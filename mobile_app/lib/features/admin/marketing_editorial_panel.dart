import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../../core/localization/app_localizations.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import '../../shared/widgets/rijvia_markdown.dart';
import 'admin_components.dart';
import 'editorial_authoring_panel.dart';
import 'editorial_controls.dart';
import 'editorial_draft.dart';
import 'marketing_presentation.dart';

class MarketingEditorialPanel extends StatefulWidget {
  const MarketingEditorialPanel({
    super.key,
    required this.workspace,
    required this.strategy,
    required this.onRefresh,
  });
  final AdminRecord workspace, strategy;
  final Future<void> Function() onRefresh;
  @override
  State<MarketingEditorialPanel> createState() =>
      _MarketingEditorialPanelState();
}

class _MarketingEditorialPanelState extends State<MarketingEditorialPanel> {
  final api = AdminApi();
  final body = TextEditingController();
  final draft = EditorialDraft();
  int? topicId;
  String language = 'AR', search = '', reason = '';
  bool busy = false, loading = false, preview = false, confirmed = false;
  bool allowExit = false;
  String? error, success;
  int revision = 0, formRevision = 0;
  List<AdminRecord> history = [];
  AdminRecord? performance;
  String? performanceError;
  Timer? translationTimer;
  bool translating = false;
  List<AdminRecord> get topics =>
      AdminApi.records(widget.workspace['topics'] ?? []);
  AdminRecord? get topic =>
      topics.where((t) => t['topicId'] == topicId).firstOrNull;
  bool get locked =>
      busy ||
      loading ||
      EditorialDraft.lockedStates.contains(topic?['lifecycleState']);
  AdminRecord? get summary => AdminApi.records(
    topic?['currentVersions'] ?? [],
  ).where((v) => v['language'] == language).firstOrNull;
  String get dynamicSlug => editorialSlug(
    summary?['focusKeyword']?.toString().trim().isNotEmpty == true
        ? summary!['focusKeyword']
        : summary?['title'] ?? topic?['title'] ?? '',
  );
  @override
  void initState() {
    super.initState();
    final first = topics.firstOrNull;
    if (first != null) {
      topicId = first['topicId'];
      language =
          first['canonicalLanguage'] ??
          first['primaryLanguage'] ??
          first['titleLanguage'] ??
          'AR';
      loadVersions();
    }
  }

  @override
  void didUpdateWidget(MarketingEditorialPanel old) {
    super.didUpdateWidget(old);
    // Parent polling refreshes workflow state without replacing unsaved content.
    if (topicId == null && topics.isNotEmpty) {
      topicId = topics.first['topicId'];
      language =
          topics.first['canonicalLanguage'] ??
          topics.first['primaryLanguage'] ??
          'AR';
      loadVersions();
    }
  }

  @override
  void dispose() {
    translationTimer?.cancel();
    body.dispose();
    super.dispose();
  }

  Future<bool> discard() async =>
      !draft.dirty ||
      await adminConfirm(context, 'admin.marketing.editorial_discard_changes');
  Future<void> choose(AdminRecord next, String lang) async {
    if (busy || translating || !await discard() || !mounted) return;
    setState(() {
      topicId = next['topicId'];
      language = lang;
      reason = '';
      confirmed = false;
      success = null;
      error = null;
    });
    await loadVersions();
  }

