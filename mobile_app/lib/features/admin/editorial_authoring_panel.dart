import 'dart:async';
import 'package:flutter/material.dart';
import '../../core/localization/app_localizations.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import 'admin_components.dart';
import 'editorial_controls.dart';
import 'marketing_presentation.dart';

class EditorialAuthoringPanel extends StatefulWidget {
  const EditorialAuthoringPanel({
    super.key,
    required this.topic,
    required this.language,
    required this.strategy,
    required this.onChanged,
  });
  final AdminRecord topic, strategy;
  final String language;
  final Future<void> Function() onChanged;
  @override
  State<EditorialAuthoringPanel> createState() =>
      _EditorialAuthoringPanelState();
}

class _EditorialAuthoringPanelState extends State<EditorialAuthoringPanel> {
  final api = AdminApi();
  AdminRecord? status;
  late AdminRecord brief;
  final source = <String, dynamic>{
    'claimKey': '',
    'claimText': '',
    'claimType': 'FACTUAL',
    'sourceType': 'RIJVIA_CORE_DATA',
    'title': '',
    'publisher': 'RijVia',
    'url': '',
    'internalReference': '',
    'jurisdiction': '',
    'legalReviewStatus': 'REQUIRES_REVIEW',
    'fingerprint': '',
  };
  bool loading = true, busy = false;
  String? error, success;
  Timer? timer;
  int revision = 0;
  static const activeStatuses = [
    'PENDING',
    'SCHEDULED',
    'WAITING_APPROVAL',
    'APPROVED',
    'RUNNING',
    'RETRY_SCHEDULED',
  ];
  @override
  void initState() {
    super.initState();
    brief = {
      'searchIntent': 'INFORMATIONAL',
      'workingTitle': widget.topic['title'] ?? '',
      'purpose': '',
      'targetQueries': widget.language == widget.topic['titleLanguage']
          ? (widget.topic['targetQueries'] as List? ?? []).join('\n')
          : '',
      'sourceRequirements': '',
      'legalReviewRequired': false,
      for (final k in [
        'uspId',
        'icpId',
        'contentPillarId',
        'funnelStageId',
        'conversionGoalId',
      ])
        k: widget.topic[k]?.toString() ?? '',
    };
    load();
  }

  @override
  void dispose() {
    timer?.cancel();
    super.dispose();
  }

  Future<void> load({bool refresh = false}) async {
    timer?.cancel();
    final request = ++revision;
    try {
      final next = AdminApi.record(
        await api.get(
          '/admin/marketing/editorial/editor/topics/${widget.topic['topicId']}/authoring-status',
        ),
      );
      if (!mounted || request != revision) return;
      final wasActive = activeStatuses.contains(
        status?['latestDraftTaskStatus'],
      );
      setState(() {
        status = next;
        loading = false;
        error = null;
      });
      if (refresh ||
          wasActive &&
              !activeStatuses.contains(next['latestDraftTaskStatus'])) {
        await widget.onChanged();
      }
      if (mounted && activeStatuses.contains(next['latestDraftTaskStatus'])) {
        timer = Timer(const Duration(seconds: 5), load);
      }
    } catch (_) {
      if (mounted && request == revision) {
        setState(() {
          loading = false;
          error = 'admin.marketing.action_failed';
        });
      }
    }
  }

