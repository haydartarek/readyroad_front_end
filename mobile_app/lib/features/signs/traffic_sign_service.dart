import '../../core/network/api_client.dart';
import '../../core/constants/api_constants.dart';
import '../../shared/models/traffic_sign.dart';

/// Traffic Sign Service
class TrafficSignService {
  final ApiClient _apiClient;

  TrafficSignService(this._apiClient);

  /// Get all traffic signs
  Future<List<TrafficSign>> getAllTrafficSigns() async {
    try {
      final response = await _apiClient.get(ApiConstants.trafficSigns);

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => TrafficSign.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load traffic signs');
      }
    } catch (e) {
      throw Exception('Error fetching traffic signs: $e');
    }
  }

  /// Get traffic sign by ID
  Future<TrafficSign> getTrafficSignById(int id) async {
    try {
      final response = await _apiClient.get('${ApiConstants.trafficSigns}/$id');

      if (response.statusCode == 200) {
        return TrafficSign.fromJson(response.data);
      } else {
        throw Exception('Failed to load traffic sign');
      }
    } catch (e) {
      throw Exception('Error fetching traffic sign: $e');
    }
  }

  /// Get traffic signs by category
  Future<List<TrafficSign>> getTrafficSignsByCategory(int categoryId) async {
    try {
      final response = await _apiClient.get(
        '${ApiConstants.trafficSigns}/category/$categoryId',
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => TrafficSign.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load traffic signs');
      }
    } catch (e) {
      throw Exception('Error fetching traffic signs by category: $e');
    }
  }
}

