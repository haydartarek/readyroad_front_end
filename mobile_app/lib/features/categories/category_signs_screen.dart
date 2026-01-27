import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../shared/models/category.dart';
import '../../shared/models/content_item.dart';
import '../../core/di/service_locator.dart';
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

  String _convertToAssetPath(String imageUrl) {
    return imageUrl.replaceFirst('/images/signs/', 'assets/traffic_signs/');
  }

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
      appBar: AppBar(title: Text(widget.category.getName(languageCode))),
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
              'Error loading content',
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
              label: const Text('Retry'),
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
              'No content in this category',
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadContent,
      child: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 0.85,
        ),
        itemCount: _contentItems.length,
        itemBuilder: (context, index) {
          final item = _contentItems[index];
          return _buildContentCard(item);
        },
      ),
    );
  }

  Widget _buildContentCard(ContentItem item) {
    return Consumer2<LanguageProvider, FavoritesProvider>(
      builder: (context, languageProvider, favoritesProvider, child) {
        final isFavorite = favoritesProvider.isFavorite(item.id);

        return Card(
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => SignDetailsScreen(content: item),
                ),
              );
            },
            child: Stack(
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Image placeholder
                    Expanded(
                      flex: 3,
                      child: Container(
                        color: Colors.grey[200],
                        child:
                            item.imageUrl != null && item.imageUrl!.isNotEmpty
                            ? Image.asset(
                                _convertToAssetPath(item.imageUrl!),
                                fit: BoxFit.contain,
                                errorBuilder: (context, error, stackTrace) {
                                  return const Icon(
                                    Icons.image,
                                    size: 48,
                                    color: Colors.grey,
                                  );
                                },
                              )
                            : const Icon(
                                Icons.image,
                                size: 48,
                                color: Colors.grey,
                              ),
                      ),
                    ),
                    // Content info
                    Expanded(
                      flex: 2,
                      child: Padding(
                        padding: const EdgeInsets.all(8.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.code,
                              style: Theme.of(context).textTheme.labelSmall
                                  ?.copyWith(color: Colors.grey[600]),
                            ),
                            const SizedBox(height: 4),
                            Expanded(
                              child: Text(
                                item.getName(languageProvider.currentLanguage),
                                style: Theme.of(context).textTheme.bodyMedium
                                    ?.copyWith(fontWeight: FontWeight.bold),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                // Favorite button
                Positioned(
                  top: 4,
                  right: 4,
                  child: IconButton(
                    icon: Icon(
                      isFavorite ? Icons.favorite : Icons.favorite_border,
                      color: isFavorite ? Colors.red : Colors.white,
                    ),
                    onPressed: () {
                      favoritesProvider.toggleFavorite(item.id);
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
