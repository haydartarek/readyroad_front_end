import '../../design_system/widgets/rijvia_focused_question_card.dart';
import '../../design_system/widgets/rijvia_result_answer_block.dart';
import '../../design_system/rijvia_tokens.dart';
import '../../design_system/widgets/rijvia_educational_image.dart';
import '../profile/account_menu.dart';
import '../../design_system/widgets/rijvia_category_image.dart';
import '../../shared/models/content_item.dart';
import '../../design_system/widgets/rijvia_answer_option.dart';
import '../../core/constants/app_theme.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_content.dart';
import '../../design_system/widgets/rijvia_app_bar.dart';
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/di/service_locator.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/network/authenticated_api_client.dart';
import '../../core/providers/language_provider.dart';
import '../../shared/widgets/service_unavailable_banner.dart';
import '../exam/exam_question_service.dart';
import '../exam/exam_results_screen.dart';
import 'sign_quiz_service.dart';
import 'category_service.dart';
import '../../shared/models/category.dart';
import '../search/search_screen.dart';

class SignQuizScreen extends StatefulWidget {
  final String signCode;
  final bool examMode;
  final int examNumber;

  const SignQuizScreen({
    super.key,
    required this.signCode,
    required this.examMode,
    this.examNumber = 1,
  });

  @override
  State<SignQuizScreen> createState() => _SignQuizScreenState();
}

