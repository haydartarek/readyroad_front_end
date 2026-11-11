import '../../design_system/rijvia_tokens.dart';
import '../../design_system/widgets/rijvia_educational_image.dart';
import '../auth/presentation/bloc/auth_bloc.dart';
import '../auth/presentation/bloc/auth_state.dart';
import '../../design_system/widgets/rijvia_app_bar.dart';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/di/service_locator.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/providers/language_provider.dart';
import 'lesson_service.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_content.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import '../../design_system/widgets/rijvia_web_navigation.dart';

class LessonsListScreen extends StatefulWidget {
  final String? initialLessonCode;

  const LessonsListScreen({super.key, this.initialLessonCode});

  @override
  State<LessonsListScreen> createState() => _LessonsListScreenState();
}

class _LessonsListScreenState extends State<LessonsListScreen> {
  final LessonService _lessonService = getIt<LessonService>();
  final TextEditingController _searchController = TextEditingController();
  Timer? _searchDebounce;
  List<LessonSummary> _lessons = const [];
  bool _isLoading = true;
  bool _isSearching = false;
  String? _error;
  List<Map<String, dynamic>> _overview = [];
  String? _overviewLanguage;
  int _overviewRevision = 0;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final language = context.watch<LanguageProvider>().currentLanguage;
    if (_overviewLanguage != language) {
      _overviewLanguage = language;
      _loadOverview(language);
    }
  }

  Future<void> _loadOverview(String language) async {
    final revision = ++_overviewRevision;
    try {
      final overview = await _lessonService.getHomeOverview(language);
      if (mounted && revision == _overviewRevision) {
        setState(() => _overview = overview);
      }
    } catch (_) {
      if (mounted && revision == _overviewRevision) {
        setState(() => _overview = []);
      }
    }
  }

  @override
  void initState() {
    super.initState();
    _loadLessons();
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadLessons({String? query}) async {
    setState(() {
      _isLoading = true;
      _error = null;
      _isSearching = query != null && query.trim().isNotEmpty;
    });
    try {
      final normalizedQuery = query?.trim() ?? '';
      final lessons = normalizedQuery.isEmpty
          ? await _lessonService.getAllLessons()
          : await _lessonService.searchLessons(normalizedQuery);
      if (!mounted) return;
      setState(() {
        _lessons = lessons;
        _isLoading = false;
        _isSearching = false;
      });
      final code = widget.initialLessonCode;
      if (code != null && mounted) {
        final matchIndex = lessons.indexWhere(
          (lesson) => lesson.lessonCode == code,
        );
        final match = matchIndex < 0 ? null : lessons[matchIndex];
        if (match != null) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => LessonDetailScreen(
                    lesson: match,
                    lessons: lessons,
                    index: matchIndex,
                  ),
                ),
              );
            }
          });
        }
      }
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.toString();
        _isLoading = false;
        _isSearching = false;
      });
    }
  }

  void _onSearchChanged(String value) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 350), () {
      if (mounted) _loadLessons(query: value);
    });
  }

  void _clearSearch() {
    _searchController.clear();
    _loadLessons();
  }

  @override
  Widget build(BuildContext context) {
    final language = Provider.of<LanguageProvider>(context).currentLanguage;
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      appBar: const RijviaAppBar(),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? _ErrorView(onRetry: _loadLessons)
          : RefreshIndicator(
              onRefresh: _loadLessons,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  RijviaPageHero(
                    title: l10n.t('lessons.page_title'),
                    description: l10n.t('lessons.page_subtitle'),
                  ),
                  const SizedBox(height: 24),
                  TextField(
                    controller: _searchController,
                    onChanged: _onSearchChanged,
                    decoration: InputDecoration(
                      labelText: l10n.t('lessons.search'),
                      prefixIcon: const Icon(Icons.search),
                      suffixIcon: _searchController.text.isEmpty
                          ? null
                          : IconButton(
                              tooltip: l10n.t('lessons.clear_search'),
                              onPressed: _clearSearch,
                              icon: const Icon(Icons.clear),
                            ),
                      border: const OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 8),
                  if (_isSearching)
                    const LinearProgressIndicator(minHeight: 2)
                  else
                    Text(
                      '${_lessons.length} ${l10n.t('lessons.result_count')}',
                    ),
                  const SizedBox(height: 12),
                  if (_lessons.isEmpty)
                    Center(
                      child: Text(
                        _searchController.text.isEmpty
                            ? l10n.t('lessons.content')
                            : l10n.t('lessons.no_results'),
                      ),
                    )
                  else
                    RijviaAdaptiveGrid(
                      minCellWidth: 260,
                      maxColumns: 3,
                      children: _lessons
                          .asMap()
                          .entries
                          .map(
                            (entry) => _LessonCard(
                              lesson: entry.value,
                              language: language,
                              lessons: _lessons,
                              index: entry.key,
                              theoryCategory:
                                  (_overview
                                                  .where(
                                                    (item) =>
                                                        item['id'] ==
                                                        entry.value.id,
                                                  )
                                                  .firstOrNull?['categories']
                                              as List? ??
                                          [])
                                      .whereType<Map>()
                                      .where(
                                        (category) =>
                                            category['primary'] == true,
                                      )
                                      .firstOrNull,
                            ),
                          )
                          .toList(),
                    ),
                  const SizedBox(height: 32),
                  const RijviaWebFooter(),
                ],
              ),
            ),
    );
  }
}

