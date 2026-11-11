import 'package:flutter/material.dart';
import '../../core/localization/app_localizations.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import 'admin_components.dart';
import 'admin_quiz_draft.dart';

class AdminTheoryCategoriesScreen extends StatefulWidget {
  const AdminTheoryCategoriesScreen({super.key});
  @override
  State<AdminTheoryCategoriesScreen> createState() =>
      _AdminTheoryCategoriesScreenState();
}

class _AdminTheoryCategoriesScreenState
    extends AdminPageState<AdminTheoryCategoriesScreen> {
  List<AdminRecord> categories = [];
  AdminRecord? health;
  @override
  Future<void> load() => fetch((request) async {
    final results = await Future.wait([
      api.get('/admin/quiz/categories/manage'),
      api.get('/admin/quiz/bank-health'),
    ]);
    final groups = AdminApi.records(results[0]);
    final bank = AdminApi.record(results[1]);
    if (mounted && request == revision) {
      setState(() {
        categories = groups;
        health = bank;
      });
    }
  });
  Future<void> _edit([AdminRecord? category]) async {
    final nextOrder =
        categories.fold<int>(
          0,
          (value, item) => (item['displayOrder'] as num).toInt() > value
              ? (item['displayOrder'] as num).toInt()
              : value,
        ) +
        1;
    final saved = await showDialog<bool>(
      context: context,
      builder: (context) =>
          _TheoryCategoryForm(category: category, nextOrder: nextOrder),
    );
    if (saved == true && mounted) await load();
  }

  Future<void> _toggle(AdminRecord category) async {
    await mutate(
      () => api.put(
        '/admin/quiz/categories/${category['id']}',
        theoryCategoryPayload({
          ...category,
          'active': category['active'] != true,
        }, editing: true),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final h = health;
    final summary = h == null ? null : AdminApi.record(h['summary']);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AdminHeader(
          title: t.t('admin.quizzes.health.category_management_title'),
          description: t.t(
            'admin.quizzes.health.category_management_description',
          ),
          icon: Icons.folder_special_outlined,
          actions: [
            OutlinedButton.icon(
              onPressed: loading ? null : load,
              icon: const Icon(Icons.refresh),
              label: Text(t.t('admin.quizzes.health.refresh')),
            ),
            FilledButton.icon(
              onPressed: saving ? null : _edit,
              icon: const Icon(Icons.add),
              label: Text(t.t('admin.quizzes.health.add_category')),
            ),
          ],
        ),
        const SizedBox(height: 20),
        messages(),
        if (categories.isNotEmpty)
          RijviaAdaptiveGrid(
            equalRowHeights: false,
            minCellWidth: 450,
            maxColumns: 2,
            maxCellWidth: double.infinity,
            children: [
              for (final category in categories)
                RijviaPageSection(
                  title: adminLocalized(context, category, 'name'),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        '${t.t('admin.quizzes.health.order')}: ${category['displayOrder']} · ${t.t('admin.quizzes.health.weight')}: ${category['examTargetWeight']}',
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          Chip(
                            label: Text(
                              t.t(
                                category['examEligible'] == true
                                    ? 'admin.quizzes.health.exam_ready'
                                    : 'admin.quizzes.health.questions_needed',
                              ),
                            ),
                          ),
                          Chip(
                            label: Text(
                              t.t(
                                category['active'] == true
                                    ? 'admin.quizzes.health.active'
                                    : 'admin.quizzes.health.inactive',
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      RijviaAdaptiveGrid(
                        minCellWidth: 120,
                        maxColumns: 3,
                        maxCellWidth: double.infinity,
                        children: [
                          for (final metric in [
                            ('totalQuestions', 'total'),
                            ('publishedQuestions', 'published'),
                            ('eligibleAllLocales', 'eligible'),
                          ])
                            AdminValue(
                              label: t.t('admin.quizzes.health.${metric.$2}'),
                              value: category[metric.$1],
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      RijviaAdaptiveGrid(
                        minCellWidth: 120,
                        maxColumns: 3,
                        maxCellWidth: double.infinity,
                        children: [
                          for (final difficulty in AdminQuizDraft.difficulties)
                            AdminValue(
                              label: t.t(
                                'difficulty.${difficulty.toLowerCase()}',
                              ),
                              value:
                                  (category['eligibleByDifficulty']
                                      as Map?)?[difficulty],
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        '${category['eligibleAllLocales']}/${category['minimumRequired']} · ${t.t('admin.quizzes.health.minimum_required')}: ${category['minimumRequired']}',
                      ),
                      if (category['examEligible'] != true)
                        Text(
                          '${t.t('admin.quizzes.health.questions_needed')}: ${category['questionsNeeded']}',
                        ),
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          OutlinedButton.icon(
                            onPressed: saving ? null : () => _edit(category),
                            icon: const Icon(Icons.edit_outlined),
                            label: Text(
                              t.t('admin.quizzes.health.edit_category'),
                            ),
                          ),
                          OutlinedButton.icon(
                            onPressed: saving ? null : () => _toggle(category),
                            icon: const Icon(Icons.power_settings_new),
                            label: Text(
                              t.t(
                                category['active'] == true
                                    ? 'admin.quizzes.health.deactivate'
                                    : 'admin.quizzes.health.activate',
                              ),
                            ),
                          ),
                          OutlinedButton.icon(
                            onPressed: () => Navigator.pushNamed(
                              context,
                              Uri(
                                path: '/admin/quizzes',
                                queryParameters: {
                                  'categoryCode': category['code'].toString(),
                                },
                              ).toString(),
                            ),
                            icon: const Icon(Icons.visibility_outlined),
                            label: Text(
                              t.t('admin.quizzes.health.view_questions'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
            ],
          ),
        const SizedBox(height: 24),
        if (summary != null)
          RijviaPageSection(
            title: t.t('admin.quizzes.health.title'),
            description: t.t('admin.quizzes.health.description'),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                RijviaAdaptiveGrid(
                  minCellWidth: 170,
                  maxColumns: 5,
                  maxCellWidth: double.infinity,
                  children: [
                    for (final field in [
                      ('totalQuestions', 'total'),
                      ('activeQuestions', 'active'),
                      ('inactiveQuestions', 'inactive'),
                      ('publishedQuestions', 'published'),
                      ('eligibleAllLocales', 'eligible'),
                      ('translationGapQuestions', 'translation_gaps'),
                      ('explanationGapQuestions', 'explanation_gaps'),
                      ('invalidQuestions', 'invalid'),
                      ('underrepresentedCategories', 'underrepresented'),
                      ('overrepresentedCategories', 'overrepresented'),
                    ])
                      AdminValue(
                        label: t.t('admin.quizzes.health.${field.$2}'),
                        value: summary[field.$1],
                      ),
                  ],
                ),
                const SizedBox(height: 16),
                RijviaAdaptiveGrid(
                  minCellWidth: 150,
                  maxCellWidth: double.infinity,
                  children: [
                    for (final locale in AdminApi.records(h!['locales']))
                      AdminValue(
                        label: t.t(
                          'admin.settings_page.language_${locale['locale']}',
                        ),
                        value:
                            '${locale['eligibleQuestions']} · ${t.t('admin.quizzes.health.gaps')}: ${locale['translationGapQuestions']}',
                      ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  t.t('admin.quizzes.health.quality_title'),
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 12),
                if ((h['questionsNeedingReview'] as List).isEmpty)
                  Text(t.t('admin.quizzes.health.no_quality_flags')),
                for (final question in AdminApi.records(
                  h['questionsNeedingReview'],
                ))
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: RijviaPageSection(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            '${t.t('admin.learning.question')} ${question['questionId']} · ${_categoryName(context, question['categoryCode'])} · ${t.t('difficulty.${question['difficulty'].toString().toLowerCase()}')}',
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              for (final flag in question['flags'] as List)
                                Chip(
                                  label: Text(
                                    t.t(
                                      'admin.quizzes.health.flag_${flag.toString().toLowerCase()}',
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          Text(
                            '${t.t('admin.quizzes.health.presentations')}: ${question['presentations']} · ${t.t('admin.quizzes.health.answers')}: ${question['answered']} · ${t.t('admin.quizzes.health.correct_rate')}: ${adminPercent(question['correctRate'])} · ${t.t('admin.quizzes.health.incorrect_rate')}: ${adminPercent(question['incorrectRate'])} · ${t.t('admin.quizzes.health.answer_time')}: ${question['averageAnswerTimeSeconds'] ?? '—'} ${t.t('admin.learning.seconds')}',
                          ),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              for (final performance in AdminApi.record(
                                question['performanceByLocale'],
                              ).entries)
                                if ((performance.value['answered'] as num) > 0)
                                  Chip(
                                    label: Text(
                                      '${t.t('admin.settings_page.language_${performance.key}')} · ${performance.value['answered']} · ${adminPercent(performance.value['correctRate'])}',
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
        if (h != null) ...[
          const SizedBox(height: 24),
          RijviaPageSection(
            title:
                '${t.t('admin.quizzes.health.rarely_exposed')} · ${t.t('admin.quizzes.health.heavily_exposed')}',
            description: t.t('admin.quizzes.health.description'),
            actions: [
              OutlinedButton(
                onPressed: () => Navigator.pushNamed(context, '/admin/quizzes'),
                child: Text(t.t('admin.quizzes.health.view_questions')),
              ),
            ],
            child: RijviaAdaptiveGrid(
              equalRowHeights: false,
              minCellWidth: 350,
              maxColumns: 2,
              maxCellWidth: double.infinity,
              children: [
                for (final field in [
                  ('rarelyExposedQuestions', 'rarely_exposed'),
                  ('heavilyExposedQuestions', 'heavily_exposed'),
                ])
                  RijviaPageSection(
                    title: t.t('admin.quizzes.health.${field.$2}'),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if ((h[field.$1] as List).isEmpty)
                          Text(t.t('admin.learning.no_data')),
                        for (final question in AdminApi.records(h[field.$1]))
                          ListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text(
                              '#${question['questionId']} · ${t.t('difficulty.${question['difficulty'].toString().toLowerCase()}')}',
                            ),
                            subtitle: Text(
                              _categoryName(context, question['categoryCode']),
                            ),
                            trailing: Text(
                              question['presentations'].toString(),
                            ),
                            onTap: () => Navigator.pushNamed(
                              context,
                              '/admin/quizzes/${question['questionId']}/edit',
                            ),
                          ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  String _categoryName(BuildContext context, Object? code) {
    final category = categories.where((c) => c['code'] == code).firstOrNull;
    return category == null
        ? AppLocalizations.of(context).t('common.not_available')
        : adminLocalized(context, category, 'name');
  }
}

AdminRecord theoryCategoryPayload(
  AdminRecord fields, {
  required bool editing,
}) => {
  'code': editing ? fields['code'] : null,
  for (final suffix in AdminQuizDraft.suffixes) ...{
    'name$suffix': fields['name$suffix'].toString().trim(),
    'description$suffix':
        fields['description$suffix']?.toString().trim().isNotEmpty == true
        ? fields['description$suffix'].toString().trim()
        : null,
  },
  'displayOrder': fields['displayOrder'],
  'active': fields['active'],
  'contentScope': fields['contentScope'],
  'examTargetWeight': fields['examTargetWeight'],
};

class _TheoryCategoryForm extends StatefulWidget {
  const _TheoryCategoryForm({this.category, required this.nextOrder});
  final AdminRecord? category;
  final int nextOrder;
  @override
  State<_TheoryCategoryForm> createState() => _TheoryCategoryFormState();
}

class _TheoryCategoryFormState extends State<_TheoryCategoryForm> {
  final form = GlobalKey<FormState>();
  late AdminRecord fields = widget.category == null
      ? {
          'code': null,
          for (final suffix in AdminQuizDraft.suffixes) ...{
            'name$suffix': '',
            'description$suffix': '',
          },
          'displayOrder': widget.nextOrder,
          'active': true,
          'contentScope': 'THEORETICAL_EXAM',
          'examTargetWeight': 10,
        }
      : {...widget.category!};
  bool saving = false, failed = false;
  Future<void> save() async {
    if (saving || !form.currentState!.validate()) return;
    form.currentState!.save();
    setState(() {
      saving = true;
      failed = false;
    });
    try {
      final payload = theoryCategoryPayload(
        fields,
        editing: widget.category != null,
      );
      if (widget.category == null) {
        await AdminApi().post('/admin/quiz/categories', payload);
      } else {
        await AdminApi().put(
          '/admin/quiz/categories/${widget.category!['id']}',
          payload,
        );
      }
      if (mounted) Navigator.pop(context, true);
    } catch (_) {
      if (mounted) setState(() => failed = true);
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return AlertDialog(
      title: Text(
        t.t(
          widget.category == null
              ? 'admin.quizzes.health.add_category'
              : 'admin.quizzes.health.edit_category',
        ),
      ),
      content: SizedBox(
        width: 700,
        child: SingleChildScrollView(
          child: Form(
            key: form,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (widget.category == null) ...[
                  Text(t.t('admin.quizzes.health.auto_code_hint')),
                  const SizedBox(height: 16),
                ],
                if (failed)
                  Text(
                    t.t('admin.quizzes.health.save_error'),
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                RijviaAdaptiveGrid(
                  equalRowHeights: false,
                  minCellWidth: 240,
                  maxColumns: 2,
                  maxCellWidth: double.infinity,
                  children: [
                    for (final metric in [
                      ('displayOrder', 'order', 0, 1000000),
                      ('examTargetWeight', 'weight', 1, 100),
                    ])
                      TextFormField(
                        initialValue: fields[metric.$1].toString(),
                        enabled: !saving,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: t.t('admin.quizzes.health.${metric.$2}'),
                        ),
                        validator: (value) {
                          final n = int.tryParse(value ?? '');
                          return n == null || n < metric.$3 || n > metric.$4
                              ? t.t('admin.settings_page.range_error', {
                                  'min': metric.$3,
                                  'max': metric.$4,
                                })
                              : null;
                        },
                        onSaved: (value) =>
                            fields[metric.$1] = int.parse(value!),
                      ),
                    for (final suffix in AdminQuizDraft.suffixes)
                      Directionality(
                        textDirection: suffix == 'Ar'
                            ? TextDirection.rtl
                            : TextDirection.ltr,
                        child: TextFormField(
                          initialValue: fields['name$suffix']?.toString() ?? '',
                          enabled: !saving,
                          decoration: InputDecoration(
                            labelText: t.t(
                              'admin.quizzes.health.name_${suffix.toLowerCase()}',
                            ),
                          ),
                          validator: (value) =>
                              value == null || value.trim().isEmpty
                              ? t.t('auth.validation.required')
                              : null,
                          onSaved: (value) =>
                              fields['name$suffix'] = value!.trim(),
                        ),
                      ),
                    for (final suffix in AdminQuizDraft.suffixes)
                      Directionality(
                        textDirection: suffix == 'Ar'
                            ? TextDirection.rtl
                            : TextDirection.ltr,
                        child: TextFormField(
                          initialValue:
                              fields['description$suffix']?.toString() ?? '',
                          enabled: !saving,
                          minLines: 3,
                          maxLines: null,
                          decoration: InputDecoration(
                            labelText: t.t(
                              'admin.quizzes.health.description_${suffix.toLowerCase()}',
                            ),
                          ),
                          onSaved: (value) => fields['description$suffix'] =
                              value?.trim() ?? '',
                        ),
                      ),
                  ],
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(t.t('admin.quizzes.health.active')),
                  value: fields['active'] == true,
                  onChanged: saving
                      ? null
                      : (value) => setState(() => fields['active'] = value),
                ),
              ],
            ),
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: saving ? null : () => Navigator.pop(context, false),
          child: Text(t.t('admin.quizzes.health.cancel')),
        ),
        FilledButton(
          onPressed: saving ? null : save,
          child: Text(t.t('admin.quizzes.health.save')),
        ),
      ],
    );
  }
}