class _SignQuizScreenState extends State<SignQuizScreen> {
  final SignQuizService _service = getIt<SignQuizService>();
  List<SignQuizQuestion> _questions = const [];
  final Map<int, int> _answers = {};
  int _currentIndex = 0;
  int? _selectedChoice;
  bool _isLoading = true;
  bool _allowExit = false;
  void _leave() {
    if (!mounted) return;
    setState(() => _allowExit = true);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) Navigator.pop(context);
    });
  }

  bool _isSubmitting = false;
  Timer? _questionTimer;
  int _secondsLeft = 10;
  String? _error;
  bool _serviceUnavailable = false;
  SignPracticeFeedback? _feedback;
  int? _sessionId;
  DateTime _questionStartedAt = DateTime.now();

  @override
  void initState() {
    super.initState();
    _loadQuiz();
  }

  @override
  void dispose() {
    _questionTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadQuiz() async {
    if (widget.signCode.trim().isEmpty) {
      setState(() {
        _isLoading = false;
        _error = 'invalid sign code';
      });
      return;
    }
    setState(() {
      _isLoading = true;
      _error = null;
      _serviceUnavailable = false;
      _feedback = null;
      _selectedChoice = null;
      _answers.clear();
      _currentIndex = 0;
    });
    try {
      if (widget.examMode) {
        final session = await _service.getExamQuestions(
          widget.signCode,
          examNumber: widget.examNumber,
        );
        _questions = session.questions;
      } else {
        final session = await _service.startPractice(widget.signCode);
        _sessionId = session.sessionId;
        _questions = session.questions;
      }
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _questionStartedAt = DateTime.now();
      });
      if (widget.examMode) _startExamTimer();
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = AppLocalizations.of(context).t('practice.result_error');
        _serviceUnavailable = AuthenticatedApiClient.isServiceUnavailable(
          error,
        );
        _isLoading = false;
      });
    }
  }

  void _startExamTimer() {
    _questionTimer?.cancel();
    _secondsLeft = 10;
    _questionTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted || !widget.examMode || _isSubmitting) return;
      if (_secondsLeft <= 1) {
        timer.cancel();
        _advanceExamQuestion();
      } else {
        setState(() => _secondsLeft--);
      }
    });
  }

  Future<void> _advanceExamQuestion() async {
    if (_currentIndex == _questions.length - 1) {
      await _finishExam();
      return;
    }
    if (!mounted) return;
    setState(() => _currentIndex++);
    _startExamTimer();
  }

  Future<void> _selectChoice(int choiceId) async {
    if (_isSubmitting || _questions.isEmpty) return;
    final question = _questions[_currentIndex];
    if (widget.examMode) {
      setState(() => _answers[question.id] = choiceId);
      if (_currentIndex == _questions.length - 1) {
        await _finishExam();
      } else {
        await Future<void>.delayed(const Duration(milliseconds: 250));
        if (mounted) {
          setState(() => _currentIndex++);
          _startExamTimer();
        }
      }
      return;
    }

    final sessionId = _sessionId;
    if (sessionId == null) return;
    setState(() {
      _selectedChoice = choiceId;
      _isSubmitting = true;
    });
    try {
      final feedback = await _service.submitPracticeAnswer(
        sessionId,
        question.id,
        choiceId,
        timeTaken: DateTime.now().difference(_questionStartedAt),
      );
      if (!mounted) return;
      setState(() {
        _feedback = feedback;
        _isSubmitting = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = AppLocalizations.of(context).t('practice.result_error');
        _serviceUnavailable = AuthenticatedApiClient.isServiceUnavailable(
          error,
        );
        _isSubmitting = false;
      });
    }
  }

  Future<void> _nextPracticeQuestion() async {
    if (_currentIndex == _questions.length - 1) {
      if (_feedback?.sessionCompleted == true) {
        await _showCompletedDialog();
      }
      return;
    }
    setState(() {
      _currentIndex++;
      _selectedChoice = null;
      _feedback = null;
      _questionStartedAt = DateTime.now();
    });
  }

  Future<void> _finishExam() async {
    setState(() => _isSubmitting = true);
    try {
      final result = await _service.submitExam(
        widget.signCode,
        widget.examNumber,
        _answers,
      );
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      final l10n = AppLocalizations.of(context);
      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (_) => AlertDialog(
          title: Text(
            result.passed ? l10n.t('exam.passed') : l10n.t('exam.failed'),
          ),
          content: Text(
            '${result.correctAnswers}/${result.totalLinked} · ${result.scorePercentage.toStringAsFixed(0)}%',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(l10n.t('practice.finish')),
            ),
          ],
        ),
      );
      if (mounted) _leave();
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = AppLocalizations.of(context).t('practice.result_error');
        _serviceUnavailable = AuthenticatedApiClient.isServiceUnavailable(
          error,
        );
        _isSubmitting = false;
      });
    }
  }

  Future<void> _showCompletedDialog() async {
    final sessionId = _sessionId;
    if (!mounted || sessionId == null) return;
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => SignPracticeResultScreen(sessionId: sessionId),
      ),
    );
  }

  Future<void> _confirmExit() async {
    if (!mounted) return;
    final l10n = AppLocalizations.of(context);
    final leave = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(l10n.t('practice.abandon_title')),
        content: Text(l10n.t('practice.abandon_message')),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(l10n.t('common.cancel')),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(l10n.t('practice.abandon')),
          ),
        ],
      ),
    );
    if (leave != true || !mounted) return;
    if (!widget.examMode && _sessionId != null) {
      try {
        await _service.abandonPractice(_sessionId!);
      } catch (_) {}
    }
    if (mounted) _leave();
  }

  @override
  Widget build(BuildContext context) {
    final language = context.watch<LanguageProvider>().currentLanguage;
    final l10n = AppLocalizations.of(context);
    return PopScope(
      canPop: _allowExit,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) unawaited(_confirmExit());
      },
      child: Scaffold(
        appBar: RijviaAppBar(
          title: Text(
            widget.examMode ? l10n.t('signs.exam') : l10n.t('signs.practice'),
          ),
        ),
        body: RijviaScrollFrame(
          maxWidth: 1680,
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _error != null
              ? _buildError()
              : _questions.isEmpty
              ? Center(child: Text(l10n.t('practice.no_questions')))
              : _buildQuestion(language),
        ),
      ),
    );
  }

  Widget _buildQuestion(String language) {
    final question = _questions[_currentIndex];
    final imagePath = question.signImagePath;
    final t = AppLocalizations.of(context);
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        RijviaFocusedQuestionCard(
          title: question.questionFor(language),
          media: imagePath == null || imagePath.isEmpty
              ? null
              : RijviaEducationalImage(
                  url: imagePath,
                  radius: RijviaDesignLayout.questionImageRadius,
                  label: t.t('media.question_image'),
                  maxHeight: MediaQuery.sizeOf(context).width >= 1024
                      ? 440
                      : 240,
                ),
          options: [
            for (final choice in question.choices)
              _buildChoice(choice, question),
          ],
          feedback: _feedback == null
              ? null
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    RijviaResultAnswerBlock(
                      label: t.t(
                        _feedback!.isCorrect
                            ? 'practice.correct_answer'
                            : 'practice.incorrect_answer',
                      ),
                      text: _feedback!.explanationFor(language),
                      correct: _feedback!.isCorrect,
                    ),
                    if (_feedback!.selectedTextFor(language).isNotEmpty)
                      RijviaResultAnswerBlock(
                        label: t.t('practice.selected_answer'),
                        text: _feedback!.selectedTextFor(language),
                        correct: _feedback!.isCorrect,
                      ),
                    if (!_feedback!.isCorrect &&
                        _feedback!.correctTextFor(language).isNotEmpty)
                      RijviaResultAnswerBlock(
                        label: t.t('practice.correct_answer'),
                        text: _feedback!.correctTextFor(language),
                        correct: true,
                      ),
                    FilledButton(
                      onPressed: _nextPracticeQuestion,
                      child: Text(
                        t.t(
                          _currentIndex == _questions.length - 1
                              ? 'practice.finish'
                              : 'practice.next',
                        ),
                      ),
                    ),
                  ],
                ),
        ),
        RijviaExamInformation(
          current: _currentIndex + 1,
          total: _questions.length,
          seconds: widget.examMode ? _secondsLeft : null,
        ),
      ],
    );
  }

  Widget _buildChoice(SignChoice choice, SignQuizQuestion question) {
    final selected = widget.examMode
        ? _answers[question.id] == choice.id
        : _selectedChoice == choice.id;
    final correct =
        _feedback != null &&
        (_feedback!.correctChoiceId == choice.id ||
            (_feedback!.isCorrect && selected));
    return RijviaAnswerOption(
      index: question.choices.indexOf(choice),
      text: choice.textFor(context.read<LanguageProvider>().currentLanguage),
      state: correct
          ? RijviaAnswerState.correct
          : _feedback != null && selected
          ? RijviaAnswerState.incorrect
          : selected
          ? RijviaAnswerState.selected
          : _feedback != null
          ? RijviaAnswerState.neutral
          : RijviaAnswerState.idle,
      onSelect: _feedback == null && !_isSubmitting
          ? () => _selectChoice(choice.id)
          : null,
    );
  }

  Widget _buildError() {
    if (_serviceUnavailable) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: ServiceUnavailableBanner(onRetry: _loadQuiz),
      );
    }
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(AppLocalizations.of(context).t('practice.result_error')),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loadQuiz,
            child: Text(AppLocalizations.of(context).t('dashboard.retry')),
          ),
        ],
      ),
    );
  }
}

