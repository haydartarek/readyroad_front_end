import '../../design_system/widgets/rijvia_answer_option.dart';
import '../../design_system/widgets/rijvia_content.dart';
import '../../design_system/widgets/rijvia_app_bar.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/constants/api_constants.dart';
import '../../core/di/service_locator.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/providers/language_provider.dart';
import '../../core/network/authenticated_api_client.dart';
import '../../shared/models/category.dart';
import '../../shared/models/quiz_models.dart';
import '../../shared/widgets/service_unavailable_banner.dart';
import 'quiz_result_screen.dart';
import 'quiz_service.dart';

class QuizScreen extends StatefulWidget {
  final Category? category;
  final int questionCount;

  const QuizScreen({super.key, this.category, this.questionCount = 10});

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  final QuizService _quizService = getIt<QuizService>();
  List<QuizQuestion> _questions = const [];
  int _currentQuestionIndex = 0;
  int _correctAnswers = 0;
  int _wrongAnswers = 0;
  int? _selectedAnswer;
  bool _isAnswered = false;
  bool _isSubmitting = false;
  bool _isLoading = true;
  String? _error;
  bool _serviceUnavailable = false;
  PracticeAnswerFeedback? _feedback;
  final List<QuizReviewItem> _review = [];
  late DateTime _quizStartTime;
  late DateTime _questionStartTime;

  @override
  void initState() {
    super.initState();
    _quizStartTime = DateTime.now();
    _questionStartTime = _quizStartTime;
    _loadQuiz();
  }

  Future<void> _loadQuiz() async {
    if (mounted) {
      setState(() {
        _isLoading = true;
        _error = null;
        _serviceUnavailable = false;
        _questions = const [];
        _currentQuestionIndex = 0;
        _correctAnswers = 0;
        _wrongAnswers = 0;
        _selectedAnswer = null;
        _feedback = null;
        _review.clear();
        _isAnswered = false;
      });
    }
    try {
      final questions = await _quizService.generateQuiz(
        categoryId: widget.category?.id,
        questionCount: widget.questionCount,
      );
      if (!mounted) return;
      setState(() {
        _questions = questions;
        _quizStartTime = DateTime.now();
        _questionStartTime = _quizStartTime;
        _isLoading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.toString();
        _serviceUnavailable = AuthenticatedApiClient.isServiceUnavailable(
          error,
        );
        _isLoading = false;
      });
    }
  }

