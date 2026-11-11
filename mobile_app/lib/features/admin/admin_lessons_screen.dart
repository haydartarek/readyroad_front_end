import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/providers/language_provider.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import 'admin_components.dart';
import 'admin_lesson_draft.dart';

class AdminLessonsScreen extends StatefulWidget {
  const AdminLessonsScreen({super.key});
  @override
  State<AdminLessonsScreen> createState() => _AdminLessonsScreenState();
}

class _AdminLessonsScreenState extends AdminPageState<AdminLessonsScreen> {
  List<AdminRecord> lessons = [];
  String query = '', filter = 'ALL';
  @override
  Future<void> load() => fetch((request) async {
    final data = AdminApi.records(await api.get('/admin/lessons'));
    if (mounted && request == revision) setState(() => lessons = data);
  });
  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final language = context.watch<LanguageProvider>().currentLanguage;
    final filtered = lessons
        .where(
          (lesson) =>
              (filter == 'ALL' ||
                  (filter == 'DRAFT'
                      ? lesson['hasDraft'] == true
                      : lesson['active'] == true)) &&
              ['lessonCode', 'titleEn', 'titleAr', 'titleNl', 'titleFr'].any(
                (field) =>
                    lesson[field]?.toString().toLowerCase().contains(
                      query.trim().toLowerCase(),
                    ) ==
                    true,
              ),
        )
        .toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AdminHeader(
          title: t.t('admin.lessons.title'),
          description: t.t('admin.lessons.description'),
          icon: Icons.menu_book_outlined,
          actions: [
            FilledButton.icon(
              onPressed: () =>
                  Navigator.pushNamed(context, '/admin/lessons/new').then((_) {
                    if (mounted) load();
                  }),
              icon: const Icon(Icons.add),
              label: Text(t.t('admin.lessons.add')),
            ),
          ],
          metrics: [
            for (final metric in [
              ('total', lessons.length),
              ('published', lessons.where((l) => l['active'] == true).length),
              (
                'with_draft',
                lessons.where((l) => l['hasDraft'] == true).length,
              ),
            ])
              Chip(
                label: Text(
                  '${t.t('admin.lessons.${metric.$1}')}: ${loading && lessons.isEmpty ? '—' : metric.$2}',
                ),
              ),
          ],
        ),
        const SizedBox(height: 20),
        messages(),
        TextField(
          decoration: InputDecoration(
            labelText: t.t('admin.lessons.search_placeholder'),
            prefixIcon: const Icon(Icons.search),
          ),
          onChanged: (value) => setState(() => query = value),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final item in [
              ('ALL', 'filter_all'),
              ('PUBLISHED', 'filter_published'),
              ('DRAFT', 'filter_draft'),
            ])
              ChoiceChip(
                label: Text(t.t('admin.lessons.${item.$2}')),
                selected: filter == item.$1,
                onSelected: (_) => setState(() => filter = item.$1),
              ),
          ],
        ),
        const SizedBox(height: 20),
        if (!loading && error == null && filtered.isEmpty)
          RijviaPageSection(child: Text(t.t('admin.lessons.empty_title'))),
        RijviaAdaptiveGrid(
          minCellWidth: 300,
          maxColumns: 3,
          maxCellWidth: double.infinity,
          children: [
            for (final lesson in filtered)
              RijviaPageSection(
                title: adminLocalized(context, lesson, 'title'),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        Chip(label: Text(lesson['lessonCode'].toString())),
                        Chip(
                          label: Text(
                            t.t(
                              'admin.lessons.status_${lesson['editorState'].toString().toLowerCase()}',
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        for (final field in [
                          ('pageCount', 'pages'),
                          ('currentVersion', 'version'),
                          ('estimatedMinutes', 'minutes'),
                        ]) ...[
                          if (field.$1 != 'pageCount') const SizedBox(width: 8),
                          Expanded(
                            child: AdminValue(
                              label: t.t('admin.lessons.${field.$2}'),
                              value: field.$1 == 'currentVersion'
                                  ? 'V${lesson[field.$1]}'
                                  : lesson[field.$1],
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(adminDate(lesson['updatedAt'], language)),
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        FilledButton.icon(
                          onPressed: () =>
                              Navigator.pushNamed(
                                context,
                                '/admin/lessons/${Uri.encodeComponent(lesson['lessonCode'].toString())}/edit',
                              ).then((_) {
                                if (mounted) load();
                              }),
                          icon: const Icon(Icons.edit_outlined),
                          label: Text(t.t('admin.lessons.manage')),
                        ),
                        OutlinedButton.icon(
                          onPressed: () => Navigator.pushNamed(
                            context,
                            '/lessons/${Uri.encodeComponent(lesson['lessonCode'].toString())}',
                          ),
                          icon: const Icon(Icons.open_in_new),
                          label: Text(t.t('admin.lessons.open_public')),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
          ],
        ),
      ],
    );
  }
}

class AdminNewLessonScreen extends StatefulWidget {
  const AdminNewLessonScreen({super.key});
  @override
  State<AdminNewLessonScreen> createState() => _AdminNewLessonScreenState();
}

class _AdminNewLessonScreenState extends State<AdminNewLessonScreen> {
  final form = GlobalKey<FormState>();
  final fields = <String, dynamic>{
    'lessonCode': '',
    'displayOrder': 0,
    'estimatedMinutes': 5,
    'icon': '',
    for (final suffix in ['Ar', 'Nl', 'Fr', 'En']) ...{
      'title$suffix': '',
      'description$suffix': '',
    },
    'page': {
      for (final suffix in ['Ar', 'Nl', 'Fr', 'En']) ...{
        'title$suffix': '',
        'content$suffix': '',
      },
    },
  };
  bool saving = false;
  String? error;
  Future<void> submit() async {
    if (saving || !form.currentState!.validate()) return;
    form.currentState!.save();
    setState(() {
      saving = true;
      error = null;
    });
    try {
      final result = AdminApi.record(
        await AdminApi().post('/admin/lessons', fields),
      );
      if (mounted) {
        Navigator.pushReplacementNamed(
          context,
          '/admin/lessons/${Uri.encodeComponent(result['lessonCode'].toString())}/edit',
        );
      }
    } catch (_) {
      if (mounted) setState(() => error = 'admin.lessons.create.error');
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  Widget textFields(
    AdminRecord values,
    String base,
    String labelKey, {
    bool required = false,
    bool multiline = false,
  }) {
    final t = AppLocalizations.of(context);
    return RijviaAdaptiveGrid(
      equalRowHeights: false,
      minCellWidth: 280,
      maxColumns: 2,
      maxCellWidth: double.infinity,
      children: [
        for (final language in AdminLessonDraft.languages)
          Directionality(
            textDirection: language == 'ar'
                ? TextDirection.rtl
                : TextDirection.ltr,
            child: TextFormField(
              enabled: !saving,
              minLines: multiline ? 3 : 1,
              maxLines: multiline ? null : 1,
              decoration: InputDecoration(
                labelText:
                    '${t.t(labelKey)} · ${t.t('admin.lessons.editor.language_$language')}',
              ),
              validator: required
                  ? (value) => value == null || value.trim().isEmpty
                        ? t.t('admin.lessons.create.required_error')
                        : null
                  : null,
              onSaved: (value) =>
                  values['$base${language[0].toUpperCase()}${language.substring(1)}'] =
                      value?.trim() ?? '',
            ),
          ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AdminHeader(
          title: t.t('admin.lessons.create.title'),
          description: t.t('admin.lessons.create.description'),
          icon: Icons.menu_book_outlined,
          actions: [
            OutlinedButton(
              onPressed: () => Navigator.pushNamed(context, '/admin/lessons'),
              child: Text(t.t('admin.lessons.editor.back_to_lessons')),
            ),
          ],
        ),
        const SizedBox(height: 20),
        if (error != null)
          AdminStatus(
            error: error,
            onRetry: () => setState(() => error = null),
          ),
        Form(
          key: form,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              RijviaPageSection(
                title: t.t('admin.lessons.create.details_title'),
                description: t.t('admin.lessons.create.details_description'),
                child: RijviaAdaptiveGrid(
                  equalRowHeights: false,
                  minCellWidth: 210,
                  maxColumns: 3,
                  maxCellWidth: double.infinity,
                  children: [
                    TextFormField(
                      enabled: !saving,
                      maxLength: 50,
                      decoration: InputDecoration(
                        labelText: t.t('admin.lessons.editor.lesson_code'),
                      ),
                      validator: (value) =>
                          value == null ||
                              !RegExp(
                                r'^[A-Za-z0-9][A-Za-z0-9_-]*$',
                              ).hasMatch(value.trim())
                          ? t.t('admin.lessons.create.invalid_error')
                          : null,
                      onSaved: (value) => fields['lessonCode'] = value!.trim(),
                    ),
                    for (final metric in [
                      ('displayOrder', 'field_display_order', 0),
                      ('estimatedMinutes', 'field_estimated_minutes', 1),
                    ])
                      TextFormField(
                        initialValue: fields[metric.$1].toString(),
                        enabled: !saving,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: t.t('admin.lessons.editor.${metric.$2}'),
                        ),
                        validator: (value) =>
                            int.tryParse(value ?? '') == null ||
                                int.parse(value!) < metric.$3
                            ? t.t('admin.lessons.create.invalid_error')
                            : null,
                        onSaved: (value) =>
                            fields[metric.$1] = int.parse(value!),
                      ),
                    TextFormField(
                      enabled: !saving,
                      maxLength: 10,
                      decoration: InputDecoration(
                        labelText: t.t('admin.lessons.editor.field_icon'),
                      ),
                      onSaved: (value) => fields['icon'] = value?.trim() ?? '',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              RijviaPageSection(
                title: t.t('admin.lessons.create.titles_title'),
                child: textFields(
                  fields,
                  'title',
                  'admin.lessons.editor.field_title',
                  required: true,
                ),
              ),
              const SizedBox(height: 20),
              RijviaPageSection(
                title: t.t('admin.lessons.editor.lesson_description'),
                child: textFields(
                  fields,
                  'description',
                  'admin.lessons.editor.field_description',
                  multiline: true,
                ),
              ),
              const SizedBox(height: 20),
              RijviaPageSection(
                title: t.t('admin.lessons.create.page_title'),
                child: textFields(
                  fields['page'] as AdminRecord,
                  'title',
                  'admin.lessons.editor.page_title',
                  required: true,
                ),
              ),
              const SizedBox(height: 20),
              RijviaPageSection(
                title: t.t('admin.lessons.editor.page_content'),
                child: textFields(
                  fields['page'] as AdminRecord,
                  'content',
                  'admin.lessons.editor.page_content',
                  multiline: true,
                ),
              ),
              const SizedBox(height: 20),
              FilledButton.icon(
                onPressed: saving ? null : submit,
                icon: const Icon(Icons.save_outlined),
                label: Text(
                  t.t(
                    saving
                        ? 'admin.lessons.create.saving'
                        : 'admin.lessons.create.submit',
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