/// Persisted mixed traffic-sign practice parity with the web `/practice/random`
/// flow: 50 questions, one timed answer per question, server-side submission,
/// and resumable history/results.
class RandomSignPracticeScreen extends StatefulWidget {
  const RandomSignPracticeScreen({super.key});

  @override
  State<RandomSignPracticeScreen> createState() =>
      _RandomSignPracticeScreenState();
}

class _RandomSignPracticeScreenState extends State<RandomSignPracticeScreen> {
  final SignQuizService _service = getIt<SignQuizService>();
  SignRandomPracticeSession? _session;
  SignRandomPracticeResult? _result;
  final Map<int, int?> _answers = {};
  Timer? _timer;
  int _secondsLeft = 15;
  int _index = 0;
  bool _loading = true;
  bool _submitting = false;
  String? _error;
  bool _allowExit = false;
  bool _serviceUnavailable = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    _timer?.cancel();
    setState(() {
      _loading = true;
      _error = null;
      _serviceUnavailable = false;
      _result = null;
      _answers.clear();
      _index = 0;
    });
    try {
      final session = await _service.startRandomPractice();
      if (!mounted) return;
      setState(() {
        _session = session;
        _loading = false;
      });
      if (session.status == 'IN_PROGRESS') {
        _startTimer();
      } else {
        final result = await _service.getRandomPracticeResult(
          session.sessionId,
        );
        if (mounted) _openResult(result);
      }
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = AppLocalizations.of(context).t('practice.result_error');
        _serviceUnavailable = AuthenticatedApiClient.isServiceUnavailable(
          error,
        );
      });
    }
  }

  void _startTimer() {
    _timer?.cancel();
    _secondsLeft = 15;
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted || _result != null) return;
      if (_secondsLeft <= 1) {
        _timer?.cancel();
        _recordAnswer(null);
      } else {
        setState(() => _secondsLeft--);
      }
    });
  }

  Future<void> _recordAnswer(int? choiceId) async {
    final session = _session;
    if (session == null || _submitting || _result != null) return;
    final question = session.questions[_index];
    if (_answers.containsKey(question.id)) return;
    setState(() => _answers[question.id] = choiceId);
    if (_index < session.questions.length - 1) {
      setState(() => _index++);
      _startTimer();
      return;
    }
    _timer?.cancel();
    setState(() => _submitting = true);
    try {
      final result = await _service.submitRandomPractice(
        session.sessionId,
        _answers,
      );
      if (!mounted) return;
      setState(() {
        _result = result;
        _submitting = false;
      });
      _openResult(result);
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _submitting = false;
        _error = AppLocalizations.of(context).t('practice.result_error');
        _serviceUnavailable = AuthenticatedApiClient.isServiceUnavailable(
          error,
        );
      });
    }
  }

  Future<void> _abandon() async {
    final session = _session;
    if (session == null || _result != null) return;
    _timer?.cancel();
    try {
      await _service.abandonRandomPractice(session.sessionId);
    } finally {
      if (mounted) {
        setState(() => _allowExit = true);
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) Navigator.pop(context);
        });
      }
    }
  }

  Future<void> _confirmAbandon() async {
    if (!mounted || _session == null || _result != null) return;
    final l10n = AppLocalizations.of(context);
    final leave = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(l10n.t('practice.abandon_title')),
        content: Text(l10n.t('practice.abandon_message')),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(l10n.t('common.cancel')),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(l10n.t('practice.abandon')),
          ),
        ],
      ),
    );
    if (leave == true) await _abandon();
  }

  void _openResult(SignRandomPracticeResult result) {
    if (!mounted) return;
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => ExamResultsScreen(
          examId: result.sessionId,
          initialResult: ExamResults.fromSignResult(result.toJson()),
          retakeBuilder: (_) => const RandomSignPracticeScreen(),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final language = context.watch<LanguageProvider>().currentLanguage;
    final l10n = AppLocalizations.of(context);
    final session = _session;
    return Scaffold(
      appBar: RijviaAppBar(
        title: Text(l10n.t('practice.random_signs')),
        actions: [
          IconButton(
            tooltip: l10n.t('practice.history_title'),
            icon: const Icon(Icons.history),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => const RandomSignPracticeHistoryScreen(),
              ),
            ),
          ),
        ],
      ),
      body: RijviaScrollFrame(
        maxWidth: 950,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
            ? _errorState()
            : _result != null
            ? _resultView(_result!, language)
            : session == null || session.questions.isEmpty
            ? Center(child: Text(l10n.t('practice.no_questions')))
            : _questionView(session, language),
      ),
    );
  }

  Widget _questionView(SignRandomPracticeSession session, String language) {
    final question = session.questions[_index];
    return PopScope(
      canPop: _allowExit,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) unawaited(_confirmAbandon());
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          RijviaFocusedQuestionCard(
            title: question.questionFor(language),
            media: question.signImagePath == null
                ? null
                : RijviaEducationalImage(
                    url: question.signImagePath!,
                    radius: RijviaDesignLayout.questionImageRadius,
                    label: AppLocalizations.of(
                      context,
                    ).t('media.question_image'),
                    maxHeight: MediaQuery.sizeOf(context).width >= 1024
                        ? 440
                        : 240,
                  ),
            badges: Text(_difficultyLabel(question.difficulty)),
            options: [
              for (final choice in question.choices)
                RijviaAnswerOption(
                  index: question.choices.indexOf(choice),
                  text: choice.textFor(language),
                  state: _answers[question.id] == choice.id
                      ? RijviaAnswerState.selected
                      : RijviaAnswerState.idle,
                  onSelect: _submitting ? null : () => _recordAnswer(choice.id),
                ),
            ],
          ),
          RijviaExamInformation(
            current: _index + 1,
            total: session.questions.length,
            seconds: _secondsLeft,
            difficulty: _difficultyLabel(question.difficulty),
          ),
        ],
      ),
    );
  }

  Widget _resultView(SignRandomPracticeResult result, String language) {
    final l10n = AppLocalizations.of(context);
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        RijviaPanel(
          child: Column(
            children: [
              RijviaProgressRing(
                value: result.scorePercentage / 100,
                label: '${result.scorePercentage.toStringAsFixed(0)}%',
                caption: '${result.correctAnswers}/${result.totalQuestions}',
                color: result.passed ? AppColors.success : AppColors.error,
              ),
              const SizedBox(height: 16),
              Text(
                result.passed
                    ? l10n.t('signs.passed')
                    : l10n.t('practice.not_passed'),
                style: Theme.of(context).textTheme.titleLarge,
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: ListTile(
            leading: Icon(
              result.passed ? Icons.check_circle : Icons.cancel,
              color: result.passed ? AppColors.success : AppColors.error,
            ),
            title: Text(
              result.passed
                  ? l10n.t('signs.passed')
                  : l10n.t('practice.not_passed'),
            ),
            subtitle: Text(
              '${result.correctAnswers}/${result.totalQuestions} · '
              '${result.scorePercentage.toStringAsFixed(0)}%',
            ),
          ),
        ),
        const SizedBox(height: 12),
        ...result.questions.map(
          (item) => Card(
            child: ListTile(
              leading: Icon(
                item.wasTimeout
                    ? Icons.timer_off
                    : item.isCorrect
                    ? Icons.check
                    : Icons.close,
                color: item.isCorrect ? AppColors.success : AppColors.error,
              ),
              title: Text(item.questionFor(language)),
              subtitle: item.explanationFor(language).isEmpty
                  ? null
                  : Text(item.explanationFor(language)),
            ),
          ),
        ),
      ],
    );
  }

  String _difficultyLabel(String value) {
    final l10n = AppLocalizations.of(context);
    return switch (value.toUpperCase()) {
      'EASY' => l10n.t('practice.easy'),
      'HARD' => l10n.t('practice.hard'),
      _ => l10n.t('practice.medium'),
    };
  }

  Widget _errorState() => _serviceUnavailable
      ? Padding(
          padding: const EdgeInsets.all(16),
          child: ServiceUnavailableBanner(onRetry: _load),
        )
      : Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(AppLocalizations.of(context).t('practice.result_error')),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: _load,
                child: Text(AppLocalizations.of(context).t('dashboard.retry')),
              ),
            ],
          ),
        );
}

