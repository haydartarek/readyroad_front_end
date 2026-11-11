import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/di/service_locator.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/network/authenticated_api_client.dart';
import '../../core/providers/language_provider.dart';
import '../../design_system/widgets/rijvia_app_bar.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_web_navigation.dart';
import '../dashboard/progress_presentation.dart';

/// Web's deep-analysis sections, also embeddable in the progress workspace.
class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({
    super.key,
    this.mode = 'weak-areas',
    this.embedded = false,
    this.simulationId,
  });
  final String mode;
  final bool embedded;
  final int? simulationId;
  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  final _api = getIt<AuthenticatedApiClient>();
  Map<String, dynamic>? _overview;
  List<Map<String, dynamic>>? _patterns;
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

  @override
  void didUpdateWidget(covariant AnalyticsScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.mode != widget.mode ||
        oldWidget.simulationId != widget.simulationId) {
      _load();
    }
  }

  Future<void> _load() async {
    final revision = ++_revision;
    setState(() {
      _error = null;
      _overview = null;
      _patterns = null;
    });
    try {
      final response = await _api.get(
        '/api/users/me/analytics/${widget.mode}',
        queryParameters:
            widget.mode == 'error-patterns' && widget.simulationId != null
            ? {'simulationId': widget.simulationId}
            : null,
      );
      if (!mounted || revision != _revision) return;
      if (widget.mode == 'weak-areas') {
        final overview = Map<String, dynamic>.from(response.data as Map);
        if (overview['weakAreas'] is! List ||
            overview['totalPracticedCategories'] is! num) {
          throw const FormatException('Invalid weak-area overview');
        }
        setState(() => _overview = overview);
      } else {
        final patterns = (response.data as List)
            .map((item) => Map<String, dynamic>.from(item as Map))
            .toList();
        for (final pattern in patterns) {
          if (pattern['patternType'] is! String ||
              pattern['currentCount'] is! num ||
              pattern['groups'] is! List ||
              pattern['trend'] is! String) {
            throw const FormatException('Invalid error pattern response');
          }
        }
        setState(
          () => _patterns = patterns
              .where(
                (p) =>
                    (p['currentCount'] as num) > 0 ||
                    (p['previousCount'] as num? ?? 0) > 0,
              )
              .toList(),
        );
      }
    } catch (error) {
      if (mounted && revision == _revision) setState(() => _error = error);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final patternsMode = widget.mode == 'error-patterns';
    final heading = t.t(
      patternsMode ? 'error_patterns.title' : 'weak_areas.title',
    );
    final loading = _overview == null && _patterns == null && _error == null;
    final content = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (!widget.embedded) ...[
          RijviaPageHero(
            title: heading,
            description: patternsMode ? null : t.t('weak_areas.subtitle'),
          ),
          const SizedBox(height: 24),
        ],
        if (_error != null)
          RijviaPageSection(
            child: Column(
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
          )
        else if (loading)
          const Center(child: CircularProgressIndicator())
        else if (patternsMode)
          ..._patternContent(t)
        else
          ..._weakContent(t),
        if (!widget.embedded) ...[
          const SizedBox(height: 32),
          const RijviaWebFooter(),
        ],
      ],
    );
    if (widget.embedded) return content;
    return Scaffold(
      appBar: const RijviaAppBar(),
      body: SingleChildScrollView(
        child: Center(
          child: Container(
            constraints: const BoxConstraints(maxWidth: 1152),
            padding: const EdgeInsets.all(24),
            child: content,
          ),
        ),
      ),
    );
  }

  List<Widget> _weakContent(AppLocalizations t) {
    final items = (_overview!['weakAreas'] as List)
        .map((v) => Map<String, dynamic>.from(v as Map))
        .toList();
    return [
      if (items.isEmpty)
        RijviaPageSection(
          title: t.t('weak_areas.no_weak_areas_title'),
          description: t.t('weak_areas.no_weak_areas_desc'),
          child: const Icon(Icons.emoji_events_outlined, size: 64),
        ),
      if (items.isNotEmpty)
        RijviaAdaptiveGrid(
          minCellWidth: 200,
          maxColumns: 4,
          children: [
            for (final metric in [
              (
                'analytics.overall_accuracy',
                ProgressPresentation.percentage(
                  _overview!['overallAccuracy'],
                  _language!,
                ),
              ),
              (
                'analytics.critical_areas',
                items
                    .where(
                      (a) =>
                          a['currentAccuracy'] is num &&
                          (a['currentAccuracy'] as num) < 50,
                    )
                    .length
                    .toString(),
              ),
              (
                'analytics.needs_practice',
                items
                    .where(
                      (a) =>
                          a['currentAccuracy'] is num &&
                          (a['currentAccuracy'] as num) >= 50,
                    )
                    .length
                    .toString(),
              ),
              (
                'analytics.strong_areas',
                ((_overview!['totalPracticedCategories'] as num) - items.length)
                    .toString(),
              ),
            ])
              RijviaPageSection(title: metric.$2, child: Text(t.t(metric.$1))),
          ],
        ),
      for (final area in items) ...[
        const SizedBox(height: 16),
        _weakCard(t, area),
      ],
      const SizedBox(height: 24),
      RijviaPageSection(
        title: t.t('weak_areas.strategy_title'),
        description: t.t('weak_areas.strategy_desc'),
        child: Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            FilledButton(
              onPressed: () => Navigator.pushNamed(context, '/exam'),
              child: Text(t.t('weak_areas.take_exam')),
            ),
            OutlinedButton(
              onPressed: () => Navigator.pushNamed(context, '/practice'),
              child: Text(t.t('weak_areas.practice_mode')),
            ),
            OutlinedButton(
              onPressed: () => Navigator.pushNamed(context, '/lessons'),
              child: Text(t.t('weak_areas.study_lessons')),
            ),
          ],
        ),
      ),
    ];
  }

  Widget _weakCard(AppLocalizations t, Map<String, dynamic> area) {
    final name =
        ProgressPresentation.localizedText(area, 'categoryName', _language!) ??
        area['categoryName']?.toString() ??
        t.t('common.not_available');
    final accuracy = area['currentAccuracy'] as num?;
    final attempted = area['questionsAttempted'] as num?;
    final correct = accuracy != null && attempted != null
        ? (accuracy / 100 * attempted).round()
        : null;
    return RijviaPageSection(
      title: name,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Wrap(
            spacing: 20,
            runSpacing: 12,
            children: [
              Text(
                '${t.t('analytics.stat_accuracy')}: ${ProgressPresentation.percentage(accuracy, _language!)}',
              ),
              Text('${t.t('analytics.stat_correct')}: ${correct ?? '—'}'),
              Text(
                '${t.t('analytics.stat_wrong')}: ${correct == null ? '—' : attempted! - correct}',
              ),
              if (area['estimatedTimeMinutes'] != null)
                Text(
                  '${t.t('analytics.stat_estimated_time')}: ${area['estimatedTimeMinutes']} min',
                ),
            ],
          ),
          const SizedBox(height: 16),
          if (accuracy != null)
            LinearProgressIndicator(
              value: (accuracy / 100).clamp(0, 1).toDouble(),
              color: accuracy < 50
                  ? Theme.of(context).colorScheme.error
                  : Theme.of(context).colorScheme.primary,
            ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: () => Navigator.pushNamed(context, '/exam'),
            child: Text(t.t('analytics.practice_now')),
          ),
          ExpansionTile(
            tilePadding: EdgeInsets.zero,
            title: Text(t.t('analytics.improvement_plan')),
            children: [
              if (area['recommendedQuestions'] != null)
                Text(
                  '${area['recommendedQuestions']} ${t.t('analytics.recommended_questions')}',
                ),
              if (area['accuracyGap'] != null)
                Text(
                  '${ProgressPresentation.percentage(area['accuracyGap'], _language!)} ${t.t('analytics.accuracy_needed')}',
                ),
              if (area['recommendedDifficulty'] != null)
                Text(
                  t.t(
                    'practice_exam.difficulty_${area['recommendedDifficulty'].toString().toLowerCase()}',
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  List<Widget> _patternContent(AppLocalizations t) => [
    if (_patterns!.isEmpty)
      RijviaPageSection(
        title: t.t('error_patterns.empty_title'),
        child: Text(t.t('error_patterns.empty_desc')),
      ),
    for (final pattern in _patterns!) ...[
      RijviaPageSection(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ErrorPatternTile(pattern: pattern),
            Wrap(
              spacing: 16,
              runSpacing: 12,
              children: [
                Text(
                  '${t.t('error_patterns.previous_value')}: ${pattern['previousCount'] ?? '—'}',
                ),
                Text(
                  '${t.t('error_patterns.current_value')}: ${pattern['currentCount']}',
                ),
                Text(
                  '${t.t('error_patterns.change')}: ${pattern['delta'] ?? '—'}',
                ),
                if (pattern['severity'] != null)
                  Chip(
                    label: Text(
                      t.t(switch (pattern['severity']) {
                        'CRITICAL' ||
                        'HIGH' => 'error_patterns.severity_critical',
                        'MODERATE' => 'error_patterns.severity_important',
                        _ => 'error_patterns.severity_minor',
                      }),
                    ),
                  ),
                Chip(
                  label: Text(
                    t.t(switch (pattern['trend']) {
                      'IMPROVED' => 'error_patterns.trend_improved',
                      'WORSENED' => 'error_patterns.trend_worsened',
                      'UNCHANGED' => 'error_patterns.trend_unchanged',
                      _ => 'error_patterns.trend_insufficient',
                    }),
                  ),
                ),
              ],
            ),
            if (pattern['lastCalculatedAt'] != null)
              Text(
                t.t('error_patterns.last_updated', {
                  'date': ProgressPresentation.date(
                    pattern['lastCalculatedAt'],
                    _language!,
                  ),
                }),
              ),
            ExpansionTile(
              tilePadding: EdgeInsets.zero,
              title: Text(t.t('error_patterns.view_details')),
              children: [
                Text(
                  t.t(
                    pattern['recommendationKey']?.toString() ??
                        'error_patterns.rec_default',
                  ),
                ),
                for (final raw in pattern['groups'] as List)
                  ListTile(
                    title: Text(
                      _groupName(t, Map<String, dynamic>.from(raw as Map)),
                    ),
                    trailing: Text('${raw['count']}'),
                  ),
                for (final raw in pattern['exampleQuestions'] as List? ?? [])
                  ListTile(
                    title: Text(
                      '${t.t('dashboard.question_text')}: ${raw['questionId']}',
                    ),
                    subtitle: Text(
                      ProgressPresentation.localizedText(
                            Map<String, dynamic>.from(raw as Map),
                            'categoryName',
                            _language!,
                          ) ??
                          '',
                    ),
                  ),
              ],
            ),
            OutlinedButton(
              onPressed: () => Navigator.pushNamed(context, '/exam'),
              child: Text(t.t('error_patterns.practice_pattern')),
            ),
          ],
        ),
      ),
      const SizedBox(height: 16),
    ],
  ];
  String _groupName(AppLocalizations t, Map<String, dynamic> group) {
    if (group['groupType'] == 'TRAFFIC_SIGN_FAMILY') {
      return t.t(
        'error_patterns.family_${group['code'].toString().toLowerCase()}',
      );
    }
    if (group['groupType'] == 'LEGAL_CONCEPT') {
      return ProgressPresentation.patternTitle(group['code'], t);
    }
    if (group['groupType'] == 'REPEATED_MISCONCEPTION') {
      return t.t('error_patterns.group_repeated_misconception');
    }
    return ProgressPresentation.localizedText(group, 'name', _language!) ??
        group['code'].toString();
  }
}
