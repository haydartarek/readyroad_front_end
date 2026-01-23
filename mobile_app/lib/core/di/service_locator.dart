import 'package:get_it/get_it.dart';
import '../network/api_client.dart';
import '../../features/categories/category_service.dart';
import '../../features/signs/traffic_sign_service.dart';
import '../../features/lessons/lesson_service.dart';
import '../../features/exam/exam_question_service.dart';
import '../../features/practice/practice_question_service.dart';
import '../../shared/services/content_service.dart';

/// Service Locator for Dependency Injection
final getIt = GetIt.instance;

/// Setup all dependencies
void setupDependencies() {
  // Core
  getIt.registerLazySingleton<ApiClient>(() => ApiClient());

  // Services
  getIt.registerLazySingleton<CategoryService>(
    () => CategoryService(getIt<ApiClient>()),
  );

  getIt.registerLazySingleton<TrafficSignService>(
    () => TrafficSignService(getIt<ApiClient>()),
  );

  getIt.registerLazySingleton<ContentService>(
    () => ContentService(getIt<ApiClient>()),
  );

  getIt.registerLazySingleton<LessonService>(
    () => LessonService(getIt<ApiClient>()),
  );

  getIt.registerLazySingleton<ExamQuestionService>(
    () => ExamQuestionService(getIt<ApiClient>()),
  );

  getIt.registerLazySingleton<PracticeQuestionService>(
    () => PracticeQuestionService(getIt<ApiClient>()),
  );
}

