import 'dart:convert';

/// Preserve schema, SEO, category links and published identity during editing.
class AdminLessonDraft {
  AdminLessonDraft(Map<String, dynamic> response) {
    hydrate(response);
  }
  static const languages = ['ar', 'nl', 'fr', 'en'];
  late int revision;
  late Map<String, dynamic> document;
  late String _baseline;
  bool conflict = false;
  bool get dirty => jsonEncode(document) != _baseline;
  bool get canPublish => !dirty && !conflict;
  static Map<String, dynamic> clone(Map<String, dynamic> value) =>
      Map<String, dynamic>.from(jsonDecode(jsonEncode(value)) as Map);
  void hydrate(Map<String, dynamic> response) {
    revision = (response['revision'] as num).toInt();
    document = clone(Map<String, dynamic>.from(response['document'] as Map));
    _baseline = jsonEncode(document);
    conflict = false;
  }

  Map<String, dynamic> get lesson => document['lesson'] as Map<String, dynamic>;
  List<Map<String, dynamic>> get pages =>
      (document['pages'] as List).cast<Map<String, dynamic>>();
  String? validate() {
    if (languages.any(
      (language) => (lesson['title'][language] as String).trim().isEmpty,
    )) {
      return 'validation_lesson_title';
    }
    final order = lesson['displayOrder'];
    if (order is! int || order < 0) return 'validation_display_order';
    final minutes = lesson['estimatedMinutes'];
    if (minutes is! int || minutes < 1) return 'validation_estimated_minutes';
    if (pages.isEmpty) return 'validation_no_pages';
    if (pages.any(
      (page) => languages.any(
        (language) => (page['title'][language] as String).trim().isEmpty,
      ),
    )) {
      return 'validation_page_title';
    }
    return null;
  }

  Map<String, dynamic> savePayload() => {
    'expectedRevision': revision,
    'document': clone(document),
  };
  void imagePurged(int assetId, {int? updatedRevision}) {
    void clear(Map<String, dynamic> value) {
      for (final page in value['pages'] as List) {
        if (page['imageAssetId'] == assetId) page['imageAssetId'] = null;
      }
    }

    clear(document);
    final baseline = Map<String, dynamic>.from(jsonDecode(_baseline) as Map);
    clear(baseline);
    _baseline = jsonEncode(baseline);
    if (updatedRevision != null) revision = updatedRevision;
  }
}
