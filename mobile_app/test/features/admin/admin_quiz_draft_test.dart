import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/admin/admin_quiz_draft.dart';

AdminQuizDraft validDraft() {
  final draft = AdminQuizDraft.newQuestion();
  draft.fields['categoryCode'] = 'TH01';
  for (final suffix in AdminQuizDraft.suffixes) {
    draft.fields['question$suffix'] = 'Which vehicle must yield?';
    draft.options[0]['text$suffix'] = 'The blue car';
    draft.options[1]['text$suffix'] = 'The red car';
  }
  draft.selectCorrect(0);
  return draft;
}

void main() {
  test('two-option question uses the exact web payload without adding C', () {
    final draft = validDraft();
    expect(draft.validate({'TH01'}), isEmpty);
    final payload = draft.payload(editing: false);
    expect(payload, isNot(contains('version')));
    expect(payload['contentImageUrl'], isNull);
    expect(payload['options'], hasLength(2));
    expect(
      (payload['options'] as List).every((o) => !(o as Map).containsKey('id')),
      isTrue,
    );
  });
  test('four translations and exactly one answer are mandatory', () {
    final draft = validDraft();
    draft.fields['questionAr'] = ' ';
    draft.options[1]['textFr'] = '';
    draft.options[1]['isCorrect'] = true;
    expect(
      draft.validate({'TH01'}),
      containsPair('questionAr', 'error_question_all_languages'),
    );
    expect(
      draft.validate({'TH01'}),
      containsPair('option_1', 'error_option_all_languages'),
    );
    expect(
      draft.validate({'TH01'}),
      containsPair('correct', 'error_exactly_one_correct'),
    );
  });
  test('duplicate and placeholder options follow web validation', () {
    final draft = validDraft();
    draft.options[1]['textEn'] = '  THE   BLUE CAR ';
    expect(draft.validate({'TH01'})['option_1'], 'error_option_duplicate');
    draft.options[1]['textEn'] = 'Option B';
    expect(draft.validate({'TH01'})['option_1'], 'error_option_placeholder');
  });
  test('reordering preserves historical option IDs and version', () {
    final payload = validDraft().payload(editing: false);
    payload['version'] = 7;
    (payload['options'] as List)[0]['id'] = 31;
    (payload['options'] as List)[1]['id'] = 32;
    final draft = AdminQuizDraft.fromJson(payload);
    draft.move(0, 1);
    final saved = draft.payload(editing: true);
    expect(saved['version'], 7);
    expect((saved['options'] as List)[1], containsPair('id', 31));
    expect((saved['options'] as List)[1], containsPair('isCorrect', true));
    expect((saved['options'] as List)[1], containsPair('displayOrder', 2));
    draft.addOption();
    draft.addOption();
    expect(draft.options, hasLength(3));
    draft.removeOption(2);
    draft.removeOption(1);
    expect(draft.options, hasLength(2));
  });
  test('image references reject credentials and unsafe schemes', () {
    final draft = validDraft();
    for (final value in [
      'javascript:alert(1)',
      'http://image.example/file.png',
      'https://user:pass@image.example/a.png',
      '/other/path.png',
    ]) {
      draft.fields['contentImageUrl'] = value;
      expect(
        draft.validate({'TH01'}),
        contains('contentImageUrl'),
        reason: value,
      );
    }
    for (final value in [
      '/images/quiz/example.webp',
      'https://images.example/quiz.png',
    ]) {
      draft.fields['contentImageUrl'] = value;
      expect(draft.validate({'TH01'}), isNot(contains('contentImageUrl')));
    }
  });
}
