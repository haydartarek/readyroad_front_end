import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:file_selector/file_selector.dart';
import 'admin_components.dart';

class AdminSelectedFile {
  const AdminSelectedFile({
    required this.name,
    required this.bytes,
    required this.mimeType,
  });
  final String name;
  final Uint8List bytes;
  final String mimeType;
}

class AdminFileSelectionException implements Exception {
  const AdminFileSelectionException(this.messageKey);
  final String messageKey;
}

class AdminFileUpload {
  static Future<AdminSelectedFile?> workbook() async {
    final file = await openFile(
      acceptedTypeGroups: [
        const XTypeGroup(
          label: 'Excel',
          extensions: ['xlsx'],
          mimeTypes: [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          ],
          uniformTypeIdentifiers: ['org.openxmlformats.spreadsheetml.sheet'],
        ),
      ],
    );
    if (file == null) return null;
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      throw const AdminFileSelectionException(
        'admin.marketing.seo_import_invalid',
      );
    }
    return AdminSelectedFile(
      name: file.name,
      bytes: await file.readAsBytes(),
      mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  }

  static Future<AdminSelectedFile?> select({
    bool json = false,
    bool allowWebp = true,
    int maxBytes = 5 * 1024 * 1024,
  }) async {
    final file = await openFile(
      acceptedTypeGroups: [
        json
            ? const XTypeGroup(
                label: 'JSON',
                extensions: ['json'],
                mimeTypes: ['application/json'],
                uniformTypeIdentifiers: ['public.json'],
              )
            : XTypeGroup(
                label: 'Images',
                extensions: ['jpg', 'jpeg', 'png', if (allowWebp) 'webp'],
                mimeTypes: [
                  'image/jpeg',
                  'image/png',
                  if (allowWebp) 'image/webp',
                ],
                uniformTypeIdentifiers: [
                  'public.jpeg',
                  'public.png',
                  if (allowWebp) 'org.webmproject.webp',
                ],
              ),
      ],
    );
    if (file == null) return null;
    if (await file.length() > maxBytes) {
      throw AdminFileSelectionException(
        json
            ? 'admin.import.validation.too_large'
            : 'admin.quizzes.upload.too_large',
      );
    }
    final extension = file.name.split('.').last.toLowerCase();
    final mime = json
        ? extension == 'json'
              ? 'application/json'
              : null
        : switch (extension) {
            'jpg' || 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'webp' when allowWebp => 'image/webp',
            _ => null,
          };
    if (mime == null) {
      throw AdminFileSelectionException(
        json
            ? 'admin.import.validation.invalid_type'
            : 'admin.quizzes.upload.invalid_type',
      );
    }
    final bytes = await file.readAsBytes();
    if (!json && !_matchesImage(bytes, mime)) {
      throw const AdminFileSelectionException(
        'admin.quizzes.upload.invalid_type',
      );
    }
    return AdminSelectedFile(name: file.name, bytes: bytes, mimeType: mime);
  }

  static bool _matchesImage(Uint8List bytes, String mime) {
    if (bytes.length < 12) return false;
    return switch (mime) {
      'image/jpeg' => bytes[0] == 0xff && bytes[1] == 0xd8 && bytes[2] == 0xff,
      'image/png' =>
        bytes[0] == 0x89 && String.fromCharCodes(bytes.sublist(1, 4)) == 'PNG',
      'image/webp' =>
        String.fromCharCodes(bytes.sublist(0, 4)) == 'RIFF' &&
            String.fromCharCodes(bytes.sublist(8, 12)) == 'WEBP',
      _ => false,
    };
  }

  static Future<String> image(
    AdminSelectedFile file, {
    String? filename,
  }) async {
    final data = FormData.fromMap({
      'file': MultipartFile.fromBytes(
        file.bytes,
        filename: file.name,
        contentType: DioMediaType.parse(file.mimeType),
      ),
      if (filename?.trim().isNotEmpty == true) 'filename': filename!.trim(),
    });
    final response = await AdminApi().client.post(
      '/api/admin/upload/image',
      data: data,
      options: Options(contentType: 'multipart/form-data'),
    );
    final url = AdminApi.record(response.data)['url'];
    if (url is! String || url.trim().isEmpty) {
      throw const FormatException('Upload did not return an image URL');
    }
    return url;
  }

  static Future<AdminRecord> lessonImage(
    String lessonCode,
    AdminSelectedFile file, {
    required String filename,
  }) async {
    final data = FormData.fromMap({
      'file': MultipartFile.fromBytes(
        file.bytes,
        filename: file.name,
        contentType: DioMediaType.parse(file.mimeType),
      ),
      'filename': filename,
    });
    final response = await AdminApi().client.post(
      '/api/admin/lessons/${Uri.encodeComponent(lessonCode)}/media',
      data: data,
      options: Options(contentType: 'multipart/form-data'),
    );
    return AdminApi.record(response.data);
  }
}
