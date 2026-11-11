import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/providers/language_provider.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_category_image.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import 'admin_components.dart';

class AdminSignsScreen extends StatefulWidget {
  const AdminSignsScreen({super.key, this.query = const {}});
  final Map<String, String> query;
  @override
  State<AdminSignsScreen> createState() => _AdminSignsScreenState();
}

class _AdminSignsScreenState extends AdminPageState<AdminSignsScreen> {
  List<AdminRecord> signs = [], categories = [];
  late int page, size;
  late String category, search, sortField, sortDir;
  int? total, pages;
  Timer? debounce;
  int? expandedId;
  @override
  void initState() {
    super.initState();
    page = (int.tryParse(widget.query['page'] ?? '') ?? 0).clamp(0, 1000000);
    size = int.tryParse(widget.query['size'] ?? '') ?? 20;
    if (![10, 20, 50].contains(size)) size = 20;
    category = widget.query['categoryCode'] ?? '';
    search = widget.query['q'] ?? '';
    sortField = widget.query['sortField'] ?? 'signCode';
    if (![
      'signCode',
      'categoryCode',
      'nameEn',
      'nameAr',
      'nameNl',
      'nameFr',
    ].contains(sortField)) {
      sortField = 'signCode';
    }
    sortDir = widget.query['sortDir'] == 'desc' ? 'desc' : 'asc';
  }

  @override
  void dispose() {
    debounce?.cancel();
    super.dispose();
  }

