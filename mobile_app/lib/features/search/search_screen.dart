import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/di/service_locator.dart';
import '../../core/providers/language_provider.dart';
import '../../shared/models/content_item.dart';
import '../../shared/services/content_service.dart';
import '../categories/sign_details_screen.dart';

/// Search Screen - Generic search for all content
class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final ContentService _contentService = getIt<ContentService>();
  final TextEditingController _searchController = TextEditingController();

  /// Convert backend imageUrl to asset path for Flutter
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

  List<ContentItem> _allContent = [];
  List<ContentItem> _filteredContent = [];
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
      final content = await _contentService.getAllContent();
      setState(() {
        _allContent = content;
        _filteredContent = content;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  void _filterContent(String query) {
    setState(() {
      _searchQuery = query;

      if (query.isEmpty) {
        _filteredContent = _allContent;
      } else {
        final languageCode = context.read<LanguageProvider>().currentLanguage;
        _filteredContent = _allContent.where((item) {
          final name = item.getName(languageCode).toLowerCase();
          final code = item.code.toLowerCase();
          final searchLower = query.toLowerCase();

          return name.contains(searchLower) || code.contains(searchLower);
        }).toList();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _searchController,
          autofocus: true,
          decoration: InputDecoration(
            hintText: 'Search content...',
            border: InputBorder.none,
            hintStyle: TextStyle(
              color: Colors.white.withValues(alpha: 0.7),
            ),
            suffixIcon: _searchQuery.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear, color: Colors.white),
                    onPressed: () {
                      _searchController.clear();
                      _filterContent('');
                    },
                  )
                : null,
          ),
          style: const TextStyle(color: Colors.white),
          onChanged: _filterContent,
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red,
            ),
            const SizedBox(height: 16),
            Text(
              'Error loading signs',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _loadAllContent,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_searchQuery.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.search,
              size: 100,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 24),
            Text(
              'Search for traffic signs',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'Enter sign name or code',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey[600],
                  ),
            ),
          ],
        ),
      );
    }

    if (_filteredContent.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.search_off,
              size: 100,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 24),
            Text(
              'No results found',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'Try a different search term',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey[600],
                  ),
            ),
          ],
        ),
      );
    }

    return Consumer<LanguageProvider>(
      builder: (context, languageProvider, child) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Text(
                '${_filteredContent.length} results found',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: Colors.grey[600],
                    ),
              ),
            ),
            Expanded(
              child: ListView.builder(
                itemCount: _filteredContent.length,
                itemBuilder: (context, index) {
                  final item = _filteredContent[index];
                  return _buildSignListItem(item, languageProvider.currentLanguage);
                },
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildSignListItem(ContentItem item, String languageCode) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ListTile(
        leading: Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            color: Colors.grey[200],
            borderRadius: BorderRadius.circular(8),
          ),
          child: item.imageUrl != null && item.imageUrl!.isNotEmpty
              ? Image.asset(
                  _convertToAssetPath(item.imageUrl!),
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) {
                    return const Icon(Icons.image, color: Colors.grey);
                  },
                )
              : const Icon(Icons.image, color: Colors.grey),
        ),
        title: Text(
          item.getName(languageCode),
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Text(item.code),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => SignDetailsScreen(content: item),
            ),
          );
        },
      ),
    );
  }
}

