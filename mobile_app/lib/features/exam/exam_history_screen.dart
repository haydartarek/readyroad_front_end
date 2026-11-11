import '../../design_system/widgets/rijvia_app_bar.dart';
import 'package:flutter/material.dart';

import '../../core/constants/api_constants.dart';
import '../../core/di/service_locator.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/network/authenticated_api_client.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_content.dart';
import '../../shared/widgets/service_unavailable_banner.dart';
import 'exam_question_service.dart';
import 'exam_results_screen.dart';
import '../categories/sign_quiz_screen.dart';
import '../categories/sign_quiz_service.dart';

/// Persistent theory-exam attempts returned by the backend history endpoint.
class ExamHistoryScreen extends StatefulWidget {
  final Map<String, dynamic>? initialHistory;
  final List<SignRandomPracticeHistoryItem>? initialRandomHistory;
  final List<Map<String, dynamic>>? initialSignHistory;
  final int? highlightExamId;
  final int? highlightRandomSessionId;
  final int? highlightSignResultId;
  final bool embedded;

  const ExamHistoryScreen({
    super.key,
    this.initialHistory,
    this.initialRandomHistory,
    this.initialSignHistory,
    this.highlightExamId,
    this.highlightRandomSessionId,
    this.highlightSignResultId,
    this.embedded = false,
  });

  @override
  State<ExamHistoryScreen> createState() => _ExamHistoryScreenState();
}

class _ExamHistoryScreenState extends State<ExamHistoryScreen> {
  final ExamQuestionService _questionService = getIt<ExamQuestionService>();
  final SignQuizService _signQuizService = getIt<SignQuizService>();
  ExamHistoryResponse? _history;
  List<SignRandomPracticeHistoryItem> _randomPractice = const [];
  List<Map<String, dynamic>> _signExams = const [];
  String? _error;
  bool _serviceUnavailable = false;
  bool _isLoading = true;
  bool _deepLinkHandled = false;
  int? _expandedTheoryId;
  int? _expandedRandomSessionId;
  int? _expandedSignResultId;
  final Map<int, ExamResults> _theoryDetails = {};
  final Map<int, ExamResults> _randomDetails = {};
  final Map<int, ExamResults> _signDetails = {};
  final Set<int> _loadingTheoryDetails = {};
  final Set<int> _loadingRandomDetails = {};
  final Set<int> _loadingSignDetails = {};
  final Map<int, Object> _detailErrors = {};

  @override
  void initState() {
    super.initState();
    final initial = widget.initialHistory;
    if (initial != null && initial.isNotEmpty) {
      _history = ExamHistoryResponse.fromJson(
        Map<String, dynamic>.from(initial),
      );
      _randomPractice = widget.initialRandomHistory ?? const [];
      _signExams = widget.initialSignHistory ?? const [];
      _isLoading = false;
      _scheduleDeepLinkOpen();
    } else {
      _loadHistory();
    }
  }

