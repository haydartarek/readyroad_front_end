import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/providers/language_provider.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import 'admin_components.dart';

class AdminModerationScreen extends StatefulWidget {
  const AdminModerationScreen({super.key});
  @override
  State<AdminModerationScreen> createState() => _AdminModerationScreenState();
}

class _AdminModerationScreenState
    extends AdminPageState<AdminModerationScreen> {
  List<AdminRecord> users = [];
  AdminRecord? summary;
  String tab = 'locked';
  @override
  Future<void> load() => fetch((request) async {
    final first = await Future.wait([
      api.get('/admin/users', {'page': 0, 'size': 100}),
      api.get('/admin/users/summary'),
    ]);
    final response = AdminApi.record(first[0]);
    final remaining = await Future.wait([
      for (var page = 1; page < (response['totalPages'] as num? ?? 1); page++)
        api.get('/admin/users', {'page': page, 'size': 100}),
    ]);
    final items = [
      ...AdminApi.records(response['users']),
      for (final page in remaining)
        ...AdminApi.records(AdminApi.record(page)['users']),
    ];
    final stats = AdminApi.record(first[1]);
    if (mounted && request == revision) {
      setState(() {
        users = items;
        summary = stats;
      });
    }
  });
  Future<void> _unlock(AdminRecord user) async {
    if (!await adminConfirm(context, 'admin.users.confirm_unlock') ||
        !mounted) {
      return;
    }
    await mutate(
      () => api.put('/admin/users/${user['id']}/lock', {'isLocked': false}),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final language = context.watch<LanguageProvider>().currentLanguage;
    final now = DateTime.now();
    final groups = {
      'locked': users.where((u) => u['isLocked'] == true).toList(),
      'inactive': users
          .where((u) => u['isActive'] != true && u['isLocked'] != true)
          .toList(),
      'new':
          users.where((u) {
            final date = DateTime.tryParse(u['createdAt']?.toString() ?? '');
            return date != null &&
                now.difference(date) < const Duration(days: 7);
          }).toList()..sort(
            (a, b) =>
                b['createdAt'].toString().compareTo(a['createdAt'].toString()),
          ),
    };
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AdminHeader(
          title: t.t('admin.moderation.title'),
          description: t.t('admin.moderation.description'),
          icon: Icons.verified_user_outlined,
          actions: [
            OutlinedButton.icon(
              onPressed: loading ? null : load,
              icon: const Icon(Icons.refresh),
              label: Text(t.t('admin.moderation.refresh')),
            ),
          ],
        ),
        const SizedBox(height: 24),
        messages(),
        RijviaAdaptiveGrid(
          minCellWidth: 220,
          maxColumns: 3,
          maxCellWidth: double.infinity,
          children: [
            for (final field in [
              ('locked', 'stats_locked', Icons.lock_outline),
              ('inactive', 'stats_inactive', Icons.person_off_outlined),
              ('newThisWeek', 'stats_new', Icons.person_add_outlined),
            ])
              RijviaMetricCard(
                label: t.t('admin.moderation.${field.$2}'),
                value: summary?[field.$1]?.toString() ?? '—',
                icon: field.$3,
              ),
          ],
        ),
        const SizedBox(height: 24),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final item in ['locked', 'new', 'inactive'])
              ChoiceChip(
                label: Text(
                  '${t.t('admin.moderation.tab_$item')} (${groups[item]!.length})',
                ),
                selected: tab == item,
                onSelected: (_) => setState(() => tab = item),
              ),
          ],
        ),
        const SizedBox(height: 16),
        if (!loading && error == null && groups[tab]!.isEmpty)
          RijviaPageSection(child: Text(t.t('admin.moderation.no_$tab'))),
        if (groups[tab]!.isNotEmpty)
          RijviaPageSection(
            child: AdminTable(
              columns: [
                for (final key in [
                  'col_user',
                  'col_role',
                  'col_status',
                  'col_joined',
                  if (tab == 'locked') 'col_actions',
                ])
                  t.t('admin.moderation.$key'),
              ],
              rows: [
                for (final user in groups[tab]!)
                  [
                    SizedBox(
                      width: 200,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user['fullName']?.toString() ??
                                user['username']?.toString() ??
                                '—',
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                          Text('@${user['username']}'),
                        ],
                      ),
                    ),
                    Chip(label: Text(user['role']?.toString() ?? '—')),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          t.t(
                            user['isActive'] == true
                                ? 'admin.users.status_active'
                                : 'admin.users.status_inactive',
                          ),
                        ),
                        if (user['isLocked'] == true)
                          Text(t.t('admin.users.status_locked')),
                      ],
                    ),
                    Text(adminDate(user['createdAt'], language)),
                    if (tab == 'locked')
                      OutlinedButton.icon(
                        onPressed: saving ? null : () => _unlock(user),
                        icon: const Icon(Icons.lock_open),
                        label: Text(t.t('admin.moderation.unlock')),
                      ),
                  ],
              ],
            ),
          ),
      ],
    );
  }
}
