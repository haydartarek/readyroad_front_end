import '../../design_system/widgets/rijvia_app_bar.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/di/service_locator.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_content.dart';
import '../categories/widgets/rijvia_sign_card.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/providers/language_provider.dart';
import '../../shared/models/content_item.dart';
import '../../shared/services/content_service.dart';
import '../categories/sign_details_screen.dart';
import '../categories/category_service.dart';
import '../../shared/models/category.dart';

/// Search Screen - Generic search for all content
class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final ContentService _contentService = getIt<ContentService>();
  final TextEditingController _searchController = TextEditingController();

  List<ContentItem> _allContent = [];
  List<Category> _categories = const [];
  String? _category;

  List<ContentItem> get _filteredContent {
    final language = context.read<LanguageProvider>().currentLanguage;
    final query = _searchQuery.toLowerCase();
    return _allContent
        .where(
          (item) =>
              (_category == null || item.categoryCode == _category) &&
              (item.getName(language).toLowerCase().contains(query) ||
                  item.code.toLowerCase().contains(query)),
        )
        .toList();
  }

  bool _isLoading = true;
  String? _error;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadAllContent();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadAllContent() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final categoriesFuture = getIt<CategoryService>()
          .getAllCategories()
          .catchError((_) => <Category>[]);
      final content = await _contentService.getAllContent();
      final categories = await categoriesFuture;
      if (!mounted) return;
      setState(() {
        _allContent = content;
        _categories = categories;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  void _filterContent(String query) => setState(() => _searchQuery = query);

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final language = context.watch<LanguageProvider>().currentLanguage;
    final categories =
        _allContent
            .map((item) => item.categoryCode)
            .whereType<String>()
            .toSet()
            .toList()
          ..sort();
    return Scaffold(
      appBar: RijviaAppBar(title: Text(l10n.t('signs.library'))),
      body: RijviaScrollFrame(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: TextField(
                controller: _searchController,
                onChanged: _filterContent,
                decoration: InputDecoration(
                  labelText: l10n.navSearch,
                  prefixIcon: const Icon(Icons.search),
                  suffixIcon: _searchQuery.isEmpty
                      ? null
                      : IconButton(
                          tooltip: l10n.t('lessons.clear_search'),
                          onPressed: () {
                            _searchController.clear();
                            _filterContent('');
                          },
                          icon: const Icon(Icons.clear),
                        ),
                ),
              ),
            ),
            if (categories.isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: SizedBox(
                  width: double.infinity,
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 4,
                    children: [
                      FilterChip(
                        label: Text(l10n.t('practice.filter_all')),
                        selected: _category == null,
                        onSelected: (_) => setState(() => _category = null),
                      ),
                      for (final code in categories)
                        FilterChip(
                          label: Text(
                            _categories
                                    .where((item) => item.code == code)
                                    .firstOrNull
                                    ?.getName(language) ??
                                (code == 'FM'
                                    ? l10n.t('story.road_management_signs')
                                    : code),
                          ),
                          selected: _category == code,
                          onSelected: (_) => setState(() => _category = code),
                        ),
                    ],
                  ),
                ),
              ),
            Expanded(child: _buildBody(language)),
          ],
        ),
      ),
    );
  }

  Widget _buildBody(String language) {
    final l10n = AppLocalizations.of(context);
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
      return RijviaEmptyState(
        icon: Icons.cloud_off_outlined,
        title: l10n.t('signs.load_error'),
        description: l10n.t('home.topics_unavailable_description'),
        action: OutlinedButton.icon(
          onPressed: _loadAllContent,
          icon: const Icon(Icons.refresh),
          label: Text(l10n.commonRetry),
        ),
      );
    }
    final items = _filteredContent;
    if (items.isEmpty) return Center(child: Text(l10n.t('search.noResults')));
    return RefreshIndicator(
      onRefresh: _loadAllContent,
      child: ListView(
        padding: const EdgeInsets.all(16),
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          RijviaAdaptiveGrid(
            minCellWidth: MediaQuery.textScalerOf(context).scale(260),
            maxColumns: 3,
            children: [
              for (final item in items)
                RijviaSignCard(
                  item: item,
                  language: language,
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => SignDetailsScreen(content: item),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
