import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/di/service_locator.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/network/authenticated_api_client.dart';
import '../../core/providers/language_provider.dart';
import '../../design_system/widgets/rijvia_app_bar.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import '../auth/presentation/bloc/auth_bloc.dart';
import '../auth/presentation/bloc/auth_state.dart';
import '../exam/account_access_card.dart';
import '../exam/exam_history_screen.dart';
import '../profile/profile_screen.dart';
import 'dashboard_screen.dart';
import 'dashboard_service.dart';
import 'progress_presentation.dart';

const dashboardSections = [
  ('overview', 'nav.dashboard', Icons.dashboard_outlined),
  ('progress', 'dashboard.progress_v2.nav', Icons.insights_outlined),
  ('exam-results', 'user_sidebar.exam_results', Icons.assignment_outlined),
  ('profile', 'nav.profile', Icons.person_outline),
];

class DashboardWorkspace extends StatelessWidget {
  const DashboardWorkspace({super.key, this.section, this.query = const {}});
  final String? section;
  final Map<String, String> query;
  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final selected = ['weak-areas', 'error-patterns'].contains(section)
        ? 'progress'
        : dashboardSections.any((s) => s.$1 == section)
        ? section
        : 'overview';
    void go(String target) => Navigator.pushReplacementNamed(
      context,
      target == 'overview' ? '/dashboard' : '/dashboard?section=$target',
    );
    final body = switch (selected) {
      'profile' => const ProfileScreen(embedded: true),
      'exam-results' => ExamHistoryScreen(
        embedded: true,
        highlightExamId: int.tryParse(query['examId'] ?? ''),
        highlightRandomSessionId: int.tryParse(query['randomSignExamId'] ?? ''),
        highlightSignResultId: int.tryParse(query['signExamResultId'] ?? ''),
      ),
      'progress' => DashboardScreen(
        embedded: true,
        analysisSection: ['weak-areas', 'error-patterns'].contains(section)
            ? section
            : null,
        simulationId: int.tryParse(query['examId'] ?? ''),
      ),
      _ => const DashboardOverview(),
    };
    return Scaffold(
      appBar: const RijviaAppBar(),
      body: LayoutBuilder(
        builder: (context, box) {
          final desktop =
              box.maxWidth >= 1024 &&
              MediaQuery.textScalerOf(context).scale(1) <= 1.5;
          final sidebar = SizedBox(
            width: 256,
            child: Material(
              color: Theme.of(context).colorScheme.surface,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Builder(
                    builder: (context) {
                      final state = context.watch<AuthBloc>().state;
                      final name = state is Authenticated
                          ? state.user.name ?? state.user.username ?? t.appName
                          : t.appName;
                      return ListTile(
                        leading: CircleAvatar(
                          child: Text(
                            name.isEmpty
                                ? 'R'
                                : name.substring(0, 1).toUpperCase(),
                          ),
                        ),
                        title: Text(name),
                      );
                    },
                  ),
                  const SizedBox(height: 24),
                  for (final item in dashboardSections)
                    ListTile(
                      selected: selected == item.$1,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      leading: Icon(item.$3),
                      title: Text(t.t(item.$2)),
                      onTap: () => go(item.$1),
                    ),
                  const SizedBox(height: 24),
                  const AccountAccessCard(),
                ],
              ),
            ),
          );
          return Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (desktop) sidebar,
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (!desktop)
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            for (final item in dashboardSections)
                              ChoiceChip(
                                label: ConstrainedBox(
                                  constraints: BoxConstraints(
                                    maxWidth: math.max(80, box.maxWidth - 112),
                                  ),
                                  child: Text(t.t(item.$2)),
                                ),
                                selected: selected == item.$1,
                                onSelected: (_) => go(item.$1),
                              ),
                          ],
                        ),
                      ),
                    Expanded(child: body),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class DashboardOverview extends StatefulWidget {
  const DashboardOverview({super.key});
  @override
  State<DashboardOverview> createState() => _DashboardOverviewState();
}

