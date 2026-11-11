import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/di/service_locator.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/network/authenticated_api_client.dart';
import '../../core/providers/language_provider.dart';
import '../../design_system/widgets/rijvia_app_bar.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import '../../design_system/widgets/rijvia_web_navigation.dart';
import '../analytics/analytics_screen.dart';
import 'dashboard_service.dart';
import 'progress_presentation.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({
    super.key,
    this.embedded = false,
    this.analysisSection,
    this.simulationId,
  });
  final bool embedded;
  final String? analysisSection;
  final int? simulationId;
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _service = getIt<DashboardService>();
  LearningProgressData? _data;
  Object? _error;
  String? _language;
  late String? _analysis = widget.analysisSection;
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
      final data = await _service.loadProgress();
      if (mounted && revision == _revision) setState(() => _data = data);
    } catch (error) {
      if (mounted && revision == _revision) setState(() => _error = error);
    }
  }

  String _percent(Object? value, AppLocalizations t) =>
      value is num && value.isFinite
      ? '${value.round()}%'
      : t.t('dashboard.progress_v2.unavailable');
  String _seconds(Object? value, AppLocalizations t, {bool delta = false}) =>
      value is num && value.isFinite
      ? '${delta && value > 0 ? '+' : ''}${value.round()} s'
      : t.t('dashboard.progress_v2.unavailable');
  List<Map<String, dynamic>> _maps(Object? value) => value is List
      ? value.whereType<Map>().map((v) => Map<String, dynamic>.from(v)).toList()
      : [];
  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final data = _data;
    return Scaffold(
      appBar: widget.embedded ? null : const RijviaAppBar(),
      body: _error != null
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      t.t(
                        AuthenticatedApiClient.isServiceUnavailable(_error!)
                            ? 'dashboard.progress_v2.service_unavailable'
                            : 'dashboard.progress_v2.load_error',
                      ),
                    ),
                    TextButton(
                      onPressed: _load,
                      child: Text(t.t('dashboard.progress_v2.retry')),
                    ),
                  ],
                ),
              ),
            )
          : data == null
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Center(
                  child: Container(
                    constraints: const BoxConstraints(maxWidth: 1152),
                    padding: const EdgeInsets.all(16),
                    child: _content(data, t),
                  ),
                ),
              ),
            ),
    );
  }

  Widget _content(LearningProgressData data, AppLocalizations t) {
    final intelligence = data.intelligence;
    final noData = intelligence['dataStatus'] == 'NO_DATA';
    final timing = intelligence['timingAnalytics'] is Map
        ? Map<String, dynamic>.from(intelligence['timingAnalytics'])
        : <String, dynamic>{};
    final coverageCategories = _maps(data.coverage['categories']);
    final weakSigns = _maps(data.overall['weakSigns']);
    final timeouts = _maps(data.timeouts['items']);
    final metrics = [
      ('weekly', 'weeklyProgress'),
      ('monthly', 'monthlyProgress'),
      ('consistency', 'learningConsistencyScore'),
      ('retention', 'knowledgeRetentionScore'),
    ];
    final timingCard = RijviaPageSection(
      title: t.t('dashboard.progress_v2.timing_title'),
      description: t.t('dashboard.progress_v2.timing_description'),
      child: Wrap(
        spacing: 24,
        runSpacing: 16,
        children: [
          _metric(
            t.t('dashboard.progress_v2.average_answer_time'),
            _seconds(timing['averageAnswerTimeSeconds'], t),
          ),
          _metric(
            t.t('dashboard.progress_v2.answer_time_trend'),
            _seconds(timing['answerTimeTrendSeconds'], t, delta: true),
          ),
          _metric(
            t.t('dashboard.progress_v2.exam_time_trend'),
            _seconds(timing['examTimeTrendSeconds'], t, delta: true),
          ),
          _metric(
            t.t('dashboard.progress_v2.samples'),
            timing['answerTimingScope'] == 'UNAVAILABLE'
                ? t.t('dashboard.progress_v2.unavailable')
                : timing['answerTimingSamples']?.toString() ??
                      t.t('dashboard.progress_v2.unavailable'),
          ),
        ],
      ),
    );
    final weakCard = RijviaPageSection(
      title: t.t('dashboard.progress_v2.weak_signs_title'),
      description: t.t('dashboard.progress_v2.weak_signs_description'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (weakSigns.isEmpty)
            Text(t.t('dashboard.progress_v2.no_weak_signs')),
          for (final sign in weakSigns)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          ProgressPresentation.localizedText(
                                sign,
                                'signName',
                                _language!,
                              ) ??
                              sign['signCode']?.toString() ??
                              t.t('common.not_available'),
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '${t.t('dashboard.progress_v2.questions_attempted')}: ${sign['attempted'] ?? '—'} · ${t.t('dashboard.progress_v2.wrong_answers')}: ${sign['wrongAnswers'] ?? '—'}',
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Flexible(child: Text(_percent(sign['accuracy'], t))),
                ],
              ),
            ),
        ],
      ),
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        RijviaPageHero(
          title: t.t('dashboard.progress_v2.title'),
          description: t.t('dashboard.progress_v2.description'),
          eyebrow: t.t('dashboard.progress_v2.nav'),
        ),
        const SizedBox(height: 24),
        RijviaAdaptiveGrid(
          minCellWidth: 220,
          maxColumns: 4,
          children: [
            for (final metric in metrics)
              RijviaPageSection(
                title: noData
                    ? t.t('dashboard.progress_v2.unavailable')
                    : _percent(intelligence[metric.$2], t),
                child: Text(t.t('dashboard.progress_v2.${metric.$1}')),
              ),
          ],
        ),
        const SizedBox(height: 24),
        RijviaPageSection(
          title: t.t('dashboard.progress_v2.categories_title'),
          description: t.t('dashboard.progress_v2.categories_description'),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Wrap(
                spacing: 24,
                runSpacing: 16,
                children: [
                  _metric(
                    t.t('dashboard.theory_coverage.coverage'),
                    _percent(data.coverage['coveragePercentage'], t),
                  ),
                  _metric(
                    t.t('dashboard.theory_coverage.accuracy'),
                    _percent(data.coverage['accuracyPercentage'], t),
                  ),
                  _metric(
                    t.t('dashboard.theory_coverage.confidence'),
                    data.coverage['confidenceState'] == null
                        ? t.t('dashboard.progress_v2.unavailable')
                        : t.t(
                            'dashboard.theory_coverage.confidence_${data.coverage['confidenceState'].toString().toLowerCase()}',
                          ),
                  ),
                ],
              ),
              const Divider(height: 32),
              RijviaAdaptiveGrid(
                minCellWidth: 320,
                maxColumns: 2,
                children: [
                  for (final category in coverageCategories)
                    _category(data, category, t),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        LayoutBuilder(
          builder: (context, box) => box.maxWidth >= 1000
              ? Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(child: timingCard),
                    const SizedBox(width: 24),
                    Expanded(child: weakCard),
                  ],
                )
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [timingCard, const SizedBox(height: 24), weakCard],
                ),
        ),
        if (timeouts.isNotEmpty) ...[
          const SizedBox(height: 24),
          RijviaPageSection(
            title: t.t('dashboard.progress_v2.timeout_title'),
            description: t.t('dashboard.progress_v2.timeout_description'),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                for (final item in timeouts)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          ProgressPresentation.localizedText(
                                item,
                                'questionText',
                                _language!,
                              ) ??
                              '#${item['questionId']}',
                        ),
                        const SizedBox(height: 8),
                        Text(
                          ProgressPresentation.localizedText(
                                item,
                                'categoryName',
                                _language!,
                              ) ??
                              '',
                        ),
                        const SizedBox(height: 12),
                        OutlinedButton(
                          onPressed: item['reviewPath'] is String
                              ? () => Navigator.pushNamed(
                                  context,
                                  item['reviewPath'],
                                )
                              : null,
                          child: Text(t.t('dashboard.progress_v2.review')),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 24),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final mode in ['weak-areas', 'error-patterns'])
              ChoiceChip(
                label: ConstrainedBox(
                  constraints: BoxConstraints(
                    maxWidth: (MediaQuery.sizeOf(context).width - 112).clamp(
                      80,
                      800,
                    ),
                  ),
                  child: Text(
                    t.t(
                      mode == 'weak-areas'
                          ? 'analytics.weak_areas'
                          : 'analytics.error_patterns',
                    ),
                  ),
                ),
                selected: _analysis == mode,
                onSelected: (_) =>
                    setState(() => _analysis = _analysis == mode ? null : mode),
              ),
          ],
        ),
        if (_analysis != null) ...[
          const SizedBox(height: 16),
          AnalyticsScreen(
            mode: _analysis!,
            embedded: true,
            simulationId: widget.simulationId,
          ),
        ],
        if (!widget.embedded) ...[
          const SizedBox(height: 32),
          const RijviaWebFooter(),
        ],
      ],
    );
  }

  Widget _metric(String label, String value) => ConstrainedBox(
    constraints: const BoxConstraints(minWidth: 180),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.labelMedium),
        const SizedBox(height: 8),
        Text(value, style: Theme.of(context).textTheme.titleLarge),
      ],
    ),
  );
  Widget _category(
    LearningProgressData data,
    Map<String, dynamic> coverage,
    AppLocalizations t,
  ) {
    final progress = data.categories
        .where((c) => c['categoryCode'] == coverage['categoryCode'])
        .firstOrNull;
    final name = progress == null
        ? coverage['categoryName']?.toString() ??
              coverage['categoryCode'].toString()
        : ProgressPresentation.localizedText(
                progress,
                'categoryName',
                _language!,
              ) ??
              progress['categoryName']?.toString() ??
              coverage['categoryCode'].toString();
    final accuracy =
        progress?['accuracyRate'] ?? coverage['accuracyPercentage'];
    final attempts =
        progress?['questionsAttempted'] ?? coverage['timesAnswered'];
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextButton(
            onPressed: () => Navigator.pushNamed(
              context,
              '/exam?category=${coverage['categoryCode']}',
            ),
            child: Align(
              alignment: AlignmentDirectional.centerStart,
              child: Text(name),
            ),
          ),
          Wrap(
            spacing: 12,
            runSpacing: 8,
            children: [
              Text(
                '${t.t('dashboard.theory_coverage.accuracy')}: ${_percent(accuracy, t)}',
              ),
              Text(
                '${t.t('dashboard.theory_coverage.coverage')}: ${_percent(coverage['coveragePercentage'], t)}',
              ),
              Text(
                '${t.t('dashboard.progress_v2.questions_attempted')}: ${attempts ?? '—'}',
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (coverage['coveragePercentage'] is num)
            LinearProgressIndicator(
              value: ((coverage['coveragePercentage'] as num) / 100)
                  .clamp(0, 1)
                  .toDouble(),
            ),
          const Divider(height: 24),
        ],
      ),
    );
  }
}
