import '../../core/network/api_client.dart';
import '../../core/constants/api_constants.dart';
import '../../shared/models/content_item.dart';

/// Generic Content Service
/// 
/// LAW #5 - DELIBERATE IGNORANCE
/// This service fetches content without knowing the domain.
/// It works for Traffic Signs, Math, Medical, or any future content.
class ContentService {
  final ApiClient _apiClient;

  ContentService(this._apiClient);

  /// Get all content items
  Future<List<ContentItem>> getAllContent() async {
    try {
      final response = await _apiClient.get(ApiConstants.trafficSigns);

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => ContentItem.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load content');
      }
    } catch (e) {
      throw Exception('Error fetching content: $e');
    }
  }

  /// Get content item by ID
  Future<ContentItem> getContentById(int id) async {
    try {
      final response = await _apiClient.get('${ApiConstants.trafficSigns}/$id');

      if (response.statusCode == 200) {
        return ContentItem.fromJson(response.data);
      } else {
        throw Exception('Failed to load content');
      }
    } catch (e) {
      throw Exception('Error fetching content: $e');
    }
  }

  /// Get content by category
  Future<List<ContentItem>> getContentByCategory(int categoryId) async {
    try {
      final response = await _apiClient.get(
        '${ApiConstants.trafficSigns}/category/$categoryId',
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => ContentItem.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load content');
      }
    } catch (e) {
      throw Exception('Error fetching content by category: $e');
    }
  }

  /// Search content by name (generic search)
  Future<List<ContentItem>> searchContent(String query, String languageCode) async {
    try {
      final allContent = await getAllContent();
      
      if (query.isEmpty) {
        return allContent;
      }

      // Generic text search - works for any content type
      return allContent.where((item) {
        final name = item.getName(languageCode).toLowerCase();
        final description = item.getDescription(languageCode)?.toLowerCase() ?? '';
        final searchQuery = query.toLowerCase();
        
        return name.contains(searchQuery) || description.contains(searchQuery);
      }).toList();
    } catch (e) {
      throw Exception('Error searching content: $e');
    }
  }

  /// Filter content by category code
  Future<List<ContentItem>> filterByCategory(String? categoryCode) async {
    try {
      final allContent = await getAllContent();
      
      if (categoryCode == null || categoryCode.isEmpty) {
        return allContent;
      }

      return allContent.where((item) => item.categoryCode == categoryCode).toList();
    } catch (e) {
      throw Exception('Error filtering content: $e');
    }
  }

  /// Sort content (generic sorting)
  List<ContentItem> sortContent(
    List<ContentItem> items,
    String languageCode, {
    bool alphabetical = true,
  }) {
    final sorted = List<ContentItem>.from(items);
    
    if (alphabetical) {
      sorted.sort((a, b) => 
        a.getName(languageCode).compareTo(b.getName(languageCode))
      );
    } else {
      // Sort by ID (most recent first)
      sorted.sort((a, b) => b.id.compareTo(a.id));
    }
    
    return sorted;
  }
}
