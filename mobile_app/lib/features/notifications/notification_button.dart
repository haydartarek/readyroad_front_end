import 'package:flutter/material.dart';

import '../../core/di/service_locator.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/network/authenticated_api_client.dart';

class NotificationButton extends StatefulWidget {
  const NotificationButton({super.key});
  @override
  State<NotificationButton> createState() => _NotificationButtonState();
}

class _NotificationButtonState extends State<NotificationButton>
    with WidgetsBindingObserver {
  int _unreadCount = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _refresh();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _refresh();
  }

  Future<void> _refresh() async {
    try {
      final response = await getIt<AuthenticatedApiClient>().get(
        '/api/users/me/notifications/unread-count',
      );
      final data = response.data;
      if (mounted && data is Map) {
        setState(
          () => _unreadCount =
              int.tryParse(data['unreadCount']?.toString() ?? '') ?? 0,
        );
      }
    } catch (_) {
      // An unavailable count must not become a fabricated notification badge.
    }
  }

  @override
  Widget build(BuildContext context) => IconButton(
    tooltip: AppLocalizations.of(context).t('notif.title'),
    icon: Badge(
      isLabelVisible: _unreadCount > 0,
      label: Text(_unreadCount > 99 ? '99+' : '$_unreadCount'),
      child: const Icon(Icons.notifications_none, size: 20),
    ),
    onPressed: () async {
      await Navigator.pushNamed(context, "/notifications");
      if (mounted) _refresh();
    },
  );
}