class RandomSignPracticeHistoryScreen extends StatefulWidget {
  const RandomSignPracticeHistoryScreen({super.key});

  @override
  State<RandomSignPracticeHistoryScreen> createState() =>
      _RandomSignPracticeHistoryScreenState();
}

class _RandomSignPracticeHistoryScreenState
    extends State<RandomSignPracticeHistoryScreen> {
  final SignQuizService _service = getIt<SignQuizService>();
  List<SignRandomPracticeHistoryItem> _items = const [];
  Object? _error;
  bool _serviceUnavailable = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final items = await _service.getRandomPracticeHistory();
      if (mounted) {
        setState(() {
          _items = items;
          _error = null;
          _serviceUnavailable = false;
        });
      }
    } catch (error) {
      if (mounted) {
        setState(() {
          _error = error;
          _serviceUnavailable = AuthenticatedApiClient.isServiceUnavailable(
            error,
          );
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      appBar: RijviaAppBar(title: Text(l10n.t('practice.history_title'))),
      body: RijviaScrollFrame(
        maxWidth: 950,
        child: _error != null
            ? (_serviceUnavailable
                  ? Padding(
                      padding: const EdgeInsets.all(16),
                      child: ServiceUnavailableBanner(onRetry: _load),
                    )
                  : Center(child: Text(l10n.t('practice.history_error'))))
            : RefreshIndicator(
                onRefresh: _load,
                child: _items.isEmpty
                    ? ListView(
                        children: [
                          const SizedBox(height: 180),
                          Center(child: Text(l10n.t('practice.history_empty'))),
                        ],
                      )
                    : ListView.builder(
                        itemCount: _items.length,
                        itemBuilder: (_, index) {
                          final item = _items[index];
                          return ListTile(
                            leading: Icon(
                              item.passed ? Icons.check_circle : Icons.history,
                            ),
                            title: Text(item.status),
                            subtitle: Text(
                              '${item.correctAnswers}/${item.totalQuestions} · '
                              '${item.scorePercentage.toStringAsFixed(0)}%',
                            ),
                            trailing: const Icon(Icons.chevron_right),
                            onTap: () async {
                              final result = await _service
                                  .getRandomPracticeResult(item.sessionId);
                              if (!context.mounted) return;
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => ExamResultsScreen(
                                    examId: result.sessionId,
                                    initialResult: ExamResults.fromSignResult(
                                      result.toJson(),
                                    ),
                                    retakeBuilder: (_) =>
                                        const RandomSignPracticeScreen(),
                                  ),
                                ),
                              );
                            },
                          );
                        },
                      ),
              ),
      ),
    );
  }
}

