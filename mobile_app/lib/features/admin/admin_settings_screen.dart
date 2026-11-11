import 'package:flutter/material.dart';
import '../../core/localization/app_localizations.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import 'admin_components.dart';

class AdminSettingsScreen extends StatefulWidget {
  const AdminSettingsScreen({super.key});
  @override
  State<AdminSettingsScreen> createState() => _AdminSettingsScreenState();
}

class _AdminSettingsScreenState extends AdminPageState<AdminSettingsScreen> {
  final _form = GlobalKey<FormState>();
  AdminRecord? settings;
  AdminRecord? saved;
  int formRevision = 0;
  @override
  Future<void> load() => fetch((request) async {
    final result = AdminApi.record(await api.get('/admin/settings'));
    // Do not mask an absent server configuration with made-up defaults.
    if (![
      'siteName',
      'defaultLanguage',
      'maintenanceMode',
      'allowRegistrations',
      'examQuestions',
      'examDurationMinutes',
      'passingScorePercent',
    ].every(result.containsKey)) {
      throw const FormatException('Incomplete settings');
    }
    if (mounted && request == revision) {
      setState(() {
        formRevision++;
        settings = {...result};
        saved = {...result};
      });
    }
  });
  Future<void> _save() async {
    if (!_form.currentState!.validate() || settings == null) return;
    _form.currentState!.save();
    await mutate(() async {
      final result = AdminApi.record(
        await api.put('/admin/settings', settings),
      );
      if (mounted) {
        setState(() {
          formRevision++;
          settings = {...result};
          saved = {...result};
        });
      }
    }, successKey: 'admin.settings_page.save_success');
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final s = settings;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AdminHeader(
          title: t.t('admin.settings_page.title'),
          description: t.t('admin.settings_page.description'),
          icon: Icons.tune,
          actions: [
            OutlinedButton(
              onPressed: saved == null || saving
                  ? null
                  : () => setState(() {
                      formRevision++;
                      settings = {...saved!};
                      success = 'admin.settings_page.reset_success';
                    }),
              child: Text(t.t('admin.settings_page.reset')),
            ),
            FilledButton.icon(
              onPressed: s == null || saving || loading ? null : _save,
              icon: const Icon(Icons.save_outlined),
              label: Text(
                t.t(
                  saving
                      ? 'admin.settings_page.saving'
                      : 'admin.settings_page.save',
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        messages(),
        if (s != null)
          Form(
            key: _form,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                RijviaPageSection(
                  title: t.t('admin.settings_page.section_general'),
                  child: RijviaAdaptiveGrid(
                    equalRowHeights: false,
                    minCellWidth: 280,
                    maxColumns: 2,
                    maxCellWidth: double.infinity,
                    children: [
                      TextFormField(
                        key: ValueKey('site-$formRevision'),
                        initialValue: s['siteName'].toString(),
                        enabled: s['siteNameEditable'] == true && !saving,
                        decoration: InputDecoration(
                          labelText: t.t('admin.settings_page.site_name'),
                          helperText: s['siteNameEditable'] == true
                              ? null
                              : t.t('admin.settings_page.fixed_site_name_hint'),
                          helperMaxLines: 4,
                        ),
                        validator: (v) => v == null || v.trim().isEmpty
                            ? t.t('auth.validation.required')
                            : null,
                        onSaved: (v) => s['siteName'] = v!.trim(),
                      ),
                      DropdownButtonFormField<String>(
                        key: ValueKey('language-$formRevision'),
                        initialValue:
                            [
                              'en',
                              'ar',
                              'nl',
                              'fr',
                            ].contains(s['defaultLanguage'])
                            ? s['defaultLanguage'] as String
                            : null,
                        isExpanded: true,
                        decoration: InputDecoration(
                          labelText: t.t(
                            'admin.settings_page.default_language',
                          ),
                        ),
                        items: [
                          for (final lang in ['en', 'ar', 'nl', 'fr'])
                            DropdownMenuItem(
                              value: lang,
                              child: Text(
                                t.t('admin.settings_page.language_$lang'),
                              ),
                            ),
                        ],
                        onChanged: saving
                            ? null
                            : (v) => setState(() => s['defaultLanguage'] = v),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                RijviaPageSection(
                  title: t.t('admin.settings_page.section_access'),
                  child: Column(
                    children: [
                      for (final item in [
                        ('allowRegistrations', 'allow_registrations'),
                        ('maintenanceMode', 'maintenance_mode'),
                      ])
                        SwitchListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(t.t('admin.settings_page.${item.$2}')),
                          subtitle: Text(
                            t.t('admin.settings_page.${item.$2}_desc'),
                          ),
                          value: s[item.$1] == true,
                          onChanged: saving
                              ? null
                              : (v) => setState(() => s[item.$1] = v),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                RijviaPageSection(
                  title: t.t('admin.settings_page.section_exam'),
                  description: s['examSettingsEditable'] == true
                      ? null
                      : t.t('admin.settings_page.fixed_exam_note'),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      RijviaAdaptiveGrid(
                        equalRowHeights: false,
                        minCellWidth: 220,
                        maxColumns: 3,
                        maxCellWidth: double.infinity,
                        children: [
                          for (final field in [
                            ('examQuestions', 'exam_questions', 10, 100),
                            ('examDurationMinutes', 'exam_duration', 1, 120),
                            ('passingScorePercent', 'passing_score', 50, 100),
                          ])
                            TextFormField(
                              key: ValueKey('${field.$1}-$formRevision'),
                              initialValue: s[field.$1]?.toString() ?? '',
                              enabled:
                                  s['examSettingsEditable'] == true && !saving,
                              keyboardType:
                                  const TextInputType.numberWithOptions(
                                    decimal: true,
                                  ),
                              decoration: InputDecoration(
                                labelText: t.t(
                                  'admin.settings_page.${field.$2}',
                                ),
                                helperText: t.t(
                                  'admin.settings_page.${field.$2}_hint',
                                ),
                                helperMaxLines: 4,
                              ),
                              validator: (value) {
                                final n = num.tryParse(value ?? '');
                                return n == null || n < field.$3 || n > field.$4
                                    ? t.t('admin.settings_page.range_error', {
                                        'min': field.$3,
                                        'max': field.$4,
                                      })
                                    : null;
                              },
                              onSaved: (v) => s[field.$1] = num.parse(v!),
                            ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      Text(
                        t.t('admin.settings_page.current_exam_config'),
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${s['examQuestions']} ${t.t('admin.settings_page.summary_questions')} · ${s['examDurationMinutes']} ${t.t('admin.settings_page.minutes_label')} · ${s['passingScorePercent']}% ${t.t('admin.settings_page.to_pass_label')}',
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Text(t.t('admin.settings_page.database_note')),
              ],
            ),
          ),
      ],
    );
  }
}
