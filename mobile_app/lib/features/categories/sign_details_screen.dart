import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../shared/models/content_item.dart';
import '../../core/providers/favorites_provider.dart';

/// Content Details Screen - Shows detailed information about content
class SignDetailsScreen extends StatelessWidget {
  final ContentItem content;

  const SignDetailsScreen({super.key, required this.content});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(content.code),
        actions: [
          Consumer<FavoritesProvider>(
            builder: (context, favoritesProvider, child) {
              final isFavorite = favoritesProvider.isFavorite(content.id);
              return IconButton(
                icon: Icon(
                  isFavorite ? Icons.favorite : Icons.favorite_border,
                  color: isFavorite ? Colors.red : null,
                ),
                onPressed: () {
                  favoritesProvider.toggleFavorite(content.id);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        isFavorite
                            ? 'Removed from favorites'
                            : 'Added to favorites',
                      ),
                      duration: const Duration(seconds: 1),
                    ),
                  );
                },
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Content Image
            _buildImageSection(),

            // Content Information
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Code badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Theme.of(
                        context,
                      ).primaryColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      content.code,
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: Theme.of(context).primaryColor,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // English Name
                  _buildLanguageSection(
                    context,
                    '🇬🇧 English',
                    content.nameEn,
                    content.descriptionEn,
                  ),

                  const Divider(height: 32),

                  // Arabic Name
                  _buildLanguageSection(
                    context,
                    '🇸🇦 العربية',
                    content.nameAr,
                    content.descriptionAr,
                  ),

                  const Divider(height: 32),

                  // Dutch Name
                  _buildLanguageSection(
                    context,
                    '🇳🇱 Nederlands',
                    content.nameNl,
                    content.descriptionNl,
                  ),

                  const Divider(height: 32),

                  // French Name
                  _buildLanguageSection(
                    context,
                    '🇫🇷 Français',
                    content.nameFr,
                    content.descriptionFr,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomBar(context),
    );
  }

  String _convertToAssetPath(String imageUrl) {
    // Handle both API formats:
    // 1. /images/signs/... (web format)
    // 2. assets/traffic_signs/... (backend format)
    if (imageUrl.startsWith('/images/signs/')) {
      return imageUrl.replaceFirst('/images/signs/', 'assets/traffic_signs/');
    }
    // Already in correct format for Flutter assets
    return imageUrl;
  }

  Widget _buildImageSection() {
    return Container(
      height: 250,
      color: Colors.grey[100],
      child: content.imageUrl != null && content.imageUrl!.isNotEmpty
          ? Image.asset(
              _convertToAssetPath(content.imageUrl!),
              fit: BoxFit.contain,
              errorBuilder: (context, error, stackTrace) {
                return const Center(
                  child: Icon(Icons.image, size: 100, color: Colors.grey),
                );
              },
            )
          : const Center(
              child: Icon(Icons.image, size: 100, color: Colors.grey),
            ),
    );
  }

  Widget _buildLanguageSection(
    BuildContext context,
    String languageLabel,
    String name,
    String? description,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          languageLabel,
          style: Theme.of(
            context,
          ).textTheme.labelMedium?.copyWith(color: Colors.grey[600]),
        ),
        const SizedBox(height: 8),
        Text(
          name,
          style: Theme.of(
            context,
          ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        if (description != null && description.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(description, style: Theme.of(context).textTheme.bodyMedium),
        ],
      ],
    );
  }

  Widget _buildBottomBar(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () {
                  // TODO: Practice with this sign
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Practice feature coming in Phase 2!'),
                      duration: Duration(seconds: 2),
                    ),
                  );
                },
                icon: const Icon(Icons.quiz),
                label: const Text('Practice'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () {
                  // TODO: Start quiz
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Quiz feature coming in Phase 2!'),
                      duration: Duration(seconds: 2),
                    ),
                  );
                },
                icon: const Icon(Icons.play_arrow),
                label: const Text('Take Quiz'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