  Future<void> loadVersions() async {
    final selected = topic;
    if (selected == null) return;
    final request = ++revision;
    setState(() {
      loading = true;
      error = null;
      history = [];
      performance = null;
      performanceError = null;
    });
    try {
      final versions = selected['articleId'] == null || summary == null
          ? <AdminRecord>[]
          : AdminApi.records(
              await api.get(
                '/admin/marketing/editorial/editor/articles/${selected['articleId']}/versions',
                {'language': language},
              ),
            );
      if (!mounted || request != revision) return;
      final current =
          versions.where((v) => v['current'] == true).firstOrNull ??
          versions.firstOrNull;
      setState(() {
        history = versions;
        if (current != null) {
          draft.hydrate(current);
        } else {
          draft.hydrate({
            'title': selected['titleLanguage'] == language
                ? selected['title']
                : '',
            'versionNumber': null,
          });
        }
        body.text = draft.fields['body'];
        formRevision++;
      });
      if ([
        'PUBLISHED',
        'UPDATE_RECOMMENDED',
      ].contains(selected['lifecycleState'])) {
        try {
          final next = AdminApi.record(
            await api.get(
              '/admin/marketing/editorial/editor/articles/${selected['articleId']}/performance',
            ),
          );
          if (mounted && request == revision) {
            setState(() => performance = next);
          }
        } catch (_) {
          if (mounted && request == revision) {
            setState(() => performanceError = 'admin.marketing.action_failed');
          }
        }
      }
    } catch (_) {
      if (mounted && request == revision) {
        setState(() => error = 'admin.marketing.editorial_history_failed');
      }
    } finally {
      if (mounted && request == revision) setState(() => loading = false);
    }
  }