class _LessonCard extends StatelessWidget {
  const _LessonCard({
    required this.lesson,
    required this.language,
    required this.lessons,
    required this.index,
    this.theoryCategory,
  });
  final LessonSummary lesson;
  final String language;
  final List<LessonSummary> lessons;
  final int index;
  final Map? theoryCategory;
  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: BorderSide(color: Theme.of(context).colorScheme.outlineVariant),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            height: 4,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Theme.of(context).colorScheme.primary,
                  Theme.of(context).colorScheme.secondary.withValues(alpha: .5),
                ],
              ),
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      Chip(
                        label: Text(
                          '${t.t('lessons.lesson')} ${lesson.displayOrder}',
                        ),
                      ),
                      if (lesson.totalPages > 0)
                        Chip(
                          label: Text(
                            '${lesson.totalPages} ${t.t('lessons.pages')}',
                          ),
                        ),
                      if (lesson.estimatedMinutes > 0)
                        Chip(
                          label: Text(
                            '${lesson.estimatedMinutes} ${t.t('lessons.minutes_short')}',
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    lesson.titleFor(language),
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  ConstrainedBox(
                    constraints: const BoxConstraints(minHeight: 72),
                    child: Text(
                      lesson.descriptionFor(language),
                      style: TextStyle(
                        height: 1.6,
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                  const Spacer(),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      FilledButton(
                        onPressed: () => Navigator.pushNamed(
                          context,
                          '/lessons/${Uri.encodeComponent(lesson.lessonCode)}',
                        ),
                        child: Text(t.t('lessons.read_lesson')),
                      ),
                      if (theoryCategory != null)
                        OutlinedButton(
                          onPressed: () => Navigator.pushNamed(
                            context,
                            '/exam?category=${theoryCategory!['categoryCode']}',
                          ),
                          child: Text(t.t('category_exam.start')),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class LessonDetailScreen extends StatefulWidget {
  final LessonSummary? lesson;
  final String? lessonCode;
  final List<LessonSummary> lessons;
  final int index;

  const LessonDetailScreen({
    super.key,
    this.lesson,
    this.lessonCode,
    this.lessons = const [],
    this.index = 0,
  }) : assert(lesson != null || lessonCode != null);

  @override
  State<LessonDetailScreen> createState() => _LessonDetailScreenState();
}

class _LessonDetailScreenState extends State<LessonDetailScreen> {
  final LessonService _lessonService = getIt<LessonService>();
  final ScrollController _scrollController = ScrollController();
  final GlobalKey _viewportKey = GlobalKey();
  final List<GlobalKey> _sectionKeys = [];
  final Set<int> _readSections = {};
  final Set<int> _savingSections = {};
  LessonDetail? _detail;
  LessonProgress? _progress;
  bool _isLoading = true;
  String? _error;
  int _activeSection = -1;
  bool _scrollCheckScheduled = false;
  bool _progressFailed = false;
  late List<LessonSummary> _relatedLessons = widget.lessons;
  String get _lessonCode => widget.lesson?.lessonCode ?? widget.lessonCode!;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_scheduleVisibleSectionCheck);
    _loadDetail();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadDetail() async {
    try {
      _progressFailed = false;
      final detail = await _lessonService.getLessonByCode(_lessonCode);
      LessonProgress? progress;
      if (getIt<AuthBloc>().state is Authenticated) {
        try {
          progress = await _lessonService.getLessonProgress(_lessonCode);
        } catch (_) {
          _progressFailed = true;
          // The lesson remains readable when progress is unavailable.
        }
      }
      if (_relatedLessons.isEmpty) {
        try {
          _relatedLessons = await _lessonService.getAllLessons();
        } catch (_) {
          /* Reading remains available when the surrounding catalog is unavailable. */
        }
      }
      if (!mounted) return;
      setState(() {
        _detail = detail;
        _progress = progress;
        _sectionKeys.clear();
        _sectionKeys.addAll(
          List.generate(detail.pages.length, (_) => GlobalKey()),
        );
        _readSections.clear();
        _readSections.addAll(
          List.generate(
            (progress?.pagesRead ?? 0).clamp(0, detail.pages.length),
            (index) => index,
          ),
        );
        _activeSection = -1;
        _isLoading = false;
        _error = null;
      });
      WidgetsBinding.instance.addPostFrameCallback(
        (_) => _recordVisibleSection(),
      );
    } catch (error) {
      if (mounted) {
        setState(() {
          _error = error.toString();
          _isLoading = false;
        });
      }
    }
  }

  void _recordVisibleSection() {
    if (!mounted || getIt<AuthBloc>().state is! Authenticated) return;
    final viewport = _viewportKey.currentContext?.findRenderObject();
    if (viewport is! RenderBox || !viewport.hasSize) return;
    final top = viewport.localToGlobal(Offset.zero).dy;
    var candidate = -1;
    final atEnd =
        _scrollController.hasClients &&
        _scrollController.position.extentAfter <= 1;
    for (var index = 0; index < _sectionKeys.length; index++) {
      final section = _sectionKeys[index].currentContext?.findRenderObject();
      if (section is! RenderBox || !section.hasSize) continue;
      final y = section.localToGlobal(Offset.zero).dy - top;
      final bottom = y + section.size.height;
      if (y < viewport.size.height &&
          bottom > 80 &&
          (y < viewport.size.height * 0.5 ||
              bottom <= viewport.size.height ||
              atEnd)) {
        candidate = index;
      }
    }
    if (candidate >= 0 && candidate != _activeSection) {
      _activeSection = candidate;
      unawaited(_markPageRead(candidate));
    }
  }

  void _scheduleVisibleSectionCheck() {
    if (_scrollCheckScheduled) return;
    _scrollCheckScheduled = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _scrollCheckScheduled = false;
      _recordVisibleSection();
    });
  }

  Future<void> _markPageRead(int index) async {
    final detail = _detail;
    if (detail == null ||
        _readSections.contains(index) ||
        !_savingSections.add(index)) {
      return;
    }
    try {
      final progress = await _lessonService.markPageRead(
        detail.lessonCode,
        detail.pages.length,
        detail.pages[index].pageNumber,
      );
      if (!mounted) return;
      setState(() {
        if (progress.pagesRead >= (_progress?.pagesRead ?? 0)) {
          _progress = progress;
          _progressFailed = false;
        }
        _readSections.addAll(
          List.generate(
            progress.pagesRead.clamp(0, detail.pages.length),
            (index) => index,
          ),
        );
      });
    } catch (_) {
      // Do not invent completed sections when persistence fails.
    } finally {
      _savingSections.remove(index);
    }
  }

  void _scrollToSection(int index) {
    final target = _sectionKeys[index].currentContext;
    if (target != null) {
      Scrollable.ensureVisible(
        target,
        duration: const Duration(milliseconds: 250),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final language = context.watch<LanguageProvider>().currentLanguage;
    final t = AppLocalizations.of(context);
    final detail = _detail;
    return Scaffold(
      appBar: const RijviaAppBar(),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? _ErrorView(onRetry: _loadDetail)
          : RijviaScrollFrame(
              maxWidth: 1280,
              child: SingleChildScrollView(
                key: _viewportKey,
                controller: _scrollController,
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Align(
                      alignment: AlignmentDirectional.centerStart,
                      child: TextButton.icon(
                        onPressed: () =>
                            Navigator.pushNamed(context, '/lessons'),
                        icon: const Icon(Icons.arrow_back),
                        label: Text(t.t('lessons.back_to_all')),
                      ),
                    ),
                    const SizedBox(height: 16),
                    LayoutBuilder(
                      builder: (context, box) {
                        final reading = _readingContent(detail!, language, t);
                        final sidebar = _readingSidebar(detail, language, t);
                        if (box.maxWidth >= 1040 &&
                            MediaQuery.textScalerOf(context).scale(1) <= 1.5) {
                          return Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(child: reading),
                              const SizedBox(width: 24),
                              SizedBox(width: 340, child: sidebar),
                            ],
                          );
                        }
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            reading,
                            const SizedBox(height: 24),
                            sidebar,
                          ],
                        );
                      },
                    ),
                    const SizedBox(height: 32),
                    const RijviaWebFooter(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _readingContent(
    LessonDetail detail,
    String language,
    AppLocalizations t,
  ) {
    final lessonIndex = _relatedLessons.indexWhere(
      (lesson) => lesson.lessonCode == detail.lessonCode,
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        RijviaPageHero(
          title: detail.titleFor(language),
          description: detail.descriptionFor(language),
          eyebrow: '${t.t('lessons.lesson')} ${detail.displayOrder}',
        ),
        for (var index = 0; index < detail.pages.length; index++)
          Padding(
            key: _sectionKeys[index],
            padding: const EdgeInsets.only(top: 20),
            child: _LessonSection(
              page: detail.pages[index],
              language: language,
            ),
          ),
        const SizedBox(height: 24),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            if (lessonIndex > 0)
              OutlinedButton.icon(
                onPressed: () => _openLesson(lessonIndex - 1),
                icon: const Icon(Icons.arrow_back),
                label: Text(t.t('lessons.previous')),
              ),
            if (lessonIndex >= 0 && lessonIndex + 1 < _relatedLessons.length)
              FilledButton.icon(
                onPressed: () => _openLesson(lessonIndex + 1),
                icon: const Icon(Icons.arrow_forward),
                label: Text(t.t('lessons.next')),
              ),
          ],
        ),
      ],
    );
  }

  Widget _readingSidebar(
    LessonDetail detail,
    String language,
    AppLocalizations t,
  ) {
    final pagesRead = _progress?.pagesRead ?? 0;
    final fraction = detail.pages.isEmpty
        ? 0.0
        : (pagesRead / detail.pages.length).clamp(0.0, 1.0);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        RijviaPageSection(
          title: t.t('lessons.your_progress'),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(t.t('lessons.lesson_progress')),
              const SizedBox(height: 12),
              Text(
                _progressFailed
                    ? t.t('common.not_available')
                    : '$pagesRead / ${detail.pages.length}',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 12),
              if (!_progressFailed) LinearProgressIndicator(value: fraction),
              if (_progressFailed)
                TextButton(
                  onPressed: _loadDetail,
                  child: Text(t.t('common.retry')),
                ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        FilledButton(
          onPressed: () => Navigator.pushNamed(context, '/exam'),
          child: Text(t.t('lessons.take_exam')),
        ),
        const SizedBox(height: 12),
        OutlinedButton(
          onPressed: () => Navigator.pushNamed(context, '/traffic-signs'),
          child: Text(t.t('lessons.view_signs')),
        ),
        const SizedBox(height: 20),
        RijviaPageSection(
          title: t.t('lessons.pages_overview'),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              for (var index = 0; index < detail.pages.length; index++)
                TextButton(
                  onPressed: () => _scrollToSection(index),
                  child: Align(
                    alignment: AlignmentDirectional.centerStart,
                    child: Text(
                      '${detail.pages[index].pageNumber}. ${detail.pages[index].titleFor(language)}',
                    ),
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  void _openLesson(int index) => Navigator.pushReplacementNamed(
    context,
    '/lessons/${Uri.encodeComponent(_relatedLessons[index].lessonCode)}',
  );
}

class _LessonSection extends StatelessWidget {
  const _LessonSection({required this.page, required this.language});
  final LessonPage page;
  final String language;

  @override
  Widget build(BuildContext context) => RijviaPageSection(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          '${AppLocalizations.of(context).t('lessons.page_label')} ${page.pageNumber}',
          style: TextStyle(
            fontSize: 12,
            color: Theme.of(context).colorScheme.primary,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          page.titleFor(language),
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 12),
        if (page.imageUrl != null) ...[
          RijviaEducationalImage(
            url: page.imageUrl!,
            radius: RijviaDesignLayout.lessonImageRadius,
            frameRadius: 16,
            label: page.titleFor(language),
          ),
          const SizedBox(height: 16),
        ],
        for (final paragraph
            in page
                .contentFor(language)
                .split(RegExp(r'\n+'))
                .map((line) => line.trim())
                .where((line) => line.isNotEmpty))
          Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: RegExp(r'^[•\-*]\s').hasMatch(paragraph)
                ? Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Theme.of(
                        context,
                      ).colorScheme.secondary.withValues(alpha: .025),
                      border: Border.all(
                        color: Theme.of(
                          context,
                        ).colorScheme.secondary.withValues(alpha: .1),
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: SelectableText(
                      paragraph,
                      style: const TextStyle(fontSize: 15.2, height: 1.85),
                    ),
                  )
                : SelectableText(
                    paragraph,
                    style: const TextStyle(fontSize: 16, height: 2),
                  ),
          ),
      ],
    ),
  );
}

class _ErrorView extends StatelessWidget {
  final Future<void> Function() onRetry;

  const _ErrorView({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            l10n.t('lessons.error'),
            style: const TextStyle(fontSize: 18, color: Colors.red),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: onRetry,
            child: Text(l10n.t('dashboard.retry')),
          ),
        ],
      ),
    );
  }
}