class SignQuizHistoryScreen extends StatefulWidget {
  const SignQuizHistoryScreen({super.key});

  @override
  State<SignQuizHistoryScreen> createState() => _SignQuizHistoryScreenState();
}

class _SignQuizHistoryScreenState extends State<SignQuizHistoryScreen> {
  final SignQuizService _service = getIt<SignQuizService>();
  List<Map<String, dynamic>> _practice = const [];
  List<Map<String, dynamic>> _exams = const [];
  Object? _error;
  bool _serviceUnavailable = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final values = await Future.wait([
        _service.getPracticeHistory(),
        _service.getExamHistory(),
      ]);
      if (!mounted) return;
      setState(() {
        _practice = values[0];
        _exams = values[1];
        _error = null;
        _serviceUnavailable = false;
      });
    } catch (error) {
      if (mounted) {
        setState(() {
          _error = error;
          _serviceUnavailable = AuthenticatedApiClient.isServiceUnavailable(
            error,
          );
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      appBar: RijviaAppBar(title: Text(l10n.t('practice.sign_history_title'))),
      body: RijviaScrollFrame(
        maxWidth: 950,
        child: _error != null
            ? (_serviceUnavailable
                  ? Padding(
                      padding: const EdgeInsets.all(16),
                      child: ServiceUnavailableBanner(onRetry: _load),
                    )
                  : Center(child: Text(l10n.t('practice.history_error'))))
            : RefreshIndicator(
                onRefresh: _load,
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Text(
                      l10n.t('signs.practice'),
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    ..._practice.map(
                      (item) => _historyTile(
                        context,
                        item,
                        isPractice: true,
                        resultLoader: () => _service.getPracticeResult(
                          _asInt(item['sessionId']),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      l10n.t('signs.exam'),
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    ..._exams.map(
                      (item) => _historyTile(
                        context,
                        item,
                        isPractice: false,
                        resultLoader: () =>
                            _service.getExamResult(_asInt(item['resultId'])),
                      ),
                    ),
                    if (_practice.isEmpty && _exams.isEmpty)
                      Padding(
                        padding: EdgeInsets.only(top: 100),
                        child: Center(
                          child: Text(l10n.t('practice.history_empty')),
                        ),
                      ),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _historyTile(
    BuildContext context,
    Map<String, dynamic> item, {
    required bool isPractice,
    required Future<Map<String, dynamic>> Function() resultLoader,
  }) {
    final score = item['scorePercentage'] ?? item['score'] ?? 0;
    final status =
        item['status'] ?? (item['passed'] == true ? 'PASSED' : 'FAILED');
    return Card(
      child: ListTile(
        title: Text('${item['signCode'] ?? ''} $status'),
        subtitle: Text(
          '$score% · ${item['completedAt'] ?? item['startedAt'] ?? ''}',
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: () async {
          if (isPractice && item['status']?.toString() == 'IN_PROGRESS') {
            final signCode = item['signCode']?.toString();
            if (signCode != null && signCode.isNotEmpty) {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) =>
                      SignQuizScreen(signCode: signCode, examMode: false),
                ),
              );
              return;
            }
          }
          try {
            if (isPractice) {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => SignPracticeResultScreen(
                    sessionId: _asInt(item['sessionId']),
                  ),
                ),
              );
              return;
            }
            final result = await resultLoader();
            if (!context.mounted) return;
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => ExamResultsScreen(
                  examId: _asInt(item['resultId']),
                  initialResult: ExamResults.fromSignResult(result),
                ),
              ),
            );
          } catch (_) {
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    AppLocalizations.of(context).t('practice.result_error'),
                  ),
                ),
              );
            }
          }
        },
      ),
    );
  }
}

