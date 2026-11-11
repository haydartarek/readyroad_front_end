import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:mobile_app/features/categories/category_service.dart';

class _SignsApi extends ApiClient {
  @override
  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async => Response(
    requestOptions: RequestOptions(path: path),
    statusCode: 200,
    data: [
      {'id': 1, 'categoryCode': 'B', 'signCode': 'B0'},
      {
        'id': 2,
        'categoryCode': 'B',
        'signCode': 'B1',
        'imageUrl': '/images/signs/B1.png',
      },
      {
        'id': 3,
        'categoryCode': 'B',
        'signCode': 'B5',
        'imageUrl': '/images/signs/B5.png',
      },
      {'id': 4, 'signCode': 'A11', 'imageUrl': '/images/signs/A11.png'},
    ],
  );
}

void main() {
  test(
    'category preview uses first actual image in API order like web',
    () async {
      final signs = await CategoryService(_SignsApi()).getRepresentativeSigns();
      expect(signs.keys, ['B', 'A']);
      expect(signs['B']!.code, 'B1');
      expect(signs['B']!.imageUrl, '/images/signs/B1.png');
      expect(signs['A']!.code, 'A11');
    },
  );
}