  Future<void> _selectAnswer(int optionId) async {
    if (_isAnswered || _isSubmitting || _questions.isEmpty) return;
    final question = _questions[_currentQuestionIndex];
    setState(() {
      _selectedAnswer = optionId;
      _isSubmitting = true;
    });

    try {
      final feedback = await _quizService.submitAnswer(
        question.id,
        optionId,
        DateTime.now().difference(_questionStartTime),
      );
      if (!mounted) return;
      setState(() {
        _feedback = feedback;
        _isAnswered = true;
        _isSubmitting = false;
        if (feedback.isCorrect) {
          _correctAnswers++;
        } else {
          _wrongAnswers++;
        }
        _review.add(
          QuizReviewItem(
            question: question,
            selectedOptionId: optionId,
            correctOptionId: feedback.correctOptionId,
            explanationEn: feedback.explanationEn,
            explanationAr: feedback.explanationAr,
            explanationNl: feedback.explanationNl,
            explanationFr: feedback.explanationFr,
          ),
        );
      });
      Future<void>.delayed(const Duration(milliseconds: 1500), () {
        if (mounted && _isAnswered) _nextQuestion();
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _isSubmitting = false;
        _selectedAnswer = null;
        _serviceUnavailable = AuthenticatedApiClient.isServiceUnavailable(
          error,
        );
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            AppLocalizations.of(context).t('practice.result_error'),
          ),
        ),
      );
    }
  }

  void _nextQuestion() {
    if (_currentQuestionIndex < _questions.length - 1) {
      setState(() {
        _currentQuestionIndex++;
        _selectedAnswer = null;
        _feedback = null;
        _isAnswered = false;
        _questionStartTime = DateTime.now();
      });
    } else {
      _finishQuiz();
    }
  }

  void _finishQuiz() {
    if (_questions.isEmpty) return;
    final result = QuizResult(
      totalQuestions: _questions.length,
      correctAnswers: _correctAnswers,
      wrongAnswers: _wrongAnswers,
      timeTaken: DateTime.now().difference(_quizStartTime),
      categoryId: widget.category?.id,
      review: List.unmodifiable(_review),
    );
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => QuizResultScreen(
          result: result,
          retryBuilder: (_) => QuizScreen(
            category: widget.category,
            questionCount: widget.questionCount,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final language = context.watch<LanguageProvider>().currentLanguage;
    final isArabic = language == 'ar';
    final l10n = AppLocalizations.of(context);
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        final shouldPop = await _showExitDialog(isArabic);
        if (shouldPop == true && context.mounted) Navigator.of(context).pop();
      },
      child: Scaffold(
        appBar: RijviaAppBar(
          title: Text(
            widget.category == null
                ? l10n.t('practice.quiz')
                : '${widget.category!.getName(language)} ${l10n.t('practice.quiz_suffix')}',
          ),
          actions: [
            if (_questions.isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Center(
                  child: Text(
                    '${_currentQuestionIndex + 1}/${_questions.length}',
                  ),
                ),
              ),
          ],
        ),
        body: RijviaScrollFrame(
          maxWidth: 950,
          child: _buildBody(language, isArabic),
        ),
      ),
    );
  }

  Widget _buildBody(String language, bool isArabic) {
    final l10n = AppLocalizations.of(context);
    if (_isLoading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 16),
            Text(l10n.t('practice.loading_questions')),
          ],
        ),
      );
    }
    if (_error != null) {
      if (_serviceUnavailable) {
        return Padding(
          padding: const EdgeInsets.all(16),
          child: ServiceUnavailableBanner(onRetry: _loadQuiz),
        );
      }
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: Colors.red),
              const SizedBox(height: 16),
              Text(
                l10n.t('practice.result_error'),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _loadQuiz,
                child: Text(l10n.t('dashboard.retry')),
              ),
            ],
          ),
        ),
      );
    }
    if (_questions.isEmpty) {
      return Center(child: Text(l10n.t('practice.no_questions')));
    }

    final question = _questions[_currentQuestionIndex];
    return Column(
      children: [
        LinearProgressIndicator(
          value: (_currentQuestionIndex + 1) / _questions.length,
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildScoreItem(
                Icons.check_circle,
                Colors.green,
                l10n.t('practice.correct'),
                _correctAnswers,
              ),
              _buildScoreItem(
                Icons.cancel,
                Colors.red,
                l10n.t('practice.wrong'),
                _wrongAnswers,
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            children: [
              if (question.contentImageUrl != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: ColoredBox(
                    color: Theme.of(context).colorScheme.surfaceContainerLow,
                    child: SizedBox(
                      height: 200,
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Image.network(
                            _resolveImageUrl(question.contentImageUrl!),
                            fit: BoxFit.contain,
                            semanticLabel: l10n.t('media.question_image'),
                            errorBuilder: (_, _, _) =>
                                const Icon(Icons.image, size: 100),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              const SizedBox(height: 16),
              Text(
                question.questionFor(language),
                style: Theme.of(context).textTheme.titleLarge,
                textAlign: TextAlign.center,
              ),
              if (question.difficultyLevel.isNotEmpty ||
                  question.questionType.isNotEmpty) ...[
                const SizedBox(height: 8),
                Wrap(
                  alignment: WrapAlignment.center,
                  spacing: 8,
                  children: [
                    if (question.difficultyLevel.isNotEmpty)
                      Chip(
                        label: Text(
                          _difficultyLabel(question.difficultyLevel, l10n),
                        ),
                      ),
                    if (question.questionType.isNotEmpty)
                      Chip(label: Text(question.questionType)),
                  ],
                ),
              ],
              const SizedBox(height: 20),
              ...question.options.map(
                (option) => _buildOption(option, question, language),
              ),
              if (_feedback != null) ...[
                const SizedBox(height: 12),
                Card(
                  color: _feedback!.isCorrect
                      ? Colors.green.withValues(alpha: 0.1)
                      : Colors.red.withValues(alpha: 0.1),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      _feedback!.explanationFor(language).isEmpty
                          ? (_feedback!.isCorrect
                                ? l10n.t('practice.correct_answer')
                                : l10n.t('practice.incorrect_answer'))
                          : _feedback!.explanationFor(language),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildScoreItem(IconData icon, Color color, String label, int value) {
    return Row(
      children: [
        Icon(icon, color: color),
        const SizedBox(width: 8),
        Text('$label: $value'),
      ],
    );
  }

  Widget _buildOption(
    QuizAnswerOption option,
    QuizQuestion question,
    String language,
  ) {
    final isSelected = _selectedAnswer == option.id;
    final isCorrect = _feedback?.correctOptionId == option.id;
    final isWrongSelection = _isAnswered && isSelected && !isCorrect;
    return RijviaAnswerOption(
      index: question.options.indexOf(option),
      text: option.textFor(language),
      state: isCorrect
          ? RijviaAnswerState.correct
          : isWrongSelection
          ? RijviaAnswerState.incorrect
          : isSelected
          ? RijviaAnswerState.selected
          : _isAnswered
          ? RijviaAnswerState.neutral
          : RijviaAnswerState.idle,
      onSelect: _isAnswered || _isSubmitting
          ? null
          : () => _selectAnswer(option.id),
    );
  }

  Future<bool?> _showExitDialog(bool isArabic) {
    return showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(isArabic ? 'مغادرة الاختبار؟' : 'Exit quiz?'),
        content: Text(
          isArabic
              ? 'سيتم فقدان تقدم هذا الاختبار.'
              : 'This quiz progress will be lost.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(isArabic ? 'إلغاء' : 'Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(isArabic ? 'مغادرة' : 'Exit'),
          ),
        ],
      ),
    );
  }

  String _difficultyLabel(String value, AppLocalizations l10n) {
    return switch (value.toUpperCase()) {
      'EASY' => l10n.t('practice.easy'),
      'HARD' => l10n.t('practice.hard'),
      _ => l10n.t('practice.medium'),
    };
  }

  String _resolveImageUrl(String path) =>
      ApiConstants.resolveMediaUrl(path) ?? path;
}
