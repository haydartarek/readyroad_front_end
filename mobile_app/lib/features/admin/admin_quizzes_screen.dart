import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../../core/localization/app_localizations.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_educational_image.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import 'admin_components.dart';
import 'admin_quiz_draft.dart';

class AdminQuizzesScreen extends StatefulWidget {
  const AdminQuizzesScreen({super.key, this.query = const {}});
  final Map<String, String> query;
  @override
  State<AdminQuizzesScreen> createState() => _AdminQuizzesScreenState();
}

class _AdminQuizzesScreenState extends AdminPageState<AdminQuizzesScreen> {
  List<AdminRecord> questions = [], categories = [];
  AdminRecord? distribution;
  AdminRecord? expanded;
  late int page, size;
  late String query, category, difficulty, hasImage, sortField, sortDir;
  int? total, pages;
  Timer? debounce;
  int? conflictId;
  @override
  void initState() {
    super.initState();
    page = (int.tryParse(widget.query['page'] ?? '') ?? 0).clamp(0, 1000000);
    size = int.tryParse(widget.query['size'] ?? '') ?? 20;
    if (![10, 20, 50].contains(size)) size = 20;
    query = widget.query['q'] ?? '';
    category = widget.query['categoryCode'] ?? '';
    difficulty = widget.query['difficulty'] ?? '';
    hasImage = widget.query['hasImage'] ?? '';
    sortField = widget.query['sortField'] ?? 'createdAt';
    if (![
      'id',
      'questionEn',
      'difficultyLevel',
      'createdAt',
    ].contains(sortField)) {
      sortField = 'createdAt';
    }
    sortDir = widget.query['sortDir'] == 'asc' ? 'asc' : 'desc';
  }

  @override
  void dispose() {
    debounce?.cancel();
    super.dispose();
  }

