import 'dart:math';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart' show NumberFormat;
import 'package:provider/provider.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/providers/language_provider.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import 'admin_components.dart';

String marketingOperationKey(String prefix) {
  final random = Random.secure();
  final bytes = List.generate(16, (_) => random.nextInt(256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  final hex = bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
  return '$prefix-${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}';
}

String marketingKey(String value) => value
    .replaceAllMapped(RegExp(r'([a-z0-9])([A-Z])'), (m) => '${m[1]}_${m[2]}')
    .replaceAll(RegExp(r'[.\s-]+'), '_')
    .replaceAll(RegExp(r'[^a-zA-Z0-9_]'), '')
    .replaceAll(RegExp('_+'), '_')
    .toLowerCase();
String _fallback(String value) => value
    .replaceAllMapped(RegExp(r'([a-z0-9])([A-Z])'), (m) => '${m[1]} ${m[2]}')
    .replaceAll(RegExp(r'[._-]+'), ' ')
    .split(' ')
    .where((word) => word.isNotEmpty)
    .map((word) => '${word[0].toUpperCase()}${word.substring(1).toLowerCase()}')
    .join(' ')
    .replaceAll('Rijvia', 'RijVia');
String marketingDisplay(String value) {
  if (RegExp(
    r'^(sc-domain:)?(?:www\.)?readyroad\.be$',
    caseSensitive: false,
  ).hasMatch(value)) {
    return 'LEGACY_SEARCH_CONSOLE_PROPERTY';
  }
  final uri = Uri.tryParse(value);
  if (uri != null && ['readyroad.be', 'www.readyroad.be'].contains(uri.host)) {
    return '${uri.path}${uri.hasQuery ? '?${uri.query}' : ''}';
  }
  return value
      .replaceAll('OLD_BRAND_READYROAD', 'LEGACY_SOURCE_DOMAIN')
      .replaceAll('READYROAD_CORE_DATA', 'RIJVIA_CORE_DATA')
      .replaceAll('READYROAD_FEATURE', 'RIJVIA_PRODUCT_CAPABILITY')
      .replaceAll(RegExp('ReadyRoad', caseSensitive: false), 'RijVia');
}

String marketingLabel(AppLocalizations t, Object? value, {bool field = false}) {
  if (value == null) return '—';
  final text = marketingDisplay(value.toString());
  final normalized = marketingKey(text);
  if (!field && normalized == 'ga4') return marketingLabel(t, 'google.ga4');
  if (!field && ['ar', 'nl', 'fr', 'en'].contains(normalized)) {
    return t.t('admin.settings_page.language_$normalized');
  }
  final key = 'admin.marketing.${field ? 'field' : 'value'}_$normalized';
  final translated = t.t(key);
  return translated == key ? _fallback(text) : translated;
}

String marketingActor(AppLocalizations t, Object? actor) {
  final text = actor?.toString() ?? '';
  return RegExp(
            r'^(?:worker[:_-].*|SYSTEM(?:_.*)?)$',
            caseSensitive: false,
          ).hasMatch(text) ||
          RegExp(
            r'^(?:[a-z0-9._-]+-)?[0-9a-f]{8}-[0-9a-f-]{27}$',
            caseSensitive: false,
          ).hasMatch(text)
      ? t.t('admin.marketing.automatic_worker')
      : marketingDisplay(text);
}

String marketingFailure(AppLocalizations t, Object? code) {
  final key = switch (code) {
    'OPENAI_QUOTA_EXHAUSTED' => 'error_openai_quota',
    'HTTP_429' || 'RATE_LIMIT' => 'error_rate_limit',
    'OPENAI_API_KEY_MISSING' || 'INVALID_API_KEY' => 'error_openai_credentials',
    'NETWORK_INTERRUPTION' ||
    'TIMEOUT' ||
    'HTTP_502' ||
    'HTTP_503' ||
    'HTTP_504' => 'error_temporary_connection',
    'MALFORMED_STRUCTURED_OUTPUT' => 'error_invalid_content',
    _ => 'error_review_task',
  };
  return t.t('admin.marketing.$key');
}

class MarketingStatus extends StatelessWidget {
  const MarketingStatus(this.value, {super.key});
  final Object? value;
  @override
  Widget build(BuildContext context) {
    final status = value?.toString().toUpperCase() ?? '';
    final color =
        const {
          'ACTIVE',
          'APPROVED',
          'COMPLETED',
          'CONFIGURED',
          'ENABLED',
          'ESTABLISHED',
          'HEALTHY',
          'IMPORTED',
          'PASSED',
          'RELEASED',
          'SUCCESS',
          'VERIFIED',
        }.contains(status)
        ? Colors.green
        : const {
            'BLOCKED',
            'DECLINING',
            'DEGRADED',
            'DISABLED',
            'FAILED',
            'MALFORMED_STRUCTURED_OUTPUT',
            'NETWORK_INTERRUPTION',
            'REJECTED',
          }.contains(status)
        ? Theme.of(context).colorScheme.error
        : const {
            'DISCOVERING',
            'EMERGING',
            'INSUFFICIENT_DATA',
            'MISSING',
            'OPPORTUNITY',
            'PENDING',
            'BLOCKED_PROVIDER_API_OAUTH',
            'PENDING_RELEASE',
            'RETRY_SCHEDULED',
            'SCHEDULED',
            'WAITING_APPROVAL',
          }.contains(status)
        ? Colors.orange
        : Theme.of(context).colorScheme.onSurfaceVariant;
    return Chip(
      label: Text(
        marketingLabel(AppLocalizations.of(context), value),
        style: TextStyle(color: color),
      ),
      backgroundColor: color.withValues(alpha: .08),
      side: BorderSide(color: color.withValues(alpha: .2)),
    );
  }
}

class MarketingList extends StatefulWidget {
  const MarketingList({super.key, required this.children, this.pageSize = 10});
  final List<Widget> children;
  final int pageSize;
  @override
  State<MarketingList> createState() => _MarketingListState();
}

class _MarketingListState extends State<MarketingList> {
  int page = 0;
  @override
  Widget build(BuildContext context) {
    final pages = (widget.children.length / widget.pageSize).ceil();
    final current = pages == 0 ? 0 : page.clamp(0, pages - 1);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (widget.children.isEmpty)
          Text(AppLocalizations.of(context).t('admin.marketing.empty')),
        for (final child
            in widget.children
                .skip(current * widget.pageSize)
                .take(widget.pageSize))
          Padding(padding: const EdgeInsets.only(bottom: 12), child: child),
        AdminPagination(
          page: current,
          pages: pages,
          onPage: (value) => setState(() => page = value),
        ),
      ],
    );
  }
}

