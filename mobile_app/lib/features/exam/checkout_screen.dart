import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../../core/localization/rijvia_dates.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/di/service_locator.dart';
import '../../core/localization/app_localizations.dart';
import '../../design_system/widgets/rijvia_app_bar.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import 'exam_payment_service.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({
    super.key,
    required this.kind,
    this.purchaseId,
    this.payment,
  });
  final String kind;
  final String? purchaseId;
  final ExamPaymentService? payment;
  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  late final _payment = widget.payment ?? getIt<ExamPaymentService>();
  Map<String, dynamic>? _purchase;
  String _state = 'confirming';
  String? _error;
  bool _busy = false;
  Timer? _pollTimer;
  Timer? _deadline;
  int _revision = 0;
  @override
  void initState() {
    super.initState();
    if (widget.kind == 'success') {
      if (!ExamPaymentService.isPurchaseId(widget.purchaseId)) {
        _state = 'invalid';
      } else {
        _deadline = Timer(const Duration(seconds: 15), () {
          _revision++;
          _pollTimer?.cancel();
          if (mounted) setState(() => _state = 'waiting');
        });
        _poll(_revision);
      }
    }
  }

  @override
  void dispose() {
    _revision++;
    _pollTimer?.cancel();
    _deadline?.cancel();
    super.dispose();
  }

  Future<void> _poll(int revision) async {
    try {
      final purchase = await _payment.purchaseStatus(widget.purchaseId!);
      if (!mounted || revision != _revision) return;
      setState(() => _purchase = purchase);
      if (purchase['status'] != 'PENDING') {
        _deadline?.cancel();
        final pending = await _payment.pendingCheckout();
        if (!mounted || revision != _revision) return;
        if (pending?['purchaseId'] == widget.purchaseId) {
          await _payment.forgetCheckout();
          if (!mounted || revision != _revision) return;
          if (purchase['status'] == 'PAID' &&
              (pending?['examId'] as num? ?? 0) > 0) {
            Navigator.pushReplacementNamed(
              context,
              '/exam/${pending!['examId']}',
            );
          }
        }
        return;
      }
    } catch (error) {
      if (!mounted || revision != _revision) return;
      final status = error is DioException ? error.response?.statusCode : null;
      if ([401, 403, 404].contains(status)) {
        _deadline?.cancel();
        setState(() => _state = status == 401 ? 'login' : 'invalid');
        return;
      }
    }
    if (mounted && revision == _revision) {
      _pollTimer = Timer(
        const Duration(milliseconds: 1500),
        () => _poll(revision),
      );
    }
  }

  Future<void> _resume() async {
    if (_busy) return;
    if (!ExamPaymentService.isPurchaseId(widget.purchaseId)) {
      setState(() => _error = 'payment.expired');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final uri = await _payment.resumeCheckoutById(widget.purchaseId!);
      if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
        throw StateError('Checkout could not open');
      }
    } catch (error) {
      if (mounted) {
        setState(
          () => _error =
              error is DioException &&
                  [404, 409, 410].contains(error.response?.statusCode)
              ? 'payment.expired'
              : 'payment.checkout_error',
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final success = widget.kind == 'success';
    final expired = widget.kind == 'expired';
    final paid = _state != 'invalid' && _purchase?['status'] == 'PAID';
    final failed = ['FAILED', 'REFUNDED'].contains(_purchase?['status']);
    final message = _state == 'invalid'
        ? 'payment.expired'
        : paid
        ? 'payment.success'
        : failed
        ? 'payment.failed'
        : _state == 'login'
        ? 'payment.login_required'
        : _state == 'waiting'
        ? 'payment.still_confirming'
        : 'payment.confirming';
    void go(String route) => Navigator.pushNamed(context, route);
    return Scaffold(
      appBar: const RijviaAppBar(),
      body: SingleChildScrollView(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: success ? 720 : 1024),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  RijviaPageHero(
                    title: t.t(
                      success
                          ? 'payment.checkout_title'
                          : expired
                          ? 'payment.expired_recovery_title'
                          : 'payment.cancel_recovery_title',
                    ),
                    description: t.t(
                      success
                          ? message
                          : expired
                          ? 'payment.expired_recovery_text'
                          : 'payment.cancel_recovery_text',
                    ),
                  ),
                  const SizedBox(height: 24),
                  if (success) ...[
                    if (paid) ...[
                      Text(
                        t.t('payment.plan.${_purchase!['plan']}'),
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      if (_purchase!['expiresAt'] != null)
                        Text(
                          t.t('payment.expires', {
                            'date': RijviaDates.expiry(
                              _purchase!['expiresAt'],
                              t.locale.languageCode,
                              long: true,
                            ),
                          }),
                        ),
                      const SizedBox(height: 24),
                      Wrap(
                        spacing: 12,
                        runSpacing: 12,
                        children: [
                          FilledButton(
                            onPressed: () => go('/practice'),
                            child: Text(t.t('payment.training')),
                          ),
                          FilledButton(
                            onPressed: () => go('/exam'),
                            child: Text(t.t('payment.exam')),
                          ),
                        ],
                      ),
                    ],
                    if (_state == 'invalid' || failed)
                      FilledButton(
                        onPressed: () => go('/#pricing'),
                        child: Text(t.t('payment.back_to_plans')),
                      ),
                    if (_state == 'login')
                      FilledButton(
                        onPressed: () => go(
                          '/login?returnUrl=${Uri.encodeComponent('/checkout/success?purchaseId=${widget.purchaseId}')}',
                        ),
                        child: Text(t.t('payment.login')),
                      ),
                    TextButton(
                      onPressed: () => go('/dashboard'),
                      child: Text(t.t('payment.dashboard')),
                    ),
                  ] else
                    RijviaPageSection(
                      title: t.t('payment.cancel_value_title'),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          for (final key in [
                            'questions',
                            'exam',
                            'explanations',
                            'languages',
                          ])
                            ListTile(
                              leading: const Icon(Icons.check_circle_outline),
                              title: Text(t.t('payment.cancel_benefit_$key')),
                            ),
                          const SizedBox(height: 16),
                          Text(t.t('payment.one_time')),
                          if (_error != null)
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              child: Text(
                                t.t(_error!),
                                style: TextStyle(
                                  color: Theme.of(context).colorScheme.error,
                                ),
                              ),
                            ),
                          const SizedBox(height: 24),
                          FilledButton(
                            onPressed: () => go('/#pricing'),
                            child: Text(t.t('payment.cancel_primary')),
                          ),
                          if (!expired) ...[
                            const SizedBox(height: 12),
                            OutlinedButton(
                              onPressed: _busy ? null : _resume,
                              child: Text(
                                t.t(
                                  _busy
                                      ? 'payment.opening'
                                      : 'payment.cancel_secondary',
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
