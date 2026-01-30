import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/di/service_locator.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/providers/language_provider.dart';
import 'exam_question_service.dart';

class ExamScreen extends StatefulWidget {
  const ExamScreen({super.key});

  @override
  State<ExamScreen> createState() => _ExamScreenState();
}

class _ExamScreenState extends State<ExamScreen> {
  final ExamQuestionService _questionService = getIt<ExamQuestionService>();
  List<Map<String, dynamic>> _questions = [];
  final Map<int, int> _answers = {}; // questionIndex -> selectedAnswer
  int _currentQuestionIndex = 0;
  bool _isLoading = true;
  String? _error;
  bool _isExamActive = true; // Track if exam is in progress for back prevention

  @override
  void initState() {
    super.initState();
    _loadQuestions();
  }

  Future<void> _loadQuestions() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      // Get 10 random questions (adjust count as needed)
      final questions = await _questionService.getRandomExamQuestions(
        count: 10,
      );
      setState(() {
        _questions = questions;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  void _selectAnswer(int answer) {
    setState(() {
      _answers[_currentQuestionIndex] = answer;
    });
  }

  void _nextQuestion() {
    if (_currentQuestionIndex < _questions.length - 1) {
      setState(() {
        _currentQuestionIndex++;
      });
    }
  }

  void _previousQuestion() {
    if (_currentQuestionIndex > 0) {
      setState(() {
        _currentQuestionIndex--;
      });
    }
  }

  void _submitExam() {
    final l10n = AppLocalizations.of(context);

    // Check if all questions are answered
    if (_answers.length < _questions.length) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Please answer all questions')));
      return;
    }

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Confirm Submission'),
        content: Text('Are you sure you want to submit the exam?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(l10n.commonCancel),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _calculateResults();
            },
            child: Text(l10n.examSubmit),
          ),
        ],
      ),
    );
  }

  /// Show exit confirmation dialog when back is pressed during active exam
  Future<bool> _onBackPressed() async {
    if (!_isExamActive || _questions.isEmpty) {
      return true; // Allow navigation if exam is not active
    }

    final l10n = AppLocalizations.of(context);

    final shouldExit = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.examExitTitle),
        content: Text(l10n.examExitMessage),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: Text(l10n.examExitLeave),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text(l10n.examExitStay),
          ),
        ],
      ),
    );

    return shouldExit ?? false;
  }

  void _calculateResults() {
    final l10n = AppLocalizations.of(context);

    // Mark exam as inactive after completion
    _isExamActive = false;

    int correctAnswers = 0;
    for (int i = 0; i < _questions.length; i++) {
      if (_answers[i] == _questions[i]['correctAnswer']) {
        correctAnswers++;
      }
    }

    final percentage = (correctAnswers / _questions.length * 100).round();
    final passed = percentage >= 82; // 41/50 = 82% passing score

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: Text(
          passed ? l10n.examPassed : l10n.examFailed,
          style: TextStyle(
            color: passed ? Colors.green : Colors.red,
            fontWeight: FontWeight.bold,
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              passed ? Icons.check_circle_outline : Icons.cancel_outlined,
              size: 80,
              color: passed ? Colors.green : Colors.red,
            ),
            const SizedBox(height: 16),
            Text(
              '$correctAnswers ${l10n.examOf} ${_questions.length} ${l10n.examCorrectAnswers}',
              style: const TextStyle(fontSize: 18),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Text(
              '$percentage%',
              style: TextStyle(
                fontSize: 48,
                fontWeight: FontWeight.bold,
                color: passed ? Colors.green : Colors.red,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              passed
                  ? 'Congratulations! You passed the exam'
                  : 'You need at least 82% to pass',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.grey),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.of(context).pop();
            },
            child: Text(l10n.commonClose),
          ),
          if (!passed)
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                setState(() {
                  _answers.clear();
                  _currentQuestionIndex = 0;
                });
                _loadQuestions();
              },
              child: const Text('Retry'),
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final languageProvider = Provider.of<LanguageProvider>(context);
    final currentLanguage = languageProvider.currentLanguage;

    // Wrap with PopScope to handle Android back button
    return PopScope(
      canPop: !_isExamActive || _questions.isEmpty,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        final shouldExit = await _onBackPressed();
        if (shouldExit && mounted && context.mounted) {
          Navigator.of(context).pop();
        }
      },
      child: Scaffold(
      appBar: AppBar(
        title: Text(l10n.navExam),
        actions: [
          IconButton(
            icon: const Icon(Icons.check),
            onPressed: _submitExam,
            tooltip: l10n.examSubmit,
          ),
        ],
      ),
      body: _isLoading
          ? Center(child: Text(l10n.commonLoading))
          : _error != null
          ? Center(child: Text('Error: $_error'))
          : _questions.isEmpty
          ? const Center(child: Text('No questions available'))
          : _buildExamView(currentLanguage),
      bottomNavigationBar: !_isLoading && _questions.isNotEmpty
          ? _buildNavigationBar()
          : null,
      ),
    );
  }

  Widget _buildExamView(String currentLanguage) {
    final l10n = AppLocalizations.of(context);
    final question = _questions[_currentQuestionIndex];
    final questionText = currentLanguage == 'ar'
        ? question['questionAr']
        : question['questionEn'];
    final selectedAnswer = _answers[_currentQuestionIndex];

    return Column(
      children: [
        LinearProgressIndicator(
          value: _answers.length / _questions.length,
          minHeight: 6,
        ),
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Text(
                          '${l10n.examQuestion} ${_currentQuestionIndex + 1}/${_questions.length}',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          questionText,
                          style: const TextStyle(fontSize: 18),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Options:',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 8),
                ...[1, 2, 3, 4].map((optionNumber) {
                  final optionText = currentLanguage == 'ar'
                      ? question['option${optionNumber}Ar']
                      : question['option${optionNumber}En'];
                  final isSelected = selectedAnswer == optionNumber;

                  return Card(
                    color: isSelected ? Colors.blue.shade100 : null,
                    margin: const EdgeInsets.only(bottom: 12),
                    child: InkWell(
                      onTap: () => _selectAnswer(optionNumber),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          children: [
                            Container(
                              width: 24,
                              height: 24,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: isSelected
                                      ? Theme.of(context).primaryColor
                                      : Colors.grey,
                                  width: 2,
                                ),
                              ),
                              child: isSelected
                                  ? Center(
                                      child: Container(
                                        width: 12,
                                        height: 12,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: Theme.of(context).primaryColor,
                                        ),
                                      ),
                                    )
                                  : null,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                optionText,
                                style: const TextStyle(fontSize: 16),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildNavigationBar() {
    final l10n = AppLocalizations.of(context);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 4,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: _currentQuestionIndex > 0 ? _previousQuestion : null,
              child: Text(l10n.examPrevious),
            ),
          ),
          const SizedBox(width: 16),
          Text(
            '${_answers.length}/${_questions.length}',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: ElevatedButton(
              onPressed: _currentQuestionIndex < _questions.length - 1
                  ? _nextQuestion
                  : _submitExam,
              child: Text(
                _currentQuestionIndex < _questions.length - 1
                    ? l10n.examNext
                    : l10n.examSubmit,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
