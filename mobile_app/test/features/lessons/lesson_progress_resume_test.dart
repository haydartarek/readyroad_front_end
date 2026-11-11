import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/lessons/lesson_service.dart';

void main() {
  LessonProgress progress(int pagesRead, {bool completed = false}) =>
      LessonProgress(
        lessonId: 7,
        pagesRead: pagesRead,
        status: completed ? 'COMPLETED' : 'IN_PROGRESS',
        completed: completed,
      );

  group('Lesson progress resume (server is source of truth)', () {
    test('unread lesson starts at first page', () {
      expect(progress(0).resumePageIndex(10), 0);
    });

    test('first page read reopens first page, not second', () {
      expect(progress(1).resumePageIndex(10), 0);
    });

    test('third page reached reopens third page', () {
      expect(progress(3).resumePageIndex(10), 2);
    });

    test('completed lesson reopens final page', () {
      expect(progress(10, completed: true).resumePageIndex(10), 9);
    });

    test('server count over new lesson size clamps to final page', () {
      expect(progress(99).resumePageIndex(4), 3);
    });

    test('negative or missing counts do not skip pages', () {
      expect(progress(-1).resumePageIndex(4), 0);
      final raw = LessonProgress.fromJson({'lessonId': 7, 'status': 'NOT_STARTED', 'completed': false});
      expect(raw.resumePageIndex(4), 0);
    });

    test('empty and single-page lessons are safe', () {
      expect(progress(1).resumePageIndex(0), 0);
      expect(progress(99).resumePageIndex(1), 0);
    });

    test('backend JSON uses 1-based pagesRead as last reached page', () {
      final raw = LessonProgress.fromJson({
        'lessonId': 7,
        'pagesRead': 2,
        'status': 'IN_PROGRESS',
        'completed': false,
      });
      expect(raw.resumePageIndex(5), 1);
    });
  });
}
