import 'package:get_it/get_it.dart';
import '../network/api_client.dart';
import '../network/authenticated_api_client.dart';
import '../storage/secure_storage_service.dart';
import '../../features/auth/data/datasources/auth_remote_data_source.dart';
import '../../features/auth/data/repositories/auth_repository_impl.dart';
import '../../features/auth/domain/repositories/auth_repository.dart';
import '../../features/auth/domain/usecases/login_usecase.dart';
import '../../features/auth/domain/usecases/logout_usecase.dart';
import '../../features/auth/domain/usecases/get_current_user_usecase.dart';
import '../../features/auth/presentation/bloc/auth_bloc.dart';
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
  // Core - Storage
  getIt.registerLazySingleton<SecureStorageService>(
    () => SecureStorageService(),
  );

  // Core - API Clients
  getIt.registerLazySingleton<ApiClient>(() => ApiClient());

  getIt.registerLazySingleton<AuthenticatedApiClient>(
    () => AuthenticatedApiClient(getIt<SecureStorageService>()),
  );

  // Auth Feature - Data Sources
  getIt.registerLazySingleton<AuthRemoteDataSource>(
    () => AuthRemoteDataSource(getIt<AuthenticatedApiClient>()),
  );

  // Auth Feature - Repositories
  getIt.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(
      remoteDataSource: getIt<AuthRemoteDataSource>(),
      secureStorage: getIt<SecureStorageService>(),
    ),
  );

  // Auth Feature - Use Cases
  getIt.registerLazySingleton<LoginUseCase>(
    () => LoginUseCase(getIt<AuthRepository>()),
  );

  getIt.registerLazySingleton<LogoutUseCase>(
    () => LogoutUseCase(getIt<AuthRepository>()),
  );

  getIt.registerLazySingleton<GetCurrentUserUseCase>(
    () => GetCurrentUserUseCase(getIt<AuthRepository>()),
  );

  // Auth Feature - BLoC
  getIt.registerFactory<AuthBloc>(
    () => AuthBloc(
      loginUseCase: getIt<LoginUseCase>(),
      logoutUseCase: getIt<LogoutUseCase>(),
      getCurrentUserUseCase: getIt<GetCurrentUserUseCase>(),
      authRepository: getIt<AuthRepository>(),
    ),
  );

  // Existing Services (using old ApiClient for now, can migrate later)
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
