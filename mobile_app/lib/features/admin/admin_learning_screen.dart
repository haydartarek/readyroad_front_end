import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/providers/language_provider.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_educational_image.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import 'admin_components.dart';

class AdminLearningScreen extends StatefulWidget {
  const AdminLearningScreen({super.key, required this.userId});
  final int userId;
  @override
  State<AdminLearningScreen> createState() => _AdminLearningScreenState();
}

class _AdminLearningScreenState extends AdminPageState<AdminLearningScreen> {
  AdminRecord? summary, payload;
  List<AdminRecord> rows = [];
  String section = 'exams';
  int page = 0, pages = 0;
  static const sections = [
    'exams',
    'coverage',
    'categories',
    'difficulty',
    'practices',
    'lessons',
    'signs',
    'errors',
    'signStudy',
    'videos',
  ];
  @override
  Future<void> load() => fetch((request) async {
    final root = '/admin/learning/users/${widget.userId}';
    final selectedSection = section;
    final endpoint = switch (section) {
      'signStudy' || 'videos' => 'activity-availability',
      'errors' => 'error-patterns',
      _ => section,
    };
    final paged = ['exams', 'practices', 'lessons', 'errors'].contains(section);
    final result = await Future.wait([
      api.get(root),
      api.get('$root/$endpoint', paged ? {'page': page, 'size': 20} : null),
    ]);
    final profile = AdminApi.record(result[0]);
    final data = result[1];
    final nextPayload = data is Map ? AdminApi.record(data) : null;
    final list = switch (selectedSection) {
      'coverage' => AdminApi.records(nextPayload!['categories']),
      'difficulty' => AdminApi.records(nextPayload!['items']),
      'signStudy' || 'videos' => [nextPayload!],
      _ => AdminApi.records(paged ? nextPayload!['items'] : data),
    };
    if (mounted && request == revision) {
      setState(() {
        summary = profile;
        payload = nextPayload;
        rows = list;
        pages = paged ? (nextPayload!['totalPages'] as num).toInt() : 0;
      });
    }
  });
  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final s = summary;
    final language = context.watch<LanguageProvider>().currentLanguage;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AdminHeader(
          title:
              s?['displayName']?.toString() ??
              s?['username']?.toString() ??
              t.t('admin.learning.profile_title'),
          description: s == null
              ? t.t('admin.learning.profile_description')
              : '${s['email']} · ${s['preferredLanguage']?.toString().toUpperCase() ?? '—'}',
          icon: Icons.person_outline,
          actions: [
            OutlinedButton(
              onPressed: () => Navigator.pushNamed(context, '/admin/users'),
              child: Text(t.t('admin.learning.back_to_users')),
            ),
            OutlinedButton.icon(
              onPressed: loading ? null : load,
              icon: const Icon(Icons.refresh),
              label: Text(t.t('common.retry')),
            ),
          ],
        ),
        const SizedBox(height: 20),
        messages(),
        if (s != null) ...[
          RijviaAdaptiveGrid(
            minCellWidth: 180,
            maxCellWidth: double.infinity,
            children: [
              AdminValue(
                label: t.t('admin.learning.completed_exams'),
                value: s['totalCompletedExams'],
              ),
              AdminValue(
                label: t.t('admin.learning.completed_practices'),
                value: s['totalCompletedPractices'],
              ),
              AdminValue(
                label: t.t('admin.learning.average_score'),
                value: adminPercent(s['averageExamScore']),
              ),
              AdminValue(
                label: t.t('admin.learning.trend'),
                value: t.t(
                  'admin.learning.trend.${s['learningTrend'].toString().toLowerCase()}',
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          RijviaAdaptiveGrid(
            minCellWidth: 300,
            maxColumns: 2,
            maxCellWidth: double.infinity,
            children: [
              for (final highlight in [
                ('strongestCategories', 'strongest_areas'),
                ('weakestCategories', 'weakest_areas'),
              ])
                RijviaPageSection(
                  title: t.t('admin.learning.${highlight.$2}'),
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      if ((s[highlight.$1] as List).isEmpty)
                        Text(t.t('admin.learning.no_data')),
                      for (final category in AdminApi.records(s[highlight.$1]))
                        Chip(
                          label: Text(
                            '${adminLocalized(context, category, 'name')} · ${adminPercent(category['accuracy'])}',
                          ),
                        ),
                    ],
                  ),
                ),
            ],
          ),
        ],
        const SizedBox(height: 20),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final item in sections)
              ChoiceChip(
                label: Text(t.t('admin.learning.section.$item')),
                selected: item == section,
                onSelected: (_) {
                  section = item;
                  page = 0;
                  rows = [];
                  payload = null;
                  load();
                },
              ),
          ],
        ),
        const SizedBox(height: 20),
        RijviaPageSection(
          title: t.t('admin.learning.section.$section'),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (section == 'coverage' && payload != null) ...[
                RijviaAdaptiveGrid(
                  minCellWidth: 160,
                  maxCellWidth: double.infinity,
                  children: [
                    AdminValue(
                      label: t.t('admin.learning.coverage'),
                      value: adminPercent(payload!['coveragePercentage']),
                    ),
                    AdminValue(
                      label: t.t('admin.learning.accuracy'),
                      value: adminPercent(payload!['accuracyPercentage']),
                    ),
                    AdminValue(
                      label: t.t('admin.learning.questions_seen'),
                      value:
                          '${payload!['uniqueQuestionsSeen']}/${payload!['eligibleQuestions']}',
                    ),
                    AdminValue(
                      label: t.t('dashboard.theory_coverage.confidence'),
                      value: t.t(
                        'dashboard.theory_coverage.confidence_${payload!['confidenceState'].toString().toLowerCase()}',
                      ),
                    ),
                    AdminValue(
                      label: t.t('admin.learning.presented_answered'),
                      value:
                          '${payload!['timesPresented']}/${payload!['timesAnswered']}',
                    ),
                  ],
                ),
                const SizedBox(height: 16),
              ],
              if (section == 'difficulty' && payload != null) ...[
                Text(
                  t.t(
                    'admin.learning.difficulty_evidence.${payload!['evidenceStatus'].toString().toLowerCase()}',
                  ),
                ),
                if ((payload!['legacyAnswersExcluded'] as num? ?? 0) > 0)
                  Text(
                    '${t.t('admin.learning.legacy_answers_excluded')}: ${payload!['legacyAnswersExcluded']}',
                  ),
                const SizedBox(height: 12),
              ],
              if (!loading && error == null && rows.isEmpty)
                Text(t.t('admin.learning.no_data')),
              for (final row in rows)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _row(context, row, language),
                ),
              AdminPagination(
                page: page,
                pages: pages,
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

  Widget _row(BuildContext context, AdminRecord row, String language) {
    final t = AppLocalizations.of(context);
    String title = '', subtitle = '';
    final badges = <String>[];
    VoidCallback? onTap;
    switch (section) {
      case 'exams':
        title =
            '${t.t('admin.learning.exam_type.${row['examType'].toString().toLowerCase()}')}${row['subjectCode'] == null ? '' : ' · ${row['subjectCode']}'}';
        subtitle = adminDate(row['completedAt'], language, includeTime: true);
        badges.addAll([
          '${row['correctAnswers']}/${row['totalQuestions']}',
          adminPercent(row['scorePercentage']),
        ]);
        onTap = () => Navigator.pushNamed(
          context,
          '/admin/users/${widget.userId}/learning/exams/${row['examType']}/${row['examId']}',
        );
      case 'categories':
        title = adminLocalized(context, row, 'name');
        subtitle = '${row['correctAnswers']}/${row['questionsAttempted']}';
        badges.add(adminPercent(row['accuracy']));
      case 'coverage':
        title = row['categoryName']?.toString() ?? t.t('common.not_available');
        subtitle =
            '${row['uniqueQuestionsSeen']}/${row['eligibleQuestions']} · ${t.t('admin.learning.questions_seen')}';
        badges.addAll([
          '${t.t('admin.learning.coverage')} ${adminPercent(row['coveragePercentage'])}',
          '${t.t('admin.learning.accuracy')} ${adminPercent(row['accuracyPercentage'])}',
          t.t(
            'dashboard.theory_coverage.confidence_${row['confidenceState'].toString().toLowerCase()}',
          ),
        ]);
      case 'difficulty':
        title = t.t('difficulty.${row['difficulty'].toString().toLowerCase()}');
        subtitle = '${row['correctAnswers']}/${row['answeredQuestions']}';
        badges.add(adminPercent(row['accuracy']));
      case 'practices':
        title = row['signCode'].toString();
        subtitle =
            '${row['correctAnswers']}/${row['answeredQuestions']} · ${adminDate(row['completedAt'] ?? row['startedAt'], language, includeTime: true)}';
        badges.addAll([
          t.t(
            'dashboard.activity_status_${row['status'].toString().toLowerCase()}',
          ),
          adminPercent(row['accuracy']),
        ]);
      case 'lessons':
        title =
            '${row['lessonCode']} · ${adminLocalized(context, row, 'title')}';
        subtitle = adminDate(
          row['lastSeenAt'] ?? row['openedAt'],
          language,
          includeTime: true,
        );
        badges.addAll([
          t.t(
            row['status'] == 'NOT_STARTED'
                ? 'admin.learning.status_not_started'
                : 'dashboard.activity_status_${row['status'].toString().toLowerCase()}',
          ),
          '${row['pagesRead']} ${t.t('admin.learning.pages_read')}',
        ]);
      case 'signs':
        title = row['signCode'].toString();
        subtitle =
            '${row['attempts']} ${t.t('admin.learning.attempts')} · ${row['passedAttempts']} ${t.t('admin.learning.passed_attempts')}';
        badges.add(adminPercent(row['averageScore']));
        if (row['latestScore'] != null) {
          badges.add(
            '${t.t('admin.learning.latest')} ${adminPercent(row['latestScore'])}',
          );
        }
      case 'errors':
        title = t.t(
          'error_patterns.pattern_${row['errorType'].toString().toLowerCase()}',
        );
        subtitle = adminDate(row['occurredAt'], language, includeTime: true);
        if (row['trafficSignCode'] != null) {
          badges.add(row['trafficSignCode'].toString());
        }
      case 'signStudy':
      case 'videos':
        title = t.t(
          row[section == 'signStudy'
                      ? 'trafficSignStudyTrackingAvailable'
                      : 'videoTrackingAvailable'] ==
                  true
              ? 'admin.learning.no_data'
              : 'admin.learning.activity_not_tracked',
        );
        subtitle = t.t(
          section == 'signStudy'
              ? 'admin.learning.sign_study_reason'
              : 'admin.learning.video_reason',
        );
    }
    return RijviaPageSection(
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
            if (subtitle.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(subtitle),
            ],
            if (badges.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: badges.map((b) => Chip(label: Text(b))).toList(),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class AdminLearningExamScreen extends StatefulWidget {
  const AdminLearningExamScreen({
    super.key,
    required this.userId,
    required this.examType,
    required this.examId,
  });
  final int userId;
  final String examType;
  final int examId;
  @override
  State<AdminLearningExamScreen> createState() =>
      _AdminLearningExamScreenState();
}

class _AdminLearningExamScreenState
    extends AdminPageState<AdminLearningExamScreen> {
  AdminRecord? detail;
  @override
  Future<void> load() => fetch((request) async {
    final response = AdminApi.record(
      await api.get(
        '/admin/learning/users/${widget.userId}/exams/${Uri.encodeComponent(widget.examType)}/${widget.examId}',
      ),
    );
    if (mounted && request == revision) setState(() => detail = response);
  });
  String _text(
    AdminRecord row,
    String language,
    List<String> bases, [
    List<String> ids = const [],
  ]) {
    final suffix = '${language[0].toUpperCase()}${language.substring(1)}';
    for (final base in bases) {
      final value = row['$base$suffix'] ?? row[base];
      if (value != null && value.toString().isNotEmpty) return value.toString();
    }
    for (final id in ids) {
      if (row[id] != null) return '#${row[id]}';
    }
    return '';
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final language = context.watch<LanguageProvider>().currentLanguage;
    final d = detail;
    final summary = d == null ? null : AdminApi.record(d['summary']);
    final result = d == null ? null : AdminApi.record(d['result']);
    final questions = result == null
        ? <AdminRecord>[]
        : AdminApi.records(
            result['allAnswers'] ??
                result['questionResults'] ??
                result['questions'] ??
                [],
          );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AdminHeader(
          title: t.t('admin.learning.exam_detail'),
          description: d == null
              ? t.t('common.loading')
              : '${t.t('admin.learning.exam_type.${d['examType'].toString().toLowerCase()}')} #${d['examId']}',
          icon: Icons.fact_check_outlined,
        ),
        const SizedBox(height: 20),
        messages(),
        if (summary != null) ...[
          RijviaPageSection(
            title: t.t('admin.learning.exam_summary'),
            child: RijviaAdaptiveGrid(
              minCellWidth: 210,
              maxCellWidth: double.infinity,
              children: [
                AdminValue(
                  label: t.t('admin.learning.exam_date'),
                  value: adminDate(summary['completedAt'], language),
                ),
                AdminValue(
                  label: t.t('admin.learning.started_at'),
                  value: adminDate(
                    summary['startedAt'],
                    language,
                    includeTime: true,
                  ),
                ),
                AdminValue(
                  label: t.t('admin.learning.completed_at'),
                  value: adminDate(
                    summary['completedAt'],
                    language,
                    includeTime: true,
                  ),
                ),
                AdminValue(
                  label: t.t('admin.learning.duration'),
                  value: adminDuration(summary['durationSeconds'], t),
                ),
                AdminValue(
                  label: t.t('admin.learning.score'),
                  value:
                      '${summary['correctAnswers']}/${summary['totalQuestions']} · ${adminPercent(summary['scorePercentage'])}',
                ),
                AdminValue(
                  label: t.t('admin.learning.result'),
                  value: t.t(
                    summary['passed'] == true
                        ? 'admin.learning.passed'
                        : 'admin.learning.failed',
                  ),
                ),
                AdminValue(
                  label: t.t('admin.learning.exam_type'),
                  value: t.t(
                    'admin.learning.exam_type.${summary['examType'].toString().toLowerCase()}',
                  ),
                ),
                AdminValue(
                  label: t.t('admin.learning.language'),
                  value: summary['languageCode']?.toString().toUpperCase(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
        ],
        if (d?['historicalContentStatus'] == 'LEGACY_NO_SNAPSHOT' ||
            d?['historicalContentStatus'] == 'SNAPSHOT_PARTIAL') ...[
          RijviaPageSection(
            child: Text(
              t.t(
                d!['historicalContentStatus'] == 'LEGACY_NO_SNAPSHOT'
                    ? 'admin.learning.legacy_snapshot_notice'
                    : 'admin.learning.partial_snapshot_notice',
              ),
            ),
          ),
          const SizedBox(height: 20),
        ],
        RijviaPageSection(
          title: t.t('admin.learning.answer_review'),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (d != null && questions.isEmpty)
                Text(t.t('admin.learning.no_historical_answers')),
              for (var i = 0; i < questions.length; i++) ...[
                if (i > 0) const SizedBox(height: 12),
                _review(
                  context,
                  questions[i],
                  i,
                  language,
                  result?['signImagePath']?.toString(),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _review(
    BuildContext context,
    AdminRecord question,
    int index,
    String language,
    String? image,
  ) {
    final t = AppLocalizations.of(context);
    final selected = _text(
      question,
      language,
      ['selectedOptionText', 'selectedText', 'selectedChoice'],
      ['selectedOptionId', 'selectedChoiceId'],
    );
    final correct = _text(
      question,
      language,
      ['correctOptionText', 'correctText', 'correctChoice'],
      ['correctOptionId', 'correctChoiceId'],
    );
    final text = _text(
      question,
      language,
      ['questionText', 'question'],
      ['questionId', 'questionRef'],
    );
    final explanation = _text(question, language, ['explanation']);
    final category = _text(question, language, ['categoryName']);
    final unanswered =
        question['answered'] == false ||
        (selected.isEmpty &&
            question['selectedChoiceId'] == null &&
            question['selectedOptionId'] == null);
    final url =
        question['contentImageUrl']?.toString() ??
        question['signImagePath']?.toString() ??
        image;
    return RijviaPageSection(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Wrap(
            spacing: 8,
            runSpacing: 8,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Text(
                '${t.t('admin.learning.question')} ${index + 1}',
                style: const TextStyle(fontWeight: FontWeight.w900),
              ),
              if (category.isNotEmpty) Chip(label: Text(category)),
              if (question['difficulty'] != null)
                Chip(
                  label: Text(
                    t.t(
                      'difficulty.${question['difficulty'].toString().toLowerCase()}',
                    ),
                  ),
                ),
              if (question['snapshotAvailable'] == false)
                Chip(label: Text(t.t('admin.learning.legacy_identity_only'))),
              Chip(
                label: Text(
                  t.t(
                    unanswered
                        ? 'exam.unanswered'
                        : question['isCorrect'] == true
                        ? 'admin.learning.correct'
                        : 'admin.learning.incorrect',
                  ),
                ),
                backgroundColor: unanswered
                    ? null
                    : question['isCorrect'] == true
                    ? Colors.green.withValues(alpha: .1)
                    : Theme.of(context).colorScheme.error.withValues(alpha: .1),
              ),
            ],
          ),
          if (url != null && url.isNotEmpty) ...[
            const SizedBox(height: 12),
            RijviaEducationalImage(
              url: url,
              label: text,
              maxHeight: 320,
              radius: 28,
            ),
          ],
          const SizedBox(height: 12),
          Text(
            text.isEmpty ? '—' : text,
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          RijviaAdaptiveGrid(
            minCellWidth: 240,
            maxColumns: 2,
            maxCellWidth: double.infinity,
            children: [
              AdminValue(
                label: t.t('admin.learning.selected_answer'),
                value: selected.isEmpty ? '—' : selected,
              ),
              AdminValue(
                label: t.t('admin.learning.correct_answer'),
                value: correct.isEmpty ? '—' : correct,
                color: Colors.green,
              ),
            ],
          ),
          if (explanation.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(explanation),
          ],
        ],
      ),
    );
  }
}
