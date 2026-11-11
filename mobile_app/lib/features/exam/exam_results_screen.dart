import '../../design_system/widgets/rijvia_page_surface.dart';
import '../../design_system/widgets/rijvia_result_answer_block.dart';
import '../../design_system/rijvia_tokens.dart';
import '../../design_system/widgets/rijvia_educational_image.dart';
import '../dashboard/progress_presentation.dart';
import '../../core/constants/app_theme.dart';
import '../../design_system/widgets/rijvia_app_bar.dart';
import 'package:flutter/material.dart';
import '../../core/di/service_locator.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/network/authenticated_api_client.dart';
import '../../core/providers/language_provider.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_content.dart';
import '../../shared/widgets/service_unavailable_banner.dart';
import 'exam_question_service.dart';
import 'package:provider/provider.dart';

/// Backend-owned theory exam results and answer review.
class ExamResultsScreen extends StatefulWidget {
  final int examId;
  final Map<String, dynamic>? initialResults;
  final ExamResults? initialResult;
  final Future<ExamResults> Function()? resultLoader;
  final WidgetBuilder? retakeBuilder;

  const ExamResultsScreen({
    super.key,
    required this.examId,
    this.initialResults,
    this.initialResult,
    this.resultLoader,
    this.retakeBuilder,
  });

  @override
  State<ExamResultsScreen> createState() => _ExamResultsScreenState();
}

class _ExamResultsScreenState extends State<ExamResultsScreen> {
  final ExamQuestionService _questionService = getIt<ExamQuestionService>();
  ExamResults? _results;
  String? _error;
  bool _serviceUnavailable = false;
  bool _isLoading = true;
  String _reviewFilter = 'wrong';
  bool _reviewExpanded = false;
  final _reviewController = ExpansibleController();
  final _reviewKey = GlobalKey();
  final _firstAnswerKey = GlobalKey();

  @override
  void dispose() {
    _reviewController.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    final initial = widget.initialResults;
    if (widget.initialResult != null) {
      _results = widget.initialResult;
      _isLoading = false;
    } else if (initial != null && initial.isNotEmpty) {
      _results = ExamResults.fromJson(Map<String, dynamic>.from(initial));
      _isLoading = false;
    } else if (widget.examId <= 0) {
      _error = 'exam.results_invalid_id';
      _isLoading = false;
    } else {
      _loadResults();
    }
  }

