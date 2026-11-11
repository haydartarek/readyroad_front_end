import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/providers/language_provider.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import 'admin_components.dart';
import 'admin_file_upload.dart';

class AdminDataImportScreen extends StatefulWidget {
  const AdminDataImportScreen({super.key, this.filePicker});
  final Future<AdminSelectedFile?> Function()? filePicker;
  @override
  State<AdminDataImportScreen> createState() => _AdminDataImportScreenState();
}

class _AdminDataImportScreenState
    extends AdminPageState<AdminDataImportScreen> {
  String type = 'categories';
  AdminSelectedFile? file;
  AdminRecord? report;
  List<AdminRecord> history = [];
  bool previewing = false;
  int fileRevision = 0;
  int? previewRevision;
  int? expandedId;
  bool get canExecute =>
      !saving &&
      file != null &&
      previewRevision == fileRevision &&
      report?['mode'] == 'PREVIEW' &&
      (report?['errors'] is List && (report!['errors'] as List).isEmpty);
  @override
  Future<void> load() => fetch((request) async {
    final result = AdminApi.records(await api.get('/admin/import/history'));
    if (mounted && request == revision) setState(() => history = result);
  });
  Future<void> selectFile() async {
    if (saving) return;
    try {
      final selected =
          await (widget.filePicker?.call() ??
              AdminFileUpload.select(json: true, maxBytes: 10 * 1024 * 1024));
      if (selected == null || !mounted) return;
      try {
        jsonDecode(utf8.decode(selected.bytes));
      } catch (_) {
        throw const AdminFileSelectionException(
          'admin.import.validation.invalid_json',
        );
      }
      setState(() {
        file = selected;
        fileRevision++;
        previewRevision = null;
        report = null;
        error = null;
      });
    } on AdminFileSelectionException catch (failure) {
      if (mounted) {
        setState(() {
          file = null;
          fileRevision++;
          report = null;
          previewRevision = null;
          error = failure.messageKey;
        });
      }
    } catch (_) {
      if (mounted) setState(() => error = 'admin.import.request_failed');
    }
  }

  Future<void> submit({required bool preview}) async {
    if (file == null || saving || (!preview && !canExecute)) return;
    final selectedFile = file!;
    final selectedType = type;
    final selectedRevision = fileRevision;
    setState(() {
      saving = true;
      previewing = preview;
      error = null;
      report = null;
      previewRevision = null;
    });
    try {
      final form = FormData.fromMap({
        'file': MultipartFile.fromBytes(
          selectedFile.bytes,
          filename: selectedFile.name,
          contentType: DioMediaType.parse('application/json'),
        ),
      });
      final response = await api.client.post(
        '/api/admin/import/$selectedType/${preview ? 'preview' : 'execute'}',
        data: form,
        options: Options(contentType: 'multipart/form-data'),
      );
      final result = AdminApi.record(response.data);
      if (!mounted || selectedRevision != fileRevision) return;
      setState(() {
        report = result;
        previewRevision =
            preview &&
                result['mode'] == 'PREVIEW' &&
                result['errors'] is List &&
                (result['errors'] as List).isEmpty
            ? selectedRevision
            : null;
      });
      await load();
    } catch (_) {
      if (mounted) setState(() => error = 'admin.import.request_failed');
    } finally {
      if (mounted) {
        setState(() {
          saving = false;
          previewing = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final language = context.watch<LanguageProvider>().currentLanguage;
    final currentReport = report;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AdminHeader(
          title: t.t('admin.import.title'),
          description: t.t('admin.import.description'),
          icon: Icons.drive_folder_upload_outlined,
          actions: [
            OutlinedButton.icon(
              onPressed: loading ? null : load,
              icon: const Icon(Icons.refresh),
              label: Text(t.t('common.retry')),
            ),
          ],
        ),
        const SizedBox(height: 20),
        messages(),
        RijviaPageSection(
          title: t.t('admin.import.select_type'),
          child: Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              for (final item in [
                ('categories', 'type_categories', Icons.list_alt),
                ('quiz_questions', 'type_quiz', Icons.quiz_outlined),
              ])
                ChoiceChip(
                  avatar: Icon(item.$3),
                  label: Text(t.t('admin.import.${item.$2}')),
                  selected: type == item.$1,
                  onSelected: saving
                      ? null
                      : (_) => setState(() {
                          type = item.$1;
                          fileRevision++;
                          previewRevision = null;
                          report = null;
                        }),
                ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        RijviaPageSection(
          title: t.t('admin.import.upload_title'),
          description: 'JSON · ${t.t('admin.import.upload_max_size')}',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              OutlinedButton.icon(
                onPressed: saving ? null : selectFile,
                icon: const Icon(Icons.upload_file),
                label: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  child: Text(t.t('admin.import.upload_browse')),
                ),
              ),
              if (file != null)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(file!.name),
                  subtitle: Text(
                    '${(file!.bytes.length / 1024).toStringAsFixed(1)} KB',
                  ),
                  trailing: IconButton(
                    tooltip: t.t('common.close'),
                    onPressed: saving
                        ? null
                        : () => setState(() {
                            file = null;
                            fileRevision++;
                            previewRevision = null;
                            report = null;
                          }),
                    icon: const Icon(Icons.close),
                  ),
                ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  OutlinedButton.icon(
                    onPressed: file == null || saving
                        ? null
                        : () => submit(preview: true),
                    icon: const Icon(Icons.visibility_outlined),
                    label: Text(
                      t.t(
                        saving && previewing
                            ? 'admin.import.previewing'
                            : 'admin.import.preview',
                      ),
                    ),
                  ),
                  FilledButton.icon(
                    onPressed: canExecute ? () => submit(preview: false) : null,
                    icon: const Icon(Icons.play_arrow),
                    label: Text(
                      t.t(
                        saving && !previewing
                            ? 'admin.import.executing'
                            : 'admin.import.execute',
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        if (currentReport != null) ...[
          const SizedBox(height: 20),
          RijviaPageSection(
            title: t.t('admin.import.results_title'),
            description:
                '${t.t('admin.import.records_total')}: ${currentReport['recordsTotal']}',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (currentReport['mode'] == 'PREVIEW') ...[
                  Text(t.t('admin.import.dry_run_note')),
                  const SizedBox(height: 12),
                ],
                RijviaAdaptiveGrid(
                  minCellWidth: 150,
                  maxColumns: 3,
                  maxCellWidth: double.infinity,
                  children: [
                    for (final metric in ['created', 'updated', 'skipped'])
                      AdminValue(
                        label: t.t('admin.import.$metric'),
                        value: currentReport[metric],
                      ),
                  ],
                ),
                for (final field in ['warnings', 'errors'])
                  if (currentReport[field] is List &&
                      (currentReport[field] as List).isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Text(
                      '${t.t('admin.import.$field')} (${(currentReport[field] as List).length})',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: field == 'errors'
                            ? Theme.of(context).colorScheme.error
                            : Colors.orange,
                      ),
                    ),
                    for (final message in currentReport[field] as List)
                      Text('• $message'),
                  ],
                if (currentReport['mode'] != 'PREVIEW' &&
                    currentReport['errors'] is List &&
                    (currentReport['errors'] as List).isEmpty) ...[
                  const SizedBox(height: 16),
                  Text(
                    t.t('admin.import.success'),
                    style: const TextStyle(color: Colors.green),
                  ),
                ],
              ],
            ),
          ),
        ],
        const SizedBox(height: 20),
        RijviaPageSection(
          title: t.t('admin.import.history_title'),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (!loading && error == null && history.isEmpty)
                Text(t.t('admin.import.history_empty')),
              if (history.isNotEmpty)
                AdminTable(
                  columns: [
                    for (final column in [
                      'history_date',
                      'history_user',
                      'history_type',
                      'history_file',
                      'history_mode',
                      'history_records',
                      'history_status',
                    ])
                      t.t('admin.import.$column'),
                  ],
                  rows: [
                    for (final row in history)
                      [
                        Text(
                          adminDate(
                            row['performedAt'],
                            language,
                            includeTime: true,
                          ),
                        ),
                        Text(row['performedBy']?.toString() ?? '—'),
                        Text(
                          t.t(
                            row['importType'] == 'categories'
                                ? 'admin.import.type_categories'
                                : 'admin.import.type_quiz',
                          ),
                        ),
                        SizedBox(
                          width: 220,
                          child: Text(row['fileName']?.toString() ?? '—'),
                        ),
                        Text(
                          t.t(
                            row['dryRun'] == true
                                ? 'admin.import.history_preview'
                                : 'admin.import.history_import',
                          ),
                        ),
                        Text(
                          '${row['createdCount']} / ${row['updatedCount']} / ${row['skippedCount']}',
                        ),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              t.t(
                                row['status'] == 'SUCCESS'
                                    ? 'admin.import.history_success'
                                    : 'admin.import.history_failed',
                              ),
                            ),
                            IconButton(
                              tooltip: t.t('admin.import.results_title'),
                              onPressed: () => setState(
                                () => expandedId = expandedId == row['id']
                                    ? null
                                    : (row['id'] as num).toInt(),
                              ),
                              icon: Icon(
                                expandedId == row['id']
                                    ? Icons.expand_less
                                    : Icons.expand_more,
                              ),
                            ),
                          ],
                        ),
                      ],
                  ],
                ),
              for (final row in history.where((row) => row['id'] == expandedId))
                RijviaPageSection(
                  title:
                      '${row['fileName']} · ${adminDate(row['performedAt'], language)}',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      RijviaAdaptiveGrid(
                        minCellWidth: 160,
                        maxColumns: 3,
                        maxCellWidth: double.infinity,
                        children: [
                          for (final metric in [
                            ('createdCount', 'created'),
                            ('updatedCount', 'updated'),
                            ('skippedCount', 'skipped'),
                          ])
                            AdminValue(
                              label: t.t('admin.import.${metric.$2}'),
                              value: row[metric.$1],
                            ),
                        ],
                      ),
                      if (row['warningSummary']?.toString().isNotEmpty == true)
                        Text(
                          '${t.t('admin.import.warnings')}: ${row['warningSummary']}',
                        ),
                      if (row['errorSummary']?.toString().isNotEmpty == true)
                        Text(
                          '${t.t('admin.import.errors')}: ${row['errorSummary']}',
                        ),
                      if (row['warningSummary'] == null &&
                          row['errorSummary'] == null)
                        Text(t.t('admin.import.history_no_issues')),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}
