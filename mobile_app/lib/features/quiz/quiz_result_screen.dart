import '../../core/constants/app_theme.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_content.dart';
import '../../design_system/widgets/rijvia_app_bar.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../shared/models/quiz_models.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/providers/language_provider.dart';
import '../../core/providers/statistics_provider.dart';

/// Quiz Result Screen - Shows quiz results
class QuizResultScreen extends StatefulWidget {
  final QuizResult result;
  final WidgetBuilder? retryBuilder;

  const QuizResultScreen({super.key, required this.result, this.retryBuilder});

  @override
  State<QuizResultScreen> createState() => _QuizResultScreenState();
}

class _QuizResultScreenState extends State<QuizResultScreen> {
  String _reviewFilter = 'all';
  @override
  void initState() {
    super.initState();
    // Save result to statistics
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<StatisticsProvider>().saveResult(widget.result);
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      appBar: RijviaAppBar(
        title: Text(l10n.t('quiz.results_title')),
        automaticallyImplyLeading: false,
      ),
      body: RijviaScrollFrame(
        maxWidth: 950,
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                RijviaProgressRing(
                  value: widget.result.score / 100,
                  label: '${widget.result.score}%',
                  caption:
                      '${widget.result.correctAnswers}/${widget.result.totalQuestions}',
                  color: _getScoreColor(),
                ),
                const SizedBox(height: 24),

                // Grade
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: _getScoreColor().withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${l10n.t('quiz.grade')}: ${widget.result.grade}',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: _getScoreColor(),
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                Text(
                  widget.result.isPassed
                      ? l10n.t('quiz.passed')
                      : l10n.t('quiz.failed'),
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: widget.result.isPassed
                        ? AppColors.success
                        : AppColors.error,
                  ),
                ),

                const SizedBox(height: 32),

                // Stats
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        _buildStatRow(
                          Icons.quiz,
                          l10n.t('quiz.total_questions'),
                          '${widget.result.totalQuestions}',
                        ),
                        const Divider(),
                        _buildStatRow(
                          Icons.check_circle,
                          l10n.t('quiz.correct_answers'),
                          '${widget.result.correctAnswers}',
                          AppColors.success,
                        ),
                        const Divider(),
                        _buildStatRow(
                          Icons.cancel,
                          l10n.t('quiz.wrong_answers'),
                          '${widget.result.wrongAnswers}',
                          AppColors.error,
                        ),
                        const Divider(),
                        _buildStatRow(
                          Icons.timer,
                          l10n.t('quiz.time_taken'),
                          _formatDuration(widget.result.timeTaken),
                        ),
                      ],
                    ),
                  ),
                ),

                if (widget.result.review.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Align(
                    alignment: AlignmentDirectional.centerStart,
                    child: Text(
                      l10n.t('quiz.review'),
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  const SizedBox(height: 8),
                  SegmentedButton<String>(
                    segments: [
                      ButtonSegment(
                        value: 'all',
                        label: Text(l10n.t('practice.filter_all')),
                      ),
                      ButtonSegment(
                        value: 'wrong',
                        label: Text(l10n.t('practice.filter_wrong')),
                      ),
                    ],
                    selected: {_reviewFilter},
                    onSelectionChanged: (value) =>
                        setState(() => _reviewFilter = value.first),
                  ),
                  ...widget.result.review
                      .where(
                        (item) => _reviewFilter == 'all' || !item.isCorrect,
                      )
                      .map((item) => _reviewItem(item, l10n)),
                ],

                const SizedBox(height: 32),

                // Actions
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          Navigator.popUntil(context, (route) => route.isFirst);
                        },
                        icon: const Icon(Icons.home),
                        label: Text(l10n.t('common.home')),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: widget.retryBuilder == null
                            ? null
                            : () => Navigator.pushReplacement(
                                context,
                                MaterialPageRoute(
                                  builder: widget.retryBuilder!,
                                ),
                              ),
                        icon: const Icon(Icons.refresh),
                        label: Text(l10n.t('dashboard.retry')),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _reviewItem(QuizReviewItem item, AppLocalizations l10n) {
    final language = context.read<LanguageProvider>().currentLanguage;
    final explanation = item.explanationFor(language);
    final selected = _optionText(
      item.question,
      item.selectedOptionId,
      language,
    );
    final correct = _optionText(item.question, item.correctOptionId, language);
    return Card(
      child: ListTile(
        leading: Icon(
          item.isCorrect ? Icons.check_circle : Icons.cancel,
          color: item.isCorrect ? AppColors.success : AppColors.error,
        ),
        title: Text(item.question.questionFor(language)),
        subtitle: Text(
          [
            if (selected != null && selected.isNotEmpty)
              '${l10n.t('practice.selected_answer')}: $selected',
            if (!item.isCorrect && correct != null && correct.isNotEmpty)
              '${l10n.t('practice.correct_answer')}: $correct',
            if (explanation.isNotEmpty)
              '${l10n.t('practice.explanation')}: $explanation',
          ].join('\n'),
        ),
      ),
    );
  }

  String? _optionText(QuizQuestion question, int? id, String language) {
    if (id == null) return null;
    for (final option in question.options) {
      if (option.id == id) return option.textFor(language);
    }
    return null;
  }

  Widget _buildStatRow(
    IconData icon,
    String label,
    String value, [
    Color? color,
  ]) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, color: color),
          const SizedBox(width: 12),
          Expanded(child: Text(label, style: const TextStyle(fontSize: 16))),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Color _getScoreColor() {
    if (widget.result.score >= 90) return AppColors.success;
    if (widget.result.score >= 70) return AppColors.success;
    if (widget.result.score >= 60) return AppColors.warning;
    return AppColors.error;
  }

  String _formatDuration(Duration duration) {
    if (duration.inHours > 0) {
      return "${duration.inHours.toString().padLeft(2, '0')}:"
          "${(duration.inMinutes % 60).toString().padLeft(2, '0')}:"
          "${(duration.inSeconds % 60).toString().padLeft(2, '0')}";
    }
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return "${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}";
  }
}