  Future<void> _loadHistory() async {
    Tooltip.dismissAllToolTips();
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _error = null;
      _serviceUnavailable = false;
    });
    try {
      final values = await Future.wait([
        _questionService.getHistory(),
        _signQuizService.getRandomPracticeHistory(),
        _signQuizService.getExamHistory(),
      ]);
      if (!mounted) return;
      setState(() {
        _history = values[0] as ExamHistoryResponse;
        _randomPractice = values[1] as List<SignRandomPracticeHistoryItem>;
        _signExams = values[2] as List<Map<String, dynamic>>;
        _isLoading = false;
        _serviceUnavailable = false;
      });
      _scheduleDeepLinkOpen();
    } catch (error) {
      if (!mounted) return;
      final unavailable = AuthenticatedApiClient.isServiceUnavailable(error);
      setState(() {
        _serviceUnavailable = unavailable;
        _error = unavailable
            ? AppLocalizations.of(context).t('common.service_unavailable')
            : AppLocalizations.of(context).t('exam.results_history_error');
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context);
    return Scaffold(
      appBar: widget.embedded
          ? null
          : RijviaAppBar(
              title: Text(localizations.t('exam.results_history_title')),
              actions: [
                IconButton(
                  onPressed: _loadHistory,
                  tooltip: localizations.t('exam.results_history_retry'),
                  icon: const Icon(Icons.refresh),
                ),
              ],
            ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? _buildError(localizations)
          : _buildHistory(localizations),
    );
  }

  Widget _buildError(AppLocalizations localizations) {
    if (_serviceUnavailable) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: ServiceUnavailableBanner(onRetry: _loadHistory),
      );
    }
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 480),
        child: RijviaEmptyState(
          icon: Icons.error_outline,
          title: localizations.t('exam.results_history_error'),
          description: _error ?? localizations.t('exam.results_history_error'),
          action: FilledButton.icon(
            onPressed: _loadHistory,
            icon: const Icon(Icons.refresh),
            label: Text(localizations.t('exam.results_history_retry')),
          ),
        ),
      ),
    );
  }

  Widget _buildHistory(AppLocalizations localizations) {
    final exams = _history?.exams ?? const <ExamHistoryItem>[];
    final hasAdditionalHistory =
        _randomPractice.isNotEmpty || _signExams.isNotEmpty;
    if (exams.isEmpty && !hasAdditionalHistory) {
      return RefreshIndicator(
        onRefresh: _loadHistory,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(24),
          children: [
            const SizedBox(height: 96),
            Icon(
              Icons.history,
              size: 64,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(height: 16),
            Text(
              localizations.t('exam.results_history_empty'),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return RijviaScrollFrame(
      child: RefreshIndicator(
        onRefresh: _loadHistory,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          children: [
            _buildHistorySummary(localizations),
            const SizedBox(height: 12),
            for (var index = 0; index < exams.length; index++) ...[
              _buildExamCard(exams[index], index, exams.length, localizations),
              const SizedBox(height: 10),
            ],
            if (_randomPractice.isNotEmpty) ...[
              _sectionTitle(
                localizations.t('exam.results_random_practice_history'),
              ),
              for (final item in _randomPractice)
                _buildRandomCard(item, localizations),
            ],
            if (_signExams.isNotEmpty) ...[
              _sectionTitle(localizations.t('exam.results_sign_exam_history')),
              for (final item in _signExams)
                _buildSignCard(item, localizations),
            ],
          ],
        ),
      ),
    );
  }

  Widget _sectionTitle(String title) => RijviaSectionHeading(title: title);

  Widget _buildHistorySummary(AppLocalizations localizations) {
    final exams = _history?.exams ?? const <ExamHistoryItem>[];
    final totalAttempts =
        (_history?.totalExams ?? exams.length) +
        _randomPractice.length +
        _signExams.length;
    final completedTheory = exams.where(
      (exam) => (exam.status ?? '').toUpperCase() == 'COMPLETED',
    );
    final completedRandom = _randomPractice.where(
      (item) => item.status.toUpperCase() == 'COMPLETED',
    );
    final completedSign = _signExams.where(
      (item) =>
          item['status'] == null ||
          item['status'].toString().toUpperCase() == 'COMPLETED',
    );
    final completedCount =
        completedTheory.length + completedRandom.length + completedSign.length;
    final passedCount =
        completedTheory.where((exam) => exam.passed).length +
        completedRandom.where((item) => item.passed).length +
        completedSign.where((item) => _asBool(item['passed'])).length;
    final passRate = completedCount == 0
        ? 0.0
        : passedCount / completedCount * 100;

    return RijviaPanel(
      child: Row(
        children: [
          Expanded(
            child: _metric(
              localizations.t('exam.results_history_total_attempts'),
              '$totalAttempts',
            ),
          ),
          Expanded(
            child: _metric(
              localizations.t('exam.results_history_passed'),
              '$passedCount',
            ),
          ),
          Expanded(
            child: _metric(
              localizations.t('exam.results_history_pass_rate'),
              '${passRate.toStringAsFixed(0)}%',
            ),
          ),
        ],
      ),
    );
  }

  void _scheduleDeepLinkOpen() {
    if (_deepLinkHandled) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _openHighlightedResult();
    });
  }

  void _openHighlightedResult() {
    if (_deepLinkHandled) return;
    if (widget.highlightExamId != null) {
      final match = (_history?.exams ?? const <ExamHistoryItem>[]).where(
        (exam) => exam.examId == widget.highlightExamId,
      );
      if (match.isNotEmpty) {
        _deepLinkHandled = true;
        _toggleTheoryDetails(widget.highlightExamId!, true);
        return;
      }
    }
    if (widget.highlightRandomSessionId != null) {
      final match = _randomPractice.where(
        (item) => item.sessionId == widget.highlightRandomSessionId,
      );
      if (match.isNotEmpty) {
        _deepLinkHandled = true;
        _toggleRandomDetails(match.first, true);
        return;
      }
    }
    if (widget.highlightSignResultId != null) {
      final match = _signExams.where(
        (item) => _asInt(item['resultId']) == widget.highlightSignResultId,
      );
      if (match.isNotEmpty) {
        _deepLinkHandled = true;
        _toggleSignDetails(match.first, true);
      }
    }
  }

  void _toggleTheoryDetails(int examId, bool expanded) {
    if (expanded) {
      setState(() => _expandedTheoryId = examId);
      _loadTheoryDetails(examId);
    } else if (_expandedTheoryId == examId) {
      setState(() => _expandedTheoryId = null);
    }
  }

  Future<void> _loadTheoryDetails(int examId) async {
    if (_theoryDetails.containsKey(examId) ||
        _loadingTheoryDetails.contains(examId)) {
      return;
    }
    setState(() {
      _loadingTheoryDetails.add(examId);
      _detailErrors.remove(examId);
    });
    try {
      final detail = await _questionService.getResults(examId);
      if (!mounted) return;
      setState(() => _theoryDetails[examId] = detail);
    } catch (error) {
      if (!mounted) return;
      setState(() => _detailErrors[examId] = error);
    } finally {
      if (mounted) setState(() => _loadingTheoryDetails.remove(examId));
    }
  }

  void _toggleRandomDetails(SignRandomPracticeHistoryItem item, bool expanded) {
    if (expanded) {
      setState(() => _expandedRandomSessionId = item.sessionId);
      _loadRandomDetails(item.sessionId);
    } else if (_expandedRandomSessionId == item.sessionId) {
      setState(() => _expandedRandomSessionId = null);
    }
  }

  Future<void> _loadRandomDetails(int sessionId) async {
    if (_randomDetails.containsKey(sessionId) ||
        _loadingRandomDetails.contains(sessionId)) {
      return;
    }
    setState(() {
      _loadingRandomDetails.add(sessionId);
      _detailErrors.remove(sessionId);
    });
    try {
      final result = await _signQuizService.getRandomPracticeResult(sessionId);
      if (!mounted) return;
      setState(
        () => _randomDetails[sessionId] = ExamResults.fromSignResult(
          result.toJson(),
        ),
      );
    } catch (error) {
      if (!mounted) return;
      setState(() => _detailErrors[sessionId] = error);
    } finally {
      if (mounted) setState(() => _loadingRandomDetails.remove(sessionId));
    }
  }

  void _toggleSignDetails(Map<String, dynamic> item, bool expanded) {
    final resultId = _asInt(item['resultId']);
    if (resultId <= 0) return;
    if (expanded) {
      setState(() => _expandedSignResultId = resultId);
      _loadSignDetails(resultId);
    } else if (_expandedSignResultId == resultId) {
      setState(() => _expandedSignResultId = null);
    }
  }

  Future<void> _loadSignDetails(int resultId) async {
    if (_signDetails.containsKey(resultId) ||
        _loadingSignDetails.contains(resultId)) {
      return;
    }
    setState(() {
      _loadingSignDetails.add(resultId);
      _detailErrors.remove(resultId);
    });
    try {
      final result = await _signQuizService.getExamResult(resultId);
      if (!mounted) return;
      setState(
        () => _signDetails[resultId] = ExamResults.fromSignResult(result),
      );
    } catch (error) {
      if (!mounted) return;
      setState(() => _detailErrors[resultId] = error);
    } finally {
      if (mounted) setState(() => _loadingSignDetails.remove(resultId));
    }
  }

  void _openTheoryResult(int examId) {
    Tooltip.dismissAllToolTips();
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => ExamResultsScreen(examId: examId)),
    );
  }

  void _openRandomResult(SignRandomPracticeHistoryItem item) {
    Tooltip.dismissAllToolTips();
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ExamResultsScreen(
          examId: item.sessionId,
          resultLoader: () async => ExamResults.fromSignResult(
            (await _signQuizService.getRandomPracticeResult(
              item.sessionId,
            )).toJson(),
          ),
          retakeBuilder: (_) => const RandomSignPracticeScreen(),
        ),
      ),
    );
  }

  void _openSignResult(Map<String, dynamic> item) {
    Tooltip.dismissAllToolTips();
    final resultId = _asInt(item['resultId']);
    if (resultId <= 0) return;
    final signCode = item['signCode']?.toString() ?? '';
    final examNumber = _asInt(item['examNumber'], fallback: 1);
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ExamResultsScreen(
          examId: resultId,
          resultLoader: () async => ExamResults.fromSignResult(
            await _signQuizService.getExamResult(resultId),
          ),
          retakeBuilder: (_) => SignQuizScreen(
            signCode: signCode,
            examMode: true,
            examNumber: examNumber,
          ),
        ),
      ),
    );
  }

  Widget _buildRandomCard(
    SignRandomPracticeHistoryItem item,
    AppLocalizations localizations,
  ) {
    return _assessmentCard(
      title:
          '${localizations.t('exam.results_random_practice_history')} #${item.sessionId}',
      status: item.status,
      passed: item.passed,
      score: item.scorePercentage,
      correct: item.correctAnswers,
      total: item.totalQuestions,
      date: item.completedAt ?? item.startedAt,
      localizations: localizations,
      onTap: () => _openRandomResult(item),
      onExpanded: (expanded) => _toggleRandomDetails(item, expanded),
      detail: _randomDetails[item.sessionId],
      detailLoading: _loadingRandomDetails.contains(item.sessionId),
      detailError: _detailErrors[item.sessionId],
      onRetryDetail: () => _loadRandomDetails(item.sessionId),
      linkExpanded: _expandedRandomSessionId == item.sessionId,
    );
  }

  Widget _buildSignCard(
    Map<String, dynamic> item,
    AppLocalizations localizations,
  ) {
    final resultId = _asInt(item['resultId']);
    if (resultId <= 0) return const SizedBox.shrink();
    final signCode = item['signCode']?.toString() ?? '';
    final examNumber = _asInt(item['examNumber'], fallback: 1);
    return _assessmentCard(
      title:
          '$signCode · ${localizations.t('exam.results_history_exam')} $examNumber',
      status: 'COMPLETED',
      passed: _asBool(item['passed']),
      score: _asDouble(item['scorePercentage']),
      correct: _asInt(item['correctAnswers']),
      total: _asInt(item['totalQuestions'] ?? item['totalLinked']),
      date: DateTime.tryParse(item['completedAt']?.toString() ?? ''),
      localizations: localizations,
      onTap: () => _openSignResult(item),
      onExpanded: (expanded) => _toggleSignDetails(item, expanded),
      detail: _signDetails[resultId],
      detailLoading: _loadingSignDetails.contains(resultId),
      detailError: _detailErrors[resultId],
      onRetryDetail: () => _loadSignDetails(resultId),
      linkExpanded: _expandedSignResultId == resultId,
    );
  }

  Widget _assessmentCard({
    required String title,
    required String status,
    required bool passed,
    required double? score,
    required int? correct,
    required int? total,
    required DateTime? date,
    required AppLocalizations localizations,
    required VoidCallback onTap,
    required ValueChanged<bool> onExpanded,
    required ExamResults? detail,
    required bool detailLoading,
    required Object? detailError,
    required VoidCallback onRetryDetail,
    required bool linkExpanded,
  }) {
    final normalizedStatus = status.toUpperCase();
    final completed = normalizedStatus == 'COMPLETED';
    return Card(
      child: ExpansionTile(
        key: ValueKey(
          '$title-${linkExpanded || detail != null || detailLoading}',
        ),
        initiallyExpanded: linkExpanded || detail != null || detailLoading,
        onExpansionChanged: completed ? onExpanded : null,
        leading: Icon(
          completed && passed ? Icons.check_circle : Icons.history,
          color: _statusColor(normalizedStatus, passed),
        ),
        title: Text(title),
        subtitle: Text(
          [
            _statusLabel(normalizedStatus, passed, localizations),
            if (completed && score != null) '${score.toStringAsFixed(0)}%',
            if (completed && correct != null && total != null)
              '$correct/$total',
            if (date != null) _formatDate(date),
          ].join(' · '),
        ),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        children: [
          if (completed && score != null && correct != null && total != null)
            Row(
              children: [
                Expanded(
                  child: _metric(
                    localizations.t('exam.results_history_score'),
                    '${score.toStringAsFixed(0)}%',
                  ),
                ),
                Expanded(
                  child: _metric(
                    localizations.t('exam.results_history_questions'),
                    '$correct/$total',
                  ),
                ),
              ],
            ),
          if (completed) ...[
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: onTap,
              icon: const Icon(Icons.open_in_new),
              label: Text(localizations.t('exam.results_history_view_result')),
            ),
          ],
          _buildInlineDetail(
            detail: detail,
            loading: detailLoading,
            error: detailError,
            onRetry: onRetryDetail,
            localizations: localizations,
          ),
        ],
      ),
    );
  }

  Widget _buildExamCard(
    ExamHistoryItem exam,
    int index,
    int total,
    AppLocalizations localizations,
  ) {
    final examId = exam.examId ?? 0;
    final status = (exam.status ?? '').toUpperCase();
    final completed = status == 'COMPLETED';
    final passed = exam.passed;
    final score = exam.scorePercentage ?? 0;
    final correct = exam.correctAnswers ?? 0;
    final questions = exam.totalQuestions ?? 0;
    final statusLabel = _statusLabel(status, passed, localizations);
    final statusColor = _statusColor(status, passed);
    final startedAt = _formatDate(exam.completedAt ?? exam.startedAt);

    return Card(
      clipBehavior: Clip.antiAlias,
      child: ExpansionTile(
        key: ValueKey(
          'theory-$examId-${_expandedTheoryId == examId || _theoryDetails[examId] != null || _loadingTheoryDetails.contains(examId)}',
        ),
        initiallyExpanded:
            _expandedTheoryId == examId ||
            _theoryDetails[examId] != null ||
            _loadingTheoryDetails.contains(examId),
        onExpansionChanged: completed && examId > 0
            ? (expanded) => _toggleTheoryDetails(examId, expanded)
            : null,
        leading: Icon(
          completed && passed ? Icons.check_circle : Icons.history,
          color: statusColor,
        ),
        title: Text(
          '${localizations.t('exam.results_history_exam')} ${total - index}',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Text(
          [
            statusLabel,
            if (completed) '${score.toStringAsFixed(0)}%',
            if (completed) '$correct/$questions',
            startedAt,
          ].join(' · '),
        ),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        children: [
          if (completed) ...[
            Row(
              children: [
                Expanded(
                  child: _metric(
                    localizations.t('exam.results_history_score'),
                    '${score.toStringAsFixed(0)}%',
                  ),
                ),
                Expanded(
                  child: _metric(
                    localizations.t('exam.results_history_questions'),
                    '$correct/$questions',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: completed && examId > 0
                  ? () => _openTheoryResult(examId)
                  : null,
              icon: const Icon(Icons.open_in_new),
              label: Text(localizations.t('exam.results_history_view_result')),
            ),
          ],
          _buildInlineDetail(
            detail: _theoryDetails[examId],
            loading: _loadingTheoryDetails.contains(examId),
            error: _detailErrors[examId],
            onRetry: () => _loadTheoryDetails(examId),
            localizations: localizations,
          ),
        ],
      ),
    );
  }

  Widget _buildInlineDetail({
    required ExamResults? detail,
    required bool loading,
    required Object? error,
    required VoidCallback onRetry,
    required AppLocalizations localizations,
  }) {
    if (!loading && detail == null && error == null) {
      return const SizedBox.shrink();
    }
    if (loading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 16),
        child: Center(child: CircularProgressIndicator()),
      );
    }
    if (error != null) {
      if (AuthenticatedApiClient.isServiceUnavailable(error)) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: ServiceUnavailableBanner(onRetry: onRetry),
        );
      }
      return Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Row(
          children: [
            Expanded(child: Text(localizations.t('exam.results_error'))),
            TextButton(
              onPressed: onRetry,
              child: Text(localizations.t('exam.results_retry_load')),
            ),
          ],
        ),
      );
    }
    final result = detail!;
    final language = Localizations.localeOf(context).languageCode;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (result.categoryBreakdown.isNotEmpty) ...[
            Text(
              localizations.t('exam.results_categories'),
              style: Theme.of(context).textTheme.titleSmall,
            ),
            const SizedBox(height: 6),
            for (final category in result.categoryBreakdown)
              _inlineCategory(category, language),
            const SizedBox(height: 8),
          ],
          if (result.answers.isEmpty)
            Text(localizations.t('exam.results_no_answers'))
          else ...[
            Text(
              localizations.t('exam.results_review'),
              style: Theme.of(context).textTheme.titleSmall,
            ),
            const SizedBox(height: 6),
            for (var index = 0; index < result.answers.length; index++)
              _inlineAnswer(
                result.answers[index],
                index,
                language,
                localizations,
              ),
          ],
        ],
      ),
    );
  }

  Widget _inlineCategory(ExamCategoryBreakdown category, String language) {
    final total = category.totalQuestions ?? 0;
    final correct = category.correctAnswers ?? 0;
    final accuracy =
        (category.accuracyPercentage ??
                (total > 0 ? (correct / total) * 100 : 0))
            .clamp(0.0, 100.0)
            .toDouble();
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  category.localizedName(language) ??
                      category.categoryCode ??
                      '',
                ),
              ),
              Text('${accuracy.toStringAsFixed(0)}%'),
            ],
          ),
          const SizedBox(height: 3),
          LinearProgressIndicator(value: accuracy / 100),
          const SizedBox(height: 2),
          Text('$correct/$total', style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }

  Widget _inlineAnswer(
    ExamAnswerReview answer,
    int index,
    String language,
    AppLocalizations localizations,
  ) {
    final question = answer.localized('questionText', language) ?? '';
    final selected = answer.localized('selectedOptionText', language);
    final correct = answer.localized('correctOptionText', language);
    final explanation =
        answer.localized('explanation', language) ??
        localizations.t('exam.results_explanation_unavailable');
    final imageUrl = ApiConstants.resolveMediaUrl(answer.contentImageUrl);
    final title = question.isEmpty
        ? '${localizations.t('exam.question')} ${index + 1}'
        : '${index + 1}. $question';
    return Card(
      margin: const EdgeInsets.only(bottom: 6),
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            if (imageUrl != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: ColoredBox(
                    color: Theme.of(context).colorScheme.surfaceContainerLow,
                    child: Padding(
                      padding: const EdgeInsets.all(8),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Image.network(
                          imageUrl,
                          height: 120,
                          fit: BoxFit.contain,
                          errorBuilder: (_, _, _) => const SizedBox.shrink(),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            Text(
              '${localizations.t('exam.results_your_answer')}: ${answer.wasTimeout ? localizations.t('exam.results_no_answer') : (selected ?? localizations.t('exam.results_no_answer'))}',
            ),
            if (!answer.isCorrect && correct != null && correct.isNotEmpty)
              Text(
                '${localizations.t('exam.results_correct_answer')}: $correct',
              ),
            Text(
              '${localizations.t('exam.results_explanation')}: $explanation',
            ),
          ],
        ),
      ),
    );
  }

  Widget _metric(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 2),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }

  String _statusLabel(
    String status,
    bool passed,
    AppLocalizations localizations,
  ) {
    return switch (status) {
      'COMPLETED' =>
        passed ? localizations.examPassed : localizations.examFailed,
      'IN_PROGRESS' => localizations.t('exam.results_history_in_progress'),
      'ABANDONED' => localizations.t('exam.results_history_abandoned'),
      'EXPIRED' => localizations.t('exam.results_history_expired'),
      _ =>
        status.isEmpty
            ? localizations.t('exam.results_history_unknown')
            : status,
    };
  }

  Color _statusColor(String status, bool passed) {
    final colors = Theme.of(context).colorScheme;
    if (status == 'COMPLETED') return passed ? colors.primary : colors.error;
    if (status == 'IN_PROGRESS') return colors.secondary;
    if (status == 'EXPIRED') return colors.tertiary;
    return colors.onSurfaceVariant;
  }

  int _asInt(Object? value, {int fallback = 0}) {
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '') ?? fallback;
  }

  double? _asDouble(Object? value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '');
  }

  bool _asBool(Object? value) =>
      value == true || value?.toString().toLowerCase() == 'true';

  String _formatDate(Object? value) {
    final parsed = DateTime.tryParse(value?.toString() ?? '');
    if (parsed == null) return value?.toString() ?? '';
    final local = parsed.toLocal();
    return '${local.year}-${local.month.toString().padLeft(2, '0')}-${local.day.toString().padLeft(2, '0')} '
        '${local.hour.toString().padLeft(2, '0')}:${local.minute.toString().padLeft(2, '0')}';
  }
}
