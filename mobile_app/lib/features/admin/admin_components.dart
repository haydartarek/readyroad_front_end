import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/di/service_locator.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/network/authenticated_api_client.dart';
import '../../core/providers/language_provider.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';

typedef AdminRecord = Map<String, dynamic>;

class AdminApi {
  final AuthenticatedApiClient client = getIt<AuthenticatedApiClient>();
  Future<dynamic> get(String path, [AdminRecord? query]) async =>
      (await client.get('/api$path', queryParameters: query)).data;
  Future<dynamic> post(String path, [dynamic data]) async =>
      (await client.post('/api$path', data: data)).data;
  Future<dynamic> put(String path, dynamic data) async =>
      (await client.put('/api$path', data: data)).data;
  Future<dynamic> patch(String path, dynamic data) async =>
      (await client.patch('/api$path', data: data)).data;
  Future<dynamic> delete(String path) async =>
      (await client.delete('/api$path')).data;

  static AdminRecord record(dynamic data) {
    if (data is! Map) throw const FormatException('Expected an object');
    return Map<String, dynamic>.from(data);
  }

  static List<AdminRecord> records(dynamic data) {
    if (data is! List) throw const FormatException('Expected a list');
    return data.map(record).toList();
  }
}

String adminLocalized(BuildContext context, AdminRecord item, String field) {
  final language = context.watch<LanguageProvider>().currentLanguage;
  final suffix = '${language[0].toUpperCase()}${language.substring(1)}';
  for (final value in [
    item['$field$suffix'],
    item['${field}En'],
    item[field],
  ]) {
    if (value != null && value.toString().trim().isNotEmpty) {
      return value.toString();
    }
  }
  return '—';
}

String adminDate(Object? value, String language, {bool includeTime = false}) {
  final date = DateTime.tryParse(value?.toString() ?? '')?.toLocal();
  if (date == null) return '—';
  return includeTime
      ? DateFormat.yMMMd(language).add_Hm().format(date)
      : DateFormat.yMMMd(language).format(date);
}

String adminPercent(Object? value) => value is num ? '${value.round()}%' : '—';

String adminDuration(Object? value, AppLocalizations t) {
  if (value is! num) return '—';
  return '${value.toInt() ~/ 60} ${t.t('admin.learning.minutes')} ${value.toInt() % 60} ${t.t('admin.learning.seconds')}';
}

/// Owner/locale changes invalidate in-flight page responses, including saves.
abstract class AdminPageState<T extends StatefulWidget> extends State<T> {
  final api = AdminApi();
  bool loading = true;
  bool saving = false;
  String? error;
  String? success;
  int revision = 0;
  String? _language;
  bool get reloadOnLanguageChange => true;
  Future<void> load();

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final language = context.watch<LanguageProvider>().currentLanguage;
    if (_language == null ||
        (reloadOnLanguageChange && language != _language)) {
      _language = language;
      load();
    }
  }

  Future<void> fetch(Future<void> Function(int request) operation) async {
    final request = ++revision;
    setState(() {
      loading = true;
      error = null;
    });
    try {
      await operation(request);
    } catch (_) {
      if (mounted && request == revision) {
        setState(() => error = 'admin.error_loading');
      }
    } finally {
      if (mounted && request == revision) setState(() => loading = false);
    }
  }

  Future<void> mutate(
    Future<void> Function() operation, {
    String? successKey,
  }) async {
    if (saving) return;
    final request = revision;
    setState(() {
      saving = true;
      error = null;
      success = null;
    });
    try {
      await operation();
      if (mounted && request == revision) {
        setState(() => success = successKey);
        await load();
      }
    } catch (_) {
      if (mounted && request == revision) {
        setState(() => error = 'common.error_desc');
      }
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  Widget messages() => AdminStatus(
    loading: loading,
    error: error,
    success: success,
    onRetry: load,
  );
}

class AdminStatus extends StatelessWidget {
  const AdminStatus({
    super.key,
    this.loading = false,
    this.error,
    this.success,
    required this.onRetry,
  });
  final bool loading;
  final String? error;
  final String? success;
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (loading) const LinearProgressIndicator(),
        if (error != null)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: RijviaPageSection(
              child: Wrap(
                crossAxisAlignment: WrapCrossAlignment.center,
                spacing: 12,
                children: [
                  Icon(
                    Icons.error_outline,
                    color: Theme.of(context).colorScheme.error,
                  ),
                  Text(t.t(error!)),
                  TextButton(
                    onPressed: onRetry,
                    child: Text(t.t('common.retry')),
                  ),
                ],
              ),
            ),
          ),
        if (success != null)
          Padding(
            padding: const EdgeInsets.all(12),
            child: Text(
              t.t(success!),
              style: const TextStyle(color: Colors.green),
            ),
          ),
      ],
    );
  }
}

