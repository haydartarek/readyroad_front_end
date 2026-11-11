import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/providers/language_provider.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import 'admin_components.dart';
import 'admin_file_upload.dart';
import 'marketing_presentation.dart';

typedef MarketingEditorialBuilder =
    Widget Function(
      AdminRecord workspace,
      AdminRecord strategy,
      Future<void> Function() refresh,
    );

class AdminMarketingScreen extends StatefulWidget {
  const AdminMarketingScreen({super.key, required this.editorialBuilder});
  final MarketingEditorialBuilder editorialBuilder;
  @override
  State<AdminMarketingScreen> createState() => _AdminMarketingScreenState();
}

class _AdminMarketingScreenState extends AdminPageState<AdminMarketingScreen> {
  AdminRecord? data;
  String view = 'overview';
  Timer? publicationTimer;
  int publicationFailures = 0;
  final reasons = <int, String>{};
  AdminSelectedFile? workbook;
  AdminRecord policy = {}, thresholds = {};
  static const views = [
    'overview',
    'analytics',
    'youtube',
    'discovery',
    'editorial',
    'seo',
    'agents',
    'tasks',
    'approvals',
    'errors',
    'audit',
    'settings',
  ];
  @override
  bool get reloadOnLanguageChange => false;
  static const policyKeys = [
    'initialBackfillDays',
    'intervalDays',
    'noDataDays',
    'sourceFailureHours',
  ];
  static const thresholdKeys = [
    'windowDays',
    'emergingImpressions',
    'emergingPositionMin',
    'emergingPositionMax',
    'opportunityImpressions',
    'opportunityPositionMin',
    'opportunityPositionMax',
    'establishedPositionMax',
    'establishedClicks',
    'positionDecline',
    'clicksDeclinePercent',
    'ctrDeclinePercent',
    'stableWindows',
  ];
  @override
  void dispose() {
    publicationTimer?.cancel();
    super.dispose();
  }

  @override
  Future<void> load() => fetch((request) async {
    const endpoints = {
      'overview': '/overview',
      'agents': '/agents',
      'tasks': '/tasks',
      'errors': '/errors',
      'audit': '/audit',
      'settings': '/settings',
      'worker': '/worker-health',
      'analyticsStatus': '/analytics/status',
      'analyticsSettings': '/analytics/settings',
      'discovery': '/analytics/organic-discovery',
      'reports': '/analytics/reports',
      'youtubeStatus': '/youtube/status',
      'seo': '/seo-migration/workspace',
      'editorial': '/editorial/editor',
      'strategy': '/strategy',
    };
    final entries = await Future.wait([
      for (final entry in endpoints.entries)
        api
            .get('/admin/marketing${entry.value}', switch (entry.key) {
              'tasks' || 'discovery' => {'limit': 100},
              'errors' || 'audit' => {'limit': 50},
              'reports' => {'limit': 20},
              _ => null,
            })
            .then((value) => MapEntry(entry.key, value)),
    ]);
    if (!mounted || request != revision) return;
    setState(() {
      data = Map.fromEntries(entries);
      final settings = AdminApi.record(data!['analyticsSettings']);
      final defaults = AdminApi.record(settings['values']);
      policy = {
        for (final key in policyKeys)
          if ((settings['policy'][key] ?? defaults[key]) is num)
            key: settings['policy'][key] ?? defaults[key],
      };
      thresholds = {
        for (final key in thresholdKeys)
          if ((settings['thresholds'][key] ?? defaults[key]) is num)
            key: settings['thresholds'][key] ?? defaults[key],
      };
    });
    _schedulePublication();
  });
  void _schedulePublication() {
    publicationTimer?.cancel();
    if (view != 'editorial' || data == null) return;
    final pending = AdminApi.records(data!['editorial']['topics']).any(
      (topic) =>
          [
            'WAITING_APPROVAL',
            'APPROVED',
            'SCHEDULED',
          ].contains(topic['lifecycleState']) &&
          topic['publicationTask'] is Map &&
          ![
            'WAITING_APPROVAL',
            'FAILED',
            'CANCELLED',
            'REJECTED',
          ].contains(topic['publicationTask']['status']),
    );
    if (!pending) return;
    final request = revision;
    publicationTimer = Timer(const Duration(seconds: 3), () async {
      try {
        final workspace = AdminApi.record(
          await api.get('/admin/marketing/editorial/editor'),
        );
        if (!mounted || request != revision || view != 'editorial') return;
        setState(() {
          data!['editorial'] = workspace;
          publicationFailures = 0;
        });
      } catch (_) {
        if (!mounted || request != revision) return;
        if (++publicationFailures >= 3) {
          setState(() => error = 'editorial.cms.publicationRefreshFailed');
          return;
        }
      }
      _schedulePublication();
    });
  }

