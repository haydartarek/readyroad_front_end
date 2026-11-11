import 'package:flutter_test/flutter_test.dart';

import 'package:mobile_app/features/categories/sign_quiz_service.dart';
import 'package:mobile_app/features/exam/exam_question_service.dart';
import 'package:mobile_app/features/lessons/lesson_service.dart';
import 'package:mobile_app/shared/models/quiz_models.dart';

void main() {
  test('parses the current lesson detail contract with pages', () {
    final lesson = LessonDetail.fromJson({
      'id': 31,
      'lessonCode': 'les-31',
      'icon': 'book',
      'titleEn': 'Economic driving',
      'titleAr': 'القيادة الاقتصادية',
      'titleNl': 'Economisch rijden',
      'titleFr': 'Conduite économique',
      'descriptionEn': 'Summary',
      'descriptionAr': 'ملخص',
      'displayOrder': 31,
      'estimatedMinutes': 8,
      'pages': [
        {
          'id': 301,
          'pageNumber': 1,
          'titleEn': 'Plan ahead',
          'titleAr': 'خطط مسبقًا',
          'titleNl': 'Plan vooruit',
          'titleFr': 'Planifiez',
          'contentEn': 'Keep a steady speed.',
          'contentAr': 'حافظ على سرعة ثابتة.',
          'contentNl': 'Rijd gelijkmatig.',
          'contentFr': 'Gardez une vitesse stable.',
          'imageUrl': '/images/lessons/les-31/page-1.png',
        },
      ],
    });

    expect(lesson.lessonCode, 'les-31');
    expect(lesson.pages, hasLength(1));
    expect(lesson.pages.single.imageUrl, contains('/images/lessons/les-31/'));
  });

  test(
    'parses sign quiz choices without relying on a client-side answer flag',
    () {
      final session = SignPracticeSession.fromJson({
        'sessionId': 7,
        'status': 'IN_PROGRESS',
        'questions': [
          {
            'id': 11,
            'questionEn': 'What does this sign mean?',
            'questionAr': 'ماذا تعني هذه الإشارة؟',
            'questionNl': 'Wat betekent dit bord?',
            'questionFr': 'Que signifie ce panneau ?',
            'signImagePath': '/images/signs/C3.png',
            'choices': [
              {'id': 101, 'textEn': 'No entry', 'textAr': 'ممنوع الدخول'},
            ],
          },
        ],
      });

      expect(session.sessionId, 7);
      expect(session.questions.single.choices.single.id, 101);
      expect(
        session.questions.single.choices.single.textFor('ar'),
        'ممنوع الدخول',
      );
    },
  );

  test('parses the general quiz contract without exposing correctness', () {
    final question = QuizQuestion.fromJson({
      'id': 407,
      'questionEn': 'Are you allowed to turn left?',
      'questionAr': 'هل يجوز لك الانعطاف يسارًا؟',
      'questionNl': 'Mag je links afslaan?',
      'questionFr': 'Peux-tu tourner à gauche ?',
      'contentImageUrl': '/images/quiz/example.png',
      'categoryId': 51,
      'options': [
        {'id': 1051, 'optionTextEn': 'Yes', 'optionTextAr': 'نعم'},
        {'id': 1052, 'optionTextEn': 'No', 'optionTextAr': 'لا'},
      ],
    });

    expect(question.id, 407);
    expect(question.options, hasLength(2));
    expect(question.options.first.textFor('ar'), 'نعم');
  });

  test('parses mixed sign practice session, timeout result, and progress', () {
    final session = SignRandomPracticeSession.fromJson({
      'sessionId': 9,
      'status': 'IN_PROGRESS',
      'totalQuestions': 50,
      'passingScore': 70,
      'startedAt': '2026-09-30T10:00:00Z',
      'expiresAt': '2026-09-30T10:12:00Z',
      'questions': [
        {
          'id': 12,
          'questionEn': 'What does this sign mean?',
          'questionAr': 'ماذا تعني؟',
          'questionNl': 'Wat betekent dit?',
          'questionFr': 'Que signifie ceci ?',
          'difficulty': 'HARD',
          'signCode': 'C3',
          'choices': [],
        },
      ],
    });
    final result = SignRandomPracticeResult.fromJson({
      'sessionId': 9,
      'status': 'COMPLETED',
      'totalQuestions': 50,
      'answeredCount': 49,
      'correctAnswers': 40,
      'wrongAnswers': 9,
      'unanswered': 1,
      'scorePercentage': 80,
      'passed': true,
      'passingScore': 70,
      'questions': [
        {
          'questionId': 12,
          'questionEn': 'What does this sign mean?',
          'questionAr': 'ماذا تعني؟',
          'questionNl': 'Wat betekent dit?',
          'questionFr': 'Que signifie ceci ?',
          'isCorrect': false,
          'wasTimeout': true,
          'difficulty': 'HARD',
        },
      ],
    });
    final progress = SignUserProgress.fromJson({
      'practiceStarted': true,
      'practiceCompleted': true,
      'practiceBestScorePct': 80,
      'exam1Attempted': true,
      'exam1Passed': false,
    });

    expect(session.questions.single.difficulty, 'HARD');
    expect(session.questions.single.signCode, 'C3');
    expect(result.unanswered, 1);
    expect(result.questions.single.wasTimeout, isTrue);
    expect(progress.practiceBestScorePct, 80);
    expect(progress.exam1Passed, isFalse);
  });

  test('parses exam results fallback and all lifecycle history states', () {
    final result = ExamResults.fromJson({
      'examId': 42,
      'completedAt': '2026-09-30T10:00:00Z',
      'totalQuestions': 50,
      'correctAnswers': 41,
      'wrongAnswers': 9,
      'scorePercentage': 82,
      'passed': true,
      'incorrectQuestions': [
        {
          'questionTextEn': 'Question',
          'selectedOptionText': 'Wrong',
          'correctOptionText': 'Right',
          'isCorrect': false,
          'wasTimeout': false,
        },
      ],
    });
    final history = ExamHistoryResponse.fromJson({
      'totalExams': 2,
      'exams': [
        {
          'examId': 42,
          'status': 'COMPLETED',
          'completedAt': '2026-09-30T10:00:00Z',
          'scorePercentage': 82,
          'correctAnswers': 41,
          'totalQuestions': 50,
          'passed': true,
        },
        {
          'examId': 43,
          'status': 'IN_PROGRESS',
          'startedAt': '2026-09-30T11:00:00Z',
        },
      ],
    });

    expect(result.answers, hasLength(1));
    expect(result.answers.single.localized('correctOptionText', 'en'), 'Right');
    expect(result.completedAt, isNotNull);
    expect(history.exams, hasLength(2));
    expect(history.exams.last.status, 'IN_PROGRESS');
    expect(history.exams.last.completedAt, isNull);

    final signResult = ExamResults.fromSignResult({
      'resultId': 8,
      'signCode': 'C3',
      'totalLinked': 2,
      'correctAnswers': 1,
      'wrongAnswers': 1,
      'unansweredCount': 0,
      'scorePercentage': 50,
      'passingThreshold': 2,
      'passed': false,
      'questionResults': [
        {
          'questionId': 10,
          'questionEn': 'Sign question',
          'selectedTextEn': 'No entry',
          'correctTextEn': 'Yield',
          'isCorrect': false,
          'answered': true,
        },
      ],
    });
    expect(
      signResult.answers.single.localized('questionText', 'en'),
      'Sign question',
    );
    expect(
      signResult.answers.single.localized('correctOptionText', 'en'),
      'Yield',
    );
  });

  test('uses the web-compatible language fallback chain for review fields', () {
    final answer = ExamAnswerReview.fromJson({
      'questionTextAr': '',
      'questionTextEn': 'English question',
      'explanationNl': 'Nederlandse uitleg',
      'correctOptionTextFr': '',
      'correctOptionTextEn': 'Correct answer',
    });

    expect(answer.localized('questionText', 'ar'), 'English question');
    expect(answer.localized('explanation', 'fr'), 'Nederlandse uitleg');
    expect(answer.localized('correctOptionText', 'nl'), 'Correct answer');
  });

  test('falls back to the first available category language', () {
    final category = ExamCategoryBreakdown.fromJson({
      'categoryNameNl': 'Verkeersregels',
      'totalQuestions': 4,
      'correctAnswers': 3,
      'accuracyPercentage': 75,
    });

    expect(category.localizedName('ar'), 'Verkeersregels');
  });

  test('uses alternate sign result answer arrays when questions is empty', () {
    final result = ExamResults.fromSignResult({
      'totalLinked': 1,
      'correctAnswers': 0,
      'questions': [],
      'allAnswers': [
        {
          'questionTextEn': 'Fallback question',
          'selectedOptionTextEn': 'Wrong',
          'correctOptionTextEn': 'Right',
          'isCorrect': false,
        },
      ],
    });

    expect(result.answers, hasLength(1));
    expect(
      result.answers.single.localized('questionText', 'en'),
      'Fallback question',
    );
  });

  test('formats result durations like the web presentation', () {
    expect(formatExamDuration(0), '00:00');
    expect(formatExamDuration(65), '01:05');
    expect(formatExamDuration(3661), '01:01:01');
  });

  test('parses sign practice feedback and result review fields', () {
    final feedback = SignPracticeFeedback.fromJson({
      'isCorrect': false,
      'questionsAnswered': 1,
      'totalQuestions': 2,
      'sessionCompleted': false,
      'selectedTextEn': 'No entry',
      'correctTextEn': 'Yield',
      'explanationEn': 'Give way.',
      'signAccuracyPercentage': 50,
      'signTotalAttempts': 2,
    });
    expect(feedback.selectedTextFor('ar'), 'No entry');
    expect(feedback.correctTextFor('fr'), 'Yield');
    expect(feedback.explanationFor('nl'), 'Give way.');

    final result = SignPracticeResult.fromJson({
      'sessionId': 12,
      'status': 'COMPLETED',
      'totalQuestions': 1,
      'correctAnswers': 0,
      'wrongAnswers': 1,
      'scorePercentage': 0,
      'passed': false,
      'questionResults': [
        {
          'questionId': 1,
          'difficulty': 'HARD',
          'questionEn': 'Question',
          'selectedTextEn': 'No entry',
          'correctTextEn': 'Yield',
          'explanationEn': 'Give way.',
          'isCorrect': false,
        },
      ],
    });
    expect(result.questions.single.correctTextFor('ar'), 'Yield');
    expect(result.questions.single.explanationFor('fr'), 'Give way.');
  });

  test('keeps generic quiz difficulty and type metadata', () {
    final question = QuizQuestion.fromJson({
      'id': 1,
      'questionEn': 'Question',
      'difficultyLevel': 'HARD',
      'questionType': 'RULE',
      'options': [],
    });
    expect(question.difficultyLevel, 'HARD');
    expect(question.questionType, 'RULE');
  });
}
