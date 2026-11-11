import 'dart:convert';
import 'dart:math';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/authenticated_api_client.dart';
import '../../core/storage/secure_storage_service.dart';

/// Uses the same hosted Checkout and webhook-backed entitlement as web_app.
class ExamPaymentService {
  static const plans = ['RIJVIA_3_DAYS', 'RIJVIA_1_WEEK', 'RIJVIA_4_WEEKS'];
  static const defaultPlan = 'RIJVIA_1_WEEK';
  static const prices = <String, String>{
    'RIJVIA_3_DAYS': '€2.99',
    'RIJVIA_1_WEEK': '€6.99',
    'RIJVIA_4_WEEKS': '€14.99',
  };
  final AuthenticatedApiClient api;
  final SecureStorageService storage;

  ExamPaymentService(this.api, this.storage);

  Future<String> _userKey() async {
    final user = await storage.getUserId();
    if (user == null || user.isEmpty) {
      throw StateError('Missing account identity');
    }
    return 'rijvia.examCheckout.$user';
  }

  Future<Map<String, dynamic>?> pendingCheckout() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(await _userKey());
    if (raw == null) return null;
    return Map<String, dynamic>.from(jsonDecode(raw) as Map);
  }

  Future<void> forgetCheckout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(await _userKey());
  }

  Future<Map<String, dynamic>> accountAccess() async {
    final response = await api.get('${ApiConstants.apiVersion}/account/access');
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<Map<String, dynamic>> purchaseStatus(String purchaseId) async {
    if (!isPurchaseId(purchaseId)) throw ArgumentError('Invalid purchase id');
    final response = await api.get(
      '${ApiConstants.apiVersion}/purchases/${Uri.encodeComponent(purchaseId)}/status',
    );
    return Map<String, dynamic>.from(response.data as Map);
  }

  static bool isPurchaseId(String? id) =>
      id != null && _uuidPattern.hasMatch(id);

  Future<Uri> resumeCheckoutById(String purchaseId) async {
    if (!isPurchaseId(purchaseId)) throw ArgumentError('Invalid purchase id');
    final response = await api.post(
      '${ApiConstants.apiVersion}/purchases/$purchaseId/resume',
    );
    return _checkoutUri(response.data['checkoutUrl']);
  }

  static Uri _checkoutUri(dynamic value) {
    final uri = value is String ? Uri.tryParse(value) : null;
    if (uri == null ||
        uri.scheme != 'https' ||
        uri.host != 'checkout.stripe.com' ||
        uri.userInfo.isNotEmpty) {
      throw StateError('Invalid Checkout URL');
    }
    return uri;
  }

  Future<Uri> checkout(String plan, int examId, String locale) async {
    if (!plans.contains(plan) || !['ar', 'nl', 'fr', 'en'].contains(locale)) {
      throw ArgumentError('Unsupported plan or language');
    }
    final prefs = await SharedPreferences.getInstance();
    final key = await _userKey();
    final previous = await pendingCheckout();
    final reuse = previous?['plan'] == plan && previous?['examId'] == examId;
    final requestId = reuse
        ? previous!['clientRequestId'] as String
        : _uuidV4();
    final record = <String, dynamic>{
      'examId': examId,
      'plan': plan,
      'clientRequestId': requestId,
      if (reuse && previous?['purchaseId'] != null)
        'purchaseId': previous!['purchaseId'],
    };
    // Save before calling the API: an interrupted request can safely be retried.
    await prefs.setString(key, jsonEncode(record));
    final purchaseId = record['purchaseId'];
    if (purchaseId != null &&
        (purchaseId is! String || !_uuidPattern.hasMatch(purchaseId))) {
      await prefs.remove(key);
      throw StateError('Invalid pending purchase');
    }
    final response = purchaseId is String
        ? await api.post(
            '${ApiConstants.apiVersion}/purchases/$purchaseId/resume',
          )
        : await api.post(
            '${ApiConstants.apiVersion}/checkout',
            data: {'plan': plan, 'clientRequestId': requestId},
            options: Options(headers: {'Accept-Language': locale}),
          );
    final result = Map<String, dynamic>.from(response.data as Map);
    final checkoutUrl = result['checkoutUrl'];
    final returnedPurchaseId = result['purchaseId'];
    if (checkoutUrl is! String ||
        returnedPurchaseId is! String ||
        !_uuidPattern.hasMatch(returnedPurchaseId)) {
      throw StateError('Invalid Checkout response');
    }
    final uri = _checkoutUri(checkoutUrl);
    record['purchaseId'] = returnedPurchaseId;
    await prefs.setString(key, jsonEncode(record));
    return uri;
  }

  static final _uuidPattern = RegExp(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
    caseSensitive: false,
  );

  static String _uuidV4() {
    final bytes = List.generate(16, (_) => Random.secure().nextInt(256));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    final hex = bytes
        .map((value) => value.toRadixString(16).padLeft(2, '0'))
        .join();
    return '${hex.substring(0, 8)}-${hex.substring(8, 12)}-'
        '${hex.substring(12, 16)}-${hex.substring(16, 20)}-'
        '${hex.substring(20)}';
  }

  Future<bool> hasConfirmedAccess() async {
    final pending = await pendingCheckout();
    if (pending?['purchaseId'] is String) {
      final status = await purchaseStatus(pending!['purchaseId'] as String);
      if (['FAILED', 'REFUNDED'].contains(status['status'])) {
        await forgetCheckout();
      }
    }
    // A redirect, a purchase identifier, or PAID alone never unlocks the exam.
    // ACTIVE + its expiry (or backend-approved unlimited access) is decisive.
    final access = await accountAccess();
    final expiresAt = DateTime.tryParse(access['expiresAt']?.toString() ?? '');
    final active =
        access['active'] == true &&
        (access['unlimited'] == true ||
            (access['status'] == 'ACTIVE' && expiresAt != null));
    if (active) await forgetCheckout();
    return active;
  }
}