class SignPracticeResultScreen extends StatefulWidget {
  final int sessionId;

  const SignPracticeResultScreen({super.key, required this.sessionId});

  @override
  State<SignPracticeResultScreen> createState() =>
      _SignPracticeResultScreenState();
}

class _SignPracticeResultScreenState extends State<SignPracticeResultScreen> {
  final SignQuizService _service = getIt<SignQuizService>();
  SignPracticeResult? _result;
  String? _error;
  bool _loading = true;
  bool _serviceUnavailable = false;
  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
      _serviceUnavailable = false;
    });
    try {
      final result = await _service.getPracticeResultModel(widget.sessionId);
      if (!mounted) return;
      setState(() {
        _result = result;
        _loading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = AppLocalizations.of(context).t('practice.result_error');
        _serviceUnavailable = AuthenticatedApiClient.isServiceUnavailable(
          error,
        );
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final language = context.watch<LanguageProvider>().currentLanguage;
    final result = _result;
    return Scaffold(
      appBar: RijviaAppBar(title: Text(l10n.t('practice.result_title'))),
      body: RijviaScrollFrame(
        maxWidth: 950,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
            ? (_serviceUnavailable
                  ? Padding(
                      padding: const EdgeInsets.all(16),
                      child: ServiceUnavailableBanner(onRetry: _load),
                    )
                  : _errorView(l10n))
            : result == null
            ? _errorView(l10n)
            : _resultBody(result, language, l10n),
      ),
    );
  }

  Widget _errorView(AppLocalizations l10n) => Center(
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(l10n.t('practice.result_error')),
        const SizedBox(height: 12),
        ElevatedButton(
          onPressed: _load,
          child: Text(l10n.t('dashboard.retry')),
        ),
      ],
    ),
  );

  Widget _resultBody(
    SignPracticeResult result,
    String language,
    AppLocalizations l10n,
  ) {
    final questions = result.questions.where((question) {
      if (_filter == 'correct') return question.isCorrect;
      if (_filter == 'wrong') return !question.isCorrect;
      return true;
    }).toList();
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                RijviaProgressRing(
                  value: result.scorePercentage / 100,
                  label: '${result.scorePercentage.toStringAsFixed(0)}%',
                  color: result.passed ? AppColors.success : AppColors.error,
                ),
                const SizedBox(height: 16),
                Text(
                  '${result.correctAnswers}/${result.totalQuestions} · ${result.passed ? l10n.t('signs.passed') : l10n.t('practice.not_passed')}',
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        SegmentedButton<String>(
          segments: [
            ButtonSegment(
              value: 'all',
              label: Text(l10n.t('practice.filter_all')),
            ),
            ButtonSegment(
              value: 'correct',
              label: Text(l10n.t('practice.filter_correct')),
            ),
            ButtonSegment(
              value: 'wrong',
              label: Text(l10n.t('practice.filter_wrong')),
            ),
          ],
          selected: {_filter},
          onSelectionChanged: (value) => setState(() => _filter = value.first),
        ),
        const SizedBox(height: 12),
        if (questions.isEmpty)
          Center(child: Text(l10n.t('practice.no_questions'))),
        ...questions.map((question) => _questionCard(question, language, l10n)),
      ],
    );
  }

  Widget _questionCard(
    SignPracticeResultQuestion question,
    String language,
    AppLocalizations l10n,
  ) {
    final explanation = question.explanationFor(language);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Icon(
                  question.isCorrect ? Icons.check_circle : Icons.cancel,
                  color: question.isCorrect
                      ? AppColors.success
                      : AppColors.error,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(_difficultyLabel(question.difficulty, l10n)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(question.questionFor(language)),
            if (question.selectedTextFor(language).isNotEmpty)
              Text(
                '${l10n.t('practice.selected_answer')}: ${question.selectedTextFor(language)}',
              ),
            if (!question.isCorrect &&
                question.correctTextFor(language).isNotEmpty)
              Text(
                '${l10n.t('practice.correct_answer')}: ${question.correctTextFor(language)}',
              ),
            if (explanation.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text('${l10n.t('practice.explanation')}: $explanation'),
              )
            else
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(l10n.t('practice.explanation_unavailable')),
              ),
          ],
        ),
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
}

