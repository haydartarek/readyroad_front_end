import '../../design_system/widgets/rijvia_content.dart';
import '../../design_system/widgets/rijvia_app_bar.dart';
import '../../design_system/widgets/rijvia_components.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../core/providers/statistics_provider.dart';
import '../../shared/models/statistics_models.dart';

/// Never combine account-wide metrics and device-only quiz sessions.
class StatisticsScreen extends StatefulWidget {
  const StatisticsScreen({super.key});

  @override
  State<StatisticsScreen> createState() => _StatisticsScreenState();
}

class _StatisticsScreenState extends State<StatisticsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.read<StatisticsProvider>().refreshRemote();
    });
  }

  @override
  Widget build(BuildContext context) {
    final copy = _StatisticsCopy(Localizations.localeOf(context).languageCode);
    return Scaffold(
      appBar: RijviaAppBar(
        title: Text(copy('title')),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: copy('refresh'),
            onPressed: () => context.read<StatisticsProvider>().refreshRemote(),
          ),
        ],
      ),
      body: RijviaScrollFrame(
        child: Consumer<StatisticsProvider>(
          builder: (context, provider, _) {
            if (!provider.isLoaded) {
              return const Center(child: CircularProgressIndicator());
            }
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _sectionTitle(copy('practiceServer')),
                _serverCard(
                  provider.progressState,
                  copy,
                  builder: () =>
                      _practiceContent(provider.serverProgress!, copy),
                ),
                const SizedBox(height: 12),
                _sectionTitle(copy('examsServer')),
                _serverCard(
                  provider.progressState,
                  copy,
                  builder: () => _examContent(provider.serverProgress!, copy),
                ),
                const SizedBox(height: 12),
                _sectionTitle(copy('recentExams')),
                _serverCard(
                  provider.historyState,
                  copy,
                  builder: () => _historyContent(provider.serverExams, copy),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(child: _sectionTitle(copy('deviceTitle'))),
                    if (provider.quizResults.isNotEmpty)
                      TextButton.icon(
                        onPressed: () => _confirmLocalClear(provider, copy),
                        icon: const Icon(Icons.delete_outline),
                        label: Text(copy('clearDevice')),
                      ),
                  ],
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Text(
                    copy('deviceExplanation'),
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ),
                Card(
                  child: provider.quizResults.isEmpty
                      ? Padding(
                          padding: const EdgeInsets.all(16),
                          child: Text(copy('noLocal')),
                        )
                      : Column(
                          children: [
                            _statRow(
                              copy('deviceSessions'),
                              '${provider.statistics.totalQuizzesTaken}',
                            ),
                            ...provider.statistics.recentResults.map(
                              (result) => ListTile(
                                leading: Icon(
                                  result.isPassed
                                      ? Icons.check_circle_outline
                                      : Icons.cancel_outlined,
                                ),
                                title: Text(
                                  '${result.correctAnswers}/${result.totalQuestions}',
                                ),
                                subtitle: Text(
                                  DateFormat(
                                    'dd/MM/yyyy HH:mm',
                                  ).format(result.completedAt.toLocal()),
                                ),
                                trailing: Text('${result.score}%'),
                              ),
                            ),
                          ],
                        ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _sectionTitle(String label) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 8),
    child: Text(
      label,
      style: Theme.of(
        context,
      ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
    ),
  );

  Widget _serverCard(
    StatisticsLoadState state,
    _StatisticsCopy copy, {
    required Widget Function() builder,
  }) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: switch (state) {
          StatisticsLoadState.ready => builder(),
          StatisticsLoadState.loading => const Center(
            child: Padding(
              padding: EdgeInsets.all(8),
              child: CircularProgressIndicator(),
            ),
          ),
          StatisticsLoadState.unavailable => Row(
            children: [
              const Icon(Icons.wifi_off_outlined),
              const SizedBox(width: 10),
              Expanded(child: Text(copy('unavailable'))),
              TextButton(
                onPressed: () =>
                    context.read<StatisticsProvider>().refreshRemote(),
                child: Text(copy('retry')),
              ),
            ],
          ),
          StatisticsLoadState.notApplicable => Text(copy('signIn')),
        },
      ),
    );
  }

  Widget _practiceContent(ServerPracticeProgress p, _StatisticsCopy copy) =>
      Column(
        children: [
          RijviaProgressRing(
            value: p.accuracy / 100,
            label: '${p.accuracy.toStringAsFixed(0)}%',
            caption: copy('accuracy'),
            size: 110,
          ),
          const SizedBox(height: 16),
          RijviaAdaptiveGrid(
            minCellWidth: MediaQuery.textScalerOf(context).scale(220),
            maxColumns: 3,
            children: [
              RijviaMetricCard(
                label: copy('answered'),
                value: '${p.attempted}',
                icon: Icons.question_answer_outlined,
              ),
              RijviaMetricCard(
                label: copy('correct'),
                value: '${p.correct}',
                icon: Icons.check_circle_outline,
              ),
              RijviaMetricCard(
                label: copy('wrong'),
                value: '${p.wrong}',
                icon: Icons.cancel_outlined,
              ),
            ],
          ),
        ],
      );

  Widget _examContent(ServerPracticeProgress p, _StatisticsCopy copy) => Column(
    children: [
      _statRow(copy('examTotal'), '${p.examsTaken}'),
      _statRow(copy('passed'), '${p.examsPassed}'),
      _statRow(copy('failed'), '${p.examsFailed}'),
      _statRow(copy('passRate'), '${p.examPassRate.toStringAsFixed(1)}%'),
    ],
  );

  Widget _historyContent(List<ServerTheoryExam> exams, _StatisticsCopy copy) {
    if (exams.isEmpty) return Text(copy('noExams'));
    return Column(
      children: exams
          .take(5)
          .map(
            (exam) => ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text('${copy('exam')} #${exam.examId}'),
              subtitle: Text(
                DateFormat(
                  'dd/MM/yyyy HH:mm',
                ).format(exam.completedAt.toLocal()),
              ),
              trailing: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('${exam.correctAnswers}/${exam.totalQuestions}'),
                  Text(exam.passed ? copy('passed') : copy('failed')),
                ],
              ),
            ),
          )
          .toList(),
    );
  }

  Widget _statRow(String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 5),
    child: Row(
      children: [
        Expanded(child: Text(label)),
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
      ],
    ),
  );

  Future<void> _confirmLocalClear(
    StatisticsProvider provider,
    _StatisticsCopy copy,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(copy('clearDevice')),
        content: Text(copy('clearExplanation')),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: Text(copy('cancel')),
          ),
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: Text(copy('clear')),
          ),
        ],
      ),
    );
    if (confirmed == true) await provider.clearStatistics();
  }
}