class AdminHeader extends StatelessWidget {
  const AdminHeader({
    super.key,
    required this.title,
    required this.icon,
    this.description,
    this.actions = const [],
    this.metrics = const [],
  });
  final String title;
  final String? description;
  final IconData icon;
  final List<Widget> actions;
  final List<Widget> metrics;
  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colors.primary.withValues(alpha: .15)),
        gradient: LinearGradient(
          begin: AlignmentDirectional.topStart,
          end: AlignmentDirectional.bottomEnd,
          colors: [colors.primary.withValues(alpha: .1), colors.surface],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: colors.primary.withValues(alpha: .1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(icon, color: colors.primary),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.headlineMedium
                          ?.copyWith(fontWeight: FontWeight.w900),
                    ),
                    if (description != null) ...[
                      const SizedBox(height: 6),
                      Text(
                        description!,
                        style: TextStyle(color: colors.onSurfaceVariant),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          if (actions.isNotEmpty) ...[
            const SizedBox(height: 20),
            Wrap(spacing: 8, runSpacing: 8, children: actions),
          ],
          if (metrics.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(spacing: 8, runSpacing: 8, children: metrics),
          ],
        ],
      ),
    );
  }
}

class AdminPagination extends StatelessWidget {
  const AdminPagination({
    super.key,
    required this.page,
    required this.pages,
    required this.onPage,
    this.busy = false,
  });
  final int page;
  final int pages;
  final ValueChanged<int> onPage;
  final bool busy;
  @override
  Widget build(BuildContext context) {
    if (pages <= 1) return const SizedBox.shrink();
    final t = AppLocalizations.of(context);
    return Wrap(
      alignment: WrapAlignment.spaceBetween,
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: 8,
      runSpacing: 8,
      children: [
        Text(
          t.t('admin.signs.page_info', {'current': page + 1, 'total': pages}),
        ),
        Wrap(
          children: [
            IconButton(
              tooltip: t.t('common.back_previous'),
              onPressed: busy || page == 0 ? null : () => onPage(0),
              icon: const Icon(Icons.first_page),
            ),
            IconButton(
              tooltip: t.t('common.back_previous'),
              onPressed: busy || page == 0 ? null : () => onPage(page - 1),
              icon: const Icon(Icons.chevron_left),
            ),
            IconButton(
              tooltip: t.t('admin.learning.next'),
              onPressed: busy || page + 1 >= pages
                  ? null
                  : () => onPage(page + 1),
              icon: const Icon(Icons.chevron_right),
            ),
            IconButton(
              tooltip: t.t('admin.learning.next'),
              onPressed: busy || page + 1 >= pages
                  ? null
                  : () => onPage(pages - 1),
              icon: const Icon(Icons.last_page),
            ),
          ],
        ),
      ],
    );
  }
}

Future<bool> adminConfirm(
  BuildContext context,
  String messageKey, {
  String? detail,
}) async {
  final t = AppLocalizations.of(context);
  return await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          content: Text(
            '${t.t(messageKey)}${detail == null ? '' : '\n$detail'}',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: Text(t.t('common.cancel')),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: Text(t.t('common.confirm')),
            ),
          ],
        ),
      ) ??
      false;
}

class AdminTable extends StatelessWidget {
  const AdminTable({
    super.key,
    required this.columns,
    required this.rows,
    this.minWidth = 720,
  });
  final List<String> columns;
  final List<List<Widget>> rows;
  final double minWidth;
  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, box) => SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: ConstrainedBox(
        constraints: BoxConstraints(
          minWidth: box.maxWidth > minWidth ? box.maxWidth : minWidth,
        ),
        child: DataTable(
          headingRowColor: WidgetStatePropertyAll(
            Theme.of(context).colorScheme.surfaceContainerLow,
          ),
          columnSpacing: 24,
          dataRowMinHeight: 64,
          dataRowMaxHeight: double.infinity,
          columns: columns
              .map((label) => DataColumn(label: Text(label)))
              .toList(),
          rows: rows
              .map(
                (cells) => DataRow(
                  cells: cells
                      .map(
                        (cell) => DataCell(
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            child: cell,
                          ),
                        ),
                      )
                      .toList(),
                ),
              )
              .toList(),
        ),
      ),
    ),
  );
}

class AdminValue extends StatelessWidget {
  const AdminValue({
    super.key,
    required this.label,
    required this.value,
    this.color,
  });
  final String label;
  final Object? value;
  final Color? color;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(12),
      color: Theme.of(context).colorScheme.surfaceContainerLow,
      border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(label, style: Theme.of(context).textTheme.bodySmall),
        const SizedBox(height: 4),
        Text(
          value?.toString() ?? '—',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w900,
            color: color,
          ),
        ),
      ],
    ),
  );
}
