import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/providers/language_provider.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import 'admin_components.dart';

class AdminAnalyticsScreen extends StatefulWidget {
  const AdminAnalyticsScreen({super.key});
  @override
  State<AdminAnalyticsScreen> createState() => _AdminAnalyticsScreenState();
}

class _AdminAnalyticsScreenState extends AdminPageState<AdminAnalyticsScreen> {
  AdminRecord? stats, quiz, exams, students;
  List<AdminRecord>? categories;
  final failures = <String>{};
  int page = 0;
  @override
  Future<void> load() => fetch((request) async {
    final values = <String, dynamic>{};
    final failed = <String>{};
    Future<void> read(String key, String path, [AdminRecord? query]) async {
      try {
        values[key] = await api.get(path, query);
      } catch (_) {
        failed.add(key);
      }
    }

    await Future.wait([
      read('stats', '/admin/dashboard'),
      read('quiz', '/admin/analytics/quiz-stats'),
      read('categories', '/admin/analytics/category-stats'),
      read('exams', '/admin/learning/exams', {'page': page, 'size': 20}),
      read('students', '/admin/learning/users', {'page': 0, 'size': 10}),
    ]);
    if (!mounted || request != revision) return;
    setState(() {
      failures
        ..clear()
        ..addAll(failed);
      stats = values['stats'] == null ? null : AdminApi.record(values['stats']);
      quiz = values['quiz'] == null ? null : AdminApi.record(values['quiz']);
      categories = values['categories'] == null
          ? null
          : AdminApi.records(values['categories']);
      exams = values['exams'] == null ? null : AdminApi.record(values['exams']);
      students = values['students'] == null
          ? null
          : AdminApi.record(values['students']);
      if (failed.isNotEmpty) error = 'admin.analytics.fetch_error';
    });
  });
  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final language = context.watch<LanguageProvider>().currentLanguage;
    final s = stats;
    final q = quiz;
    final categoryRows = [...?categories]
      ..sort(
        (a, b) => (b['avgAccuracy'] as num).compareTo(a['avgAccuracy'] as num),
      );
    final examRows = exams == null
        ? <AdminRecord>[]
        : AdminApi.records(exams!['items']);
    final studentRows = students == null
        ? <AdminRecord>[]
        : AdminApi.records(students!['items']);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AdminHeader(
          title: t.t('admin.analytics.title'),
          description: t.t('admin.analytics.description'),
          icon: Icons.bar_chart,
          actions: [
            OutlinedButton.icon(
              onPressed: loading ? null : load,
              icon: const Icon(Icons.refresh),
              label: Text(t.t('admin.analytics.refresh')),
            ),
          ],
        ),
        const SizedBox(height: 24),
        messages(),
        RijviaAdaptiveGrid(
          equalRowHeights: false,
          minCellWidth: 200,
          maxCellWidth: double.infinity,
          children: [
            AdminValue(
              label: t.t('admin.analytics.total_users'),
              value: s?['totalUsers'],
            ),
            AdminValue(
              label: t.t('admin.analytics.total_signs'),
              value: s?['totalSigns'],
            ),
            AdminValue(
              label: t.t('admin.analytics.total_exams'),
              value: s?['totalQuizAttempts'],
            ),
            AdminValue(
              label: t.t('admin.analytics.pass_rate'),
              value: adminPercent(q?['passRate']),
            ),
          ],
        ),
        if (s != null) ...[
          const SizedBox(height: 24),
          RijviaPageSection(
            title: t.t('admin.analytics.sign_activity'),
            child: RijviaAdaptiveGrid(
              equalRowHeights: false,
              minCellWidth: 180,
              maxColumns: 6,
              maxCellWidth: double.infinity,
              children: [
                for (final field in [
                  ('totalSignQuestions', 'total_sign_questions'),
                  ('totalSignPracticeSessions', 'total_sign_practice_sessions'),
                  ('totalSignExamAttempts', 'total_sign_exam_attempts'),
                  (
                    'totalPassedSignExamResults',
                    'total_passed_sign_exam_results',
                  ),
                  (
                    'totalRandomSignExamAttempts',
                    'total_random_sign_exam_attempts',
                  ),
                  (
                    'totalPassedRandomSignExamResults',
                    'total_passed_random_sign_exam_results',
                  ),
                ])
                  AdminValue(
                    label: t.t('admin.analytics.${field.$2}'),
                    value: s[field.$1],
                  ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          RijviaPageSection(
            title: t.t('admin.analytics.user_roles'),
            child: RijviaAdaptiveGrid(
              equalRowHeights: false,
              minCellWidth: 220,
              maxColumns: 3,
              maxCellWidth: double.infinity,
              children: [
                for (final role in [
                  (
                    'role_user',
                    (s['totalUsers'] as num) -
                        (s['adminUsers'] as num) -
                        (s['moderatorUsers'] as num),
                    Colors.blueGrey,
                  ),
                  (
                    'role_moderator',
                    s['moderatorUsers'] as num,
                    Theme.of(context).colorScheme.primary,
                  ),
                  (
                    'role_admin',
                    s['adminUsers'] as num,
                    Theme.of(context).colorScheme.onSurface,
                  ),
                ])
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text('${t.t('admin.analytics.${role.$1}')}: ${role.$2}'),
                      const SizedBox(height: 8),
                      LinearProgressIndicator(
                        value: (s['totalUsers'] as num) > 0
                            ? (role.$2 / (s['totalUsers'] as num))
                                  .clamp(0, 1)
                                  .toDouble()
                            : 0,
                        color: role.$3,
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 24),
        RijviaAdaptiveGrid(
          equalRowHeights: false,
          minCellWidth: 400,
          maxColumns: 2,
          maxCellWidth: double.infinity,
          children: [
            RijviaPageSection(
              title: t.t('admin.analytics.quiz_performance'),
              child: q == null
                  ? Text(
                      t.t(
                        failures.contains('quiz')
                            ? 'admin.analytics.fetch_error'
                            : loading
                            ? 'common.loading'
                            : 'admin.analytics.no_data',
                      ),
                    )
                  : RijviaAdaptiveGrid(
                      equalRowHeights: false,
                      minCellWidth: 160,
                      maxColumns: 2,
                      maxCellWidth: double.infinity,
                      children: [
                        for (final field in [
                          ('averageScore', 'avg_score', true),
                          ('passRate', 'pass_rate', true),
                          ('totalCompleted', 'total_completed', false),
                          ('totalPassed', 'total_passed_count', false),
                        ])
                          AdminValue(
                            label: t.t('admin.analytics.${field.$2}'),
                            value: field.$3
                                ? adminPercent(q[field.$1])
                                : q[field.$1],
                          ),
                      ],
                    ),
            ),
            RijviaPageSection(
              title: t.t('admin.analytics.category_performance'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (categoryRows.isEmpty)
                    Text(
                      t.t(
                        failures.contains('categories')
                            ? 'admin.analytics.fetch_error'
                            : loading
                            ? 'common.loading'
                            : 'admin.analytics.no_category_data',
                      ),
                    ),
                  for (final category in categoryRows)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: RijviaPageSection(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              category['categoryName']?.toString() ??
                                  t.t('common.not_available'),
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            Text(
                              '${category['totalCorrect']}/${category['totalAttempted']} ${t.t('admin.analytics.correct')} · ${category['userCount']} ${t.t('admin.analytics.users_label')}',
                            ),
                            Align(
                              alignment: AlignmentDirectional.centerEnd,
                              child: Chip(
                                label: Text(
                                  '${(category['avgAccuracy'] as num).toStringAsFixed(1)}%',
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        RijviaPageSection(
          title: t.t('admin.learning.students_title'),
          child: studentRows.isEmpty
              ? Text(
                  t.t(
                    failures.contains('students')
                        ? 'admin.analytics.fetch_error'
                        : loading
                        ? 'common.loading'
                        : 'admin.learning.no_data',
                  ),
                )
              : RijviaAdaptiveGrid(
                  equalRowHeights: false,
                  minCellWidth: 300,
                  maxColumns: 2,
                  maxCellWidth: double.infinity,
                  children: [
                    for (final student in studentRows)
                      RijviaPageSection(
                        child: InkWell(
                          onTap: () => Navigator.pushNamed(
                            context,
                            '/admin/users/${student['userId']}/learning',
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Text(
                                student['displayName']?.toString() ??
                                    student['username'].toString(),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              Text(student['email'].toString()),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  Chip(
                                    label: Text(
                                      '${student['totalCompletedExams']} ${t.t('admin.learning.completed_exams')}',
                                    ),
                                  ),
                                  Chip(
                                    label: Text(
                                      adminPercent(student['averageExamScore']),
                                    ),
                                  ),
                                  Chip(
                                    label: Text(
                                      t.t(
                                        'admin.learning.trend.${student['learningTrend'].toString().toLowerCase()}',
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
        ),
        const SizedBox(height: 24),
        RijviaPageSection(
          title: t.t('admin.analytics.recent_exams'),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (examRows.isEmpty)
                Text(
                  t.t(
                    failures.contains('exams')
                        ? 'admin.analytics.fetch_error'
                        : loading
                        ? 'common.loading'
                        : 'admin.analytics.no_exams',
                  ),
                ),
              if (examRows.isNotEmpty)
                AdminTable(
                  columns: [
                    for (final column in [
                      'admin.analytics.exam_user',
                      'admin.learning.exam_type',
                      'admin.analytics.exam_score',
                      'admin.analytics.exam_result',
                      'admin.analytics.exam_duration',
                      'admin.analytics.exam_date',
                    ])
                      t.t(column),
                  ],
                  rows: [
                    for (final exam in examRows)
                      [
                        TextButton(
                          onPressed: () => Navigator.pushNamed(
                            context,
                            '/admin/users/${exam['userId']}/learning',
                          ),
                          child: Text(
                            exam['displayName']?.toString() ??
                                exam['username'].toString(),
                          ),
                        ),
                        TextButton(
                          onPressed: () => Navigator.pushNamed(
                            context,
                            '/admin/users/${exam['userId']}/learning/exams/${exam['examType']}/${exam['examId']}',
                          ),
                          child: Text(
                            t.t(
                              'admin.learning.exam_type.${exam['examType'].toString().toLowerCase()}',
                            ),
                          ),
                        ),
                        Text(
                          '${exam['correctAnswers']}/${exam['totalQuestions']} · ${adminPercent(exam['scorePercentage'])}',
                        ),
                        Text(
                          t.t(
                            exam['passed'] == true
                                ? 'exam.passed'
                                : 'exam.failed',
                          ),
                          style: TextStyle(
                            color: exam['passed'] == true
                                ? Colors.green
                                : Theme.of(context).colorScheme.error,
                          ),
                        ),
                        Text(adminDuration(exam['durationSeconds'], t)),
                        Text(
                          adminDate(
                            exam['completedAt'],
                            language,
                            includeTime: true,
                          ),
                        ),
                      ],
                  ],
                ),
              if (exams != null)
                AdminPagination(
                  page: page,
                  pages: (exams!['totalPages'] as num).toInt(),
                  busy: loading,
                  onPage: (value) {
                    page = value;
                    load();
                  },
                ),
            ],
          ),
        ),
      ],
    );
  }
}