  Future<bool> action(
    Future<void> Function() operation, {
    String? successKey,
    bool reload = false,
  }) async {
    if (busy) return false;
    final request = revision;
    setState(() {
      busy = true;
      error = null;
      success = null;
    });
    try {
      await operation();
      if (!mounted || request != revision) return false;
      setState(() => success = successKey);
      await widget.onRefresh();
      if (reload && mounted) await loadVersions();
      return true;
    } on DioException catch (e) {
      if (mounted && request == revision) {
        setState(
          () => error = e.response?.statusCode == 409
              ? 'admin.marketing.action_failed'
              : 'admin.marketing.action_failed',
        );
      }
      return false;
    } catch (_) {
      if (mounted && request == revision) {
        setState(() => error = 'admin.marketing.action_failed');
      }
      return false;
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> save() async {
    if (locked || !draft.valid || topic == null) return;
    await action(
      () async {
        final result = AdminApi.record(
          await api.put(
            '/admin/marketing/editorial/editor/topics/$topicId/versions/$language',
            draft.payload(dynamicSlug: dynamicSlug),
          ),
        );
        final version = AdminApi.record(result['version']);
        draft.markSaved(version['versionNumber'] as int);
      },
      successKey: 'admin.marketing.editorial_saved',
      reload: true,
    );
  }

  Future<void> advance() async {
    final selected = topic;
    if (selected == null || !draft.canAdvance(selected) || busy) return;
    final confirmKey = switch (selected['lifecycleState']) {
      'DRAFTING' => 'submitDraftConfirm',
      'DRAFT_READY' => 'startFactCheckConfirm',
      'FACT_CHECK_REQUIRED' => 'factCheckConfirm',
      'LEGAL_REVIEW_REQUIRED' => 'legalReviewConfirm',
      'TRANSLATION_REQUIRED' => 'translationsCompleteConfirm',
      _ => 'submitDraftConfirm',
    };
    if (!await adminConfirm(context, 'editorial.workflow.$confirmKey') ||
        !mounted) {
      return;
    }
    await action(() async {
      await api.post(
        '/admin/marketing/editorial/editor/articles/${selected['articleId']}/workflow/advance',
      );
    }, successKey: 'editorial.workflow.advanced');
  }

  Future<void> translate() async {
    final selected = topic;
    if (selected == null || busy || !draft.canTranslate(selected)) return;
    final canonical = AdminApi.records(
      selected['currentVersions'],
    ).where((v) => v['language'] == selected['canonicalLanguage']).first;
    int? taskId;
    final ok = await action(() async {
      final result = AdminApi.record(
        await api.post(
          '/admin/marketing/editorial/editor/articles/${selected['articleId']}/translation-requests',
          {
            'idempotencyKey':
                'admin-translation-${selected['articleId']}-${selected['canonicalLanguage']}-v${canonical['versionNumber']}-${EditorialDraft.missingTranslations(selected).join('-')}-seo-v2',
          },
        ),
      );
      taskId = result['taskId'] ?? result['id'];
    }, successKey: 'admin.marketing.editorial_translation_requested');
    if (ok && taskId != null && mounted) {
      setState(() => translating = true);
      pollTranslation(taskId!, revision);
    }
  }

  void pollTranslation(int id, int request) {
    translationTimer?.cancel();
    translationTimer = Timer(const Duration(seconds: 5), () async {
      try {
        final task = AdminApi.record(
          await api.get('/admin/marketing/tasks/$id'),
        );
        if (!mounted || request != revision) return;
        if ([
          'COMPLETED',
          'FAILED',
          'CANCELLED',
          'REJECTED',
        ].contains(task['status'])) {
          setState(() {
            translating = false;
            if (task['status'] != 'COMPLETED') {
              error = 'admin.marketing.editorial_translation_failed';
            } else {
              success = 'admin.marketing.editorial_translation_completed';
            }
          });
          if (task['status'] == 'COMPLETED') {
            await widget.onRefresh();
            if (mounted) await loadVersions();
          }
        } else {
          pollTranslation(id, request);
        }
      } catch (_) {
        if (mounted && request == revision) {
          setState(() {
            translating = false;
            error = 'admin.marketing.editorial_translation_failed';
          });
        }
      }
    });
  }

  Future<void> showPreview(AdminRecord fields) async {
    final t = AppLocalizations.of(context);
    await showDialog<void>(
      context: context,
      builder: (context) => Dialog(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 900),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Align(
                  alignment: AlignmentDirectional.centerEnd,
                  child: IconButton(
                    tooltip: t.t('common.close'),
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                  ),
                ),
                Directionality(
                  textDirection: language == 'AR'
                      ? TextDirection.rtl
                      : TextDirection.ltr,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        fields['title']?.toString() ?? '',
                        style: Theme.of(context).textTheme.headlineLarge,
                      ),
                      const SizedBox(height: 16),
                      Text(fields['summary']?.toString() ?? ''),
                      const SizedBox(height: 24),
                      RijviaMarkdown(
                        text: fields['body']?.toString() ?? '',
                        typography: Map<String, dynamic>.from(
                          fields['typography'] as Map? ?? {},
                        ),
                      ),
                      for (final link in fields['internalLinks'] as List? ?? [])
                        TextButton(
                          onPressed: () {
                            final path = link['targetPath']?.toString() ?? '';
                            if (path.startsWith('/') &&
                                !path.startsWith('//')) {
                              Navigator.pushNamed(context, path);
                            }
                          },
                          child: Text(link['anchorText'] ?? ''),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> restore(AdminRecord version) async {
    if (locked ||
        !await adminConfirm(context, 'editorial.cms.versionRestoreConfirm') ||
        !mounted) {
      return;
    }
    setState(() {
      draft.hydrate(
        version,
        expectedVersion: draft.fields['expectedCurrentVersion'],
        restored: true,
      );
      body.text = draft.fields['body'];
      formRevision++;
      success = 'editorial.cms.versionLoaded';
    });
  }

  Future<void> deleteVersion(AdminRecord version) async {
    final selected = topic;
    if (selected == null ||
        busy ||
        !draft.canDeleteVersion(selected, version, history.length) ||
        !await adminConfirm(
          context,
          'admin.marketing.editorial_version_delete_title',
          detail: AppLocalizations.of(context).t(
            'admin.marketing.editorial_version_delete_confirm',
            {'version': version['versionNumber']},
          ),
        ) ||
        !mounted) {
      return;
    }
    await action(
      () async {
        await api.delete(
          '/admin/marketing/editorial/editor/articles/${selected['articleId']}/versions/${version['id']}',
        );
      },
      successKey: 'admin.marketing.editorial_version_deleted',
      reload: true,
    );
  }

  void format(String kind) {
    if (locked) return;
    final value = body.value;
    final start = value.selection.isValid
            ? value.selection.start
            : value.text.length,
        end = value.selection.isValid ? value.selection.end : value.text.length;
    final selected = value.text.substring(start, end);
    final t = AppLocalizations.of(context);
    String fallback(String k) => selected.isEmpty
        ? t.t('admin.marketing.editorial_markdown_fallback_$k')
        : selected;
    final inserted = switch (kind) {
      'h1' => '# ${fallback('heading')}',
      'h2' => '## ${fallback('heading')}',
      'h3' => '### ${fallback('heading')}',
      'h4' => '#### ${fallback('heading')}',
      'bold' => '**${fallback('bold')}**',
      'italic' => '*${fallback('italic')}*',
      'unordered_list' => '- ${fallback('list_item')}',
      'ordered_list' => '1. ${fallback('list_item')}',
      'link' => '[${fallback('link')}](https://)',
      'clear' => selected.replaceAll(
        RegExp(r'(^#{1,6}\s+|\*\*|\*|^[-\d.]+\s+)', multiLine: true),
        '',
      ),
      _ => fallback('paragraph'),
    };
    body.value = TextEditingValue(
      text: value.text.replaceRange(start, end, inserted),
      selection: TextSelection.collapsed(offset: start + inserted.length),
    );
    setState(() => draft.fields['body'] = body.text);
  }

  Widget field(
    String key,
    String label, {
    int lines = 1,
    int? limit,
    bool readOnly = false,
    String? value,
  }) => EditorialField(
    key: ValueKey('$formRevision-$key'),
    label: AppLocalizations.of(context).t('admin.marketing.editorial_$label'),
    value: value ?? draft.fields[key].toString(),
    readOnly: locked || readOnly,
    lines: lines,
    maxLength: limit,
    onChanged: (v) => setState(() => draft.fields[key] = v),
  );
  Widget section(String title, List<Widget> children) => Padding(
    padding: const EdgeInsets.only(bottom: 20),
    child: RijviaPageSection(
      title: AppLocalizations.of(context).t(title),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: children,
      ),
    ),
  );
  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context), selected = topic;
    final filtered = topics
        .where(
          (item) => '${item['topicKey']} ${item['title']} ${item['priority']}'
              .toLowerCase()
              .contains(search.toLowerCase()),
        )
        .toList();
    final browser = RijviaPageSection(
      title: t.t('admin.marketing.editorial_search'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            decoration: InputDecoration(
              labelText: t.t('common.search'),
              prefixIcon: const Icon(Icons.search),
            ),
            onChanged: (v) => setState(() => search = v),
          ),
          const SizedBox(height: 16),
          MarketingList(
            pageSize: 10,
            children: [
              for (final item in filtered)
                ListTile(
                  selected: topicId == item['topicId'],
                  title: Text(item['title'] ?? ''),
                  subtitle: Text(
                    '${t.t('editorial.article_number', {'number': item['order'] ?? '—'})} · ${t.t('editorial.lifecycleLabels.${item['lifecycleState']}')}',
                  ),
                  onTap: () => choose(
                    item,
                    item['canonicalLanguage'] ??
                        item['primaryLanguage'] ??
                        item['titleLanguage'] ??
                        'AR',
                  ),
                ),
            ],
          ),
        ],
      ),
    );
    final editor = selected == null
        ? Text(t.t('admin.marketing.empty'))
        : Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AdminStatus(
                loading: loading || busy,
                error: error,
                success: success,
                onRetry: loadVersions,
              ),
              RijviaPageSection(
                title: selected['title'] ?? '',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      t.t(
                        'editorial.lifecycleLabels.${selected['lifecycleState']}',
                      ),
                    ),
                    Text(
                      t.t(
                        selected['strategyContextResolved'] == true
                            ? 'admin.marketing.editorial_strategy_ready'
                            : 'admin.marketing.editorial_strategy_missing',
                      ),
                    ),
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        for (final l in EditorialDraft.languages)
                          ChoiceChip(
                            label: Text(l),
                            selected: language == l,
                            onSelected: busy || translating
                                ? null
                                : (_) => choose(selected, l),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              EditorialAuthoringPanel(
                key: ValueKey('$topicId-$language'),
                topic: selected,
                language: language,
                strategy: widget.strategy,
                onChanged: widget.onRefresh,
              ),
              const SizedBox(height: 20),
              if ([
                'PUBLISHED',
                'UPDATE_RECOMMENDED',
              ].contains(selected['lifecycleState']))
                section('editorial.cms.startUpdate', [
                  Text(t.t('editorial.cms.startUpdateDescription')),
                  FilledButton(
                    onPressed: busy
                        ? null
                        : () => action(
                            () async {
                              await api.post(
                                '/admin/marketing/editorial/editor/articles/${selected['articleId']}/update-session',
                              );
                            },
                            successKey: 'editorial.cms.updateStarted',
                            reload: true,
                          ),
                    child: Text(t.t('editorial.cms.startUpdate')),
                  ),
                  if (performanceError != null) Text(t.t(performanceError!)),
                  if (performance != null) MarketingData(performance),
                ]),
              if ([
                'DRAFTING',
                'DRAFT_READY',
                'FACT_CHECK_REQUIRED',
                'LEGAL_REVIEW_REQUIRED',
                'TRANSLATION_REQUIRED',
              ].contains(selected['lifecycleState']))
                section('editorial.workflow.title', [
                  Text(
                    '${t.t('editorial.workflow.currentStage')}: ${t.t('editorial.lifecycleLabels.${selected['lifecycleState']}')}',
                  ),
                  FilledButton(
                    onPressed: busy || !draft.canAdvance(selected)
                        ? null
                        : advance,
                    child: Text(
                      t.t(
                        'editorial.workflow.${switch (selected['lifecycleState']) {
                          'DRAFTING' => 'submitDraft',
                          'DRAFT_READY' => 'startFactCheck',
                          'FACT_CHECK_REQUIRED' => 'confirmFactCheck',
                          'LEGAL_REVIEW_REQUIRED' => 'confirmLegalReview',
                          'TRANSLATION_REQUIRED' => 'continueToImage',
                          _ => 'advance',
                        }}',
                      ),
                    ),
                  ),
                ]),
              Directionality(
                textDirection: language == 'AR'
                    ? TextDirection.rtl
                    : TextDirection.ltr,
                child: section('editorial.cms.editorTitle', [
                  Text(t.t('admin.marketing.editorial_markdown_help')),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      ChoiceChip(
                        label: Text(t.t('editorial.cms.editorWrite')),
                        selected: !preview,
                        onSelected: (_) => setState(() => preview = false),
                      ),
                      ChoiceChip(
                        label: Text(t.t('editorial.cms.editorPreview')),
                        selected: preview,
                        onSelected: (_) => setState(() => preview = true),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (preview)
                    RijviaMarkdown(
                      text: body.text,
                      typography: Map<String, dynamic>.from(
                        draft.fields['typography'],
                      ),
                    )
                  else ...[
                    Wrap(
                      spacing: 4,
                      runSpacing: 4,
                      children: [
                        for (final kind in [
                          'h1',
                          'h2',
                          'h3',
                          'h4',
                          'paragraph',
                          'bold',
                          'italic',
                          'unordered_list',
                          'ordered_list',
                          'link',
                          'clear',
                        ])
                          OutlinedButton(
                            onPressed: locked ? null : () => format(kind),
                            child: Text(
                              t.t(
                                'admin.marketing.editorial_markdown_toolbar_$kind',
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    EditorialField(
                      label: t.t('admin.marketing.editorial_body'),
                      value: body.text,
                      controller: body,
                      lines: 14,
                      maxLength: 500000,
                      readOnly: locked,
                      onChanged: (v) =>
                          setState(() => draft.fields['body'] = v),
                    ),
                  ],
                  RijviaAdaptiveGrid(
                    minCellWidth: 250,
                    equalRowHeights: false,
                    children: [
                      field('title', 'title', limit: 500),
                      field(
                        'slug',
                        'slug',
                        value: dynamicSlug.isNotEmpty
                            ? dynamicSlug
                            : draft.fields['slug'],
                        readOnly: dynamicSlug.isNotEmpty,
                        limit: 255,
                      ),
                    ],
                  ),
                  field('summary', 'summary', lines: 4, limit: 2000),
                  RijviaAdaptiveGrid(
                    minCellWidth: 250,
                    equalRowHeights: false,
                    children: [
                      field('metaTitle', 'meta_title', limit: 500),
                      field(
                        'metaDescription',
                        'meta_description',
                        lines: 4,
                        limit: 2000,
                      ),
                    ],
                  ),
                  ExpansionTile(
                    title: Text(t.t('editorial.cms.editorFormat')),
                    children: [
                      RijviaAdaptiveGrid(
                        minCellWidth: 210,
                        equalRowHeights: false,
                        children: [
                          for (final key in [
                            'h1Size',
                            'h2Size',
                            'h3Size',
                            'h4Size',
                            'paragraphSize',
                          ])
                            EditorialSelect(
                              label: t.t(
                                'admin.marketing.editorial_markdown_size',
                                {
                                  'target': key == 'paragraphSize'
                                      ? t.t(
                                          'admin.marketing.editorial_markdown_paragraph',
                                        )
                                      : key.substring(0, 2).toUpperCase(),
                                },
                              ),
                              value: draft.fields['typography'][key],
                              options: {
                                for (final size in [
                                  'COMPACT',
                                  'DEFAULT',
                                  'LARGE',
                                ])
                                  size: t.t(
                                    'admin.marketing.editorial_markdown_size_${size.toLowerCase()}',
                                  ),
                              },
                              disabled: locked,
                              onChanged: (v) => setState(
                                () => draft.fields['typography'][key] = v,
                              ),
                            ),
                          EditorialSelect(
                            label: t.t(
                              'admin.marketing.editorial_markdown_text_color',
                            ),
                            value: draft.fields['typography']['textColor'],
                            options: {
                              for (final color in [
                                'DEFAULT',
                                'MUTED',
                                'PRIMARY',
                                'SECONDARY',
                              ])
                                color: t.t(
                                  'admin.marketing.editorial_markdown_color_${color.toLowerCase()}',
                                ),
                            },
                            disabled: locked,
                            onChanged: (v) => setState(
                              () => draft.fields['typography']['textColor'] = v,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ]),
              ),
              section('admin.marketing.editorial_internal_links', [
                Text(
                  t.t('admin.marketing.editorial_internal_links_description'),
                ),
                const SizedBox(height: 16),
                for (
                  var i = 0;
                  i < (draft.fields['internalLinks'] as List).length;
                  i++
                )
                  _link(i, locked, t),
                if ((draft.fields['internalLinks'] as List).isEmpty)
                  Text(t.t('admin.marketing.editorial_internal_links_empty')),
                OutlinedButton.icon(
                  onPressed: locked
                      ? null
                      : () => setState(() {
                          (draft.fields['internalLinks'] as List).add({
                            'targetPath': '',
                            'anchorText': '',
                          });
                        }),
                  icon: const Icon(Icons.add),
                  label: Text(
                    t.t('admin.marketing.editorial_internal_link_add'),
                  ),
                ),
              ]),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  FilledButton.icon(
                    onPressed: locked || !draft.valid ? null : save,
                    icon: const Icon(Icons.save_outlined),
                    label: Text(t.t('editorial.cms.saveDraft')),
                  ),
                  OutlinedButton(
                    onPressed: () => showPreview(draft.fields),
                    child: Text(t.t('admin.marketing.editorial_preview')),
                  ),
                  if (draft.dirty)
                    Text(t.t('admin.marketing.editorial_unsaved')),
                ],
              ),
              const SizedBox(height: 20),
              if (selected['articleId'] != null) ...[
                EditorialImagePanel(
                  key: ValueKey(
                    '${selected['articleId']}:${selected['image']?['id']}',
                  ),
                  articleId: selected['articleId'],
                  topic: selected,
                  suggestedFileName: dynamicSlug,
                  onChanged: widget.onRefresh,
                  disabled: busy || draft.dirty,
                ),
                const SizedBox(height: 20),
                section('admin.marketing.editorial_translation_title', [
                  Text(
                    t.t('admin.marketing.editorial_translation_description'),
                  ),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final l in EditorialDraft.languages)
                        Chip(
                          label: Text(
                            '$l · ${t.t(EditorialDraft.missingTranslations(selected).contains(l) ? 'admin.marketing.editorial_translation_missing' : 'admin.marketing.editorial_translation_available')}',
                          ),
                        ),
                    ],
                  ),
                  if (translating)
                    Text(t.t('admin.marketing.editorial_translation_running')),
                  if (draft.dirty)
                    Text(
                      t.t('admin.marketing.editorial_translation_save_first'),
                    ),
                  FilledButton(
                    onPressed:
                        busy || translating || !draft.canTranslate(selected)
                        ? null
                        : translate,
                    child: Text(
                      t.t('admin.marketing.editorial_translation_action'),
                    ),
                  ),
                ]),
              ] else
                Text(t.t('admin.marketing.editorial_image_save_first')),
              if (selected['lifecycleState'] == 'IMAGE_REQUIRED')
                section('admin.marketing.editorial_approval_title', [
                  Text(t.t('admin.marketing.editorial_approval_description')),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final gate
                          in widget.workspace['qualityGates'] as List? ?? [])
                        Chip(
                          label: Text(t.t('editorial.qualityGateLabels.$gate')),
                        ),
                    ],
                  ),
                  CheckboxListTile(
                    value: confirmed,
                    onChanged: busy
                        ? null
                        : (v) => setState(() => confirmed = v == true),
                    title: Text(
                      t.t('admin.marketing.editorial_approval_confirm'),
                    ),
                  ),
                  EditorialField(
                    label: t.t('admin.marketing.editorial_approval_reason'),
                    value: reason,
                    lines: 3,
                    maxLength: 1000,
                    readOnly: busy,
                    onChanged: (v) => setState(() => reason = v),
                  ),
                  if (!EditorialDraft.hasEveryLanguage(selected))
                    Text(
                      t.t(
                        'admin.marketing.editorial_approval_languages_required',
                      ),
                    ),
                  if (selected['image']?['status'] != 'APPROVED')
                    Text(
                      t.t('admin.marketing.editorial_approval_image_required'),
                    ),
                  if (draft.dirty)
                    Text(t.t('admin.marketing.editorial_approval_save_first')),
                  FilledButton(
                    onPressed:
                        busy ||
                            !draft.canRequestApproval(
                              selected,
                              confirmed: confirmed,
                              reason: reason,
                            )
                        ? null
                        : () => action(
                            () async {
                              await api.post(
                                '/admin/marketing/editorial/editor/articles/${selected['articleId']}/approval-requests',
                                {
                                  'passedQualityGates':
                                      widget.workspace['qualityGates'],
                                  'reason': reason.trim(),
                                },
                              );
                            },
                            successKey:
                                'admin.marketing.editorial_approval_requested',
                          ),
                    child: Text(
                      t.t('admin.marketing.editorial_request_approval'),
                    ),
                  ),
                ]),
              if (selected['lifecycleState'] == 'WAITING_APPROVAL')
                section('admin.marketing.editorial_publish_title', [
                  Text(
                    t.t(
                      'admin.marketing.editorial_waiting_approval_description',
                    ),
                  ),
                  EditorialField(
                    label: t.t('admin.marketing.editorial_publish_reason'),
                    value: reason,
                    lines: 3,
                    maxLength: 1000,
                    readOnly: busy,
                    onChanged: (v) => setState(() => reason = v),
                  ),
                  FilledButton(
                    onPressed:
                        busy ||
                            selected['pendingApprovalTaskId'] == null ||
                            reason.trim().isEmpty
                        ? null
                        : () async {
                            if (!await adminConfirm(
                                  context,
                                  'admin.marketing.editorial_publish_confirm',
                                ) ||
                                !mounted) {
                              return;
                            }
                            await action(
                              () async {
                                await api.post(
                                  '/admin/marketing/tasks/${selected['pendingApprovalTaskId']}/approve',
                                  {'reason': reason.trim()},
                                );
                              },
                              successKey:
                                  'admin.marketing.editorial_publish_approved',
                            );
                          },
                    child: Text(
                      t.t('admin.marketing.editorial_publish_action'),
                    ),
                  ),
                ]),
              if ([
                'APPROVED',
                'SCHEDULED',
              ].contains(selected['lifecycleState']))
                Text(t.t('editorial.cms.publicationInProgress')),
              section('editorial.cms.versionTitle', [
                Text(t.t('editorial.cms.versionDescription')),
                const SizedBox(height: 12),
                MarketingList(
                  children: [
                    for (final version in history)
                      RijviaPageSection(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              '${t.t('editorial.version.${version['versionNumber']}')} · ${version['title']}',
                            ),
                            Text(
                              '${adminDate(version['createdAt'], t.locale.languageCode, includeTime: true)} · ${marketingActor(t, version['createdBy'])}',
                            ),
                            if (version['current'] == true)
                              Text(t.t('editorial.cms.versionCurrent')),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                TextButton(
                                  onPressed: () => showPreview(version),
                                  child: Text(
                                    t.t('editorial.cms.versionPreview'),
                                  ),
                                ),
                                TextButton(
                                  onPressed: locked
                                      ? null
                                      : () => restore(version),
                                  child: Text(
                                    t.t('editorial.cms.versionRestore'),
                                  ),
                                ),
                                TextButton(
                                  onPressed:
                                      busy ||
                                          !draft.canDeleteVersion(
                                            selected,
                                            version,
                                            history.length,
                                          )
                                      ? null
                                      : () => deleteVersion(version),
                                  child: Text(
                                    t.t(
                                      'admin.marketing.editorial_version_delete',
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
                if (history.isEmpty)
                  Text(t.t('admin.marketing.editorial_no_versions')),
              ]),
            ],
          );
    return PopScope(
      canPop: allowExit || !draft.dirty,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        if (await discard() && context.mounted) {
          setState(() => allowExit = true);
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) Navigator.pop(context);
          });
        }
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          LayoutBuilder(
            builder: (context, c) => c.maxWidth >= 1100
                ? Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(width: 300, child: browser),
                      const SizedBox(width: 24),
                      Expanded(child: editor),
                    ],
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [browser, const SizedBox(height: 24), editor],
                  ),
          ),
          const SizedBox(height: 24),
          section('admin.marketing.editorial_content_graph', [
            if (widget.workspace['contentGraph'] is Map)
              MarketingData(widget.workspace['contentGraph']),
          ]),
        ],
      ),
    );
  }

  Widget _link(int i, bool disabled, AppLocalizations t) {
    final link = draft.fields['internalLinks'][i];
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          EditorialField(
            key: ValueKey('$formRevision-link-$i-target'),
            label: t.t('admin.marketing.editorial_internal_link_target'),
            value: link['targetPath'],
            readOnly: disabled,
            maxLength: 500,
            onChanged: (v) => setState(() => link['targetPath'] = v),
          ),
          EditorialField(
            key: ValueKey('$formRevision-link-$i-anchor'),
            label: t.t('admin.marketing.editorial_internal_link_anchor'),
            value: link['anchorText'],
            readOnly: disabled,
            maxLength: 500,
            onChanged: (v) => setState(() => link['anchorText'] = v),
          ),
          Align(
            alignment: AlignmentDirectional.centerEnd,
            child: IconButton(
              tooltip: t.t('admin.marketing.editorial_internal_link_remove'),
              onPressed: disabled
                  ? null
                  : () => setState(() {
                      (draft.fields['internalLinks'] as List).removeAt(i);
                      formRevision++;
                    }),
              icon: const Icon(Icons.delete_outline),
            ),
          ),
        ],
      ),
    );
  }
}