  AdminRecord get params => {
    'page': page,
    'size': size,
    'sort': '$sortField,$sortDir',
    if (category.isNotEmpty) 'categoryCode': category,
    if (difficulty.isNotEmpty) 'difficulty': difficulty,
    if (hasImage.isNotEmpty) 'hasImage': hasImage,
    if (query.isNotEmpty) 'q': query,
  };
  String get returnTo => Uri(
    path: '/admin/quizzes',
    queryParameters: {
      for (final entry in params.entries)
        if (entry.key != 'sort') entry.key: entry.value.toString(),
      'sortField': sortField,
      'sortDir': sortDir,
    },
  ).toString();
  @override
  Future<void> load() => fetch((request) async {
    final results = await Future.wait([
      api.get('/admin/quiz/questions', params),
      api.get('/admin/quiz/categories'),
      api.get('/admin/quiz/correct-answer-distribution'),
    ]);
    final response = AdminApi.record(results[0]);
    final items = AdminApi.records(response['items']);
    final groups = AdminApi.records(results[1]);
    final dist = AdminApi.record(results[2]);
    if (mounted && request == revision) {
      setState(() {
        questions = items;
        categories = groups;
        distribution = dist;
        total = (response['totalItems'] as num).toInt();
        pages = (response['totalPages'] as num).toInt();
        expanded = null;
      });
    }
  });
  Future<void> _delete(AdminRecord question) async {
    if (!await adminConfirm(
          context,
          'admin.quizzes.delete',
          detail: '#${question['id']}',
        ) ||
        !mounted ||
        saving) {
      return;
    }
    setState(() {
      saving = true;
      error = null;
      conflictId = null;
    });
    try {
      await api.delete('/admin/quiz/questions/${question['id']}');
      if (!mounted) return;
      if (questions.length == 1 && page > 0) page--;
      success = 'admin.quizzes.delete_success';
      await load();
    } on DioException catch (failure) {
      if (!mounted) return;
      setState(() {
        error = failure.response?.statusCode == 409
            ? 'admin.quizzes.delete_conflict'
            : failure.response?.statusCode == 404
            ? 'admin.quizzes.delete_not_found'
            : 'admin.quizzes.delete_failed';
        if (failure.response?.statusCode == 409) {
          conflictId = (question['id'] as num).toInt();
        }
      });
    } catch (_) {
      if (mounted) setState(() => error = 'admin.quizzes.delete_failed');
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  void _edit(int id) =>
      Navigator.pushNamed(
        context,
        Uri(
          path: '/admin/quizzes/$id/edit',
          queryParameters: {'returnTo': returnTo},
        ).toString(),
      ).then((_) {
        if (mounted) load();
      });
  void _filter(VoidCallback update) {
    update();
    page = 0;
    load();
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final dist = distribution;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AdminHeader(
          title: t.t('admin.quizzes.title'),
          description: t.t('admin.quizzes.description'),
          icon: Icons.fact_check_outlined,
          actions: [
            FilledButton.icon(
              onPressed: () =>
                  Navigator.pushNamed(context, '/admin/quizzes/new').then((_) {
                    if (mounted) load();
                  }),
              icon: const Icon(Icons.add),
              label: Text(t.t('admin.quizzes.add_new')),
            ),
          ],
          metrics: [
            if (total != null)
              Chip(label: Text('${t.t('admin.quizzes.total_count')}: $total')),
          ],
        ),
        const SizedBox(height: 20),
        messages(),
        if (conflictId != null)
          RijviaPageSection(
            description: t.t('admin.quizzes.delete_conflict_hint'),
            child: TextButton(
              onPressed: () => _edit(conflictId!),
              child: Text(t.t('admin.quizzes.edit')),
            ),
          ),
        if (dist != null) ...[
          RijviaPageSection(
            title: t.t('admin.quizzes.distribution_title'),
            description: t.t('admin.quizzes.distribution_total', {
              'total': dist['total'] ?? '—',
            }),
            child: RijviaAdaptiveGrid(
              minCellWidth: 160,
              maxColumns: 3,
              maxCellWidth: double.infinity,
              children: [
                for (final position in AdminApi.records(dist['positions']))
                  AdminValue(
                    label: position['label'].toString(),
                    value: '${position['count']} · ${position['percentage']}%',
                  ),
              ],
            ),
          ),
          const SizedBox(height: 20),
        ],
        RijviaAdaptiveGrid(
          equalRowHeights: false,
          minCellWidth: 190,
          maxColumns: 3,
          maxCellWidth: double.infinity,
          children: [
            TextFormField(
              initialValue: query,
              decoration: InputDecoration(
                labelText: t.t('admin.quizzes.search_placeholder'),
                prefixIcon: const Icon(Icons.search),
              ),
              onChanged: (value) {
                debounce?.cancel();
                debounce = Timer(
                  const Duration(milliseconds: 400),
                  () => _filter(() => query = value),
                );
              },
            ),
            DropdownButtonFormField<String>(
              initialValue: categories.any((c) => c['code'] == category)
                  ? category
                  : '',
              isExpanded: true,
              decoration: InputDecoration(
                labelText: t.t('admin.quizzes.col_category'),
              ),
              items: [
                DropdownMenuItem(
                  value: '',
                  child: Text(t.t('admin.quizzes.all_categories')),
                ),
                for (final c in categories)
                  DropdownMenuItem(
                    value: c['code'].toString(),
                    child: Text(adminLocalized(context, c, 'name')),
                  ),
              ],
              onChanged: (v) => _filter(() => category = v ?? ''),
            ),
            DropdownButtonFormField<String>(
              initialValue: AdminQuizDraft.difficulties.contains(difficulty)
                  ? difficulty
                  : '',
              isExpanded: true,
              decoration: InputDecoration(
                labelText: t.t('admin.quizzes.col_difficulty'),
              ),
              items: [
                DropdownMenuItem(
                  value: '',
                  child: Text(t.t('admin.quizzes.all_difficulties')),
                ),
                for (final d in AdminQuizDraft.difficulties)
                  DropdownMenuItem(
                    value: d,
                    child: Text(t.t('difficulty.${d.toLowerCase()}')),
                  ),
              ],
              onChanged: (v) => _filter(() => difficulty = v ?? ''),
            ),
            DropdownButtonFormField<String>(
              initialValue: ['yes', 'no'].contains(hasImage) ? hasImage : '',
              isExpanded: true,
              decoration: InputDecoration(
                labelText: t.t('admin.quizzes.col_image'),
              ),
              items: [
                DropdownMenuItem(
                  value: '',
                  child: Text(t.t('admin.quizzes.all_images')),
                ),
                DropdownMenuItem(
                  value: 'yes',
                  child: Text(t.t('admin.quizzes.has_image')),
                ),
                DropdownMenuItem(
                  value: 'no',
                  child: Text(t.t('admin.quizzes.no_image')),
                ),
              ],
              onChanged: (v) => _filter(() => hasImage = v ?? ''),
            ),
            DropdownButtonFormField<int>(
              initialValue: size,
              isExpanded: true,
              decoration: InputDecoration(
                labelText: t.t('admin.quizzes.per_page'),
              ),
              items: [
                for (final s in [10, 20, 50])
                  DropdownMenuItem(value: s, child: Text(s.toString())),
              ],
              onChanged: (v) => _filter(() => size = v ?? 20),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          children: [
            for (final sort in [
              ('id', 'col_no'),
              ('questionEn', 'col_question'),
              ('difficultyLevel', 'col_difficulty'),
              ('createdAt', 'meta_created'),
            ])
              TextButton.icon(
                onPressed: () {
                  sortDir = sortField == sort.$1 && sortDir == 'asc'
                      ? 'desc'
                      : 'asc';
                  sortField = sort.$1;
                  page = 0;
                  load();
                },
                icon: Icon(
                  sortField == sort.$1
                      ? sortDir == 'asc'
                            ? Icons.arrow_upward
                            : Icons.arrow_downward
                      : Icons.swap_vert,
                  size: 16,
                ),
                label: Text(t.t('admin.quizzes.${sort.$2}')),
              ),
          ],
        ),
        if (!loading && error == null && questions.isEmpty)
          RijviaPageSection(child: Text(t.t('admin.quizzes.no_results'))),
        if (questions.isNotEmpty)
          RijviaPageSection(
            child: AdminTable(
              minWidth: 980,
              columns: [
                for (final key in [
                  'col_no',
                  'col_question',
                  'col_category',
                  'col_difficulty',
                  'col_image',
                  'col_options',
                  'col_availability',
                  'col_actions',
                ])
                  t.t('admin.quizzes.$key'),
              ],
              rows: [
                for (final question in questions)
                  [
                    Text('#${question['id']}'),
                    SizedBox(
                      width: 300,
                      child: Text(
                        adminLocalized(context, question, 'question'),
                      ),
                    ),
                    SizedBox(
                      width: 160,
                      child: Text(
                        adminLocalized(
                          context,
                          categories.firstWhere(
                            (c) => c['code'] == question['categoryCode'],
                            orElse: () => {
                              'nameEn': question['categoryNameEn'],
                            },
                          ),
                          'name',
                        ),
                      ),
                    ),
                    Chip(
                      label: Text(
                        t.t(
                          'difficulty.${question['difficultyLevel'].toString().toLowerCase()}',
                        ),
                      ),
                    ),
                    Icon(
                      question['contentImageUrl']?.toString().isNotEmpty == true
                          ? Icons.image_outlined
                          : Icons.image_not_supported_outlined,
                    ),
                    Text(
                      question['optionsCount']?.toString() ??
                          (question['options'] as List?)?.length.toString() ??
                          '—',
                    ),
                    Text(
                      t.t(
                        question['isActive'] == true
                            ? 'admin.quizzes.active'
                            : 'admin.quizzes.inactive',
                      ),
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          tooltip: t.t('admin.quizzes.col_question'),
                          onPressed: () => setState(
                            () => expanded = expanded?['id'] == question['id']
                                ? null
                                : question,
                          ),
                          icon: Icon(
                            expanded?['id'] == question['id']
                                ? Icons.expand_less
                                : Icons.expand_more,
                          ),
                        ),
                        IconButton(
                          tooltip: t.t('admin.quizzes.edit'),
                          onPressed: () =>
                              _edit((question['id'] as num).toInt()),
                          icon: const Icon(Icons.edit_outlined),
                        ),
                        IconButton(
                          tooltip: t.t('common.delete'),
                          onPressed: saving ? null : () => _delete(question),
                          icon: const Icon(Icons.delete_outline),
                        ),
                      ],
                    ),
                  ],
              ],
            ),
          ),
        if (expanded != null) ...[
          const SizedBox(height: 16),
          _detail(context, expanded!),
        ],
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

  Widget _detail(BuildContext context, AdminRecord question) {
    final t = AppLocalizations.of(context);
    final options = AdminApi.records(question['options'])
      ..sort(
        (a, b) =>
            (a['displayOrder'] as num).compareTo(b['displayOrder'] as num),
      );
    return RijviaPageSection(
      title: '#${question['id']}',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (question['contentImageUrl']?.toString().isNotEmpty == true) ...[
            RijviaEducationalImage(
              url: question['contentImageUrl'].toString(),
              radius: 28,
              label: t.t('admin.quizzes.col_image'),
              maxHeight: 280,
            ),
            const SizedBox(height: 16),
          ],
          for (final suffix in AdminQuizDraft.suffixes)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Directionality(
                textDirection: suffix == 'Ar'
                    ? TextDirection.rtl
                    : TextDirection.ltr,
                child: RijviaPageSection(
                  title: t.t(
                    'admin.settings_page.language_${suffix.toLowerCase()}',
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        question['question$suffix']?.toString() ?? '—',
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 8),
                      for (var i = 0; i < options.length; i++)
                        Text(
                          '${String.fromCharCode(65 + i)}. ${options[i]['text$suffix'] ?? '—'} ${options[i]['isCorrect'] == true ? '✓' : ''}',
                          style: TextStyle(
                            color: options[i]['isCorrect'] == true
                                ? Colors.green
                                : null,
                          ),
                        ),
                      if (question['explanation$suffix']
                              ?.toString()
                              .isNotEmpty ==
                          true) ...[
                        const SizedBox(height: 12),
                        Text(question['explanation$suffix'].toString()),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          if (question['isReferenced'] == true)
            Text(t.t('admin.quizzes.edit_referenced_detail')),
        ],
      ),
    );
  }
}
