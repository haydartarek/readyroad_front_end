import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../shared/models/quiz_models.dart';
import '../../core/providers/statistics_provider.dart';

/// Quiz Result Screen - Shows quiz results
class QuizResultScreen extends StatefulWidget {
  final QuizResult result;

  const QuizResultScreen({
    super.key,
    required this.result,
  });

  @override
  State<QuizResultScreen> createState() => _QuizResultScreenState();
}

class _QuizResultScreenState extends State<QuizResultScreen> {
  @override
  void initState() {
    super.initState();
    // Save result to statistics
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<StatisticsProvider>().saveResult(widget.result);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Quiz Results'),
        automaticallyImplyLeading: false,
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Result icon
              _buildResultIcon(),

              const SizedBox(height: 24),

              // Score
              Text(
                '${widget.result.score}%',
                style: Theme.of(context).textTheme.displayLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: _getScoreColor(),
                    ),
              ),

              const SizedBox(height: 8),

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
                  'Grade: ${widget.result.grade}',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: _getScoreColor(),
                  ),
                ),
              ),

              const SizedBox(height: 16),

              Text(
                widget.result.isPassed ? 'Passed!' : 'Failed',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: widget.result.isPassed ? Colors.green : Colors.red,
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
                        'Total Questions',
                        '${widget.result.totalQuestions}',
                      ),
                      const Divider(),
                      _buildStatRow(
                        Icons.check_circle,
                        'Correct Answers',
                        '${widget.result.correctAnswers}',
                        Colors.green,
                      ),
                      const Divider(),
                      _buildStatRow(
                        Icons.cancel,
                        'Wrong Answers',
                        '${widget.result.wrongAnswers}',
                        Colors.red,
                      ),
                      const Divider(),
                      _buildStatRow(
                        Icons.timer,
                        'Time Taken',
                        _formatDuration(widget.result.timeTaken),
                      ),
                    ],
                  ),
                ),
              ),

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
                      label: const Text('Home'),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.pop(context);
                      },
                      icon: const Icon(Icons.refresh),
                      label: const Text('Retry'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildResultIcon() {
    IconData icon;
    Color color;

    if (widget.result.score >= 90) {
      icon = Icons.emoji_events;
      color = Colors.amber;
    } else if (widget.result.score >= 70) {
      icon = Icons.thumb_up;
      color = Colors.green;
    } else {
      icon = Icons.sentiment_dissatisfied;
      color = Colors.red;
    }

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        shape: BoxShape.circle,
      ),
      child: Icon(
        icon,
        size: 80,
        color: color,
      ),
    );
  }

  Widget _buildStatRow(IconData icon, String label, String value, [Color? color]) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, color: color),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(fontSize: 16),
            ),
          ),
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
    if (widget.result.score >= 90) return Colors.green[700]!;
    if (widget.result.score >= 70) return Colors.green;
    if (widget.result.score >= 60) return Colors.orange;
    return Colors.red;
  }

  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return '${minutes}m ${seconds}s';
  }
}

