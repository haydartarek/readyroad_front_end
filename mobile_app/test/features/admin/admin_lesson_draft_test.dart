import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/admin/admin_lesson_draft.dart';

Map<String, dynamic> snapshot() => {
  'revision': 4,
  'document': {
    'schemaVersion': 1,
    'lesson': {
      'lessonCode': 'lesson-1',
      'title': {
        for (final lang in AdminLessonDraft.languages) lang: 'Priority',
      },
      'description': {
        for (final lang in AdminLessonDraft.languages) lang: null,
      },
      'icon': null,
      'displayOrder': 0,
      'estimatedMinutes': 5,
      'isActive': true,
    },
    'pages': [
      {
        'pageNumber': 1,
        'title': {
          for (final lang in AdminLessonDraft.languages) lang: 'Intersections',
        },
        'content': {
          for (final lang in AdminLessonDraft.languages)
            lang: 'Original lesson',
        },
        'imageAssetId': 10,
      },
    ],
    'seo': {
      'en': {'canonical': 'keep-server-content'},
    },
    'structuredSections': [
      {'id': 'keep-structure'},
    ],
    'categoryLinks': [
      {'categoryId': 1, 'primary': true},
    ],
    'media': [
      {'id': 10},
    ],
  },
};
void main() {
  test(
    'draft payload preserves protected document fields and expected revision',
    () {
      final response = snapshot();
      final draft = AdminLessonDraft(response);
      expect(draft.canPublish, isTrue);
      draft.lesson['title']['en'] = 'Edited title';
      expect(draft.dirty, isTrue);
      expect(draft.canPublish, isFalse);
      expect(draft.validate(), isNull);
      final payload = draft.savePayload();
      expect(payload['expectedRevision'], 4);
      for (final key in [
        'schemaVersion',
        'seo',
        'structuredSections',
        'categoryLinks',
        'media',
      ]) {
        expect(payload['document'][key], response['document'][key]);
      }
      expect(response['document']['lesson']['title']['en'], 'Priority');
    },
  );
  test(
    'image purge keeps pending text edits and adopts only server revision',
    () {
      final draft = AdminLessonDraft(snapshot());
      draft.pages.first['content']['en'] = 'Unsaved text';
      draft.imagePurged(10, updatedRevision: 5);
      expect(draft.revision, 5);
      expect(draft.pages.first['imageAssetId'], isNull);
      expect(draft.pages.first['content']['en'], 'Unsaved text');
      expect(draft.dirty, isTrue);
      final clean = AdminLessonDraft(snapshot());
      clean.imagePurged(10, updatedRevision: 5);
      expect(clean.dirty, isFalse);
    },
  );
  test('conflict and unsaved edits independently block publication', () {
    final draft = AdminLessonDraft(snapshot());
    draft.conflict = true;
    expect(draft.canPublish, isFalse);
    draft.hydrate({...snapshot(), 'revision': 5});
    expect(draft.canPublish, isTrue);
    expect(draft.revision, 5);
    draft.pages.first['title']['fr'] = ' ';
    expect(draft.validate(), 'validation_page_title');
    expect(draft.canPublish, isFalse);
  });
}