  @override
  Future<void> load() => fetch((request) async {
    final results = await Future.wait([
      api.get('/admin/signs', {
        'page': page,
        'size': size,
        'sort': '$sortField,$sortDir',
        if (category.isNotEmpty) 'categoryCode': category,
        if (search.isNotEmpty) 'q': search,
      }),
      api.get('/categories'),
    ]);
    final result = AdminApi.record(results[0]);
    final items = AdminApi.records(result['items']);
    final groups = AdminApi.records(results[1]);
    if (mounted && request == revision) {
      setState(() {
        signs = items;
        categories = groups;
        total = (result['totalItems'] as num).toInt();
        pages = (result['totalPages'] as num).toInt();
      });
    }
  });
  void _sort(String field) {
    setState(() {
      sortDir = sortField == field && sortDir == 'asc' ? 'desc' : 'asc';
      sortField = field;
      page = 0;
    });
    load();
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final lang = context.watch<LanguageProvider>().currentLanguage;
    final categoryCodes = categories
        .map((c) => c['code']?.toString())
        .whereType<String>()
        .toSet();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AdminHeader(
          title: t.t('admin.signs.title'),
          description: t.t('admin.signs.description'),
          icon: Icons.traffic_outlined,
          metrics: [
            if (total != null)
              Chip(label: Text('${t.t('admin.signs.total_count')}: $total')),
          ],
        ),
        const SizedBox(height: 24),
        RijviaAdaptiveGrid(
          equalRowHeights: false,
          minCellWidth: 220,
          maxColumns: 3,
          maxCellWidth: double.infinity,
          children: [
            TextFormField(
              initialValue: search,
              decoration: InputDecoration(
                labelText: t.t('admin.signs.search_placeholder'),
                prefixIcon: const Icon(Icons.search),
              ),
              onChanged: (value) {
                debounce?.cancel();
                debounce = Timer(const Duration(milliseconds: 400), () {
                  search = value;
                  page = 0;
                  load();
                });
              },
            ),
            DropdownButtonFormField<String>(
              initialValue: categoryCodes.contains(category) ? category : '',
              isExpanded: true,
              decoration: InputDecoration(
                labelText: t.t('admin.signs.col_category'),
              ),
              items: [
                DropdownMenuItem(
                  value: '',
                  child: Text(t.t('admin.signs.all_categories')),
                ),
                for (final c in categories)
                  DropdownMenuItem(
                    value: c['code'].toString(),
                    child: Text(
                      '${adminLocalized(context, c, 'name')} (${c['code']})',
                    ),
                  ),
              ],
              onChanged: (v) {
                category = v ?? '';
                page = 0;
                load();
              },
            ),
            DropdownButtonFormField<int>(
              initialValue: size,
              isExpanded: true,
              decoration: InputDecoration(
                labelText: t.t('admin.signs.per_page'),
              ),
              items: [
                for (final value in [10, 20, 50])
                  DropdownMenuItem(
                    value: value,
                    child: Text('$value ${t.t('admin.signs.per_page')}'),
                  ),
              ],
              onChanged: (v) {
                size = v ?? 20;
                page = 0;
                load();
              },
            ),
          ],
        ),
        const SizedBox(height: 12),
        messages(),
        if (total != null)
          Text(
            '${t.t('admin.signs.showing')} ${total! == 0 ? 0 : page * size + 1}–${((page + 1) * size).clamp(0, total!)} ${t.t('admin.signs.of')} $total',
          ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          children: [
            for (final sort in [
              ('signCode', 'col_code'),
              ('name${lang[0].toUpperCase()}${lang.substring(1)}', 'col_name'),
              ('categoryCode', 'col_category'),
            ])
              TextButton.icon(
                onPressed: () => _sort(sort.$1),
                icon: Icon(
                  sortField == sort.$1
                      ? sortDir == 'asc'
                            ? Icons.arrow_upward
                            : Icons.arrow_downward
                      : Icons.swap_vert,
                  size: 16,
                ),
                label: Text(t.t('admin.signs.${sort.$2}')),
              ),
          ],
        ),
        if (!loading && error == null && signs.isEmpty)
          RijviaPageSection(child: Text(t.t('admin.signs.no_results'))),
        AdminTable(
          columns: [
            for (final key in [
              'col_image',
              'col_code',
              'col_name',
              'col_category',
              'col_actions',
            ])
              t.t('admin.signs.$key'),
          ],
          rows: [
            for (final sign in signs)
              [
                RijviaSignImage(
                  url: sign['imageUrl']?.toString(),
                  label: sign['signCode']?.toString() ?? '',
                  size: 44,
                ),
                Text(
                  sign['signCode']?.toString() ?? '—',
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(adminLocalized(context, sign, 'name')),
                Chip(label: Text(sign['categoryCode']?.toString() ?? '—')),
                IconButton(
                  tooltip: t.t('admin.signs.col_actions'),
                  onPressed: () => setState(
                    () => expandedId = expandedId == sign['id']
                        ? null
                        : sign['id'],
                  ),
                  icon: Icon(
                    expandedId == sign['id']
                        ? Icons.keyboard_arrow_up
                        : Icons.keyboard_arrow_down,
                  ),
                ),
              ],
          ],
        ),
        for (final sign in signs.where((sign) => sign['id'] == expandedId))
          Padding(
            padding: const EdgeInsets.only(top: 12, bottom: 12),
            child: RijviaPageSection(
              title:
                  '${sign['signCode']} · ${adminLocalized(context, sign, 'name')}',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  RijviaAdaptiveGrid(
                    equalRowHeights: false,
                    minCellWidth: 210,
                    maxCellWidth: double.infinity,
                    children: [
                      for (final language in ['en', 'ar', 'nl', 'fr'])
                        Directionality(
                          textDirection: language == 'ar'
                              ? TextDirection.rtl
                              : TextDirection.ltr,
                          child: RijviaPageSection(
                            title: t.t(
                              'admin.settings_page.language_$language',
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Text(
                                  sign['name${language[0].toUpperCase()}${language.substring(1)}']
                                          ?.toString() ??
                                      '—',
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  sign['description${language[0].toUpperCase()}${language.substring(1)}']
                                          ?.toString() ??
                                      '',
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  SelectableText(
                    '${t.t('admin.signs.meta_url')}: ${sign['imageUrl'] ?? '—'}',
                  ),
                  Text(
                    '${t.t('admin.signs.meta_status')}: ${t.t(sign['isActive'] == true ? 'admin.signs.active' : 'admin.signs.inactive')}',
                  ),
                  for (final date in [
                    ('createdAt', 'meta_created'),
                    ('updatedAt', 'meta_updated'),
                  ])
                    if (sign[date.$1] != null)
                      Text(
                        '${t.t('admin.signs.${date.$2}')}: ${sign[date.$1]}',
                      ),
                ],
              ),
            ),
          ),
        if (pages != null)
          AdminPagination(
            page: page,
            pages: pages!,
            busy: loading,
            onPage: (value) {
              page = value;
              load();
            },
          ),
      ],
    );
  }
}
