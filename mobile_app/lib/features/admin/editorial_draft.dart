import 'dart:convert';
import 'package:unorm_dart/unorm_dart.dart' as unorm;

String editorialSlug(String value) => unorm
    .nfkd(value.trim().toLowerCase())
    .replaceAll(RegExp(r'\p{M}+', unicode: true), '')
    .replaceAll(RegExp(r'[^\p{L}\p{N}]+', unicode: true), '-')
    .replaceAll(RegExp(r'^-+|-+$'), '')
    .replaceAll(RegExp('-+'), '-');

class EditorialDraft {
  EditorialDraft({String title = ''})
    : fields = {
        'title': title,
        'slug': '',
        'summary': '',
        'body': '',
        'metaTitle': '',
        'metaDescription': '',
        'internalLinks': <Map<String, dynamic>>[],
        'typography': {...defaultTypography},
        'expectedCurrentVersion': null,
      } {
    _baseline = jsonEncode(fields);
  }
  static const languages = ['AR', 'NL', 'FR', 'EN'];
  static const lockedStates = [
    'WAITING_APPROVAL',
    'APPROVED',
    'SCHEDULED',
    'PUBLISHED',
    'UPDATE_RECOMMENDED',
    'REJECTED',
    'ARCHIVED',
  ];
  static const defaultTypography = {
    'h1Size': 'DEFAULT',
    'h2Size': 'DEFAULT',
    'h3Size': 'DEFAULT',
    'h4Size': 'DEFAULT',
    'paragraphSize': 'DEFAULT',
    'textColor': 'DEFAULT',
  };
  Map<String, dynamic> fields;
  late String _baseline;
  bool get dirty => jsonEncode(fields) != _baseline;
  static Map<String, dynamic> _clone(Map<String, dynamic> value) =>
      Map<String, dynamic>.from(jsonDecode(jsonEncode(value)) as Map);
  void hydrate(
    Map<String, dynamic> version, {
    int? expectedVersion,
    bool restored = false,
  }) {
    fields = {
      for (final key in [
        'title',
        'slug',
        'summary',
        'body',
        'metaTitle',
        'metaDescription',
      ])
        key: version[key]?.toString() ?? '',
      'internalLinks': [
        for (final item in version['internalLinks'] as List? ?? [])
          {'targetPath': item['targetPath'], 'anchorText': item['anchorText']},
      ],
      'typography': {
        ...defaultTypography,
        ...?version['typography'] as Map<String, dynamic>?,
      },
      'expectedCurrentVersion': expectedVersion ?? version['versionNumber'],
    };
    if (!restored) _baseline = jsonEncode(fields);
  }

  bool get valid =>
      [
        'title',
        'body',
        'metaTitle',
        'metaDescription',
      ].every((key) => fields[key].toString().trim().isNotEmpty) &&
      (fields['internalLinks'] as List).every(
        (link) =>
            link['targetPath'].toString().trim().isNotEmpty &&
            link['anchorText'].toString().trim().isNotEmpty,
      );
  Map<String, dynamic> payload({required String dynamicSlug}) => {
    'title': fields['title'].toString().trim(),
    'slug': dynamicSlug.isNotEmpty
        ? dynamicSlug
        : fields['slug'].toString().trim().isEmpty
        ? null
        : fields['slug'].toString().trim(),
    'summary': fields['summary'].toString().trim().isEmpty
        ? null
        : fields['summary'].toString().trim(),
    'body': fields['body'],
    'metaTitle': fields['metaTitle'].toString().trim(),
    'metaDescription': fields['metaDescription'].toString().trim(),
    'internalLinks': [
      for (final link in fields['internalLinks'] as List)
        {
          'targetPath': link['targetPath'].toString().trim(),
          'anchorText': link['anchorText'].toString().trim(),
        },
    ],
    'typography': _clone(
      Map<String, dynamic>.from(fields['typography'] as Map),
    ),
    'expectedCurrentVersion': fields['expectedCurrentVersion'],
  };
  void markSaved(int version) {
    fields['expectedCurrentVersion'] = version;
    _baseline = jsonEncode(fields);
  }

  static bool hasEveryLanguage(Map<String, dynamic> topic) => languages.every(
    (language) => (topic['currentVersions'] as List).any(
      (version) => version['language'] == language,
    ),
  );
  static List<String> missingTranslations(Map<String, dynamic> topic) =>
      languages
          .where(
            (language) =>
                language != topic['canonicalLanguage'] &&
                !(topic['currentVersions'] as List).any(
                  (version) =>
                      version['language'] == language &&
                      (version['focusKeyword']?.toString().trim().isNotEmpty ??
                          false),
                ),
          )
          .toList();
  bool canTranslate(Map<String, dynamic> topic) =>
      topic['articleId'] != null &&
      [
        'DRAFT_READY',
        'FACT_CHECK_REQUIRED',
        'LEGAL_REVIEW_REQUIRED',
        'TRANSLATION_REQUIRED',
        'IMAGE_REQUIRED',
      ].contains(topic['lifecycleState']) &&
      (topic['currentVersions'] as List).any(
        (version) => version['language'] == topic['canonicalLanguage'],
      ) &&
      missingTranslations(topic).isNotEmpty &&
      !dirty;
  bool canAdvance(Map<String, dynamic> topic) =>
      topic['articleId'] != null &&
      [
        'DRAFTING',
        'DRAFT_READY',
        'FACT_CHECK_REQUIRED',
        'LEGAL_REVIEW_REQUIRED',
        'TRANSLATION_REQUIRED',
      ].contains(topic['lifecycleState']) &&
      (topic['lifecycleState'] != 'TRANSLATION_REQUIRED' ||
          hasEveryLanguage(topic)) &&
      (topic['lifecycleState'] != 'DRAFTING' ||
          (topic['currentVersions'] as List).any(
            (version) =>
                version['language'] == topic['canonicalLanguage'] &&
                version['status'] == 'DRAFT',
          )) &&
      !dirty;
  bool canRequestApproval(
    Map<String, dynamic> topic, {
    required bool confirmed,
    required String reason,
  }) =>
      topic['articleId'] != null &&
      topic['lifecycleState'] == 'IMAGE_REQUIRED' &&
      hasEveryLanguage(topic) &&
      topic['image'] is Map &&
      topic['image']['status'] == 'APPROVED' &&
      !dirty &&
      confirmed &&
      reason.trim().isNotEmpty;
  bool canDeleteVersion(
    Map<String, dynamic> topic,
    Map<String, dynamic> version,
    int historyCount,
  ) =>
      historyCount > 1 &&
      !dirty &&
      version['status'] != 'PUBLISHED' &&
      !(version['current'] == true &&
          [
            'WAITING_APPROVAL',
            'APPROVED',
            'SCHEDULED',
            'PUBLISHED',
          ].contains(topic['lifecycleState']));
}