  Future<void> _action(
    String path, {
    dynamic body,
    bool put = false,
    String successKey = 'admin.marketing.approval_created',
  }) => mutate(() async {
    if (put) {
      await api.put(path, body);
    } else {
      await api.post(path, body);
    }
  }, successKey: successKey);
  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final d = data;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AdminHeader(
          title: t.t('admin.marketing.title'),
          description: t.t('admin.marketing.description'),
          icon: Icons.campaign_outlined,
          actions: [
            OutlinedButton.icon(
              onPressed: loading || saving ? null : load,
              icon: const Icon(Icons.refresh),
              label: Text(t.t('admin.marketing.refresh')),
            ),
          ],
          metrics: [
            if (d != null) MarketingStatus(d['worker']['status']),
            if (d?['overview']['automaticTasksEnabled'] is bool)
              Text(
                t.t(
                  d!['overview']['automaticTasksEnabled'] == true
                      ? 'admin.marketing.automatic_execution'
                      : 'admin.marketing.on_demand_execution',
                ),
              ),
          ],
        ),
        const SizedBox(height: 20),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              for (final item in views)
                Padding(
                  padding: const EdgeInsetsDirectional.only(end: 6),
                  child: ChoiceChip(
                    label: Text(t.t('admin.marketing.tab_$item')),
                    selected: item == view,
                    onSelected: (_) {
                      setState(() => view = item);
                      _schedulePublication();
                    },
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        messages(),
        if (d != null)
          switch (view) {
            'overview' => _overview(context, d),
            'agents' => _agents(context, AdminApi.records(d['agents'])),
            'tasks' => _tasks(context, AdminApi.records(d['tasks']['items'])),
            'approvals' => _approvals(
              context,
              AdminApi.records(
                d['tasks']['items'],
              ).where((task) => task['status'] == 'WAITING_APPROVAL').toList(),
            ),
            'errors' => _errors(context, AdminApi.records(d['errors'])),
            'audit' => _audit(context, AdminApi.records(d['audit'])),
            'analytics' => _analytics(context, d),
            'youtube' => _youtube(context, AdminApi.record(d['youtubeStatus'])),
            'discovery' => _discovery(context, AdminApi.record(d['discovery'])),
            'seo' => _seo(context, AdminApi.record(d['seo'])),
            'settings' => _settings(context, d),
            'editorial' => widget.editorialBuilder(
              AdminApi.record(d['editorial']),
              AdminApi.record(d['strategy']),
              load,
            ),
            _ => const SizedBox.shrink(),
          },
      ],
    );
  }

  Widget _metrics(BuildContext context, List<(String, Object?)> values) =>
      RijviaAdaptiveGrid(
        minCellWidth: 180,
        maxCellWidth: double.infinity,
        children: [
          for (final metric in values)
            AdminValue(
              label: AppLocalizations.of(
                context,
              ).t('admin.marketing.${metric.$1}'),
              value: metric.$2,
            ),
        ],
      );
  Widget _overview(BuildContext context, AdminRecord d) {
    final t = AppLocalizations.of(context);
    final overview = AdminApi.record(d['overview']);
    final worker = AdminApi.record(d['worker']);
    final counts = AdminApi.record(overview['tasksByStatus']);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _metrics(context, [
          ('tasks_today', overview['tasksToday']),
          ('completed', counts['COMPLETED'] ?? 0),
          ('failed', counts['FAILED'] ?? 0),
          ('waiting_approval', counts['WAITING_APPROVAL'] ?? 0),
        ]),
        const SizedBox(height: 20),
        RijviaPageSection(
          title: t.t('admin.marketing.worker_health'),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              MarketingStatus(worker['status']),
              const SizedBox(height: 12),
              _metrics(context, [
                ('active_agents', overview['activeAgents']),
                ('active_workers', worker['activeWorkers']),
                ('running_tasks', worker['runningTasks']),
                ('expired_locks', worker['expiredLocks']),
                (
                  'checked_at',
                  adminDate(
                    worker['checkedAt'],
                    context.watch<LanguageProvider>().currentLanguage,
                    includeTime: true,
                  ),
                ),
              ]),
            ],
          ),
        ),
        const SizedBox(height: 20),
        RijviaPageSection(
          title: t.t('admin.marketing.recent_activity'),
          child: _audit(context, AdminApi.records(overview['recentActivity'])),
        ),
      ],
    );
  }

  Widget _agents(BuildContext context, List<AdminRecord> agents) {
    final t = AppLocalizations.of(context);
    return MarketingList(
      children: [
        for (final agent in agents)
          RijviaPageSection(
            title: marketingLabel(t, agent['agentType']),
            description: t.t(
              'admin.marketing.agent_description_${agent['agentType'].toString().toLowerCase()}',
            ),
            actions: [
              MarketingStatus(
                agent['enabled'] == true ? 'ENABLED' : 'DISABLED',
              ),
              if (agent['agentType'] != 'ADMIN_PLATFORM')
                OutlinedButton(
                  onPressed: saving
                      ? null
                      : () => _action(
                          '/admin/marketing/agents/${Uri.encodeComponent(agent['agentType'].toString())}/enabled',
                          put: true,
                          body: {
                            'enabled': agent['enabled'] != true,
                            'idempotencyKey': marketingOperationKey(
                              'agent-control-${agent['agentType']}',
                            ),
                          },
                        ),
                  child: Text(
                    t.t(
                      agent['enabled'] == true
                          ? 'admin.marketing.request_disable'
                          : 'admin.marketing.request_enable',
                    ),
                  ),
                ),
            ],
            child: _metrics(context, [
              ('tasks_today', agent['tasksToday']),
              ('success_rate', adminPercent(agent['successRate'])),
              ('retries', agent['retryCount']),
              (
                'last_run',
                adminDate(
                  agent['lastRunAt'],
                  context.watch<LanguageProvider>().currentLanguage,
                  includeTime: true,
                ),
              ),
            ]),
          ),
      ],
    );
  }

  Widget _tasks(BuildContext context, List<AdminRecord> tasks) {
    final t = AppLocalizations.of(context);
    return MarketingList(
      children: [
        for (final task in tasks)
          RijviaPageSection(
            title:
                '#${task['id']} · ${marketingLabel(t, task['agentType'])} · ${marketingLabel(t, task['taskType'])}',
            actions: [
              MarketingStatus(task['status']),
              MarketingStatus(task['priority']),
              if (task['status'] == 'FAILED')
                OutlinedButton.icon(
                  onPressed: saving
                      ? null
                      : () => _action(
                          '/admin/marketing/tasks/${task['id']}/retry',
                          successKey: 'admin.marketing.retry_created',
                        ),
                  icon: const Icon(Icons.replay),
                  label: Text(t.t('admin.marketing.retry')),
                ),
            ],
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  adminDate(
                    task['createdAt'],
                    context.watch<LanguageProvider>().currentLanguage,
                    includeTime: true,
                  ),
                ),
                Text(
                  t.t('admin.marketing.attempt_count', {
                    'count': task['attempts'] ?? '—',
                    'max': task['maxAttempts'] ?? '—',
                  }),
                ),
                if (task['errorCode'] != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    marketingLabel(t, task['errorCode']),
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                  Text(marketingFailure(t, task['errorCode'])),
                  if (task['nextRetryAt'] != null)
                    Text(
                      '${t.t('admin.marketing.next_retry')}: ${adminDate(task['nextRetryAt'], context.watch<LanguageProvider>().currentLanguage, includeTime: true)}',
                    ),
                ],
              ],
            ),
          ),
      ],
    );
  }

  Widget _approvals(BuildContext context, List<AdminRecord> tasks) {
    final t = AppLocalizations.of(context);
    return MarketingList(
      children: [
        for (final task in tasks)
          RijviaPageSection(
            title:
                '#${task['id']} · ${marketingLabel(t, task['agentType'])} · ${marketingLabel(t, task['taskType'])}',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                MarketingStatus(task['status']),
                if (task['taskType'] == 'ARTICLE_APPROVAL')
                  TextField(
                    key: ValueKey('reason-${task['id']}'),
                    enabled: !saving,
                    minLines: 3,
                    maxLines: null,
                    maxLength: 1000,
                    decoration: InputDecoration(
                      labelText: t.t(
                        'admin.marketing.editorial_approval_decision_reason',
                      ),
                    ),
                    onChanged: (value) => setState(
                      () => reasons[(task['id'] as num).toInt()] = value,
                    ),
                  ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final decision in ['approve', 'reject'])
                      FilledButton(
                        onPressed:
                            saving ||
                                (task['taskType'] == 'ARTICLE_APPROVAL' &&
                                    (reasons[task['id']]?.trim().isEmpty ??
                                        true))
                            ? null
                            : () => _action(
                                '/admin/marketing/tasks/${task['id']}/$decision',
                                body: {
                                  if (reasons[task['id']]?.trim().isNotEmpty ==
                                      true)
                                    'reason': reasons[task['id']]!.trim(),
                                },
                                successKey: decision == 'approve'
                                    ? 'admin.marketing.approved'
                                    : 'admin.marketing.rejected',
                              ),
                        child: Text(t.t('admin.marketing.$decision')),
                      ),
                  ],
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _errors(BuildContext context, List<AdminRecord> errors) {
    final t = AppLocalizations.of(context);
    return MarketingList(
      children: [
        for (final item in errors)
          RijviaPageSection(
            title: marketingLabel(t, item['eventCode']),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  adminDate(
                    item['createdAt'],
                    context.watch<LanguageProvider>().currentLanguage,
                    includeTime: true,
                  ),
                ),
                const SizedBox(height: 12),
                Text(marketingFailure(t, item['eventCode'])),
                Text(
                  t.t('admin.marketing.task_reference', {
                    'id': item['taskId'] ?? '—',
                  }),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _audit(BuildContext context, List<AdminRecord> items) {
    final t = AppLocalizations.of(context);
    return MarketingList(
      children: [
        for (final item in items)
          RijviaPageSection(
            title: marketingLabel(t, item['eventType']),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (item['entityType'] != null)
                  Text(marketingLabel(t, item['entityType'])),
                Text(marketingActor(t, item['actor'])),
                Text(
                  adminDate(
                    item['createdAt'],
                    context.watch<LanguageProvider>().currentLanguage,
                    includeTime: true,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _analytics(BuildContext context, AdminRecord d) {
    final t = AppLocalizations.of(context);
    final status = AdminApi.record(d['analyticsStatus']);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _metrics(context, [
          (
            'analytics_auth',
            t.t(
              status['serviceAccountConfigured'] == true
                  ? 'admin.marketing.configured'
                  : 'admin.marketing.not_configured',
            ),
          ),
          ('analytics_source', status['ga4PropertyResource']),
          ('analytics_rijvia_property', status['searchConsoleSiteUrl']),
          (
            'latest_data',
            status['latestSearchConsoleDate'] ?? t.t('admin.marketing.never'),
          ),
        ]),
        for (final alert in status['alerts'] as List)
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Text(marketingLabel(t, alert)),
          ),
        const SizedBox(height: 16),
        FilledButton.icon(
          onPressed: saving || status['serviceAccountConfigured'] != true
              ? null
              : () => _action(
                  '/admin/marketing/analytics/sync',
                  body: {
                    'idempotencyKey': marketingOperationKey('analytics-sync'),
                  },
                  successKey: 'admin.marketing.analytics_sync_created',
                ),
          icon: const Icon(Icons.refresh),
          label: Text(t.t('admin.marketing.analytics_sync')),
        ),
        const SizedBox(height: 20),
        MarketingData(
          status['sources'],
          title: t.t('admin.marketing.analytics_sources'),
        ),
        const SizedBox(height: 20),
        RijviaPageSection(
          title: t.t('admin.marketing.analytics_thresholds'),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              RijviaAdaptiveGrid(
                equalRowHeights: false,
                minCellWidth: 220,
                maxCellWidth: double.infinity,
                children: [
                  for (final group in [policy, thresholds])
                    for (final entry in group.entries)
                      TextFormField(
                        key: ValueKey('analytics-${entry.key}-$revision'),
                        initialValue: entry.value.toString(),
                        enabled: !saving,
                        keyboardType: const TextInputType.numberWithOptions(
                          decimal: true,
                        ),
                        decoration: InputDecoration(
                          labelText: t.t(
                            'admin.marketing.analytics_${entry.key}',
                          ),
                        ),
                        onChanged: (value) =>
                            group[entry.key] = num.tryParse(value),
                      ),
                ],
              ),
              const SizedBox(height: 16),
              OutlinedButton(
                onPressed: saving
                    ? null
                    : () {
                        if ([
                          ...policy.values,
                          ...thresholds.values,
                        ].any((v) => v is! num || !v.isFinite || v < 0)) {
                          setState(
                            () => error = 'admin.marketing.action_failed',
                          );
                          return;
                        }
                        _action(
                          '/admin/marketing/analytics/settings',
                          put: true,
                          body: {
                            'policy': policy,
                            'thresholds': thresholds,
                            'idempotencyKey': marketingOperationKey(
                              'analytics-settings',
                            ),
                          },
                          successKey:
                              'admin.marketing.analytics_settings_saved',
                        );
                      },
                child: Text(t.t('admin.marketing.save_settings')),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        MarketingData(
          d['reports'],
          title: t.t('admin.marketing.analytics_reports'),
        ),
      ],
    );
  }

  Widget _youtube(BuildContext context, AdminRecord status) {
    final t = AppLocalizations.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _metrics(context, [
          ('youtube_channel', status['channelHandle']),
          ('youtube_videos', status['videoCount']),
          ('youtube_packages', status['contentPackageCount']),
          ('youtube_social_drafts', status['socialDraftCount']),
        ]),
        const SizedBox(height: 20),
        RijviaPageSection(
          title: t.t('admin.marketing.youtube_monitor'),
          description: t.t('admin.marketing.youtube_interval', {
            'hours': status['monitoringIntervalHours'] ?? '—',
          }),
          actions: [
            FilledButton.icon(
              onPressed: saving || status['apiKeyConfigured'] != true
                  ? null
                  : () => _action(
                      '/admin/marketing/youtube/sync',
                      body: {
                        'idempotencyKey': marketingOperationKey('youtube-sync'),
                      },
                      successKey: 'admin.marketing.youtube_sync_created',
                    ),
              icon: const Icon(Icons.refresh),
              label: Text(t.t('admin.marketing.youtube_sync')),
            ),
          ],
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              MarketingStatus(
                status['apiKeyConfigured'] == true
                    ? 'CONFIGURED'
                    : 'NOT_CONFIGURED',
              ),
              if (status['readOnly'] == true)
                Text(t.t('admin.marketing.read_only')),
              Text(
                '${t.t('admin.marketing.youtube_channel_id')}: ${status['channelId']}',
              ),
              ExpansionTile(
                title: Text(t.t('admin.marketing.details')),
                children: [MarketingData(status['latestSync'])],
              ),
            ],
          ),
        ),
        for (final section in [
          ('latestVideos', 'youtube_latest'),
          ('bestVideos', 'youtube_best'),
        ]) ...[
          const SizedBox(height: 20),
          RijviaPageSection(
            title: t.t('admin.marketing.${section.$2}'),
            child: MarketingList(
              pageSize: 5,
              children: [
                for (final video in AdminApi.records(status[section.$1]))
                  RijviaPageSection(
                    title: video['title']?.toString(),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          '${t.t('admin.marketing.youtube_views')}: ${video['view_count'] ?? '—'}',
                        ),
                        ExpansionTile(
                          title: Text(t.t('admin.marketing.details')),
                          children: [MarketingData(video)],
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

  Widget _discovery(BuildContext context, AdminRecord d) {
    final t = AppLocalizations.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final section in [
          ('opportunities', 'opportunities'),
          ('contentGaps', 'content_gaps'),
          ('queryClassifications', 'query_classifications'),
          ('languages', 'language_performance'),
          ('devices', 'device_performance'),
        ])
          Padding(
            padding: const EdgeInsets.only(bottom: 20),
            child: MarketingData(
              d[section.$1],
              title: t.t('admin.marketing.${section.$2}'),
            ),
          ),
      ],
    );
  }

  Future<void> _chooseWorkbook() async {
    try {
      final selected = await AdminFileUpload.workbook();
      if (mounted && selected != null) setState(() => workbook = selected);
    } on AdminFileSelectionException catch (failure) {
      if (mounted) setState(() => error = failure.messageKey);
    } catch (_) {
      if (mounted) setState(() => error = 'admin.marketing.seo_import_failed');
    }
  }

  Future<void> _importWorkbook() async {
    if (saving ||
        workbook == null ||
        data?['seo']['localImportEnabled'] != true) {
      return;
    }
    await mutate(() async {
      final selected = workbook!;
      final form = FormData.fromMap({
        'file': MultipartFile.fromBytes(
          selected.bytes,
          filename: selected.name,
          contentType: DioMediaType.parse(selected.mimeType),
        ),
      });
      await api.client.post(
        '/api/admin/marketing/seo-migration/import',
        data: form,
        options: Options(contentType: 'multipart/form-data'),
      );
    }, successKey: 'admin.marketing.seo_import_complete');
  }

  Widget _seo(BuildContext context, AdminRecord workspace) {
    final t = AppLocalizations.of(context);
    final latest = AdminApi.record(workspace['latestImport']);
    final counts = latest['sheetCounts'] is Map
        ? AdminApi.record(latest['sheetCounts'])
        : <String, dynamic>{};
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _metrics(context, [
          (
            'seo_snapshot',
            latest['status'] == null
                ? t.t('admin.marketing.never')
                : marketingLabel(t, latest['status']),
          ),
          ('seo_queries', counts['طلبات البحث'] ?? 0),
          ('seo_pages', counts['الصفحات'] ?? 0),
          ('seo_canonical', workspace['targetDomain']),
        ]),
        const SizedBox(height: 20),
        MarketingStatus(workspace['canonicalActivation']),
        const SizedBox(height: 20),
        RijviaPageSection(
          title: t.t('admin.marketing.seo_import_title'),
          description: t.t('admin.marketing.seo_import_description'),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (latest['sourceFileName'] != null)
                Text(
                  '${marketingDisplay(latest['sourceFileName'].toString())} · ${latest['periodStart']} — ${latest['periodEnd']}',
                ),
              if (latest['importedAt'] != null)
                Text(
                  adminDate(
                    latest['importedAt'],
                    context.watch<LanguageProvider>().currentLanguage,
                    includeTime: true,
                  ),
                ),
              if (workspace['localImportEnabled'] == true)
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    OutlinedButton.icon(
                      onPressed: saving ? null : _chooseWorkbook,
                      icon: const Icon(Icons.upload_file),
                      label: Text(
                        workbook?.name ??
                            t.t('admin.marketing.seo_choose_file'),
                      ),
                    ),
                    FilledButton(
                      onPressed: saving || workbook == null
                          ? null
                          : _importWorkbook,
                      child: Text(t.t('admin.marketing.seo_import')),
                    ),
                  ],
                )
              else
                const MarketingStatus('IMPORT_DISABLED'),
            ],
          ),
        ),
        const SizedBox(height: 20),
        MarketingData(
          workspace['opportunities'],
          title: t.t('admin.marketing.opportunities'),
        ),
        for (final section in [
          ('migrationReadiness', 'migration_readiness'),
          ('internalLinks', 'internal_links'),
          ('contentBacklog', 'content_backlog'),
          ('strategy', 'strategy_context'),
          ('authority', 'authority'),
          ('social', 'social'),
        ])
          Padding(
            padding: const EdgeInsets.only(top: 16),
            child: RijviaPageSection(
              child: ExpansionTile(
                title: Text(t.t('admin.marketing.seo_${section.$2}')),
                children: [MarketingData(workspace[section.$1])],
              ),
            ),
          ),
        if ((workspace['ownerDecisionsRequired'] as List).isNotEmpty) ...[
          const SizedBox(height: 20),
          RijviaPageSection(
            title: t.t('admin.marketing.seo_owner_decisions'),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                for (final decision
                    in workspace['ownerDecisionsRequired'] as List)
                  Text('• ${marketingLabel(t, decision)}'),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _settings(BuildContext context, AdminRecord d) {
    final t = AppLocalizations.of(context);
    final worker = AdminApi.record(d['worker']);
    final settings = AdminApi.record(d['settings']);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        RijviaPageSection(
          title: t.t('admin.marketing.runtime_settings'),
          child: _metrics(context, [
            ('poll_interval', '${worker['pollIntervalMs']} ms'),
            ('batch_size', worker['batchSize']),
            ('lock_ttl', '${worker['lockTtlSeconds']} s'),
            ('expired_locks', worker['expiredLocks']),
          ]),
        ),
        const SizedBox(height: 20),
        RijviaPageSection(
          title: t.t('admin.marketing.agent_settings'),
          child: MarketingList(
            pageSize: 5,
            children: [
              for (final setting in AdminApi.records(settings['settings']))
                RijviaPageSection(
                  title: marketingLabel(t, setting['key']),
                  description: marketingLabel(t, setting['agentType']),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      ExpansionTile(
                        title: Text(t.t('admin.marketing.details')),
                        children: [MarketingData(setting['value'])],
                      ),
                      Text(
                        '${t.t('admin.marketing.updated')}: ${adminDate(setting['updatedAt'], context.watch<LanguageProvider>().currentLanguage, includeTime: true)}',
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        RijviaPageSection(
          title: t.t('admin.marketing.schedules'),
          child: MarketingList(
            children: [
              for (final schedule in AdminApi.records(settings['schedules']))
                RijviaPageSection(
                  title: marketingLabel(t, schedule['key']),
                  description: schedule['intervalDays'] == null
                      ? t.t('admin.marketing.schedule_defined')
                      : t.t('admin.marketing.schedule_every_days', {
                          'count': schedule['intervalDays'],
                        }),
                  actions: [
                    MarketingStatus(
                      schedule['enabled'] == true ? 'ENABLED' : 'DISABLED',
                    ),
                  ],
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _metrics(context, [
                        (
                          'next_run',
                          adminDate(
                            schedule['nextRunAt'],
                            context.watch<LanguageProvider>().currentLanguage,
                            includeTime: true,
                          ),
                        ),
                        (
                          'last_run',
                          adminDate(
                            schedule['lastRunAt'],
                            context.watch<LanguageProvider>().currentLanguage,
                            includeTime: true,
                          ),
                        ),
                      ]),
                      const SizedBox(height: 12),
                      Text(
                        '${marketingLabel(t, schedule['taskType'])} · ${schedule['zoneId']}',
                      ),
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
