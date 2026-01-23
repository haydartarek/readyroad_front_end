import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../shared/models/content_item.dart';

/// Favorites Provider
/// 
/// LAW #5 - DELIBERATE IGNORANCE
/// Stores content IDs only - no domain logic, no smart analysis
/// Just a dumb list of favorite IDs
class FavoritesProvider extends ChangeNotifier {
  final Set<int> _favoriteIds = {};
  bool _isLoaded = false;

  Set<int> get favoriteIds => _favoriteIds;
  bool get isLoaded => _isLoaded;

  FavoritesProvider() {
    _loadFavorites();
  }

  /// Load favorites from local storage
  Future<void> _loadFavorites() async {
    final prefs = await SharedPreferences.getInstance();
    final favorites = prefs.getStringList('favorites') ?? [];
    _favoriteIds.clear();
    _favoriteIds.addAll(favorites.map((id) => int.parse(id)));
    _isLoaded = true;
    notifyListeners();
  }

  /// Check if content is favorite
  bool isFavorite(int contentId) {
    return _favoriteIds.contains(contentId);
  }

  /// Toggle favorite status
  Future<void> toggleFavorite(int contentId) async {
    if (_favoriteIds.contains(contentId)) {
      _favoriteIds.remove(contentId);
    } else {
      _favoriteIds.add(contentId);
    }

    await _saveFavorites();
    notifyListeners();
  }

  /// Add to favorites
  Future<void> addFavorite(int contentId) async {
    if (!_favoriteIds.contains(contentId)) {
      _favoriteIds.add(contentId);
      await _saveFavorites();
      notifyListeners();
    }
  }

  /// Remove from favorites
  Future<void> removeFavorite(int contentId) async {
    if (_favoriteIds.contains(contentId)) {
      _favoriteIds.remove(contentId);
      await _saveFavorites();
      notifyListeners();
    }
  }

  /// Save favorites to local storage
  Future<void> _saveFavorites() async {
    final prefs = await SharedPreferences.getInstance();
    final favorites = _favoriteIds.map((id) => id.toString()).toList();
    await prefs.setStringList('favorites', favorites);
  }

  /// Get favorites count
  int get favoritesCount => _favoriteIds.length;

  /// Clear all favorites
  Future<void> clearFavorites() async {
    _favoriteIds.clear();
    await _saveFavorites();
    notifyListeners();
  }

  /// Get favorite content items from list (generic filter)
  List<ContentItem> filterFavorites(List<ContentItem> allContent) {
    return allContent.where((item) => _favoriteIds.contains(item.id)).toList();
  }
}

