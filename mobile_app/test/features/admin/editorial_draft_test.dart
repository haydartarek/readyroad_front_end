import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/admin/editorial_draft.dart';

void main() {
  test('slug normalization matches web NFKD for the four content languages', () {
    expect(editorialSlug('  Één priorité — à Bruxelles! '), 'een-priorite-a-bruxelles');
    expect(editorialSlug('إشاراتُ المُرور'), 'اشارات-المرور');
    expect(editorialSlug('Driving -- theory'), 'driving-theory');
  });
  test('restoring an old version keeps the current optimistic version', () {
    final draft = EditorialDraft();
    final version = {'versionNumber': 4, 'title': 'Current', 'body': 'Content', 'metaTitle': 'SEO', 'metaDescription': 'Description', 'internalLinks': []};
    draft.hydrate(version);
    expect(draft.dirty, isFalse);
    draft.hydrate({...version, 'versionNumber': 2, 'title': 'Old version'}, expectedVersion: 4, restored: true);
    expect(draft.dirty, isTrue);
    expect(draft.payload(dynamicSlug: 'priority')['expectedCurrentVersion'], 4);
    expect(draft.fields['title'], 'Old version');
    draft.markSaved(5);
    expect(draft.dirty, isFalse);
  });
  test('approval requires all translations, an approved image and owner checks', () {
    final draft = EditorialDraft();
    final topic = <String, dynamic>{'articleId': 3, 'lifecycleState': 'IMAGE_REQUIRED', 'canonicalLanguage': 'AR', 'currentVersions': [for (final lang in EditorialDraft.languages) {'language': lang, 'focusKeyword': 'Keyword', 'status': 'DRAFT'}], 'image': {'status': 'APPROVED'}};
    expect(draft.canRequestApproval(topic, confirmed: true, reason: 'Reviewed'), isTrue);
    expect(draft.canRequestApproval(topic, confirmed: false, reason: 'Reviewed'), isFalse);
    topic['image'] = null;
    expect(draft.canRequestApproval(topic, confirmed: true, reason: 'Reviewed'), isFalse);
    topic['lifecycleState'] = 'TRANSLATION_REQUIRED';
    (topic['currentVersions'] as List).removeLast();
    expect(draft.canAdvance(topic), isFalse);
    expect(EditorialDraft.missingTranslations(topic), ['EN']);
  });
  test('published or protected current versions cannot be deleted', () {
    final draft = EditorialDraft();
    final topic = {'lifecycleState': 'PUBLISHED'};
    expect(draft.canDeleteVersion(topic, {'status': 'DRAFT', 'current': true}, 2), isFalse);
    expect(draft.canDeleteVersion(topic, {'status': 'PUBLISHED', 'current': false}, 2), isFalse);
    expect(draft.canDeleteVersion(topic, {'status': 'DRAFT', 'current': false}, 2), isTrue);
    expect(draft.canDeleteVersion(topic, {'status': 'DRAFT', 'current': false}, 1), isFalse);
  });
}