class _DashboardOverviewState extends State<DashboardOverview> {
  DashboardOverviewData? _data;
  Object? _error;
  String? _language;
  int _revision = 0;
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final language = context.watch<LanguageProvider>().currentLanguage;
    if (_language != language) {
      _language = language;
      _load();
    }
  }

  Future<void> _load() async {
    final revision = ++_revision;
    setState(() {
      _data = null;
      _error = null;
    });
    try {
      final data = await getIt<DashboardService>().loadOverview();
      if (mounted && revision == _revision) setState(() => _data = data);
    } catch (error) {
      if (mounted && revision == _revision) setState(() => _error = error);
    }
  }

  String _percent(Object? value) => value is num && value.isFinite
      ? '${value.round().clamp(0, 100)}%'
      : AppLocalizations.of(context).t('common.not_available');
  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final data = _data;
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                t.t(
                  AuthenticatedApiClient.isServiceUnavailable(_error!)
                      ? 'common.service_unavailable'
                      : 'common.error_desc',
                ),
              ),
              TextButton(onPressed: _load, child: Text(t.t('common.retry'))),
            ],
          ),
        ),
      );
    }
    if (data == null) return const Center(child: CircularProgressIndicator());
    final intelligence = data.intelligence;
    final scores =
        ((intelligence['examAnalytics'] as Map?)?['recentScores'] as List? ??
                [])
            .whereType<num>()
            .take(6)
            .toList()
            .reversed
            .toList();
    final priorities = (intelligence['learningPriorities'] as List? ?? [])
        .whereType<Map>()
        .toList();
    final weak = (data.weakAreas['weakAreas'] as List? ?? [])
        .whereType<Map>()
        .toList();
    final focus = priorities.firstOrNull ?? weak.firstOrNull;
    final focusMap = focus == null
        ? <String, dynamic>{}
        : Map<String, dynamic>.from(focus);
    final name =
        ProgressPresentation.localizedText(
          focusMap,
          'categoryName',
          _language!,
        ) ??
        focusMap['categoryName']?.toString() ??
        t.t('common.not_available');
    final code = focusMap['categoryCode']?.toString();
    final recommendations = (intelligence['recommendations'] as List? ?? [])
        .whereType<Map>()
        .toList();
    final recommendation = recommendations.firstOrNull;
    var action = recommendation?['actionPath']?.toString() ?? '/practice';
    if (code != null) {
      action = RegExp(r'^TH(0[1-9]|10)$').hasMatch(code)
          ? '/exam?category=$code'
          : '/practice/$code';
    }
    final metrics = [
      (
        'dashboard.stat_questions_done',
        data.overall['totalAttempted']?.toString() ?? '—',
        Icons.menu_book_outlined,
      ),
      (
        'analytics.stat_accuracy',
        _percent(data.overall['overallAccuracy']),
        Icons.gps_fixed,
      ),
      (
        'student_intelligence.exam.total',
        data.overall['totalExamsTaken']?.toString() ?? '—',
        Icons.emoji_events_outlined,
      ),
      (
        'dashboard.lessons_completed',
        data.overall['lessonsCompletedCount']?.toString() ?? '—',
        Icons.check_circle_outline,
      ),
    ];
    final trend = RijviaPageSection(
      title: t.t('student_intelligence.exam_history'),
      description: t.t('student_intelligence.exam.score_trend'),
      child: scores.isEmpty
          ? Padding(
              padding: const EdgeInsets.all(40),
              child: Text(
                t.t('common.not_available'),
                textAlign: TextAlign.center,
              ),
            )
          : LayoutBuilder(
              builder: (context, box) {
                final width = math.max(
                  box.maxWidth,
                  scores.length *
                      56 *
                      MediaQuery.textScalerOf(context).scale(1),
                );
                return SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: SizedBox(
                    width: width,
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      textDirection: TextDirection.ltr,
                      children: [
                        for (var i = 0; i < scores.length; i++)
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 4,
                              ),
                              child: Column(
                                children: [
                                  Text(_percent(scores[i])),
                                  const SizedBox(height: 8),
                                  Container(
                                    height: 112,
                                    alignment: Alignment.bottomCenter,
                                    decoration: BoxDecoration(
                                      color: Theme.of(
                                        context,
                                      ).colorScheme.surfaceContainerHighest,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: FractionallySizedBox(
                                      widthFactor: 1,
                                      heightFactor: math.max(
                                        .06,
                                        scores[i].clamp(0, 100) / 100,
                                      ),
                                      child: DecoratedBox(
                                        decoration: BoxDecoration(
                                          color: i == scores.length - 1
                                              ? Theme.of(
                                                  context,
                                                ).colorScheme.primary
                                              : Theme.of(context)
                                                    .colorScheme
                                                    .secondary
                                                    .withValues(alpha: .3),
                                          borderRadius: BorderRadius.circular(
                                            6,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text('#${i + 1}'),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
    final next = RijviaPageSection(
      title: t.t('student_intelligence.next_steps'),
      description: t.t('dashboard.next_focus_description'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(name, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          Text(
            '${t.t('analytics.stat_accuracy')}: ${_percent(focusMap['accuracy'] ?? focusMap['currentAccuracy'])}',
          ),
          const SizedBox(height: 20),
          OutlinedButton(
            onPressed: () => Navigator.pushNamed(context, action),
            child: Text(
              code != null
                  ? t.t('dashboard.v2_focus_cta')
                  : recommendation != null
                  ? t.t(recommendation['key'].toString(), {'category': name})
                  : t.t('dashboard.action_practice_title'),
            ),
          ),
        ],
      ),
    );
    return RefreshIndicator(
      onRefresh: _load,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1152),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (MediaQuery.sizeOf(context).width < 1024) ...[
                    const AccountAccessCard(compact: true),
                    const SizedBox(height: 24),
                  ],
                  RijviaPageHero(
                    title: t.t('student_intelligence.readiness'),
                    eyebrow: t.t('student_intelligence.title'),
                    description: t.t('dashboard.readiness_description'),
                    actions: [
                      Text(
                        _percent(intelligence['examReadinessScore']),
                        style: TextStyle(
                          fontSize: 44,
                          color: Theme.of(context).colorScheme.primary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      if (intelligence['studentLevel'] != null)
                        Chip(
                          label: Text(
                            t.t(
                              'student_intelligence.level.${intelligence['studentLevel'].toString().toLowerCase()}',
                            ),
                          ),
                        ),
                      if (intelligence['overallLearningTrend'] != null)
                        Chip(
                          label: Text(
                            t.t(
                              'student_intelligence.trend.${intelligence['overallLearningTrend'].toString().toLowerCase()}',
                            ),
                          ),
                        ),
                      Text(
                        '${t.t('student_intelligence.pass_probability')}: ${_percent(intelligence['estimatedPassProbability'])}',
                      ),
                      FilledButton(
                        onPressed: () => Navigator.pushNamed(context, '/exam'),
                        child: Text(t.t('dashboard.v2_exam_cta')),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  LayoutBuilder(
                    builder: (context, box) {
                      final columns = box.maxWidth >= 900
                          ? 4
                          : box.maxWidth >= 380
                          ? 2
                          : 1;
                      return Wrap(
                        spacing: 12,
                        runSpacing: 12,
                        children: [
                          for (final metric in metrics)
                            SizedBox(
                              width:
                                  (box.maxWidth - (columns - 1) * 12) / columns,
                              child: RijviaPageSection(
                                title: metric.$2,
                                child: Row(
                                  children: [
                                    Icon(
                                      metric.$3,
                                      color: Theme.of(
                                        context,
                                      ).colorScheme.primary,
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(child: Text(t.t(metric.$1))),
                                  ],
                                ),
                              ),
                            ),
                        ],
                      );
                    },
                  ),
                  const SizedBox(height: 24),
                  LayoutBuilder(
                    builder: (context, box) => box.maxWidth >= 1000
                        ? Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(flex: 7, child: trend),
                              const SizedBox(width: 24),
                              Expanded(flex: 3, child: next),
                            ],
                          )
                        : Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [trend, const SizedBox(height: 24), next],
                          ),
                  ),
                  const SizedBox(height: 24),
                  RijviaPageSection(
                    title: t.t('dashboard.recent_activity'),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (data.activities.isEmpty)
                          Text(t.t('common.not_available')),
                        for (final activity in data.activities.take(3))
                          ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: const Icon(Icons.history),
                            title: Text(
                              ProgressPresentation.activityType(
                                activity['activityType'],
                                t,
                              ),
                            ),
                            subtitle: Text(
                              '${ProgressPresentation.activityScore(activity, t)} · ${ProgressPresentation.date(activity['completedAt'] ?? activity['startedAt'], _language!)}',
                            ),
                            trailing: const Icon(Icons.chevron_right),
                            onTap: () =>
                                Navigator.pushNamed(context, activity['link']),
                          ),
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
