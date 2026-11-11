import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../../core/localization/app_localizations.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_educational_image.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import 'admin_components.dart';
import 'admin_file_upload.dart';
import 'admin_quiz_draft.dart';

class AdminQuizEditor extends StatefulWidget {
  const AdminQuizEditor({
    super.key,
    this.questionId,
    this.returnTo = '/admin/quizzes',
  });
  final int? questionId;
  final String returnTo;
  @override
  State<AdminQuizEditor> createState() => _AdminQuizEditorState();
}

class _AdminQuizEditorState extends AdminPageState<AdminQuizEditor> {
  AdminQuizDraft? draft;
  List<AdminRecord> categories = [];
  Map<String, String> errors = {};
  bool uploading = false;
  String filename = '';
  String? serverMessage;
  bool get editing => widget.questionId != null;
  String get returnTo {
    final uri = Uri.tryParse(widget.returnTo);
    return uri != null &&
            !uri.hasScheme &&
            !uri.hasAuthority &&
            uri.path == '/admin/quizzes'
        ? uri.toString()
        : '/admin/quizzes';
  }

  @override
  Future<void> load() => fetch((request) async {
    final results = await Future.wait([
      api.get('/admin/quiz/categories'),
      if (editing) api.get('/admin/quiz/questions/${widget.questionId}'),
    ]);
    final groups = AdminApi.records(results[0]);
    final form = editing
        ? AdminQuizDraft.fromJson(AdminApi.record(results[1]))
        : AdminQuizDraft.newQuestion();
    if (mounted && request == revision) {
      setState(() {
        categories = groups;
        draft ??= form;
      });
    }
  });
  Future<void> save() async {
    if (draft == null || saving || uploading) return;
    final validation = draft!.validate(
      categories.map((c) => c['code'].toString()).toSet(),
    );
    setState(() {
      errors = validation;
      serverMessage = null;
      error = null;
    });
    if (validation.isNotEmpty) return;
    setState(() => saving = true);
    try {
      final payload = draft!.payload(editing: editing);
      if (editing) {
        await api.put('/admin/quiz/questions/${widget.questionId}', payload);
      } else {
        await api.post('/admin/quiz/questions', payload);
      }
      if (mounted) Navigator.pushReplacementNamed(context, returnTo);
    } on DioException catch (failure) {
      if (!mounted) return;
      final body = failure.response?.data;
      final message = body is Map ? body['message'] ?? body['error'] : null;
      setState(() {
        error = failure.response?.statusCode == 409
            ? 'admin.quizzes.form.edit_conflict'
            : editing
            ? 'admin.quizzes.form.update_error'
            : 'admin.quizzes.form.error_generic';
        serverMessage = message is String ? message : null;
        if (body is Map && body['fields'] is Map) {
          for (final entry in (body['fields'] as Map).entries) {
            final match = RegExp(
              r'^options\[(\d+)\]',
            ).firstMatch(entry.key.toString());
            errors[match == null
                ? entry.key.toString()
                : 'option_${match[1]}'] = entry.value
                .toString();
          }
        }
      });
    } catch (_) {
      if (mounted) {
        setState(
          () => error = editing
              ? 'admin.quizzes.form.update_error'
              : 'admin.quizzes.form.error_generic',
        );
      }
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  Future<void> upload() async {
    if (uploading || saving) return;
    setState(() {
      uploading = true;
      error = null;
    });
    try {
      final file = await AdminFileUpload.select();
      if (file == null) return;
      final url = await AdminFileUpload.image(file, filename: filename);
      if (mounted) setState(() => draft!.fields['contentImageUrl'] = url);
    } on AdminFileSelectionException catch (failure) {
      if (mounted) setState(() => error = failure.messageKey);
    } catch (_) {
      if (mounted) setState(() => error = 'admin.quizzes.upload.failed');
    } finally {
      if (mounted) setState(() => uploading = false);
    }
  }

  String? _error(String key) {
    final value = errors[key];
    if (value == null) return null;
    return value.startsWith('error_')
        ? AppLocalizations.of(context).t('admin.quizzes.form.$value')
        : value;
  }

  Widget _languageFields(
    String base,
    String label,
    Map<String, dynamic> values, {
    String? optionKey,
  }) => RijviaAdaptiveGrid(
    equalRowHeights: false,
    minCellWidth: 300,
    maxColumns: 2,
    maxCellWidth: double.infinity,
    children: [
      for (final suffix in AdminQuizDraft.suffixes)
        Directionality(
          textDirection: suffix == 'Ar' ? TextDirection.rtl : TextDirection.ltr,
          child: TextFormField(
            key: ValueKey('$base-${identityHashCode(values)}-$suffix'),
            initialValue: values['$base$suffix']?.toString() ?? '',
            enabled: !saving,
            minLines: base == 'text' ? 1 : 3,
            maxLines: null,
            decoration: InputDecoration(
              labelText: AppLocalizations.of(
                context,
              ).t('admin.quizzes.form.${label}_${suffix.toLowerCase()}'),
              errorText: _error(optionKey ?? '$base$suffix'),
              errorMaxLines: 4,
            ),
            onChanged: (value) => values['$base$suffix'] = value,
          ),
        ),
    ],
  );
  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final d = draft;
    final image = d?.fields['contentImageUrl']?.toString() ?? '';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AdminHeader(
          title: t.t(
            editing ? 'admin.quizzes.edit_title' : 'admin.quizzes.add_new',
          ),
          description: t.t('admin.quizzes.form.required_note'),
          icon: Icons.fact_check_outlined,
          actions: [
            OutlinedButton(
              onPressed: saving
                  ? null
                  : () => Navigator.pushNamed(context, returnTo),
              child: Text(t.t('common.cancel')),
            ),
          ],
        ),
        const SizedBox(height: 20),
        messages(),
        if (serverMessage != null)
          Text(
            serverMessage!,
            style: TextStyle(color: Theme.of(context).colorScheme.error),
          ),
        if (error == 'admin.quizzes.form.edit_conflict')
          OutlinedButton.icon(
            onPressed: saving
                ? null
                : () async {
                    if (await adminConfirm(
                          context,
                          'admin.quizzes.form.edit_conflict',
                        ) &&
                        mounted) {
                      setState(() => draft = null);
                      await load();
                    }
                  },
            icon: const Icon(Icons.refresh),
            label: Text(t.t('common.retry')),
          ),
        if (d != null) ...[
          if (d.referenced) ...[
            RijviaPageSection(
              child: Text(t.t('admin.quizzes.edit_referenced_detail')),
            ),
            const SizedBox(height: 20),
          ],
          RijviaPageSection(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                RijviaAdaptiveGrid(
                  equalRowHeights: false,
                  minCellWidth: 240,
                  maxColumns: 2,
                  maxCellWidth: double.infinity,
                  children: [
                    DropdownButtonFormField<String>(
                      initialValue:
                          categories.any(
                            (c) => c['code'] == d.fields['categoryCode'],
                          )
                          ? d.fields['categoryCode'] as String
                          : null,
                      isExpanded: true,
                      decoration: InputDecoration(
                        labelText: t.t('admin.quizzes.form.category'),
                        errorText: _error('categoryCode'),
                      ),
                      items: [
                        for (final category in categories)
                          DropdownMenuItem(
                            value: category['code'].toString(),
                            child: Text(
                              adminLocalized(context, category, 'name'),
                            ),
                          ),
                      ],
                      onChanged: saving
                          ? null
                          : (value) => d.fields['categoryCode'] = value,
                    ),
                    DropdownButtonFormField<String>(
                      initialValue:
                          AdminQuizDraft.difficulties.contains(
                            d.fields['difficultyLevel'],
                          )
                          ? d.fields['difficultyLevel'] as String
                          : null,
                      isExpanded: true,
                      decoration: InputDecoration(
                        labelText: t.t('admin.quizzes.form.difficulty'),
                        errorText: _error('difficultyLevel'),
                      ),
                      items: [
                        for (final value in AdminQuizDraft.difficulties)
                          DropdownMenuItem(
                            value: value,
                            child: Text(
                              t.t('difficulty.${value.toLowerCase()}'),
                            ),
                          ),
                      ],
                      onChanged: saving
                          ? null
                          : (value) => d.fields['difficultyLevel'] = value,
                    ),
                  ],
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(
                    t.t(
                      d.fields['isActive'] == true
                          ? 'admin.quizzes.active'
                          : 'admin.quizzes.inactive',
                    ),
                  ),
                  value: d.fields['isActive'] == true,
                  onChanged: saving
                      ? null
                      : (value) => setState(() => d.fields['isActive'] = value),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          RijviaPageSection(
            title: t.t('admin.quizzes.upload.title'),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (image.isNotEmpty) ...[
                  RijviaEducationalImage(
                    url: image,
                    label: t.t('admin.quizzes.upload.title'),
                    radius: 28,
                    maxHeight: 300,
                  ),
                  TextButton.icon(
                    onPressed: saving || uploading
                        ? null
                        : () =>
                              setState(() => d.fields['contentImageUrl'] = ''),
                    icon: const Icon(Icons.close),
                    label: Text(t.t('admin.quizzes.upload.remove')),
                  ),
                ],
                TextFormField(
                  initialValue: filename,
                  decoration: InputDecoration(
                    labelText: t.t('admin.quizzes.upload.filename'),
                    helperText: t.t('admin.quizzes.upload.filename_hint'),
                    helperMaxLines: 4,
                  ),
                  onChanged: (value) => filename = value,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  key: ValueKey(image),
                  initialValue: image,
                  enabled: !saving && !uploading,
                  decoration: InputDecoration(
                    labelText: t.t('admin.quizzes.form.image_url'),
                    errorText: _error('contentImageUrl'),
                  ),
                  onChanged: (value) => d.fields['contentImageUrl'] = value,
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: saving || uploading ? null : upload,
                  icon: const Icon(Icons.upload_file),
                  label: Text(
                    t.t(
                      uploading
                          ? 'admin.quizzes.upload.uploading'
                          : 'admin.quizzes.upload.action',
                    ),
                  ),
                ),
                Text(t.t('admin.quizzes.upload.hint')),
              ],
            ),
          ),
          const SizedBox(height: 20),
          RijviaPageSection(
            title: t.t('admin.quizzes.form.questions'),
            child: _languageFields('question', 'question', d.fields),
          ),
          const SizedBox(height: 20),
          RijviaPageSection(
            title: t.t('admin.quizzes.form.explanations'),
            child: _languageFields('explanation', 'explanation', d.fields),
          ),
          const SizedBox(height: 20),
          RijviaPageSection(
            title: t.t('admin.quizzes.form.options_title'),
            description: t.t('admin.quizzes.form.rule_note'),
            actions: [
              OutlinedButton.icon(
                onPressed: saving || d.options.length >= 3
                    ? null
                    : () => setState(d.addOption),
                icon: const Icon(Icons.add),
                label: Text(t.t('admin.quizzes.form.add_option')),
              ),
            ],
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_error('options') != null || _error('correct') != null)
                  Text(
                    _error('options') ?? _error('correct')!,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                for (var index = 0; index < d.options.length; index++) ...[
                  if (index > 0) const SizedBox(height: 16),
                  RijviaPageSection(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          crossAxisAlignment: WrapCrossAlignment.center,
                          children: [
                            Chip(label: Text(String.fromCharCode(65 + index))),
                            Text(
                              t.t('admin.quizzes.form.option_number', {
                                'number': String.fromCharCode(65 + index),
                              }),
                            ),
                            FilterChip(
                              label: Text(
                                t.t('admin.quizzes.form.mark_correct'),
                              ),
                              selected: d.options[index]['isCorrect'] == true,
                              onSelected: saving
                                  ? null
                                  : (_) =>
                                        setState(() => d.selectCorrect(index)),
                            ),
                            IconButton(
                              tooltip: t.t('admin.quizzes.form.move_up'),
                              onPressed: saving || index == 0
                                  ? null
                                  : () => setState(() => d.move(index, -1)),
                              icon: const Icon(Icons.arrow_upward),
                            ),
                            IconButton(
                              tooltip: t.t('admin.quizzes.form.move_down'),
                              onPressed: saving || index + 1 == d.options.length
                                  ? null
                                  : () => setState(() => d.move(index, 1)),
                              icon: const Icon(Icons.arrow_downward),
                            ),
                            if (d.options.length > 2)
                              IconButton(
                                tooltip: t.t(
                                  'admin.quizzes.form.remove_option',
                                ),
                                onPressed: saving
                                    ? null
                                    : () =>
                                          setState(() => d.removeOption(index)),
                                icon: const Icon(Icons.delete_outline),
                              ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        _languageFields(
                          'text',
                          'option_text',
                          d.options[index],
                          optionKey: 'option_$index',
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 20),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              OutlinedButton(
                onPressed: saving
                    ? null
                    : () => Navigator.pushNamed(context, returnTo),
                child: Text(t.t('common.cancel')),
              ),
              FilledButton.icon(
                onPressed: saving || uploading ? null : save,
                icon: const Icon(Icons.save_outlined),
                label: Text(
                  t.t(
                    editing
                        ? 'admin.quizzes.form.update'
                        : 'admin.quizzes.form.save',
                  ),
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}
