import '../../core/navigation/web_route_registry.dart';
import 'package:flutter/material.dart';

import '../../core/di/service_locator.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/network/authenticated_api_client.dart';
import '../../design_system/widgets/rijvia_app_bar.dart';
import '../../design_system/widgets/rijvia_content.dart';
import '../../shared/widgets/language_selector.dart';
import 'notification_presentation.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final _api = getIt<AuthenticatedApiClient>();
  List<Map<String, dynamic>> _items = const [];
  bool _loading = true;
  bool _failed = false;
  int _unreadCount = 0;
  int _visibleCount = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({bool showLatest = false}) async {
    if (mounted) {
      setState(() {
        _loading = true;
        _failed = false;
      });
    }
    try {
      final responses = await Future.wait([
        _api.get('/api/users/me/notifications'),
        _api.get('/api/users/me/notifications/unread-count'),
      ]);
      if (!mounted) return;
      if (responses.any((response) => (response.statusCode ?? 500) >= 400) ||
          responses[0].data is! List) {
        throw StateError('Notification request failed');
      }
      final seen = <Object>{};
      final items = (responses[0].data as List)
          .whereType<Map>()
          .map((item) => Map<String, dynamic>.from(item))
          .where((item) => item['id'] == null || seen.add(item['id'] as Object))
          .toList();
      final counts = responses[1].data;
      setState(() {
        _items = items;
        _unreadCount = counts is Map
            ? int.tryParse(counts['unreadCount']?.toString() ?? '') ?? 0
            : 0;
        _visibleCount = showLatest || items.length < 15
            ? items.length.clamp(0, 15)
            : 5;
        _loading = false;
      });
      // Web marks the panel's notifications as read when it opens.
      if (_unreadCount > 0) await _markAllRead();
    } catch (_) {
      if (mounted) {
        setState(() {
          _failed = true;
          _loading = false;
        });
      }
    }
  }

  Future<void> _markAllRead() async {
    try {
      final response = await _api.patch('/api/users/me/notifications/read-all');
      if ((response.statusCode ?? 500) >= 400) {
        throw StateError('Read request failed');
      }
      if (mounted) setState(() => _unreadCount = 0);
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  Future<void> _markRead(Map<String, dynamic> item) async {
    if (item['id'] != null && item['isRead'] != true) {
      try {
        final response = await _api.patch(
          '/api/users/me/notifications/${item['id']}/read',
        );
        if ((response.statusCode ?? 500) >= 400) {
          throw StateError('Read request failed');
        }
        if (mounted) setState(() => item['isRead'] = true);
      } catch (_) {
        if (mounted) setState(() => _failed = true);
      }
    }
    if (mounted) _openLink(item['link']?.toString());
  }

  void _openLink(String? rawLink) {
    if (rawLink == null || rawLink.isEmpty) return;
    final uri = Uri.tryParse(rawLink);
    if (uri == null) return;
    if (uri.hasScheme || uri.hasAuthority || rawLink.startsWith('//')) return;
    final normalized = WebRouteRegistry.normalize(rawLink);
    if (normalized.path != '/404') {
      Navigator.pushNamed(context, normalized.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Scaffold(
      appBar: RijviaAppBar(
        title: Text(t.t('notif.title')),
        actions: [const LanguageSelector()],
      ),
      body: RijviaScrollFrame(
        maxWidth: 760,
        child: RefreshIndicator(
          onRefresh: _load,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (_failed)
                Card(
                  child: ListTile(
                    title: Text(t.t('notif.request_failed')),
                    trailing: IconButton(
                      tooltip: t.t('notif.retry'),
                      onPressed: _load,
                      icon: const Icon(Icons.refresh),
                    ),
                  ),
                ),
              if (_loading)
                const Padding(
                  padding: EdgeInsets.all(48),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (_items.isEmpty && !_failed)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      children: [
                        const Icon(Icons.done_all, size: 32),
                        const SizedBox(height: 12),
                        Text(
                          t.t('notif.empty_title'),
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 8),
                        Text(t.t('notif.empty_subtitle')),
                      ],
                    ),
                  ),
                )
              else ...[
                for (final item in _items.take(_visibleCount))
                  _notification(item, t),
                if (_items.length >= 15 && _visibleCount < 15)
                  TextButton(
                    onPressed: () => _load(showLatest: true),
                    child: Text(t.t('notif.show_latest_15')),
                  ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _notification(Map<String, dynamic> item, AppLocalizations t) {
    final presentation = NotificationPresentation(item);
    final unread = item['isRead'] != true;
    final colors = Theme.of(context).colorScheme;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      color: unread
          ? Color.alphaBlend(
              colors.primary.withValues(alpha: 0.06),
              colors.surface,
            )
          : colors.surface,
      child: InkWell(
        customBorder: Theme.of(context).cardTheme.shape,
        onTap: () => _markRead(item),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: colors.surface,
                  border: Border.all(color: colors.outlineVariant),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Badge(
                  isLabelVisible: unread,
                  smallSize: 8,
                  child: Icon(
                    presentation.icon,
                    color: presentation.color,
                    size: 20,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      presentation.title(t),
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: unread ? FontWeight.w800 : FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(presentation.message(t)),
                    const SizedBox(height: 8),
                    Text(
                      presentation.timeAgo(t, DateTime.now()),
                      style: Theme.of(context).textTheme.labelSmall,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