const _technicalMarketingFields = {
  'id',
  'uuid',
  'task_id',
  'attempt_id',
  'file_sha256',
  'payload',
  'raw_payload',
  'container_node',
  'pojo',
  'correlation_id',
  'idempotency_key',
};

/// Native equivalent of the web StructuredData/StructuredRecordCard presentation.
class MarketingData extends StatelessWidget {
  const MarketingData(
    this.data, {
    super.key,
    this.title,
    this.field = '',
    this.depth = 0,
  });
  final dynamic data;
  final String? title;
  final String field;
  final int depth;
  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final language = context.watch<LanguageProvider>().currentLanguage;
    Widget content;
    if (data is List) {
      content = MarketingList(
        pageSize: 5,
        children: [
          for (final item in data as List)
            MarketingData(item, field: field, depth: depth + 1),
        ],
      );
    } else if (data is Map) {
      final entries = (data as Map).entries
          .where(
            (entry) =>
                !_technicalMarketingFields.contains(
                  marketingKey(entry.key.toString()),
                ) &&
                entry.value != null &&
                entry.value != '' &&
                !(entry.value is List && (entry.value as List).isEmpty) &&
                !(entry.value is Map && (entry.value as Map).isEmpty),
          )
          .toList();
      content = Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (entries.isEmpty) Text(t.t('admin.marketing.empty')),
          RijviaAdaptiveGrid(
            equalRowHeights: false,
            minCellWidth: 190,
            maxColumns: depth < 2 ? 2 : 1,
            maxCellWidth: double.infinity,
            children: [
              for (final entry in entries.where(
                (e) => e.value is! Map && e.value is! List,
              ))
                Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      marketingLabel(t, entry.key, field: true),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 4),
                    MarketingData(
                      entry.value,
                      field: entry.key.toString(),
                      depth: depth + 1,
                    ),
                    const Divider(),
                  ],
                ),
            ],
          ),
          for (final entry in entries.where(
            (e) => e.value is Map || e.value is List,
          ))
            ExpansionTile(
              tilePadding: EdgeInsets.zero,
              title: Text(marketingLabel(t, entry.key, field: true)),
              children: [
                MarketingData(
                  entry.value,
                  field: entry.key.toString(),
                  depth: depth + 1,
                ),
              ],
            ),
        ],
      );
    } else if (data == null || data == '') {
      content = Text('—', semanticsLabel: t.t('admin.marketing.no_value'));
    } else if (data is bool) {
      content = Text(
        t.t(data == true ? 'admin.marketing.yes' : 'admin.marketing.no'),
      );
    } else if (data is num) {
      final key = marketingKey(field);
      final value = data as num;
      final number = NumberFormat.decimalPattern(language)
        ..maximumFractionDigits = 2;
      final text = key == 'ctr' || key.endsWith('_ctr')
          ? '${number.format(value.abs() <= 1 ? value * 100 : value)}%'
          : key.contains('percent') || key.endsWith('_rate')
          ? '${number.format(value)}%'
          : number.format(value);
      content = Text(
        text,
        textDirection: TextDirection.ltr,
        style: const TextStyle(fontWeight: FontWeight.w700),
      );
    } else {
      final text = marketingDisplay(data.toString());
      final key = marketingKey(field);
      if (RegExp(r'(_at|_date|_time)$').hasMatch(key) &&
          DateTime.tryParse(text) != null) {
        content = Text(adminDate(text, language, includeTime: true));
      } else if (RegExp(r'^[A-Z][A-Z0-9_]+$').hasMatch(text) ||
          [
            'status',
            'state',
            'priority',
            'classification',
            'search_intent',
            'approval_mode',
          ].any(key.contains)) {
        content = Wrap(children: [MarketingStatus(text)]);
      } else {
        content = SelectableText(text);
      }
    }
    return title == null
        ? content
        : RijviaPageSection(title: title, child: content);
  }
}
