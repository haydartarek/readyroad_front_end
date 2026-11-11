import '../../design_system/widgets/rijvia_app_bar.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/di/service_locator.dart';
import '../../design_system/widgets/rijvia_content.dart';
import '../categories/widgets/rijvia_sign_card.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/providers/favorites_provider.dart';
import '../../core/providers/language_provider.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../shared/models/content_item.dart';
import '../../shared/services/content_service.dart';
import '../categories/sign_details_screen.dart';

/// Favorites Screen - Shows all favorite content
class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  final ContentService _contentService = getIt<ContentService>();
  List<ContentItem> _favoriteContent = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadFavorites();
  }

  Future<void> _loadFavorites() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final favoritesProvider = context.read<FavoritesProvider>();
      await favoritesProvider.refresh();
      if (!mounted) return;
      if (!favoritesProvider.isLoaded) {
        throw StateError('Favorites are not synchronized yet');
      }
      final userAtStart = favoritesProvider.boundUserId;
      final versionAtStart = favoritesProvider.bindingVersion;
      final favoriteIds = favoritesProvider.favoriteIds;

      if (favoriteIds.isEmpty) {
        if (!mounted) return;
        setState(() {
          _favoriteContent = [];
          _isLoading = false;
        });
        return;
      }

      // Load all content and filter favorites
      final allContent = await _contentService.getAllContent();
      if (!mounted ||
          favoritesProvider.boundUserId != userAtStart ||
          favoritesProvider.bindingVersion != versionAtStart) {
        return;
      }
      final favorites = allContent
          .where((item) => favoriteIds.contains(item.id))
          .toList();

      setState(() {
        _favoriteContent = favorites;
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

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      appBar: RijviaAppBar(
        title: Text(l10n.t('nav.favorites')),
        actions: [
          if (_favoriteContent.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.delete_outline),
              onPressed: _showClearDialog,
              tooltip: l10n.commonDelete,
            ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    final l10n = AppLocalizations.of(context);
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: RijviaEmptyState(
            icon: Icons.cloud_off_outlined,
            title: l10n.t('favorites.load_error'),
            description: _error!,
            action: FilledButton.icon(
              onPressed: _loadFavorites,
              icon: const Icon(Icons.refresh),
              label: Text(l10n.commonRetry),
            ),
          ),
        ),
      );
    }

    if (_favoriteContent.isEmpty) {
      return Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: RijviaEmptyState(
            icon: Icons.favorite_border,
            title: l10n.t('favorites.empty'),
            description: l10n.t('favorites.empty_description'),
          ),
        ),
      );
    }

    return Consumer<LanguageProvider>(
      builder: (context, language, _) => RijviaScrollFrame(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            RijviaAdaptiveGrid(
              minCellWidth: MediaQuery.textScalerOf(context).scale(260),
              children: [
                for (final item in _favoriteContent)
                  RijviaSignCard(
                    item: item,
                    language: language.currentLanguage,
                    isFavorite: true,
                    onTap: () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => SignDetailsScreen(content: item),
                        ),
                      );
                      if (mounted) _loadFavorites();
                    },
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showClearDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(AppLocalizations.of(context).t('favorites.clear_title')),
        content: Text(
          AppLocalizations.of(context).t('favorites.clear_confirm'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(AppLocalizations.of(context).commonCancel),
          ),
          TextButton(
            onPressed: () async {
              final favoritesProvider = this.context.read<FavoritesProvider>();
              Navigator.pop(context);
              try {
                await favoritesProvider.clearFavorites();
                if (!mounted) return;
                await _loadFavorites();
              } catch (_) {
                if (!mounted) return;
                ScaffoldMessenger.of(this.context).showSnackBar(
                  SnackBar(
                    content: Text(
                      AppLocalizations.of(
                        this.context,
                      ).t('favorites.sync_error'),
                    ),
                  ),
                );
                await _loadFavorites();
              }
            },
            child: Text(
              AppLocalizations.of(context).commonDelete,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ),
        ],
      ),
    );
  }
}
