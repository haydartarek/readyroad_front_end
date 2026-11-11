import 'dart:async';
import 'package:flutter/material.dart';
import '../../core/di/service_locator.dart';
import '../../core/localization/app_localizations.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import '../../core/localization/rijvia_dates.dart';
import 'exam_payment_service.dart';

class AccountAccessCard extends StatefulWidget {
  const AccountAccessCard({super.key, this.compact = false});
  final bool compact;
  @override
  State<AccountAccessCard> createState() => _AccountAccessCardState();
}

class _AccountAccessCardState extends State<AccountAccessCard>
    with WidgetsBindingObserver {
  Map<String, dynamic>? _access;
  bool _failed = false;
  Timer? _timer;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _load();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _timer?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _load();
  }

  Future<void> _load() async {
    _timer?.cancel();
    try {
      final access = await getIt<ExamPaymentService>().accountAccess();
      if (!mounted) return;
      setState(() {
        _access = access;
        _failed = false;
      });
      if (access['expiresAt'] != null) {
        _timer = Timer.periodic(const Duration(minutes: 1), (_) {
          if (mounted) setState(() {});
        });
      }
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final access = _access;
    final expires = DateTime.tryParse(access?['expiresAt']?.toString() ?? '');
    final unlimited = access?['unlimited'] == true;
    final expired =
        !unlimited &&
        (access?['status'] == 'EXPIRED' ||
            expires != null && !expires.isAfter(DateTime.now()));
    final paid = !expired && access?['active'] == true;
    final status = unlimited
        ? 'unlimited'
        : paid
        ? 'paid'
        : expired
        ? 'expired'
        : 'free';
    final remaining = expires?.difference(DateTime.now());
    final available = access != null && !_failed;
    final label = !available
        ? t.t(_failed ? 'account_access.unavailable' : 'account_access.loading')
        : t.t('account_access.$status');
    return RijviaPageSection(
      title: t.t('account_access.title'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(label, style: Theme.of(context).textTheme.titleMedium),
          if (_failed)
            TextButton(onPressed: _load, child: Text(t.t('common.retry'))),
          if (available) ...[
            if (access['plan'] != null)
              Text(t.t('payment.plan.${access['plan']}')),
            if (paid && remaining != null && remaining > Duration.zero)
              Text(
                t.t('account_access.remaining_value', {
                  'days': remaining.inDays,
                  'hours': remaining.inHours % 24,
                }),
              ),
            if (!widget.compact && expires != null)
              Text(
                '${t.t('account_access.expires')}: ${RijviaDates.expiry(expires, t.locale.languageCode)}',
              ),
            if (!unlimited) ...[
              const SizedBox(height: 12),
              FilledButton(
                onPressed: () => Navigator.pushNamed(context, '/#pricing'),
                child: Text(
                  t.t(
                    paid
                        ? 'account_access.extend'
                        : expired
                        ? 'account_access.renew'
                        : 'account_access.view_packages',
                  ),
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }
}
