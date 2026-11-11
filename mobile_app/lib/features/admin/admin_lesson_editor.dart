import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/providers/language_provider.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_educational_image.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import 'admin_components.dart';
import 'admin_file_upload.dart';
import 'admin_lesson_draft.dart';

String? adminLessonImage(List<AdminRecord> assets, Object? id) {
  final asset = assets.where((a) => a['id'] == id).firstOrNull;
  final key = asset?['storageKey']?.toString().trim().replaceFirst(
    RegExp(r'^/+'),
    '',
  );
  return key == null || key.isEmpty
      ? null
      : key.startsWith('images/')
      ? '/$key'
      : '/images/$key';
}

class AdminLessonEditor extends StatefulWidget {
  const AdminLessonEditor({super.key, required this.lessonCode});
  final String lessonCode;
  @override
  State<AdminLessonEditor> createState() => _AdminLessonEditorState();
}

class _AdminLessonEditorState extends AdminPageState<AdminLessonEditor> {
  AdminRecord? detail;
  AdminLessonDraft? draft;
  List<AdminRecord> assets = [], versions = [];
  String? contentLanguage;
  int? uploadingPage;
  bool _allowExit = false;
  String get root => '/admin/lessons/${Uri.encodeComponent(widget.lessonCode)}';
  @override
  Future<void> load() => fetch((request) async {
    final data = AdminApi.record(await api.get(root));
    var history = AdminApi.records(data['versions']);
    try {
      history = AdminApi.records(await api.get('$root/versions'));
    } catch (_) {
      /* Detail retains its server-owned version history. */
    }
    if (!mounted || request != revision) return;
    setState(() {
      detail = data;
      assets = AdminApi.records(data['mediaAssets']);
      versions = history
        ..sort(
          (a, b) =>
              (b['versionNumber'] as num).compareTo(a['versionNumber'] as num),
        );
      if (draft == null || (!draft!.dirty && !draft!.conflict)) {
        draft = data['draft'] == null
            ? null
            : AdminLessonDraft(AdminApi.record(data['draft']));
      }
      contentLanguage ??= context.read<LanguageProvider>().currentLanguage;
    });
  });
  Future<void> startDraft() async {
    if (saving || detail == null || draft != null) return;
    setState(() {
      saving = true;
      error = null;
    });
    try {
      final created = AdminApi.record(await api.post('$root/draft'));
      if (mounted) {
        setState(() {
          draft = AdminLessonDraft(created);
          detail!['draft'] = created;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => error = 'admin.lessons.editor.draft_start_error');
      }
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  Future<void> saveDraft() async {
    final current = draft;
    if (current == null ||
        !current.dirty ||
        current.conflict ||
        saving ||
        uploadingPage != null) {
      return;
    }
    final invalid = current.validate();
    if (invalid != null) {
      setState(() => error = 'admin.lessons.editor.$invalid');
      return;
    }
    setState(() {
      saving = true;
      error = null;
      success = null;
    });
    try {
      final result = AdminApi.record(
        await api.put('$root/draft', current.savePayload()),
      );
      if (mounted) {
        setState(() {
          current.hydrate(result);
          detail!['draft'] = result;
          success = 'admin.lessons.editor.saved_success';
        });
      }
    } on DioException catch (failure) {
      if (mounted) {
        setState(() {
          if (failure.response?.statusCode == 409) current.conflict = true;
          error = failure.response?.statusCode == 409
              ? 'admin.lessons.editor.conflict_title'
              : 'admin.lessons.editor.save_error';
        });
      }
    } catch (_) {
      if (mounted) setState(() => error = 'admin.lessons.editor.save_error');
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  Future<void> publish() async {
    final current = draft;
    if (current == null ||
        !current.canPublish ||
        saving ||
        uploadingPage != null) {
      return;
    }
    final t = AppLocalizations.of(context);
    String note = '';
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(t.t('admin.lessons.publish.title')),
        content: SizedBox(
          width: 480,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'R${current.revision} · V${detail!['currentVersion']} → V${(detail!['currentVersion'] as num) + 1}',
                ),
                const SizedBox(height: 12),
                Text(t.t('admin.lessons.publish.description')),
                const SizedBox(height: 16),
                TextField(
                  minLines: 3,
                  maxLines: null,
                  decoration: InputDecoration(
                    labelText: t.t('admin.lessons.publish.change_note_label'),
                    hintText: t.t(
                      'admin.lessons.publish.change_note_placeholder',
                    ),
                    helperText: t.t('admin.lessons.publish.change_note_help'),
                    helperMaxLines: 5,
                  ),
                  onChanged: (value) => note = value,
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(t.t('admin.lessons.publish.cancel')),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(t.t('admin.lessons.publish.confirm')),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted || !current.canPublish) return;
    setState(() {
      saving = true;
      error = null;
    });
    try {
      await api.post('$root/publish', {
        'expectedRevision': current.revision,
        'changeNote': note.trim().isEmpty ? null : note.trim(),
      });
      if (!mounted) return;
      setState(() {
        draft = null;
        success = 'admin.lessons.publish.success';
      });
      await load();
    } on DioException catch (failure) {
      if (mounted) {
        setState(() {
          if (failure.response?.statusCode == 409) current.conflict = true;
          error = failure.response?.statusCode == 409
              ? 'admin.lessons.publish.conflict_error'
              : 'admin.lessons.publish.generic_error';
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => error = 'admin.lessons.publish.generic_error');
      }
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  Future<void> upload(AdminRecord page) async {
    if (saving || uploadingPage != null || draft == null || draft!.conflict) {
      return;
    }
    setState(() {
      uploadingPage = (page['pageNumber'] as num).toInt();
      error = null;
    });
    try {
      final file = await AdminFileUpload.select();
      if (file == null) return;
      final asset = await AdminFileUpload.lessonImage(
        widget.lessonCode,
        file,
        filename: '${draft!.lesson['lessonCode']}-page-${page['pageNumber']}',
      );
      if (mounted) {
        setState(() {
          assets = [asset, ...assets.where((a) => a['id'] != asset['id'])];
          page['imageAssetId'] = asset['id'];
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => error = 'admin.lessons.editor.image_upload_error');
      }
    } finally {
      if (mounted) setState(() => uploadingPage = null);
    }
  }

  Future<void> purge(int assetId) async {
    if (saving || uploadingPage != null || draft == null || draft!.conflict) {
      return;
    }
    if (!await adminConfirm(
          context,
          'admin.lessons.editor.confirm_delete_image',
        ) ||
        !mounted) {
      return;
    }
    setState(() {
      saving = true;
      error = null;
    });
    try {
      final result = await api.delete('/admin/lessons/media/$assetId');
      if (mounted) {
        setState(() {
          assets.removeWhere((a) => a['id'] == assetId);
          draft!.imagePurged(
            assetId,
            updatedRevision: result is Map
                ? (result['revision'] as num?)?.toInt()
                : null,
          );
          if (result is Map) detail!['draft'] = result;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => error = 'admin.lessons.editor.image_delete_error');
      }
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  Future<void> preview(AdminRecord document) => showDialog<void>(
    context: context,
    builder: (context) => _LessonPreview(
      document: AdminLessonDraft.clone(document),
      assets: assets,
      language: contentLanguage ?? 'en',
    ),
  );
  Future<void> _leave(String path) async {
    if (draft?.dirty == true &&
        !await adminConfirm(
          context,
          'admin.lessons.editor.unsaved_navigation_warning',
        )) {
      return;
    }
    if (mounted) {
      setState(() => _allowExit = true);
      Navigator.pushNamed(context, path);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final data = detail;
    final current = draft;
    final language =
        contentLanguage ?? context.watch<LanguageProvider>().currentLanguage;
    return PopScope(
      canPop: _allowExit || current?.dirty != true,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        if (await adminConfirm(
              context,
              'admin.lessons.editor.unsaved_changes',
            ) &&
            context.mounted) {
          setState(() => _allowExit = true);
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) Navigator.pop(context);
          });
        }
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AdminHeader(
            title: data == null
                ? t.t('admin.lessons.title')
                : adminLocalized(context, data, 'title'),
            description: data?['lessonCode']?.toString(),
            icon: Icons.edit_note,
            actions: [
              OutlinedButton(
                onPressed: saving ? null : () => _leave('/admin/lessons'),
                child: Text(t.t('admin.lessons.editor.back_to_lessons')),
              ),
              if (data != null)
                OutlinedButton(
                  onPressed: () => preview(
                    current?.document ??
                        AdminApi.record(data['publishedDocument']),
                  ),
                  child: Text(t.t('admin.lessons.preview.open')),
                ),
            ],
          ),
          const SizedBox(height: 20),
          messages(),
          if (data != null) ...[
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final code in AdminLessonDraft.languages)
                  ChoiceChip(
                    label: Text(t.t('admin.lessons.editor.language_$code')),
                    selected: language == code,
                    onSelected: (_) => setState(() => contentLanguage = code),
                  ),
              ],
            ),
            const SizedBox(height: 20),
            if (current == null) ...[
              RijviaPageSection(
                title: t.t('admin.lessons.editor.draft_status'),
                description: t.t('admin.lessons.editor.no_draft'),
                child: FilledButton.icon(
                  onPressed: saving ? null : startDraft,
                  icon: const Icon(Icons.edit_outlined),
                  label: Text(t.t('admin.lessons.editor.start_editing')),
                ),
              ),
              const SizedBox(height: 20),
              _PublishedLesson(
                document: AdminApi.record(data['publishedDocument']),
                assets: assets,
                language: language,
              ),
            ] else ...[
              RijviaPageSection(
                title: t.t('admin.lessons.editor.draft_editor_title'),
                description: t.t(
                  'admin.lessons.editor.draft_editor_description',
                ),
                actions: [
                  Chip(label: Text('R${current.revision}')),
                  Chip(
                    label: Text(
                      t.t(
                        current.dirty
                            ? 'admin.lessons.editor.unsaved_changes'
                            : 'admin.lessons.editor.saved_state',
                      ),
                    ),
                  ),
                  FilledButton.icon(
                    onPressed:
                        !current.dirty ||
                            current.conflict ||
                            saving ||
                            uploadingPage != null
                        ? null
                        : saveDraft,
                    icon: const Icon(Icons.save_outlined),
                    label: Text(
                      t.t(
                        saving
                            ? 'admin.lessons.editor.saving_draft'
                            : 'admin.lessons.editor.save_draft',
                      ),
                    ),
                  ),
                  FilledButton.icon(
                    onPressed:
                        !current.canPublish || saving || uploadingPage != null
                        ? null
                        : publish,
                    icon: const Icon(Icons.send_outlined),
                    label: Text(t.t('admin.lessons.publish.button')),
                  ),
                ],
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(t.t('admin.lessons.editor.locked_fields_notice')),
                    if (current.conflict) ...[
                      const SizedBox(height: 12),
                      Text(
                        t.t('admin.lessons.publish.blocked_conflict'),
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.error,
                        ),
                      ),
                    ],
                    const SizedBox(height: 20),
                    RijviaAdaptiveGrid(
                      equalRowHeights: false,
                      minCellWidth: 220,
                      maxColumns: 3,
                      maxCellWidth: double.infinity,
                      children: [
                        TextFormField(
                          key: ValueKey('icon-${current.revision}'),
                          initialValue:
                              current.lesson['icon']?.toString() ?? '',
                          enabled: !saving && !current.conflict,
                          maxLength: 10,
                          decoration: InputDecoration(
                            labelText: t.t('admin.lessons.editor.field_icon'),
                          ),
                          onChanged: (value) => setState(
                            () => current.lesson['icon'] = value.isEmpty
                                ? null
                                : value,
                          ),
                        ),
                        for (final field in [
                          ('displayOrder', 'field_display_order'),
                          ('estimatedMinutes', 'field_estimated_minutes'),
                        ])
                          TextFormField(
                            key: ValueKey('${field.$1}-${current.revision}'),
                            initialValue: current.lesson[field.$1].toString(),
                            enabled: !saving && !current.conflict,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                              labelText: t.t(
                                'admin.lessons.editor.${field.$2}',
                              ),
                            ),
                            onChanged: (value) => setState(
                              () => current.lesson[field.$1] = int.tryParse(
                                value,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _editText(
                      current.lesson['title'] as AdminRecord,
                      language,
                      'admin.lessons.editor.field_title',
                      current,
                      lines: 1,
                    ),
                    const SizedBox(height: 16),
                    _editText(
                      current.lesson['description'] as AdminRecord,
                      language,
                      'admin.lessons.editor.field_description',
                      current,
                    ),
                    for (final page in current.pages) ...[
                      const SizedBox(height: 20),
                      RijviaPageSection(
                        title:
                            '${t.t('admin.lessons.editor.page_label')} ${page['pageNumber']}',
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            _editText(
                              page['title'] as AdminRecord,
                              language,
                              'admin.lessons.editor.page_title',
                              current,
                              identity: page['pageNumber'].toString(),
                              lines: 1,
                            ),
                            const SizedBox(height: 16),
                            if (adminLessonImage(assets, page['imageAssetId'])
                                case final url?)
                              RijviaEducationalImage(
                                url: url,
                                radius: 16,
                                label:
                                    (page['title'] as Map)[language]
                                        ?.toString() ??
                                    '',
                                maxHeight: 280,
                              )
                            else
                              RijviaPageSection(
                                child: Text(
                                  t.t('admin.lessons.editor.no_page_image'),
                                ),
                              ),
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                OutlinedButton.icon(
                                  onPressed:
                                      saving ||
                                          uploadingPage != null ||
                                          current.conflict
                                      ? null
                                      : () => upload(page),
                                  icon: const Icon(Icons.upload_file),
                                  label: Text(
                                    t.t(
                                      uploadingPage == page['pageNumber']
                                          ? 'admin.lessons.editor.uploading_image'
                                          : 'admin.lessons.editor.upload_image',
                                    ),
                                  ),
                                ),
                                if (page['imageAssetId'] is num)
                                  OutlinedButton.icon(
                                    onPressed:
                                        saving ||
                                            uploadingPage != null ||
                                            current.conflict
                                        ? null
                                        : () => purge(
                                            (page['imageAssetId'] as num)
                                                .toInt(),
                                          ),
                                    icon: const Icon(
                                      Icons.delete_forever_outlined,
                                    ),
                                    label: Text(
                                      t.t(
                                        'admin.lessons.editor.delete_image_permanently',
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            _editText(
                              page['content'] as AdminRecord,
                              language,
                              'admin.lessons.editor.page_content',
                              current,
                              identity: page['pageNumber'].toString(),
                              lines: 7,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
            const SizedBox(height: 20),
            RijviaPageSection(
              title: t.t('admin.lessons.editor.status_title'),
              description: t.t('admin.lessons.editor.status_description'),
              child: Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  Chip(label: Text(data['lessonCode'].toString())),
                  Chip(
                    label: Text(
                      t.t(
                        data['active'] == true
                            ? 'admin.lessons.status_published'
                            : 'admin.lessons.status_unpublished',
                      ),
                    ),
                  ),
                  Chip(label: Text('V${data['currentVersion']}')),
                  if (current != null)
                    Chip(label: Text('R${current.revision}')),
                ],
              ),
            ),
            const SizedBox(height: 20),
            RijviaPageSection(
              title: t.t('admin.lessons.history.title'),
              description: t.t('admin.lessons.history.description'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (versions.isEmpty)
                    Text(t.t('admin.lessons.history.empty')),
                  for (final version in versions)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: RijviaPageSection(
                        title: 'V${version['versionNumber']}',
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(version['source'].toString()),
                            Text(
                              adminDate(
                                version['publishedAt'],
                                context
                                    .watch<LanguageProvider>()
                                    .currentLanguage,
                                includeTime: true,
                              ),
                            ),
                            Text(
                              version['publishedByUserId'] == null
                                  ? t.t(
                                      'admin.lessons.history.system_publisher',
                                    )
                                  : '${t.t('admin.lessons.history.publisher')} #${version['publishedByUserId']}',
                            ),
                            const SizedBox(height: 8),
                            Text(
                              version['changeNote']
                                          ?.toString()
                                          .trim()
                                          .isNotEmpty ==
                                      true
                                  ? version['changeNote'].toString()
                                  : t.t('admin.lessons.history.no_change_note'),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            RijviaPageSection(
              title: t.t('admin.lessons.editor.scope_title'),
              child: Text(t.t('admin.lessons.editor.locked_fields_notice')),
            ),
          ],
        ],
      ),
    );
  }

  Widget _editText(
    AdminRecord values,
    String language,
    String label,
    AdminLessonDraft current, {
    int lines = 3,
    String identity = 'lesson',
  }) => Directionality(
    textDirection: language == 'ar' ? TextDirection.rtl : TextDirection.ltr,
    child: TextFormField(
      key: ValueKey('$identity-$label-$language-${current.revision}'),
      initialValue: values[language]?.toString() ?? '',
      enabled: !saving && !current.conflict,
      minLines: lines,
      maxLines: null,
      decoration: InputDecoration(
        labelText: AppLocalizations.of(context).t(label),
      ),
      onChanged: (value) => setState(
        () => values[language] =
            value.isEmpty &&
                label != 'admin.lessons.editor.field_title' &&
                label != 'admin.lessons.editor.page_title'
            ? null
            : value,
      ),
    ),
  );
}

class _PublishedLesson extends StatelessWidget {
  const _PublishedLesson({
    required this.document,
    required this.assets,
    required this.language,
  });
  final AdminRecord document;
  final List<AdminRecord> assets;
  final String language;
  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final lesson = AdminApi.record(document['lesson']);
    final pages = AdminApi.records(document['pages'])
      ..sort(
        (a, b) => (a['pageNumber'] as num).compareTo(b['pageNumber'] as num),
      );
    return Directionality(
      textDirection: language == 'ar' ? TextDirection.rtl : TextDirection.ltr,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          RijviaPageHero(
            title: (lesson['title'] as Map)[language]?.toString() ?? '',
            description:
                (lesson['description'] as Map)[language]?.toString() ?? '',
          ),
          for (final page in pages) ...[
            const SizedBox(height: 20),
            RijviaPageSection(
              title:
                  '${t.t('admin.lessons.editor.page_label')} ${page['pageNumber']} · ${(page['title'] as Map)[language] ?? ''}',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (adminLessonImage(assets, page['imageAssetId'])
                      case final url?) ...[
                    RijviaEducationalImage(
                      url: url,
                      radius: 16,
                      label: (page['title'] as Map)[language]?.toString() ?? '',
                      maxHeight: 360,
                    ),
                    const SizedBox(height: 16),
                  ],
                  for (final paragraph
                      in ((page['content'] as Map)[language]?.toString() ?? '')
                          .split(RegExp(r'\n+'))
                          .where((p) => p.trim().isNotEmpty))
                    Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: Text(
                        paragraph.trim(),
                        style: const TextStyle(height: 2),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _LessonPreview extends StatefulWidget {
  const _LessonPreview({
    required this.document,
    required this.assets,
    required this.language,
  });
  final AdminRecord document;
  final List<AdminRecord> assets;
  final String language;
  @override
  State<_LessonPreview> createState() => _LessonPreviewState();
}

class _LessonPreviewState extends State<_LessonPreview> {
  late String language = widget.language;
  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Dialog(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 1152),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      t.t('admin.lessons.preview.title'),
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  IconButton(
                    tooltip: t.t('common.close'),
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              Text(t.t('admin.lessons.preview.description')),
              const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final code in AdminLessonDraft.languages)
                    ChoiceChip(
                      label: Text(t.t('admin.lessons.editor.language_$code')),
                      selected: language == code,
                      onSelected: (_) => setState(() => language = code),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  Chip(label: Text(t.t('admin.lessons.preview.draft_badge'))),
                  Chip(
                    label: Text(
                      '${(widget.document['pages'] as List).length} ${t.t('admin.lessons.pages')}',
                    ),
                  ),
                  Chip(
                    label: Text(
                      '${widget.document['lesson']['estimatedMinutes']} ${t.t('admin.lessons.minutes')}',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              _PublishedLesson(
                document: widget.document,
                assets: widget.assets,
                language: language,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
