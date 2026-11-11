import 'dart:async';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:unorm_dart/unorm_dart.dart' as unorm;
import '../../core/localization/app_localizations.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import '../../design_system/widgets/rijvia_educational_image.dart';
import 'admin_components.dart';
import 'admin_file_upload.dart';
import 'editorial_draft.dart';
import 'marketing_presentation.dart';

/// Form controls use the same CMS labels and keep drafts across locale changes.
class EditorialField extends StatelessWidget {
  const EditorialField({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.lines = 1,
    this.maxLength,
    this.readOnly = false,
    this.controller,
  });
  final String label, value;
  final ValueChanged<String> onChanged;
  final int lines;
  final int? maxLength;
  final bool readOnly;
  final TextEditingController? controller;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 16),
    child: TextFormField(
      controller: controller,
      initialValue: controller == null ? value : null,
      readOnly: readOnly,
      minLines: lines,
      maxLines: lines == 1 ? 1 : lines + 6,
      maxLength: maxLength,
      decoration: InputDecoration(labelText: label, alignLabelWithHint: true),
      onChanged: onChanged,
    ),
  );
}

class EditorialSelect extends StatelessWidget {
  const EditorialSelect({
    super.key,
    required this.label,
    required this.value,
    required this.options,
    required this.onChanged,
    this.disabled = false,
  });
  final String label, value;
  final Map<String, String> options;
  final ValueChanged<String> onChanged;
  final bool disabled;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 16),
    child: DropdownButtonFormField<String>(
      key: ValueKey('$label:$value:${options.keys.join(',')}'),
      initialValue: options.containsKey(value) ? value : null,
      isExpanded: true,
      decoration: InputDecoration(labelText: label),
      items: [
        for (final e in options.entries)
          DropdownMenuItem(value: e.key, child: Text(e.value)),
      ],
      onChanged: disabled
          ? null
          : (v) {
              if (v != null) onChanged(v);
            },
    ),
  );
}

String editorialFileName(String value, int articleId) {
  final result = unorm
      .nfkd(value.replaceFirst(RegExp(r'\.[^.]+$'), '').toLowerCase())
      .replaceAll(RegExp('[^a-z0-9]+'), '-')
      .replaceAll(RegExp(r'^-+|-+$'), '')
      .replaceAll(RegExp('-+'), '-');
  return result.isEmpty
      ? 'article-$articleId'
      : result.substring(0, result.length.clamp(0, 128));
}

class EditorialImagePanel extends StatefulWidget {
  const EditorialImagePanel({
    super.key,
    required this.articleId,
    required this.topic,
    required this.suggestedFileName,
    required this.onChanged,
    required this.disabled,
  });
  final int articleId;
  final AdminRecord topic;
  final String suggestedFileName;
  final Future<void> Function() onChanged;
  final bool disabled;
  @override
  State<EditorialImagePanel> createState() => _EditorialImagePanelState();
}

class _EditorialImagePanelState extends State<EditorialImagePanel> {
  final api = AdminApi();
  final alt = <String, String>{}, previousKeywords = <String, String>{};
  AdminSelectedFile? file;
  bool busy = false;
  String? error;
  @override
  void initState() {
    super.initState();
    _keywords(initial: true);
  }

  @override
  void didUpdateWidget(EditorialImagePanel old) {
    super.didUpdateWidget(old);
    _keywords();
  }

  void _keywords({bool initial = false}) {
    final image = widget.topic['image'] as Map?;
    for (final language in EditorialDraft.languages) {
      final keyword =
          AdminApi.records(widget.topic['currentVersions'])
              .where((v) => v['language'] == language)
              .firstOrNull?['focusKeyword']
              ?.toString()
              .trim() ??
          '';
      final existing =
          AdminApi.records(image?['localizations'] ?? [])
              .where((v) => v['language'] == language)
              .firstOrNull?['altText']
              ?.toString() ??
          '';
      if (initial) {
        alt[language] = existing.isNotEmpty ? existing : keyword;
      } else if (alt[language]?.trim().isEmpty != false ||
          alt[language] == previousKeywords[language]) {
        alt[language] = keyword;
      }
      previousKeywords[language] = keyword;
    }
  }

  List<String> get missing => EditorialDraft.languages
      .where((l) => alt[l]?.trim().isNotEmpty != true)
      .toList();
  Future<void> select() async {
    if (busy || widget.disabled) return;
    try {
      final next = await AdminFileUpload.select(allowWebp: false);
      if (!mounted || next == null) return;
      setState(() {
        file = next;
        error = null;
      });
      if (missing.isEmpty) await upload();
    } on AdminFileSelectionException catch (e) {
      if (mounted) {
        setState(
          () => error = e.messageKey.contains('too_large')
              ? 'admin.marketing.editorial_image_too_large'
              : 'admin.marketing.editorial_image_invalid_type',
        );
      }
    } catch (_) {
      if (mounted) setState(() => error = 'admin.marketing.action_failed');
    }
  }