  Future<void> _loadResults() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _error = null;
      _serviceUnavailable = false;
    });
    if (widget.examId <= 0) {
      setState(() {
        _error = 'exam.results_invalid_id';
        _isLoading = false;
      });
      return;
    }
    try {
      final results =
          await (widget.resultLoader?.call() ??
              _questionService.getResults(widget.examId));
      if (!mounted) return;
      setState(() {
        _results = results;
        _isLoading = false;
        _serviceUnavailable = false;
      });
    } catch (error) {
      if (!mounted) return;
      final unavailable = AuthenticatedApiClient.isServiceUnavailable(error);
      setState(() {
        _serviceUnavailable = unavailable;
        _error = unavailable
            ? AppLocalizations.of(context).t('common.service_unavailable')
            : AppLocalizations.of(context).t('exam.results_error');
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context);
    return Scaffold(
      appBar: RijviaAppBar(
        title: Text(localizations.examResults),
        actions: [
          IconButton(
            onPressed: () => Navigator.pushNamed(context, '/exam/results'),
            tooltip: localizations.t('exam.results_history_title'),
            icon: const Icon(Icons.history),
          ),
        ],
      ),
      body: _isLoading
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const CircularProgressIndicator(),
                  const SizedBox(height: 12),
                  Text(localizations.t('exam.results_loading')),
                ],
              ),
            )
          : _error != null
          ? _buildError(localizations)
          : _results == null
          ? _buildError(localizations)
          : _buildResults(_results!, localizations),
    );
  }

  Widget _buildError(AppLocalizations localizations) {
    if (_serviceUnavailable) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: ServiceUnavailableBanner(onRetry: _loadResults),
      );
    }
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 480),
        child: RijviaEmptyState(
          icon: Icons.error_outline,
          title: localizations.t('exam.results_error'),
          description: _error == 'exam.results_invalid_id'
              ? localizations.t(_error!)
              : (_error ?? localizations.t('exam.results_error')),
          action: FilledButton.icon(
            onPressed: _loadResults,
            icon: const Icon(Icons.refresh),
            label: Text(localizations.t('exam.results_retry_load')),
          ),
        ),
      ),
    );
  }

  Widget _buildResults(ExamResults results, AppLocalizations localizations) {
    final passed = results.passed;
    final correct = results.correctAnswers ?? 0;
    final total = results.totalQuestions ?? 0;
    final wrong = results.wrongAnswers ?? 0;
    final unanswered = results.unansweredCount ?? 0;
    final score = results.scorePercentage ?? 0;
    final threshold = results.passingThreshold ?? results.passingScore ?? 0;
    final allAnswers = results.answers;
    final filteredAnswers = allAnswers.where(_matchesReviewFilter).toList();
    final categories = results.categoryBreakdown;
    final language = context.watch<LanguageProvider>().currentLanguage;
    final timeTaken =
        results.timeTakenSeconds ??
        (results.durationMinutes == null
            ? null
            : results.durationMinutes! * 60);
    final categoryPanel = RijviaPageSection(
      title: localizations.t('exam.results_category_title'),
      description: localizations.t('exam.results_category_desc'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (categories.isEmpty)
            Text(localizations.t('exam.results_no_answers')),
          for (final category in categories)
            _buildCategoryRow(category, language),
          if (!passed)
            OutlinedButton.icon(
              onPressed: () =>
                  Navigator.pushNamed(context, '/dashboard?section=weak-areas'),
              icon: const Icon(Icons.lightbulb_outline),
              label: Text(localizations.t('exam.results_study_weak_areas')),
            ),
        ],
      ),
    );
    final timePanel = RijviaPageSection(
      title: localizations.t('exam.results_time_title'),
      description: localizations.t('exam.results_time_desc'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (final item in <(String, String, IconData)>[
            (
              'exam.results_total_time',
              timeTaken == null
                  ? localizations.t('common.not_available')
                  : formatExamDuration(timeTaken),
              Icons.schedule,
            ),
            (
              'exam.results_average_time',
              results.averageTimePerQuestion == null
                  ? localizations.t('common.not_available')
                  : formatExamDuration(results.averageTimePerQuestion!),
              Icons.timer_outlined,
            ),
            (
              'exam.answered',
              '${results.answeredCount ?? 0}/$total',
              Icons.assignment_outlined,
            ),
          ])
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(
                    color: Theme.of(context).colorScheme.outline,
                  ),
                ),
                leading: Icon(
                  item.$3,
                  color: Theme.of(context).colorScheme.primary,
                ),
                title: Text(localizations.t(item.$1)),
                subtitle: Text(item.$2),
              ),
            ),
          OutlinedButton.icon(
            onPressed: () => Navigator.pushNamed(
              context,
              '/dashboard?section=error-patterns',
            ),
            icon: const Icon(Icons.warning_amber_outlined),
            label: Text(localizations.t('exam.results_view_error_patterns')),
          ),
        ],
      ),
    );
    return RijviaScrollFrame(
      maxWidth: 1024,
      child: RefreshIndicator(
        onRefresh: _loadResults,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildSummary(
                passed: passed,
                score: score,
                correct: correct,
                total: total,
                threshold: threshold,
                wrong: wrong,
                unanswered: unanswered,
                hasAnswers: allAnswers.isNotEmpty,
                localizations: localizations,
              ),
              const SizedBox(height: 16),
              LayoutBuilder(
                builder: (context, c) => c.maxWidth >= 900
                    ? Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(flex: 3, child: categoryPanel),
                          const SizedBox(width: 16),
                          Expanded(flex: 2, child: timePanel),
                        ],
                      )
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          categoryPanel,
                          const SizedBox(height: 16),
                          timePanel,
                        ],
                      ),
              ),
              const SizedBox(height: 16),
              _buildExpandableSectionCard(
                child: ExpansionTile(
                  key: _reviewKey,
                  controller: _reviewController,
                  expansionAnimationStyle: AnimationStyle.noAnimation,
                  initiallyExpanded: _reviewExpanded,
                  onExpansionChanged: (expanded) =>
                      setState(() => _reviewExpanded = expanded),
                  tilePadding: EdgeInsets.zero,
                  childrenPadding: EdgeInsets.zero,
                  title: Text(localizations.t('practice_exam.review_title')),
                  children: [
                    if (allAnswers.isEmpty)
                      Text(localizations.t('exam.results_no_answers'))
                    else ...[
                      _buildReviewFilters(localizations, allAnswers.length),
                      const SizedBox(height: 12),
                      if (filteredAnswers.isEmpty)
                        Text(
                          localizations.t('exam.results_no_filtered_answers'),
                        )
                      else
                        for (var i = 0; i < filteredAnswers.length; i++)
                          _buildAnswerTile(
                            filteredAnswers[i],
                            i,
                            language,
                            localizations,
                          ),
                    ],
                  ],
                ),
              ),
              if (results.completedAt != null)
                Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: Text(
                    '${localizations.t('exam.results_completed_at')}: ${_formatDate(results.completedAt!)}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildReviewFilters(AppLocalizations localizations, int total) {
    final filters = [
      ('all', localizations.t('exam.results_filter_all')),
      ('correct', localizations.t('exam.results_filter_correct')),
      ('wrong', localizations.t('exam.results_filter_wrong')),
      ('timeout', localizations.t('exam.results_filter_timeout')),
    ];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (final filter in filters)
            Padding(
              padding: const EdgeInsetsDirectional.only(end: 8),
              child: ChoiceChip(
                label: Text(filter.$2),
                selected: _reviewFilter == filter.$1,
                onSelected: (_) => setState(() => _reviewFilter = filter.$1),
              ),
            ),
          Text('$total'),
        ],
      ),
    );
  }

  bool _matchesReviewFilter(ExamAnswerReview answer) {
    final correct = answer.isCorrect;
    final timeout = answer.wasTimeout;
    return switch (_reviewFilter) {
      'correct' => correct,
      'wrong' => !correct && !timeout,
      'timeout' => timeout,
      _ => true,
    };
  }

  void _openReview() {
    setState(() => _reviewExpanded = true);
    _reviewController.expand();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final target = _firstAnswerKey.currentContext ?? _reviewKey.currentContext;
      if (mounted && target != null) {
        Scrollable.ensureVisible(
          target,
          duration: const Duration(milliseconds: 250),
        );
      }
    });
  }

  Widget _buildSummary({
    required bool passed,
    required double score,
    required int correct,
    required int total,
    required int threshold,
    required int wrong,
    required int unanswered,
    required bool hasAnswers,
    required AppLocalizations localizations,
  }) {
    final colors = Theme.of(context).colorScheme;
    final tone = passed ? const Color(0xff16a34a) : const Color(0xffef4444);
    final t = localizations;
    final details = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          t.t('exam.results_score_label'),
          style: Theme.of(context).textTheme.headlineMedium,
        ),
        const SizedBox(height: 8),
        Text(
          t.t(
            passed ? 'exam.results_passed_title' : 'exam.results_failed_title',
          ),
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w900,
            color: tone,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          t.t(
            passed
                ? 'exam.results_passed_subtitle'
                : 'exam.results_failed_subtitle',
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Icon(
              passed ? Icons.emoji_events_outlined : Icons.assignment_outlined,
              color: tone,
              size: 32,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                '${score.round()}%',
                style: TextStyle(
                  fontSize: 48,
                  fontWeight: FontWeight.w900,
                  color: passed ? tone : colors.onSurface,
                ),
              ),
            ),
            Text('$correct/$total'),
          ],
        ),
        const SizedBox(height: 16),
        Text(t.t('practice_exam.score_pass_threshold', {'n': threshold})),
        const SizedBox(height: 8),
        LinearProgressIndicator(
          value: (score / 100).clamp(0, 1),
          minHeight: 10,
          borderRadius: BorderRadius.circular(16),
          color: tone,
        ),
        const SizedBox(height: 8),
        Text('$correct/$total · $threshold/$total'),
        const SizedBox(height: 16),
        RijviaAdaptiveGrid(
          minCellWidth: 180,
          maxColumns: 3,
          children: [
            RijviaMetricCard(
              icon: Icons.check_circle_outline,
              label: t.t('practice_exam.score_correct'),
              value: '$correct',
              color: const Color(0xff16a34a),
            ),
            RijviaMetricCard(
              icon: Icons.cancel_outlined,
              label: t.t('practice_exam.score_wrong'),
              value: '$wrong',
              color: const Color(0xffef4444),
            ),
            RijviaMetricCard(
              icon: Icons.timer_off_outlined,
              label: t.t('practice_exam.score_timeout'),
              value: '$unanswered',
              color: const Color(0xfff97316),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            if (widget.resultLoader == null || widget.retakeBuilder != null)
              FilledButton.icon(
                onPressed: () {
                  if (widget.retakeBuilder != null) {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: widget.retakeBuilder!),
                    );
                  } else {
                    Navigator.pushNamed(context, '/exam');
                  }
                },
                icon: const Icon(Icons.refresh),
                label: Text(t.t('exam.results_take_another')),
              ),
            FilledButton.tonal(
              key: const ValueKey('exam-review-button'),
              onPressed: hasAnswers ? _openReview : null,
              child: Text(t.t('exam.results_toggle_review')),
            ),
            OutlinedButton(
              onPressed: () => Navigator.pushNamed(context, '/dashboard'),
              child: Text(t.t('exam.results_back_dashboard')),
            ),
          ],
        ),
      ],
    );
    final icon = Container(
      width: 150,
      height: 150,
      decoration: BoxDecoration(
        color: tone.withValues(alpha: .06),
        border: Border.all(color: tone.withValues(alpha: .2)),
        borderRadius: BorderRadius.circular(27),
      ),
      child: Icon(
        passed ? Icons.check_circle_outline : Icons.cancel_outlined,
        color: tone,
        size: 56,
      ),
    );
    return RijviaPageSection(
      child: LayoutBuilder(
        builder: (context, c) => c.maxWidth >= 900
            ? Row(
                children: [
                  SizedBox(width: 180, child: Center(child: icon)),
                  const SizedBox(width: 24),
                  Expanded(child: details),
                ],
              )
            : Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(child: icon),
                  const SizedBox(height: 20),
                  details,
                ],
              ),
      ),
    );
  }

  Widget _buildCategoryRow(ExamCategoryBreakdown category, String language) {
    final name =
        category.localizedName(language) ?? category.categoryCode ?? '';
    final correct = category.correctAnswers ?? 0;
    final total = category.totalQuestions ?? 0;
    final accuracy =
        category.accuracyPercentage ??
        (total > 0 ? (correct / total) * 100 : 0);
    final weak = category.isWeakArea;
    final progress = (accuracy / 100).clamp(0.0, 1.0).toDouble();
    final colors = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(
                weak ? Icons.warning_amber_rounded : Icons.insights,
                color: weak ? colors.tertiary : colors.primary,
              ),
              const SizedBox(width: 12),
              Expanded(child: Text(name)),
              Text('${accuracy.toStringAsFixed(0)}%'),
            ],
          ),
          const SizedBox(height: 6),
          LinearProgressIndicator(value: progress),
          const SizedBox(height: 4),
          Text('$correct/$total'),
        ],
      ),
    );
  }

  Widget _buildAnswerTile(
    ExamAnswerReview answer,
    int index,
    String language,
    AppLocalizations localizations,
  ) {
    final correct = answer.isCorrect;
    final timeout = answer.wasTimeout;
    final question = answer.localized('questionText', language) ?? '';
    final selected = answer.localized('selectedOptionText', language);
    final expected = answer.localized('correctOptionText', language);
    final explanation = answer.localized('explanation', language);
    final category =
        answer.localized('categoryName', language) ?? answer.categoryCode;
    final difficulty = _difficultyLabel(answer.difficulty, localizations);
    final scheme = Theme.of(context).colorScheme;
    final statusColor = timeout
        ? scheme.tertiary
        : correct
        ? AppColors.success
        : scheme.error;
    final statusIcon = timeout
        ? Icons.timer_off
        : correct
        ? Icons.check_circle
        : Icons.cancel;
    final imagePath = answer.contentImageUrl;

    return Card(
      key: index == 0 ? _firstAnswerKey : null,
      margin: const EdgeInsets.only(bottom: 8),
      child: ExpansionTile(
        leading: Icon(statusIcon, color: statusColor),
        title: Text('${index + 1}. $question'),
        subtitle: Text(
          timeout
              ? localizations.t('exam.results_timeout')
              : correct
              ? localizations.t('exam.preview_correct')
              : localizations.t('exam.preview_incorrect'),
        ),
        childrenPadding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
        children: [
          if (imagePath != null && imagePath.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 20),
              child: RijviaEducationalImage(
                url: imagePath,
                radius: RijviaDesignLayout.questionImageRadius,
                label: localizations.t('media.question_image'),
                maxHeight: 360,
              ),
            ),
          _answerLine(
            localizations.t('exam.results_your_answer'),
            timeout || selected == null || selected.isEmpty
                ? localizations.t('exam.results_no_answer')
                : selected,
            correct: timeout ? null : correct,
          ),
          if (expected != null && expected.isNotEmpty)
            _answerLine(
              localizations.t('exam.results_correct_answer'),
              expected,
              correct: true,
            ),
          _answerLine(
            localizations.t('exam.results_explanation'),
            explanation != null && explanation.isNotEmpty
                ? explanation
                : localizations.t('exam.results_explanation_unavailable'),
            explanation: true,
          ),
          const SizedBox(height: 12),
          if (category != null && category.isNotEmpty)
            Align(
              alignment: AlignmentDirectional.centerStart,
              child: Text(
                category,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
          if (difficulty.trim().isNotEmpty)
            Align(
              alignment: AlignmentDirectional.centerStart,
              child: Chip(
                avatar: const Icon(Icons.speed, size: 16),
                label: Text(
                  difficulty,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _answerLine(
    String label,
    String value, {
    bool? correct,
    bool explanation = false,
  }) => RijviaResultAnswerBlock(
    label: label,
    text: value,
    correct: correct,
    explanation: explanation,
  );

  Widget _buildExpandableSectionCard({required Widget child}) {
    return RijviaPanel(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: child,
    );
  }

  String _difficultyLabel(String? difficulty, AppLocalizations localizations) {
    return switch (difficulty?.trim().toUpperCase()) {
      'EASY' => localizations.t('practice.easy'),
      'MEDIUM' => localizations.t('practice.medium'),
      'HARD' => localizations.t('practice.hard'),
      _ => difficulty?.trim() ?? '',
    };
  }

  String _formatDate(DateTime value) {
    return ProgressPresentation.date(
      value,
      Localizations.localeOf(context).languageCode,
    );
  }
}
