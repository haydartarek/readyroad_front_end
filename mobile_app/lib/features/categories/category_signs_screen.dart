import '../../design_system/widgets/rijvia_app_bar.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../shared/models/category.dart';
import '../../shared/models/content_item.dart';
import '../../core/di/service_locator.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_content.dart';
import 'widgets/rijvia_sign_card.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/providers/language_provider.dart';
import '../../core/providers/favorites_provider.dart';
import '../../shared/services/content_service.dart';
import 'sign_details_screen.dart';

/// Category Signs Screen - Shows all content in a category
class CategorySignsScreen extends StatefulWidget {
  final Category category;

  const CategorySignsScreen({super.key, required this.category});

  @override
  State<CategorySignsScreen> createState() => _CategorySignsScreenState();
}

class _CategorySignsScreenState extends State<CategorySignsScreen> {
  final ContentService _contentService = getIt<ContentService>();
  List<ContentItem> _contentItems = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadContent();
  }

  Future<void> _loadContent() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final items = await _contentService.getContentByCategory(
        widget.category.id,
      );
      setState(() {
        _contentItems = items;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final languageCode = context.watch<LanguageProvider>().currentLanguage;

    return Scaffold(
      appBar: RijviaAppBar(title: Text(widget.category.getName(languageCode))),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              AppLocalizations.of(context).t('signs.load_error'),
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Text(
                _error!,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _loadContent,
              icon: const Icon(Icons.refresh),
              label: Text(AppLocalizations.of(context).t('dashboard.retry')),
            ),
          ],
        ),
      );
    }

    if (_contentItems.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.content_paste, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              AppLocalizations.of(context).t('signs.empty'),
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ],
        ),
      );
    }

    return RijviaScrollFrame(
      child: RefreshIndicator(
        onRefresh: _loadContent,
        child: ListView(
          padding: const EdgeInsets.all(16),
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            RijviaAdaptiveGrid(
              minCellWidth: MediaQuery.textScalerOf(context).scale(260),
              maxColumns: 3,
              children: _contentItems.map(_buildContentCard).toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContentCard(ContentItem item) =>
      Consumer2<LanguageProvider, FavoritesProvider>(
        builder: (context, language, favorites, _) => RijviaSignCard(
          item: item,
          language: language.currentLanguage,
          isFavorite: favorites.isFavorite(item.id),
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => SignDetailsScreen(content: item)),
          ),
          onFavorite: () async {
            try {
              await favorites.toggleFavorite(item.id);
            } catch (_) {
              if (!context.mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    AppLocalizations.of(context).t('favorites.load_error'),
                  ),
                ),
              );
            }
          },
        ),
      );
}
