import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/di/service_locator.dart';
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
  Map<int, int> _answers = {}; // questionIndex -> selectedAnswer
  int _currentQuestionIndex = 0;
  bool _isLoading = true;
  bool _isSubmitted = false;
  String? _error;

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
      final questions = await _questionService.getRandomExamQuestions(count: 10);
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
    final languageProvider = Provider.of<LanguageProvider>(context, listen: false);
    final isArabic = languageProvider.currentLanguage == 'ar';

    // Check if all questions are answered
    if (_answers.length < _questions.length) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            isArabic
                ? 'يرجى الإجابة على جميع الأسئلة'
                : 'Please answer all questions',
          ),
        ),
      );
      return;
    }

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(isArabic ? 'تأكيد التسليم' : 'Confirm Submission'),
        content: Text(
          isArabic
              ? 'هل أنت متأكد من تسليم الامتحان؟'
              : 'Are you sure you want to submit the exam?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(isArabic ? 'إلغاء' : 'Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _calculateResults();
            },
            child: Text(isArabic ? 'تسليم' : 'Submit'),
          ),
        ],
      ),
    );
  }

  void _calculateResults() {
    int correctAnswers = 0;
    for (int i = 0; i < _questions.length; i++) {
      if (_answers[i] == _questions[i]['correctAnswer']) {
        correctAnswers++;
      }
    }

    setState(() {
      _isSubmitted = true;
    });

    final percentage = (correctAnswers / _questions.length * 100).round();
    final passed = percentage >= 82; // 41/50 = 82% passing score

    final languageProvider = Provider.of<LanguageProvider>(context, listen: false);
    final isArabic = languageProvider.currentLanguage == 'ar';

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: Text(
          passed ? (isArabic ? 'نجحت!' : 'Passed!') : (isArabic ? 'راسب' : 'Failed'),
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
              isArabic
                  ? '$correctAnswers من ${_questions.length} إجابات صحيحة'
                  : '$correctAnswers out of ${_questions.length} correct answers',
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
              isArabic
                  ? (passed
                      ? 'تهانينا! لقد نجحت في الامتحان'
                      : 'يجب الحصول على 82% على الأقل للنجاح')
                  : (passed
                      ? 'Congratulations! You passed the exam'
                      : 'You need at least 82% to pass'),
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
            child: Text(isArabic ? 'إنهاء' : 'Finish'),
          ),
          if (!passed)
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                setState(() {
                  _answers.clear();
                  _currentQuestionIndex = 0;
                  _isSubmitted = false;
                });
                _loadQuestions();
              },
              child: Text(isArabic ? 'إعادة المحاولة' : 'Retry'),
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final languageProvider = Provider.of<LanguageProvider>(context);
    final isArabic = languageProvider.currentLanguage == 'ar';

    return Scaffold(
      appBar: AppBar(
        title: Text(isArabic ? 'الامتحان' : 'Exam'),
        actions: [
          IconButton(
            icon: const Icon(Icons.check),
            onPressed: _submitExam,
            tooltip: isArabic ? 'تسليم' : 'Submit',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text('Error: $_error'))
              : _questions.isEmpty
                  ? Center(
                      child: Text(isArabic ? 'لا توجد أسئلة متاحة' : 'No questions available'),
                    )
                  : _buildExamView(isArabic),
      bottomNavigationBar: !_isLoading && _questions.isNotEmpty
          ? _buildNavigationBar(isArabic)
          : null,
    );
  }

  Widget _buildExamView(bool isArabic) {
    final question = _questions[_currentQuestionIndex];
    final questionText = isArabic ? question['questionAr'] : question['questionEn'];
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
                          '${isArabic ? 'السؤال' : 'Question'} ${_currentQuestionIndex + 1}/${_questions.length}',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
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
                Text(
                  isArabic ? 'الخيارات:' : 'Options:',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 8),
                ...[1, 2, 3, 4].map((optionNumber) {
                  final optionText = isArabic
                      ? question['option${optionNumber}Ar']
                      : question['option${optionNumber}En'];
                  final isSelected = selectedAnswer == optionNumber;

                  return Card(
                    color: isSelected ? Colors.blue.shade100 : null,
                    margin: const EdgeInsets.only(bottom: 12),
                    child: RadioListTile<int>(
                      value: optionNumber,
                      groupValue: selectedAnswer,
                      onChanged: (value) => _selectAnswer(value!),
                      title: Text(optionText),
                      dense: false,
                    ),
                  );
                }).toList(),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildNavigationBar(bool isArabic) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
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
              child: Text(isArabic ? 'السابق' : 'Previous'),
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
                    ? (isArabic ? 'التالي' : 'Next')
                    : (isArabic ? 'تسليم' : 'Submit'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