  Future<void> operation(
    String endpoint,
    AdminRecord payload,
    String successKey,
  ) async {
    if (busy) return;
    setState(() {
      busy = true;
      error = null;
      success = null;
    });
    try {
      await api.post(endpoint, payload);
      if (!mounted) return;
      setState(() => success = successKey);
      await load(refresh: true);
    } catch (_) {
      if (mounted) setState(() => error = 'admin.marketing.action_failed');
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  List<String> lines(String field) => brief[field]
      .toString()
      .split('\n')
      .map((v) => v.trim())
      .where((v) => v.isNotEmpty)
      .toList();
  bool get briefValid =>
      [
        'uspId',
        'icpId',
        'contentPillarId',
        'funnelStageId',
        'conversionGoalId',
        'workingTitle',
        'purpose',
      ].every((k) => brief[k].toString().trim().isNotEmpty) &&
      lines('targetQueries').isNotEmpty &&
      lines('targetQueries').every((q) => q.length <= 120) &&
      lines('sourceRequirements').isNotEmpty;
  bool get internal => [
    'RIJVIA_CORE_DATA',
    'APPROVED_INTERNAL_SOURCE',
  ].contains(source['sourceType']);
  bool get legal => source['claimType'] == 'LEGAL';
  String get trust => source['sourceType'] == 'RIJVIA_CORE_DATA'
      ? 'CORE_TRUSTED'
      : source['sourceType'].toString().startsWith('OFFICIAL_')
      ? 'OFFICIAL'
      : 'APPROVED_REFERENCE';
  bool get sourceValid =>
      [
        'claimKey',
        'claimText',
        'title',
        'publisher',
        internal ? 'internalReference' : 'url',
      ].every((k) => source[k].toString().trim().isNotEmpty) &&
      (!legal || source['legalReviewStatus'] == 'VERIFIED');
  Future<void> createBrief() => operation(
    '/admin/marketing/editorial/topics/${widget.topic['topicId']}/briefs',
    {
      'targetLanguage': widget.language,
      'searchIntent': brief['searchIntent'],
      'workingTitle': brief['workingTitle'].toString().trim(),
      'purpose': brief['purpose'].toString().trim(),
      'strategyContext': {
        for (final k in [
          'uspId',
          'icpId',
          'contentPillarId',
          'funnelStageId',
          'conversionGoalId',
        ])
          k: k == 'icpId' ? brief[k] : int.parse(brief[k]),
      },
      'targetQueries': lines('targetQueries'),
      'sourceRequirements': lines('sourceRequirements'),
      'legalReviewRequired': brief['legalReviewRequired'],
      'idempotencyKey': marketingOperationKey(
        'admin-brief-${widget.topic['topicId']}-${widget.language}',
      ),
    },
    'admin.marketing.editorial_authoring_brief_queued',
  );
  Future<void> collect() =>
      operation('/admin/marketing/editorial/source-collections', {
        'articleTopicId': widget.topic['topicId'],
        'briefReference': status!['briefReference'],
        'claims': [
          {
            'claimKey': source['claimKey'].toString().trim(),
            'claimText': source['claimText'].toString().trim(),
            'claimType': source['claimType'],
            'language': status!['briefLanguage'] ?? widget.language,
            'legalReviewRequired': legal,
            'sources': [
              {
                'sourceType': source['sourceType'],
                'locationType': internal ? 'INTERNAL' : 'EXTERNAL',
                'title': source['title'].toString().trim(),
                'publisher': source['publisher'].toString().trim(),
                'url': internal ? null : source['url'].toString().trim(),
                'internalReference': internal
                    ? source['internalReference'].toString().trim()
                    : null,
                'jurisdiction': source['jurisdiction'].toString().trim().isEmpty
                    ? null
                    : source['jurisdiction'].toString().trim(),
                'language': status!['briefLanguage'] ?? widget.language,
                'verificationStatus': 'VERIFIED',
                'trustStatus': trust,
                'legalReviewRequired': legal,
                'legalReviewStatus': legal ? 'VERIFIED' : 'NOT_REQUIRED',
                'fingerprint': source['fingerprint'].toString().trim().isEmpty
                    ? null
                    : source['fingerprint'].toString().trim(),
                'etag': null,
                'lastModified': null,
              },
            ],
          },
        ],
        'idempotencyKey': marketingOperationKey(
          'admin-source-${widget.topic['topicId']}-${source['claimKey']}',
        ),
      }, 'admin.marketing.editorial_authoring_source_queued');
  Widget field(
    AppLocalizations t,
    String field,
    String label, {
    bool isBrief = false,
    int lines = 1,
    int? maxLength,
    bool readOnly = false,
  }) {
    final form = isBrief ? brief : source;
    return EditorialField(
      key: ValueKey('${isBrief ? 'brief' : 'source'}-$field'),
      label: t.t('admin.marketing.editorial_authoring_$label'),
      value: form[field].toString(),
      lines: lines,
      maxLength: maxLength,
      readOnly: busy || readOnly,
      onChanged: (v) => setState(() => form[field] = v),
    );
  }

  Map<String, String> options(
    String collection,
    String kind,
    String labelField,
    String keyField,
  ) {
    final t = AppLocalizations.of(context);
    return {
      for (final item
          in AdminApi.records(widget.strategy[collection] ?? []).where(
            (i) =>
                i['active'] == true &&
                (collection != 'conversionGoals' ||
                    i['funnelStageId']?.toString() == brief['funnelStageId']),
          ))
        item['id'].toString():
            t.t('editorial.strategy.$kind.${item[keyField]}') ==
                'editorial.strategy.$kind.${item[keyField]}'
            ? item[labelField].toString()
            : t.t('editorial.strategy.$kind.${item[keyField]}'),
    };
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    Widget select(String field, String label, Map<String, String> values) =>
        EditorialSelect(
          label: t.t('admin.marketing.editorial_authoring_$label'),
          value: brief[field].toString(),
          options: values,
          disabled: busy,
          onChanged: (v) => setState(() {
            brief[field] = v;
            if (field == 'funnelStageId') brief['conversionGoalId'] = '';
          }),
        );
    return RijviaPageSection(
      title: t.t('admin.marketing.editorial_authoring_title'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(t.t('admin.marketing.editorial_authoring_description')),
          const SizedBox(height: 16),
          AdminStatus(
            loading: loading || busy,
            error: error,
            success: success,
            onRetry: load,
          ),
          if (status != null) ...[
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                MarketingStatus(status!['briefStatus']),
                MarketingStatus(status!['latestSourceTaskStatus']),
                MarketingStatus(status!['latestDraftTaskStatus']),
              ],
            ),
            const SizedBox(height: 16),
            MarketingData({
              for (final key in [
                'claimsTotal',
                'claimsSupported',
                'claimsRequiringReview',
                'claimsMissing',
              ])
                key: status![key],
            }),
            if (status!['latestDraftErrorCode'] != null)
              Text(marketingFailure(t, status!['latestDraftErrorCode'])),
            if (status!['canCreateBrief'] == true)
              ExpansionTile(
                title: Text(
                  '1. ${t.t('admin.marketing.editorial_authoring_create_brief')}',
                ),
                children: [
                  RijviaAdaptiveGrid(
                    minCellWidth: 280,
                    equalRowHeights: false,
                    children: [
                      select('searchIntent', 'search_intent', {
                        for (final v in [
                          'INFORMATIONAL',
                          'TRANSACTIONAL',
                          'NAVIGATIONAL',
                        ])
                          v: t.t(
                            'admin.marketing.editorial_search_intent_${v.toLowerCase()}',
                          ),
                      }),
                      field(
                        t,
                        'workingTitle',
                        'working_title',
                        isBrief: true,
                        maxLength: 500,
                      ),
                      select(
                        'uspId',
                        'usp',
                        options('usps', 'USP', 'title', 'id'),
                      ),
                      select(
                        'icpId',
                        'icp',
                        options('icps', 'ICP', 'name', 'id'),
                      ),
                      select(
                        'contentPillarId',
                        'pillar',
                        options(
                          'contentPillars',
                          'CONTENT_PILLAR',
                          'name',
                          'pillarKey',
                        ),
                      ),
                      select(
                        'funnelStageId',
                        'funnel',
                        options(
                          'funnelStages',
                          'FUNNEL_STAGE',
                          'stageKey',
                          'stageKey',
                        ),
                      ),
                      select(
                        'conversionGoalId',
                        'goal',
                        options(
                          'conversionGoals',
                          'CONVERSION_GOAL',
                          'name',
                          'goalKey',
                        ),
                      ),
                    ],
                  ),
                  field(
                    t,
                    'purpose',
                    'purpose',
                    isBrief: true,
                    lines: 3,
                    maxLength: 4000,
                  ),
                  field(
                    t,
                    'targetQueries',
                    'queries',
                    isBrief: true,
                    lines: 4,
                    readOnly:
                        widget.topic['sourceType'] ==
                            'OFFICIAL_STRATEGIC_BACKLOG' &&
                        widget.language == widget.topic['titleLanguage'],
                  ),
                  field(
                    t,
                    'sourceRequirements',
                    'requirements',
                    isBrief: true,
                    lines: 4,
                  ),
                  CheckboxListTile(
                    value: brief['legalReviewRequired'] == true,
                    onChanged: busy
                        ? null
                        : (v) => setState(
                            () => brief['legalReviewRequired'] = v == true,
                          ),
                    title: Text(
                      t.t('admin.marketing.editorial_authoring_legal_review'),
                    ),
                  ),
                  FilledButton(
                    onPressed: busy || !briefValid ? null : createBrief,
                    child: Text(
                      t.t('admin.marketing.editorial_authoring_create_brief'),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            if (status!['canCollectSources'] == true &&
                status!['briefReference'] != null)
              ExpansionTile(
                title: Text(
                  '2. ${t.t('admin.marketing.editorial_authoring_collect_source')}',
                ),
                children: [
                  RijviaAdaptiveGrid(
                    minCellWidth: 280,
                    equalRowHeights: false,
                    children: [
                      field(t, 'claimKey', 'claim_key'),
                      EditorialSelect(
                        label: t.t(
                          'admin.marketing.editorial_authoring_claim_type',
                        ),
                        value: source['claimType'],
                        options: {
                          for (final v in [
                            'FACTUAL',
                            'PRODUCT_FACT',
                            'LEGAL',
                            'REGIONAL',
                            'DATE_SENSITIVE',
                            'STATISTIC',
                          ])
                            v: t.t('editorial.claimTypeLabels.$v'),
                        },
                        disabled: busy,
                        onChanged: (v) =>
                            setState(() => source['claimType'] = v),
                      ),
                      EditorialSelect(
                        label: t.t(
                          'admin.marketing.editorial_authoring_source_type',
                        ),
                        value: source['sourceType'],
                        options: {
                          for (final v in [
                            'RIJVIA_CORE_DATA',
                            'APPROVED_INTERNAL_SOURCE',
                            'OFFICIAL_LEGAL_SOURCE',
                            'OFFICIAL_GOVERNMENT_SOURCE',
                            'OFFICIAL_PUBLIC_AUTHORITY_SOURCE',
                            'APPROVED_REFERENCE_SOURCE',
                          ])
                            v: t.t('editorial.evidenceSourceTypeLabels.$v'),
                        },
                        disabled: busy,
                        onChanged: (v) =>
                            setState(() => source['sourceType'] = v),
                      ),
                      field(t, 'title', 'source_title'),
                      field(t, 'publisher', 'publisher'),
                    ],
                  ),
                  field(t, 'claimText', 'claim_text', lines: 3),
                  if (internal)
                    field(t, 'internalReference', 'internal_reference')
                  else
                    field(t, 'url', 'source_url'),
                  field(t, 'jurisdiction', 'jurisdiction'),
                  field(t, 'fingerprint', 'fingerprint'),
                  if (legal)
                    EditorialSelect(
                      label: t.t(
                        'admin.marketing.editorial_authoring_legal_status',
                      ),
                      value: source['legalReviewStatus'],
                      options: {
                        for (final v in [
                          'REQUIRES_REVIEW',
                          'VERIFIED',
                          'REJECTED',
                        ])
                          v: t.t('editorial.legalReviewStatusLabels.$v'),
                      },
                      disabled: busy,
                      onChanged: (v) =>
                          setState(() => source['legalReviewStatus'] = v),
                    ),
                  Text(
                    t.t('admin.marketing.editorial_authoring_source_policy', {
                      'location': t.t(
                        'editorial.sourceLocationLabels.${internal ? 'INTERNAL' : 'EXTERNAL'}',
                      ),
                      'trust': t.t('editorial.sourceTrustLabels.$trust'),
                    }),
                  ),
                  FilledButton(
                    onPressed: busy || !sourceValid ? null : collect,
                    child: Text(
                      t.t('admin.marketing.editorial_authoring_collect_source'),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            const SizedBox(height: 16),
            Text(
              t.t(
                status!['canCreateDraft'] == true
                    ? 'admin.marketing.editorial_authoring_draft_ready'
                    : 'admin.marketing.editorial_authoring_draft_blocked',
              ),
            ),
            FilledButton.icon(
              onPressed:
                  busy ||
                      status!['canCreateDraft'] != true ||
                      status!['articleId'] == null
                  ? null
                  : () => operation(
                      '/admin/marketing/editorial/editor/articles/${status!['articleId']}/draft-requests',
                      {
                        'idempotencyKey': marketingOperationKey(
                          'admin-draft-${status!['articleId']}',
                        ),
                      },
                      'admin.marketing.editorial_authoring_draft_queued',
                    ),
              icon: const Icon(Icons.auto_awesome_outlined),
              label: Text(
                t.t(
                  status!['latestDraftTaskStatus'] == 'FAILED'
                      ? 'admin.marketing.editorial_authoring_retry_draft'
                      : 'admin.marketing.editorial_authoring_generate_draft',
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