/// Feature-local copy is complete in all four supported languages and does
/// not depend on modifying the user's existing l10n assets during a data fix.
class _StatisticsCopy {
  final String language;
  const _StatisticsCopy(this.language);

  String call(String key) =>
      (_labels[language] ?? _labels['en']!)[key] ?? _labels['en']![key] ?? key;

  static const Map<String, Map<String, String>> _labels = {
    'en': {
      'title': 'Statistics',
      'refresh': 'Refresh',
      'practiceServer': 'Practice progress · Account',
      'examsServer': 'Theory exams · Account',
      'recentExams': 'Recent completed theory exams',
      'deviceTitle': 'Quiz sessions · This device',
      'deviceExplanation':
          'These session summaries are stored on this device only. Your submitted practice answers are saved to your account.',
      'noLocal': 'No device sessions recorded',
      'deviceSessions': 'Recorded sessions',
      'answered': 'Practice answers',
      'correct': 'Correct',
      'wrong': 'Wrong',
      'accuracy': 'Practice accuracy',
      'examTotal': 'Exams completed',
      'passed': 'Passed',
      'failed': 'Failed',
      'passRate': 'Exam pass rate',
      'exam': 'Exam',
      'noExams': 'No completed exams yet',
      'signIn': 'Sign in to view account statistics',
      'unavailable':
          'Account data unavailable. No local values have been substituted.',
      'retry': 'Retry',
      'clearDevice': 'Clear device sessions',
      'clearExplanation':
          'Remove only the quiz session summaries saved on this device. Server progress and exam results will not be changed.',
      'cancel': 'Cancel',
      'clear': 'Clear',
    },
    'ar': {
      'title': 'الإحصائيات',
      'refresh': 'تحديث',
      'practiceServer': 'تقدم التدريبات · الحساب',
      'examsServer': 'الامتحانات النظرية · الحساب',
      'recentExams': 'آخر الامتحانات النظرية المكتملة',
      'deviceTitle': 'جلسات التدريب · هذا الجهاز',
      'deviceExplanation':
          'ملخصات الجلسات محفوظة على هذا الجهاز فقط، أما الإجابات المرسلة فتُحفظ في حسابك.',
      'noLocal': 'لا توجد جلسات محفوظة على الجهاز',
      'deviceSessions': 'الجلسات المسجلة',
      'answered': 'إجابات التدريبات',
      'correct': 'صحيحة',
      'wrong': 'خاطئة',
      'accuracy': 'دقة التدريبات',
      'examTotal': 'الامتحانات المكتملة',
      'passed': 'ناجح',
      'failed': 'راسب',
      'passRate': 'نسبة نجاح الامتحانات',
      'exam': 'امتحان',
      'noExams': 'لا توجد امتحانات مكتملة بعد',
      'signIn': 'سجّل الدخول لعرض إحصائيات الحساب',
      'unavailable': 'بيانات الحساب غير متاحة. لن نستبدلها بأرقام الجهاز.',
      'retry': 'إعادة المحاولة',
      'clearDevice': 'مسح جلسات الجهاز',
      'clearExplanation':
          'سيتم مسح ملخصات جلسات التدريب على هذا الجهاز فقط، دون تغيير التقدم أو نتائج الامتحانات على الخادم.',
      'cancel': 'إلغاء',
      'clear': 'مسح',
    },
    'nl': {
      'title': 'Statistieken',
      'refresh': 'Vernieuwen',
      'practiceServer': 'Oefenvoortgang · Account',
      'examsServer': 'Theorie-examens · Account',
      'recentExams': 'Recente voltooide theorie-examens',
      'deviceTitle': 'Oefensessies · Dit apparaat',
      'deviceExplanation':
          'Deze sessiesamenvattingen staan alleen op dit apparaat. Ingediende oefenantwoorden staan in je account.',
      'noLocal': 'Geen sessies op dit apparaat',
      'deviceSessions': 'Opgeslagen sessies',
      'answered': 'Oefenantwoorden',
      'correct': 'Juist',
      'wrong': 'Fout',
      'accuracy': 'Oefennauwkeurigheid',
      'examTotal': 'Voltooide examens',
      'passed': 'Geslaagd',
      'failed': 'Gezakt',
      'passRate': 'Slagingspercentage',
      'exam': 'Examen',
      'noExams': 'Nog geen voltooide examens',
      'signIn': 'Log in om accountstatistieken te bekijken',
      'unavailable':
          'Accountgegevens niet beschikbaar. Lokale cijfers worden niet als vervanging gebruikt.',
      'retry': 'Opnieuw',
      'clearDevice': 'Apparaatsessies wissen',
      'clearExplanation':
          'Wis alleen de sessiesamenvattingen op dit apparaat. Voortgang en examenresultaten op de server blijven bewaard.',
      'cancel': 'Annuleren',
      'clear': 'Wissen',
    },
    'fr': {
      'title': 'Statistiques',
      'refresh': 'Actualiser',
      'practiceServer': 'Progression des exercices · Compte',
      'examsServer': 'Examens théoriques · Compte',
      'recentExams': 'Examens théoriques terminés récemment',
      'deviceTitle': 'Séances de quiz · Cet appareil',
      'deviceExplanation':
          'Ces résumés de séances sont conservés uniquement sur cet appareil. Les réponses envoyées sont enregistrées sur votre compte.',
      'noLocal': 'Aucune séance enregistrée sur cet appareil',
      'deviceSessions': 'Séances enregistrées',
      'answered': 'Réponses aux exercices',
      'correct': 'Correctes',
      'wrong': 'Incorrectes',
      'accuracy': 'Précision des exercices',
      'examTotal': 'Examens terminés',
      'passed': 'Réussi',
      'failed': 'Échoué',
      'passRate': 'Taux de réussite',
      'exam': 'Examen',
      'noExams': 'Aucun examen terminé',
      'signIn': 'Connectez-vous pour voir vos statistiques',
      'unavailable':
          'Données du compte indisponibles. Les chiffres locaux ne sont pas utilisés à la place.',
      'retry': 'Réessayer',
      'clearDevice': 'Effacer les séances locales',
      'clearExplanation':
          'Effacer uniquement les résumés de séances de cet appareil, sans modifier la progression ni les résultats sur le serveur.',
      'cancel': 'Annuler',
      'clear': 'Effacer',
    },
  };
}
