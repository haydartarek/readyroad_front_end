import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/di/service_locator.dart';
import '../../core/providers/language_provider.dart';
import 'practice_question_service.dart';

class PracticeScreen extends StatefulWidget {
  final int lessonId;

  const PracticeScreen({super.key, required this.lessonId});

  @override
  State<PracticeScreen> createState() => _PracticeScreenState();
}

class _PracticeScreenState extends State<PracticeScreen> {
  final PracticeQuestionService _questionService = getIt<PracticeQuestionService>();
  List<Map<String, dynamic>> _questions = [];
  int _currentQuestionIndex = 0;
  int? _selectedAnswer;
  bool _isAnswered = false;
  bool _isLoading = true;
  String? _error;
  int _correctAnswers = 0;

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

      final questions = await _questionService.getPracticeQuestionsByLesson(widget.lessonId);
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
    if (_isAnswered) return;

    setState(() {
      _selectedAnswer = answer;
      _isAnswered = true;
      if (answer == _questions[_currentQuestionIndex]['correctAnswer']) {
        _correctAnswers++;
      }
    });
  }

  void _nextQuestion() {
    if (_currentQuestionIndex < _questions.length - 1) {
      setState(() {
        _currentQuestionIndex++;
        _selectedAnswer = null;
        _isAnswered = false;
      });
    } else {
      _showResults();
    }
  }

  void _showResults() {
    final languageProvider = Provider.of<LanguageProvider>(context, listen: false);
    final isArabic = languageProvider.currentLanguage == 'ar';
    final percentage = (_correctAnswers / _questions.length * 100).round();

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: Text(isArabic ? 'النتيجة' : 'Result'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              isArabic
                  ? 'لقد أجبت بشكل صحيح على $_correctAnswers من ${_questions.length} سؤال'
                  : 'You answered $_correctAnswers out of ${_questions.length} questions correctly',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 18),
            ),
            const SizedBox(height: 16),
            Text(
              '$percentage%',
              style: TextStyle(
                fontSize: 48,
                fontWeight: FontWeight.bold,
                color: percentage >= 80 ? Colors.green : Colors.orange,
              ),
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
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              setState(() {
                _currentQuestionIndex = 0;
                _selectedAnswer = null;
                _isAnswered = false;
                _correctAnswers = 0;
              });
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
        title: Text(isArabic ? 'التمرين' : 'Practice'),
        actions: [
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                '${_currentQuestionIndex + 1}/${_questions.length}',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ),
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
                  : _buildQuestionView(isArabic),
    );
  }

  Widget _buildQuestionView(bool isArabic) {
    final question = _questions[_currentQuestionIndex];
    final questionText = isArabic ? question['questionAr'] : question['questionEn'];
    final correctAnswer = question['correctAnswer'];

    return Column(
      children: [
        LinearProgressIndicator(
          value: (_currentQuestionIndex + 1) / _questions.length,
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
                    child: Text(
                      questionText,
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                ...[1, 2, 3, 4].map((optionNumber) {
                  final optionText = isArabic
                      ? question['option${optionNumber}Ar']
                      : question['option${optionNumber}En'];
                  final isCorrect = optionNumber == correctAnswer;
                  final isSelected = _selectedAnswer == optionNumber;

                  Color? cardColor;
                  if (_isAnswered) {
                    if (isSelected && !isCorrect) {
                      cardColor = Colors.red.shade100;
                    } else if (isCorrect) {
                      cardColor = Colors.green.shade100;
                    }
                  } else if (isSelected) {
                    cardColor = Colors.blue.shade100;
                  }

                  return Card(
                    color: cardColor,
                    margin: const EdgeInsets.only(bottom: 12),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: _isAnswered && isCorrect
                            ? Colors.green
                            : _isAnswered && isSelected
                                ? Colors.red
                                : null,
                        child: Text('$optionNumber'),
                      ),
                      title: Text(optionText),
                      trailing: _isAnswered && isCorrect
                          ? const Icon(Icons.check_circle, color: Colors.green)
                          : _isAnswered && isSelected
                              ? const Icon(Icons.cancel, color: Colors.red)
                              : null,
                      onTap: () => _selectAnswer(optionNumber),
                    ),
                  );
                }).toList(),
                if (_isAnswered) ...[
                  const SizedBox(height: 16),
                  Card(
                    color: Colors.blue.shade50,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            isArabic ? 'التفسير:' : 'Explanation:',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            isArabic
                                ? question['explanationAr']
                                : question['explanationEn'],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _nextQuestion,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: Text(
                      _currentQuestionIndex < _questions.length - 1
                          ? (isArabic ? 'السؤال التالي' : 'Next Question')
                          : (isArabic ? 'عرض النتائج' : 'Show Results'),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}
