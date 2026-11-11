import 'package:flutter_test/flutter_test.dart';

import 'package:mobile_app/features/auth/data/models/user_model.dart';
import 'package:mobile_app/features/lessons/lesson_service.dart';

void main() {
  test('user profile keeps the complete backend auth contract', () {
    final user = UserModel.fromJson({
      'id': 42,
      'username': 'driver42',
      'email': 'driver@example.com',
      'fullName': 'Driver 42',
      'emailVerified': true,
      'linkedProviders': ['LOCAL', 'GOOGLE'],
      'googleLinked': true,
      'role': 'USER',
      'isActive': true,
    });

    final entity = user.toEntity();
    expect(entity.username, 'driver42');
    expect(entity.emailVerified, isTrue);
    expect(entity.linkedProviders, ['LOCAL', 'GOOGLE']);
    expect(entity.googleLinked, isTrue);
  });

  test('lesson summary preserves metadata and localized fallback', () {
    final lesson = LessonSummary.fromJson({
      'id': 1,
      'lessonCode': 'RULES-01',
      'icon': '🚦',
      'titleEn': 'Priority',
      'titleFr': 'Priorité',
      'titleNl': 'Voorrang',
      'titleAr': 'الأولوية',
      'descriptionEn': 'Priority rules',
      'descriptionFr': 'Règles de priorité',
      'descriptionNl': 'Voorrangsregels',
      'descriptionAr': 'قواعد الأولوية',
      'displayOrder': 1,
      'estimatedMinutes': 12,
      'totalPages': 4,
    });

    expect(lesson.totalPages, 4);
    expect(lesson.estimatedMinutes, 12);
    expect(lesson.titleFor('fr'), 'Priorité');
    expect(lesson.titleFor('ar'), 'الأولوية');
  });
}