  Future<void> upload() async {
    if (busy || widget.disabled || file == null || missing.isNotEmpty) return;
    setState(() {
      busy = true;
      error = null;
    });
    final chosen = file!;
    try {
      final metadata = {
        'storedFileName': editorialFileName(
          widget.suggestedFileName.isNotEmpty
              ? widget.suggestedFileName
              : chosen.name,
          widget.articleId,
        ),
        for (final l in EditorialDraft.languages)
          'altText${l[0]}${l.substring(1).toLowerCase()}': alt[l]!.trim(),
      };
      final form = FormData.fromMap({
        'file': MultipartFile.fromBytes(
          chosen.bytes,
          filename: chosen.name,
          contentType: DioMediaType.parse(chosen.mimeType),
        ),
        'metadata': MultipartFile.fromString(
          jsonEncode(metadata),
          contentType: DioMediaType('application', 'json'),
        ),
      });
      await api.post(
        '/admin/marketing/editorial/editor/articles/${widget.articleId}/image',
        form,
      );
      if (!mounted) return;
      setState(() => file = null);
      await widget.onChanged();
    } catch (_) {
      if (mounted) setState(() => error = 'admin.marketing.action_failed');
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> remove() async {
    if (busy ||
        widget.disabled ||
        !await adminConfirm(
          context,
          'admin.marketing.editorial_image_remove_confirm',
        )) {
      return;
    }
    if (!mounted) return;
    setState(() => busy = true);
    try {
      await api.delete(
        '/admin/marketing/editorial/editor/articles/${widget.articleId}/image',
      );
      await widget.onChanged();
    } catch (_) {
      if (mounted) setState(() => error = 'admin.marketing.action_failed');
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final image = widget.topic['image'] as Map?;
    final hero = AdminApi.records(
      image?['variants'] ?? [],
    ).where((v) => v['type'] == 'HERO').firstOrNull;
    return RijviaPageSection(
      title: t.t('editorial.cms.imageTitle'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(t.t('editorial.cms.imageDescription')),
          const SizedBox(height: 16),
          if (busy) const LinearProgressIndicator(),
          if (error != null)
            Text(
              t.t(error!),
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          if (file != null)
            Image.memory(
              file!.bytes,
              fit: BoxFit.contain,
              height: 220,
              semanticLabel: t.t('admin.marketing.editorial_image_preview'),
            )
          else if (hero != null)
            RijviaEducationalImage(
              url: hero['publicPath'],
              radius: 12,
              maxHeight: 220,
              label: alt['AR'] ?? alt['EN'] ?? '',
            )
          else
            Text(t.t('editorial.cms.imageEmpty')),
          if (image != null) ...[
            Text(image['storedFileName']?.toString() ?? '—'),
            Text(
              '${image['originalWidth'] ?? '—'} × ${image['originalHeight'] ?? '—'}',
            ),
            MarketingStatus(image['status']),
          ],
          const SizedBox(height: 16),
          Text(t.t('editorial.cms.altDescription')),
          const SizedBox(height: 16),
          RijviaAdaptiveGrid(
            minCellWidth: 250,
            equalRowHeights: false,
            children: [
              for (final l in EditorialDraft.languages)
                EditorialField(
                  key: ValueKey('$l:${previousKeywords[l]}:${image?['id']}'),
                  label: '${t.t('admin.marketing.editorial_image_alt')} · $l',
                  value: alt[l] ?? '',
                  readOnly: busy || widget.disabled,
                  onChanged: (v) => setState(() => alt[l] = v),
                ),
            ],
          ),
          if (file != null && missing.isNotEmpty)
            Text(
              t.t('editorial.cms.imageMissingAlt', {
                'languages': missing.join(', '),
              }),
            ),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              OutlinedButton.icon(
                onPressed: busy || widget.disabled ? null : select,
                icon: const Icon(Icons.upload_file),
                label: Text(
                  t.t(
                    image == null
                        ? 'editorial.cms.imageFile'
                        : 'editorial.cms.imageReplace',
                  ),
                ),
              ),
              if (file != null) ...[
                FilledButton(
                  onPressed: busy || widget.disabled || missing.isNotEmpty
                      ? null
                      : upload,
                  child: Text(t.t('editorial.cms.imageUpload')),
                ),
                TextButton(
                  onPressed: busy ? null : () => setState(() => file = null),
                  child: Text(t.t('editorial.cms.imageClearSelection')),
                ),
              ],
              if (image != null)
                TextButton.icon(
                  onPressed: busy || widget.disabled ? null : remove,
                  icon: const Icon(Icons.delete_outline),
                  label: Text(t.t('admin.marketing.editorial_image_remove')),
                ),
            ],
          ),
          Text(t.t('editorial.cms.imageFileHint')),
        ],
      ),
    );
  }
}
