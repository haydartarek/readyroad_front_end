import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/localization/app_localizations.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import '../auth/presentation/bloc/auth_bloc.dart';
import '../auth/presentation/bloc/auth_state.dart';
import 'admin_components.dart';

class AdminOverviewScreen extends StatefulWidget {
  const AdminOverviewScreen({super.key});
  @override
  State<AdminOverviewScreen> createState() => _AdminOverviewScreenState();
}

class _AdminOverviewScreenState extends AdminPageState<AdminOverviewScreen> {
  AdminRecord? data;
  @override
  Future<void> load() => fetch((request) async {
    final result = AdminApi.record(await api.get('/admin/dashboard'));
    if (mounted && request == revision) setState(() => data = result);
  });
  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final state = context.watch<AuthBloc>().state;
    final counts = data?['quizQuestionDifficultyCounts'];
    final difficulty = counts is Map
        ? [
            for (final k in [
              'EASY',
              'MEDIUM',
              'HARD',
              if ((counts['UNCLASSIFIED'] as num? ?? 0) > 0) 'UNCLASSIFIED',
            ])
              '${t.t('difficulty.${k.toLowerCase()}')}: ${counts[k] ?? '—'}',
          ].join(' · ')
        : t.t('admin.total_quizzes_desc');
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AdminHeader(
          title: t.t('admin.dashboard'),
          icon: Icons.speed,
          description:
              '${t.t('admin.welcome')}, ${state is Authenticated ? state.user.name ?? t.t('admin.system_admin') : t.t('admin.system_admin')}',
        ),
        const SizedBox(height: 24),
        messages(),
        if (data != null) ...[
          RijviaAdaptiveGrid(
            maxColumns: 3,
            minCellWidth: 220,
            maxCellWidth: double.infinity,
            children: [
              for (final metric in [
                (
                  'totalUsers',
                  'total_users',
                  Icons.people_outline,
                  t.t('admin.total_users_desc'),
                ),
                (
                  'totalSigns',
                  'total_signs',
                  Icons.traffic_outlined,
                  t.t('admin.total_signs_desc'),
                ),
                (
                  'totalQuizQuestions',
                  'total_quizzes',
                  Icons.fact_check_outlined,
                  difficulty,
                ),
              ])
                RijviaPageSection(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      RijviaMetricCard(
                        label: t.t('admin.${metric.$2}'),
                        value: data![metric.$1]?.toString() ?? '—',
                        icon: metric.$3,
                      ),
                      const SizedBox(height: 8),
                      Text(metric.$4),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 24),
          RijviaPageSection(
            title: t.t('admin.quick_actions'),
            child: RijviaAdaptiveGrid(
              minCellWidth: 180,
              maxCellWidth: double.infinity,
              children: [
                for (final action in [
                  ('/admin/signs', 'admin.signs.title', Icons.traffic_outlined),
                  ('/admin/users', 'admin.manage_users', Icons.people_outline),
                  ('/admin/analytics', 'admin.statistics', Icons.bar_chart),
                  ('/admin/settings', 'admin.settings', Icons.tune),
                ])
                  OutlinedButton.icon(
                    onPressed: () => Navigator.pushNamed(context, action.$1),
                    icon: Icon(action.$3),
                    label: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      child: Text(t.t(action.$2)),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}