class PracticeHubScreen extends StatefulWidget {
  const PracticeHubScreen({super.key, this.initialCategory});
  final String? initialCategory;

  @override
  State<PracticeHubScreen> createState() => _PracticeHubScreenState();
}

/// The Web Assessment contract has no matching backend controller yet.
/// Keep the mobile route explicit instead of sending users to a dead 404.
class AssessmentUnavailableScreen extends StatelessWidget {
  const AssessmentUnavailableScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      appBar: RijviaAppBar(title: Text(l10n.t('practice.assessment_title'))),
      body: RijviaScrollFrame(
        maxWidth: 950,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.info_outline, size: 56),
                const SizedBox(height: 16),
                Text(
                  l10n.t('practice.assessment_backend_missing'),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                OutlinedButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text(l10n.t('common.close')),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _PracticeHubScreenState extends State<PracticeHubScreen> {
  final SignQuizService _service = getIt<SignQuizService>();
  List<SignPracticeProgress> _items = const [];
  bool _loading = true;
  bool _serviceUnavailable = false;
  String? _error;
  SignCategoryCode? _category;
  List<Category> _categoryDetails = const [];
  Map<String, ContentItem> _representativeSigns = const {};
  bool _showAllSigns = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialCategory != null) {
      _category = SignCategoryCode.fromValue(widget.initialCategory);
    }
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
      _serviceUnavailable = false;
    });
    try {
      final representativesFuture = getIt<CategoryService>()
          .getRepresentativeSigns()
          .catchError((_) => <String, ContentItem>{});
      final detailsFuture = getIt<CategoryService>()
          .getAllCategories()
          .catchError((_) => <Category>[]);
      final items = await _service.getAllProgress();
      final details = await detailsFuture;
      final representatives = await representativesFuture;
      if (!mounted) return;
      setState(() {
        _items = items;
        _categoryDetails = details;
        _representativeSigns = representatives;
        _loading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = AppLocalizations.of(context).t('practice.result_error');
        _serviceUnavailable = AuthenticatedApiClient.isServiceUnavailable(
          error,
        );
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final language = context.watch<LanguageProvider>().currentLanguage;
    final filtered = _category == null
        ? _items
        : _items.where((item) => item.category == _category).toList();
    final categories = _items.map((item) => item.category).toSet().toList();
    return Scaffold(
      appBar: RijviaAppBar(
        title: Text(l10n.t('practice.hub_title')),
        leading: _category != null || _showAllSigns
            ? BackButton(
                onPressed: () {
                  setState(() {
                    _category = null;
                    _showAllSigns = false;
                  });
                },
              )
            : null,
        actions: [
          const RijviaAccountMenu(),
          IconButton(
            tooltip: l10n.t('signs.library'),
            icon: const Icon(Icons.search),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const SearchScreen()),
            ),
          ),
          IconButton(
            tooltip: l10n.t('practice.history_title'),
            icon: const Icon(Icons.history),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const SignQuizHistoryScreen()),
            ),
          ),
        ],
      ),
      body: RijviaScrollFrame(
        maxWidth: 950,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
            ? (_serviceUnavailable
                  ? Padding(
                      padding: const EdgeInsets.all(16),
                      child: ServiceUnavailableBanner(onRetry: _load),
                    )
                  : _errorBody(l10n))
            : RijviaScrollFrame(
                child: RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Card(
                        child: ListTile(
                          leading: const Icon(Icons.shuffle),
                          title: Text(l10n.t('practice.random_signs')),
                          subtitle: Text(
                            l10n.t('practice.random_signs_subtitle'),
                          ),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const RandomSignPracticeScreen(),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      if (categories.isNotEmpty) ...[
                        RijviaSectionHeading(
                          title: l10n.t('wire.training_categories'),
                        ),
                        if (_category == null && !_showAllSigns)
                          RijviaAdaptiveGrid(
                            minCellWidth: MediaQuery.textScalerOf(
                              context,
                            ).scale(260),
                            children: [
                              for (final category in categories)
                                RijviaTopicCard(
                                  title: _categoryName(category, language),
                                  image: RijviaCategoryImage(
                                    sign:
                                        _representativeSigns[category.name
                                            .toUpperCase()],
                                    label: _categoryName(category, language),
                                  ),
                                  subtitle:
                                      '${_items.where((item) => item.category == category).length} ${l10n.t('story.signs_count')}',
                                  progress:
                                      _items
                                          .where(
                                            (item) =>
                                                item.category == category &&
                                                item.practiceCompleted,
                                          )
                                          .length /
                                      _items
                                          .where(
                                            (item) => item.category == category,
                                          )
                                          .length,
                                  onTap: () =>
                                      setState(() => _category = category),
                                ),
                            ],
                          ),
                        const SizedBox(height: 16),
                        if (_category != null || _showAllSigns)
                          InputDecorator(
                            decoration: InputDecoration(
                              labelText: l10n.t('wire.training_categories'),
                            ),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<SignCategoryCode>(
                                value: _category,
                                isExpanded: true,
                                itemHeight: null,
                                menuMaxHeight: 400,
                                hint: Text(l10n.t('practice.filter_all')),
                                style: Theme.of(context).textTheme.bodyLarge,
                                onChanged: (category) => setState(() {
                                  _category = category;
                                  _showAllSigns = true;
                                }),
                                items: [
                                  DropdownMenuItem(
                                    value: null,
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 12,
                                      ),
                                      child: Text(
                                        l10n.t('practice.filter_all'),
                                      ),
                                    ),
                                  ),
                                  for (final category in categories)
                                    DropdownMenuItem(
                                      value: category,
                                      child: Padding(
                                        padding: const EdgeInsets.symmetric(
                                          vertical: 12,
                                        ),
                                        child: Text(
                                          _categoryName(category, language),
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ),
                        if (_category != null || _showAllSigns) ...[
                          const SizedBox(height: 12),
                          Text(
                            '${l10n.t('signs.practice')}: '
                            '${filtered.where((item) => item.practiceCompleted).length}/${filtered.length}',
                          ),
                        ],
                      ],
                      const SizedBox(height: 12),
                      if ((_category != null || _showAllSigns) &&
                          filtered.isEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 80),
                          child: Center(child: Text(l10n.t('signs.empty'))),
                        ),
                      if (_category != null || _showAllSigns)
                        RijviaAdaptiveGrid(
                          minCellWidth: MediaQuery.textScalerOf(
                            context,
                          ).scale(260),
                          maxColumns: 3,
                          children: filtered
                              .map((item) => _signTile(item, language, l10n))
                              .toList(),
                        ),
                    ],
                  ),
                ),
              ),
      ),
    );
  }

  String _categoryName(SignCategoryCode category, String language) =>
      _categoryDetails
          .where((item) => item.code?.toLowerCase() == category.name)
          .firstOrNull
          ?.getName(language) ??
      AppLocalizations.of(context).t(switch (category) {
        SignCategoryCode.g => 'story.additional_signs',
        SignCategoryCode.m => 'story.cyclist_delineation_signs',
        _ => 'signs.library',
      });

  Widget _errorBody(AppLocalizations l10n) => Center(
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(l10n.t('signs.load_error')),
        const SizedBox(height: 12),
        ElevatedButton(
          onPressed: _load,
          child: Text(l10n.t('dashboard.retry')),
        ),
      ],
    ),
  );

  Widget _signTile(
    SignPracticeProgress item,
    String language,
    AppLocalizations l10n,
  ) {
    final progress = item.practiceBestScorePct == null
        ? l10n.t('signs.not_started')
        : '${item.practiceBestScorePct!.toStringAsFixed(0)}%';
    final examStatus = item.exam1Passed
        ? l10n.t('signs.passed')
        : item.exam1Attempted
        ? l10n.t('signs.attempted')
        : l10n.t('signs.not_started');
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(RijviaDesignLayout.signCardRadius),
        side: BorderSide(color: Theme.of(context).colorScheme.outlineVariant),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                RijviaSignImage(
                  url: item.imagePath,
                  label: item.nameFor(language),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    item.nameFor(language),
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                ),
                PopupMenuButton<String>(
                  onSelected: (value) {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => SignQuizScreen(
                          signCode: item.signCode,
                          examMode: value == 'exam',
                        ),
                      ),
                    );
                  },
                  itemBuilder: (_) => [
                    PopupMenuItem(
                      value: 'practice',
                      child: Text(
                        item.practiceStarted && !item.practiceCompleted
                            ? l10n.t('practice.hub_resume')
                            : l10n.t('practice.hub_start'),
                      ),
                    ),
                    PopupMenuItem(
                      value: 'exam',
                      child: Text(l10n.t('signs.take_exam')),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              item.signCode,
              textDirection: TextDirection.ltr,
              style: Theme.of(context).textTheme.labelMedium,
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 16,
              runSpacing: 8,
              children: [
                Text('${l10n.t('signs.practice')}: $progress'),
                Text('${l10n.t('signs.exam')}: $examStatus'),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

int _asInt(Object? value) => switch (value) {
  int number => number,
  num number => number.toInt(),
  String text => int.tryParse(text) ?? 0,
  _ => 0,
};
