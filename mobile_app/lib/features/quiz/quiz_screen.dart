import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/providers/language_provider.dart';
import '../../shared/models/quiz_models.dart';
import '../../shared/models/category.dart';
import 'quiz_service.dart';
import 'quiz_result_screen.dart';

/// Quiz Screen - Main quiz interface
class QuizScreen extends StatefulWidget {
  final Category? category;
  final int questionCount;

  const QuizScreen({
    super.key,
    this.category,
    this.questionCount = 10,
  });

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  final QuizService _quizService = QuizService();

  List<QuizQuestion>? _questions;
  int _currentQuestionIndex = 0;
  int _correctAnswers = 0;
  int _wrongAnswers = 0;
  int? _selectedAnswer;
  bool _isAnswered = false;
  bool _isLoading = true;
  String? _error;

  late DateTime _startTime;

  /// Convert backend imageUrl to asset path for Flutter
  String _convertToAssetPath(String imageUrl) {
    // Handle both API formats:
    // 1. /images/signs/... (web format)
    // 2. assets/traffic_signs/... (backend format)
    if (imageUrl.startsWith('/images/signs/')) {
      return imageUrl.replaceFirst('/images/signs/', 'assets/traffic_signs/');
    }
    // Already in correct format for Flutter assets
    return imageUrl;
  }

  @override
  void initState() {
    super.initState();
    _startTime = DateTime.now();
    _loadQuiz();
  }

  Future<void> _loadQuiz() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final questions = await _quizService.generateQuiz(
        categoryId: widget.category?.id,
        questionCount: widget.questionCount,
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

  void _selectAnswer(int index) {
    if (_isAnswered) return;

    setState(() {
      _selectedAnswer = index;
      _isAnswered = true;

      if (_questions![_currentQuestionIndex].isCorrect(index)) {
        _correctAnswers++;
      } else {
        _wrongAnswers++;
      }
    });

    // Auto advance after 1.5 seconds
    Future.delayed(const Duration(milliseconds: 1500), () {
      if (mounted) _nextQuestion();
    });
  }

  void _nextQuestion() {
    if (_currentQuestionIndex < _questions!.length - 1) {
      setState(() {
        _currentQuestionIndex++;
        _selectedAnswer = null;
        _isAnswered = false;
      });
    } else {
      _finishQuiz();
    }
  }

  void _finishQuiz() {
    final timeTaken = DateTime.now().difference(_startTime);
    final result = QuizResult(
      totalQuestions: _questions!.length,
      correctAnswers: _correctAnswers,
      wrongAnswers: _wrongAnswers,
      timeTaken: timeTaken,
      categoryId: widget.category?.id,
    );

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => QuizResultScreen(result: result),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        final shouldPop = await _showExitDialog();
        if (shouldPop == true && context.mounted) {
          Navigator.of(context).pop();
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(widget.category != null
              ? '${widget.category!.getName('en')} Quiz'
              : 'Content Quiz'),
          actions: [
            if (_questions != null)
              Center(
                child: Padding(
                  padding: const EdgeInsets.only(right: 16),
                  child: Text(
                    '${_currentQuestionIndex + 1}/${_questions!.length}',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
          ],
        ),
        body: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Generating quiz...'),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text('Error: $_error'),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loadQuiz,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    final question = _questions![_currentQuestionIndex];
    final languageCode = context.watch<LanguageProvider>().currentLanguage;

    return Column(
      children: [
        // Progress bar
        LinearProgressIndicator(
          value: (_currentQuestionIndex + 1) / _questions!.length,
          backgroundColor: Colors.grey[300],
        ),

        // Score
        Container(
          padding: const EdgeInsets.all(16),
          color: Colors.grey[100],
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildScoreItem(
                Icons.check_circle,
                Colors.green,
                'Correct',
                _correctAnswers,
              ),
              _buildScoreItem(
                Icons.cancel,
                Colors.red,
                'Wrong',
                _wrongAnswers,
              ),
            ],
          ),
        ),

        // Question
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Question image
                Container(
                  height: 200,
                  decoration: BoxDecoration(
                    color: Colors.grey[200],
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: question.correctContent.imageUrl != null && question.correctContent.imageUrl!.isNotEmpty
                      ? Image.asset(
                          _convertToAssetPath(question.correctContent.imageUrl!),
                          fit: BoxFit.contain,
                          errorBuilder: (context, error, stackTrace) {
                            return const Icon(Icons.image, size: 100);
                          },
                        )
                      : const Icon(Icons.image, size: 100),
                ),

                const SizedBox(height: 24),

                Text(
                  'What is this?',
                  style: Theme.of(context).textTheme.titleLarge,
                  textAlign: TextAlign.center,
                ),

                const SizedBox(height: 24),

                // Options
                ...List.generate(question.options.length, (index) {
                  return _buildOption(
                    index,
                    question.options[index].getName(languageCode),
                    question,
                  );
                }),
              ],
            ),
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
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
            ),
            Text(
              '$value',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildOption(int index, String text, QuizQuestion question) {
    Color? backgroundColor;
    Color? borderColor;
    IconData? icon;

    if (_isAnswered) {
      final isCorrect = question.isCorrect(index);
      final isSelected = _selectedAnswer == index;

      if (isCorrect) {
        backgroundColor = Colors.green.withValues(alpha: 0.1);
        borderColor = Colors.green;
        icon = Icons.check_circle;
      } else if (isSelected && !isCorrect) {
        backgroundColor = Colors.red.withValues(alpha: 0.1);
        borderColor = Colors.red;
        icon = Icons.cancel;
      }
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => _selectAnswer(index),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: backgroundColor,
            border: Border.all(
              color: borderColor ?? Colors.grey[300]!,
              width: 2,
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  text,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              if (icon != null)
                Icon(
                  icon,
                  color: borderColor,
                ),
            ],
          ),
        ),
      ),
    );
  }

  Future<bool?> _showExitDialog() {
    return showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Exit Quiz?'),
        content: const Text('Your progress will be lost.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text(
              'Exit',
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
  }
}

