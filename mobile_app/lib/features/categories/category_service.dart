import '../../core/network/api_client.dart';
import '../../core/constants/api_constants.dart';
import '../../shared/models/category.dart';

/// Category Service
class CategoryService {
  final ApiClient _apiClient;

  CategoryService(this._apiClient);

  /// Get all categories
  Future<List<Category>> getAllCategories() async {
    try {
      final response = await _apiClient.get(ApiConstants.categories);

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => Category.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load categories');
      }
    } catch (e) {
      throw Exception('Error fetching categories: $e');
    }
  }

  /// Get category by ID
  Future<Category> getCategoryById(int id) async {
    try {
      final response = await _apiClient.get('${ApiConstants.categories}/$id');

      if (response.statusCode == 200) {
        return Category.fromJson(response.data);
      } else {
        throw Exception('Failed to load category');
      }
    } catch (e) {
      throw Exception('Error fetching category: $e');
    }
  }
}

