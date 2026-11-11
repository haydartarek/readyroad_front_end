import 'package:mobile_app/core/constants/api_constants.dart';
import 'package:mobile_app/design_system/widgets/rijvia_web_navigation.dart';
import 'package:mobile_app/design_system/widgets/rijvia_page_surface.dart';
import 'package:mobile_app/features/admin/admin_signs_screen.dart';
import 'package:mobile_app/features/admin/admin_data_import_screen.dart';
import 'package:mobile_app/features/admin/admin_file_upload.dart';
import 'package:mobile_app/features/public/public_catalog_screen.dart';
import 'package:mobile_app/features/public/rijvia_video_player.dart';
import 'package:mobile_app/main.dart' show MyApp;
import 'package:mobile_app/features/admin/admin_workspace.dart';
import 'package:mobile_app/core/navigation/web_route_registry.dart';
import 'package:mobile_app/features/public/public_document_screen.dart';
import 'package:mobile_app/features/public/contact_screen.dart';
import 'package:mobile_app/features/assessment/assessment_screen.dart';
import 'package:mobile_app/features/dashboard/dashboard_workspace.dart';
import 'package:mobile_app/features/exam/category_exam_screen.dart';
import 'package:mobile_app/features/categories/traffic_signs_screen.dart';
import 'package:mobile_app/features/categories/web_practice_screen.dart';
import 'package:mobile_app/features/auth/presentation/bloc/auth_event.dart';
import 'package:mobile_app/features/dashboard/progress_presentation.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:mobile_app/design_system/widgets/rijvia_answer_option.dart';
import 'dart:convert';
import 'package:mobile_app/design_system/widgets/rijvia_category_image.dart';
import 'package:mobile_app/features/categories/widgets/rijvia_sign_card.dart';
import 'package:mobile_app/features/exam/exam_history_screen.dart';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/constants/app_theme.dart';
import 'package:mobile_app/core/di/service_locator.dart';
import 'package:mobile_app/core/localization/app_localizations.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:mobile_app/core/network/authenticated_api_client.dart';
import 'package:mobile_app/core/providers/favorites_api_gateway.dart';
import 'package:mobile_app/core/providers/favorites_provider.dart';
import 'package:mobile_app/core/providers/language_provider.dart';
import 'package:mobile_app/core/providers/statistics_provider.dart';
import 'package:mobile_app/core/providers/theme_provider.dart';
import 'package:mobile_app/core/storage/secure_storage_service.dart';
import 'package:mobile_app/features/auth/domain/entities/user.dart';
import 'package:mobile_app/features/auth/domain/repositories/auth_repository.dart';
import 'package:mobile_app/features/auth/domain/usecases/get_current_user_usecase.dart';
import 'package:mobile_app/features/auth/domain/usecases/login_usecase.dart';
import 'package:mobile_app/features/auth/domain/usecases/logout_usecase.dart';
import 'package:mobile_app/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:mobile_app/features/auth/presentation/bloc/auth_state.dart';
import 'package:mobile_app/features/auth/presentation/screens/login_screen.dart';
import 'package:mobile_app/features/auth/presentation/screens/register_screen.dart';
import 'package:mobile_app/features/auth/presentation/screens/forgot_password_screen.dart';
import 'package:mobile_app/features/auth/presentation/screens/reset_password_screen.dart';
import 'package:mobile_app/features/auth/presentation/screens/welcome_screen.dart';
import 'package:mobile_app/features/dashboard/dashboard_screen.dart';
import 'package:mobile_app/features/exam/exam_screen.dart';
import 'package:mobile_app/features/exam/exam_results_screen.dart';
import 'package:mobile_app/features/home/rijvia_app_shell.dart';
import 'package:mobile_app/features/home/home_screen.dart';
import 'package:mobile_app/design_system/widgets/rijvia_components.dart';
import 'package:mobile_app/features/lessons/lesson_service.dart';
import 'package:mobile_app/features/lessons/lessons_list_screen.dart';
import 'package:mobile_app/features/profile/profile_screen.dart';
import 'package:mobile_app/features/search/search_screen.dart';
import 'package:mobile_app/features/analytics/analytics_screen.dart';
import 'package:mobile_app/features/notifications/notifications_screen.dart';
import 'package:mobile_app/shared/models/category.dart' as models;
import 'package:mobile_app/shared/models/content_item.dart';
import 'package:mobile_app/shared/models/quiz_models.dart';
import 'package:mobile_app/features/categories/category_signs_screen.dart';
import 'package:mobile_app/features/categories/sign_quiz_service.dart';
import 'package:mobile_app/features/categories/sign_details_screen.dart';
import 'package:mobile_app/features/quiz/quiz_result_screen.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../support/load_app_fonts.dart';

// These are test-only fixtures. Production screens keep using their services.
const _lesson = <String, dynamic>{
  'id': 1,
  'lessonCode': 'layout-test',
  'displayOrder': 1,
  'totalPages': 1,
  'estimatedMinutes': 10,
  'titleEn': 'Priority at intersections and road junctions',
  'titleAr': 'الأولوية في التقاطعات وقواعد استعمال الطريق',
  'titleFr': 'Priorité aux intersections et aux carrefours',
  'titleNl': 'Voorrang op kruispunten en verkeersregels',
  'descriptionEn': 'A long lesson description to verify card wrapping.',
  'descriptionAr': 'وصف الدرس لاختبار التفاف النص والمساحات داخل البطاقة.',
  'descriptionFr':
      'Description de la leçon pour vérifier le retour à la ligne.',
  'descriptionNl': 'Beschrijving van de les om de tekstomloop te controleren.',
};
const _score = <String, dynamic>{
  'totalQuestions': 50,
  'correctAnswers': 42,
  'wrongAnswers': 8,
  'scorePercentage': 84,
  'passed': true,
  'timeTakenSeconds': 600,
};

class _PublicFixture extends ApiClient {
  final responses = <String, Object>{};
  @override
  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    final Object data;
    if (responses.containsKey(path)) {
      data = responses[path]!;
    } else if (path == '/api/lessons/home-overview') {
      data = [
        {
          ..._lesson,
          'displayOrder': 1,
          'categories': [
            {
              'categoryCode': 'TH01',
              'nameEn': 'Priority rules',
              'questionCount': 2,
              'primary': true,
            },
          ],
        },
      ];
    } else if (path == '/api/lessons' || path == '/api/lessons/search') {
      data = [_lesson];
    } else if (path == '/api/lessons/layout-test') {
      data = {
        ..._lesson,
        'pages': [
          {
            'id': 1,
            'pageNumber': 1,
            'titleEn': 'Road rules',
            'titleAr': 'قواعد الطريق',
            'titleFr': 'Règles de circulation',
            'titleNl': 'Verkeersregels',
            'contentEn': List.filled(35, 'Lesson content.').join('\n\n'),
            'contentAr': 'محتوى الدرس.',
            'contentFr': 'Contenu de la leçon.',
            'contentNl': 'Lesinhoud.',
          },
          {
            'id': 2,
            'pageNumber': 2,
            'titleEn': 'Second lesson section',
            'titleAr': 'القسم الثاني من الدرس',
            'titleFr': 'Deuxième section',
            'titleNl': 'Tweede onderdeel',
            'contentEn': 'Second section content.',
          },
        ],
      };
    } else if (path.contains('categories')) {
      data = [
        {
          'id': 1,
          'code': 'B',
          'signCount': 16,
          'nameEn': 'Priority signs',
          'nameAr': 'علامات الأولوية',
          'nameNl': 'Voorrangsborden',
          'nameFr': 'Signaux de priorité',
        },
      ];
    } else {
      data = [
        {
          'id': 1,
          'signCode': 'B1',
          'categoryCode': 'B',
          'imageUrl': '/images/signs/B1.png',
          'nameEn': 'Give way to traffic on the priority road',
          'nameAr': 'أعط الأولوية للمركبات على الطريق الرئيسي',
          'nameFr': 'Cédez le passage aux véhicules prioritaires',
          'nameNl': 'Verleen voorrang aan verkeer op de hoofdweg',
        },
      ];
    }
    return Response(
      requestOptions: RequestOptions(path: path),
      statusCode: 200,
      data: data,
    );
  }
}

class _AccountFixture extends AuthenticatedApiClient {
  _AccountFixture() : super(getIt<SecureStorageService>());
  final responses = <String, Object>{};
  final reads = <String>[];
  final requestQueries = <String, Map<String, dynamic>?>{};
  final writes = <String>[];
  final writeData = <String, dynamic>{};
  bool activeExam = false;
  String accessMode = 'PREVIEW';
  Map<String, dynamic> answerResponse = {};
  bool threeOptions = false;
  bool questionImage = false;
  bool progressLabels = false;
  int unreadCount = 0;
  List<Map<String, dynamic>> notifications = [];

  @override
  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    reads.add(path);
    requestQueries[path] = queryParameters;
    final Object data;
    if (responses.containsKey(path)) {
      data = responses[path]!;
    } else if (path == '/api/users/me/notifications') {
      data = notifications;
    } else if (path == '/api/users/me/notifications/unread-count') {
      data = {'unreadCount': unreadCount};
    } else if (path == '/api/users/me') {
      data = {
        'id': 'layout-test',
        'fullName': 'Layout test account',
        'email': 'layout@example.test',
      };
    } else if (path == '/api/account/access') {
      data = {'active': false, 'unlimited': false};
    } else if (path.endsWith('/overall')) {
      data = {
        'totalAttempted': 320,
        'totalCorrect': 218,
        'overallAccuracy': 68,
        'totalExamsTaken': 5,
        'passedExams': 3,
        'failedExams': 2,
        'passRate': 60,
        'studyStreak': 3,
        'incompleteActivitiesCount': 1,
        'lessonsCompletedCount': 1,
      };
    } else if (progressLabels && path == '/api/users/me/progress/categories') {
      data = [
        {
          'categoryCode': 'B',
          'categoryNameEn': 'Priority',
          'questionsAttempted': 12,
          'masteryLevel': 'ADVANCED',
          'accuracyRate': 85,
        },
      ];
    } else if (progressLabels &&
        path == '/api/users/me/progress/intelligence') {
      data = {
        'studentLevel': 'ADVANCED',
        'overallLearningTrend': 'IMPROVING',
        'learningPriorities': [
          {'categoryCode': 'B', 'trend': 'IMPROVING'},
        ],
      };
    } else if (path == '/api/lessons') {
      data = [_lesson];
    } else if (path == '/api/sign-quiz/user-progress') {
      data = [
        {
          'signCode': 'B1',
          'category': 'PRIORITY',
          'nameEn': 'Give way',
          'nameAr': 'أعط الأولوية',
          'nameFr': 'Cédez le passage',
          'nameNl': 'Voorrang verlenen',
          'practiceBestScorePct': 60,
        },
      ];
    } else if (path.endsWith('/progress')) {
      data = {'lessonId': 1, 'pagesRead': 0, 'completed': false};
    } else if (path.endsWith('/active')) {
      data = activeExam
          ? {
              'hasActiveExam': true,
              'activeExam': {
                'examId': 77,
                'status': 'IN_PROGRESS',
                'accessMode': accessMode,
                'accessState': accessMode == 'PREVIEW'
                    ? 'PREVIEW_ACTIVE'
                    : 'ACTIVE',
                'totalQuestions': 50,
                'freeQuestionLimit': 10,
                'resumeQuestionOrder': 1,
                'finalizedQuestionIds': <int>[],
                'serverTime': DateTime.now().toUtc().toIso8601String(),
                'questionDeadlineAt': DateTime.now()
                    .toUtc()
                    .add(const Duration(seconds: 15))
                    .toIso8601String(),
                'questions': [
                  for (var index = 0; index < 10; index++)
                    {
                      'questionId': 90 + index,
                      if (questionImage)
                        'imageUrl': '/images/questions/road.png',
                      'questionOrder': index + 1,
                      'questionTextEn': 'Who has priority at this junction?',
                      'questionTextAr': 'من له الأولوية في هذا التقاطع؟',
                      'options': [
                        {
                          'optionId': 100,
                          'optionTextEn': 'The blue car',
                          'optionTextAr': 'السيارة الزرقاء',
                        },
                        {
                          'optionId': 101,
                          'optionTextEn': 'The red car',
                          'optionTextAr': 'السيارة الحمراء',
                        },
                        if (threeOptions)
                          {
                            'optionId': 102,
                            'optionTextEn': 'The cyclist',
                            'optionTextAr': 'الدراجة',
                          },
                      ],
                    },
                ],
              },
            }
          : {'hasActiveExam': false};
    } else if (path.contains('history') ||
        path.endsWith('/categories') ||
        path.endsWith('/recommendations') ||
        path.endsWith('/error-patterns') ||
        path.contains('timeouts')) {
      data = <dynamic>[];
    } else {
      data = <String, dynamic>{};
    }
    return Response(
      requestOptions: RequestOptions(path: path),
      statusCode: 200,
      data: data,
    );
  }

  @override
  Future<Response> patch(String path, {dynamic data}) async {
    writes.add(path);
    if (path.endsWith('/read-all')) unreadCount = 0;
    return Response(
      requestOptions: RequestOptions(path: path),
      statusCode: 200,
      data: {},
    );
  }

  @override
  Future<Response> post(String path, {dynamic data, Options? options}) async {
    writes.add(path);
    writeData[path] = data;
    return Response(
      requestOptions: RequestOptions(path: path),
      statusCode: 200,
      data: responses.containsKey(path)
          ? responses[path]
          : path.endsWith('/answer')
          ? answerResponse
          : {
              'lessonId': 1,
              'pagesRead': data is Map ? data['pageNumber'] ?? 1 : 1,
              'completed': false,
            },
    );
  }
}

class _LayoutAuth extends AuthBloc {
  void seed(AuthState state) => emit(state);
  bool ignoreInitialCheck = false;
  @override
  void add(AuthEvent event) {
    if (!(ignoreInitialCheck && event is CheckAuthEvent)) super.add(event);
  }

  _LayoutAuth()
    : super(
        loginUseCase: getIt<LoginUseCase>(),
        logoutUseCase: getIt<LogoutUseCase>(),
        getCurrentUserUseCase: getIt<GetCurrentUserUseCase>(),
        authRepository: getIt<AuthRepository>(),
      ) {
    emit(
      Authenticated(
        User(
          id: 'layout-test',
          email: 'layout@example.test',
          name: 'Layout test account',
        ),
      ),
    );
  }
}

class _FavoritesFixture implements FavoritesRemoteGateway {
  final ids = <int>{};
  final writes = <String>[];
  @override
  Future<Set<int>> load(String expectedUserId) async => {...ids};
  @override
  Future<void> add(String expectedUserId, int signId) async {
    ids.add(signId);
    writes.add('add:$signId');
  }

  @override
  Future<void> remove(String expectedUserId, int signId) async {
    ids.remove(signId);
    writes.add('remove:$signId');
  }
}

class _LoadedLocale extends LocalizationsDelegate<AppLocalizations> {
  const _LoadedLocale(this.value);
  final AppLocalizations value;
  @override
  bool isSupported(Locale locale) => locale == value.locale;
  @override
  Future<AppLocalizations> load(Locale locale) => SynchronousFuture(value);
  @override
  bool shouldReload(_LoadedLocale old) => value.locale != old.value.locale;
}

void main() {
  const captureStoryboard = bool.fromEnvironment('CAPTURE_STORYBOARD');
  final captureBoundary = GlobalKey();
  Future<void> capture(WidgetTester tester, String name) async {
    if (!captureStoryboard) return;
    await tester.runAsync(() async {
      await precacheImage(
        const AssetImage('assets/branding/rijvia-app-icon.png'),
        captureBoundary.currentContext!,
      );
    });
    await tester.pump();
    final boundary =
        captureBoundary.currentContext!.findRenderObject()
            as RenderRepaintBoundary;
    await tester.runAsync(() async {
      final image = await boundary.toImage(pixelRatio: 2);
      final data = await image.toByteData(format: ui.ImageByteFormat.png);
      final file = File('output/wireframe-review/$name.png');
      await file.parent.create(recursive: true);
      await file.writeAsBytes(data!.buffer.asUint8List());
      image.dispose();
    });
  }

  test('backend category names use the same families as category progress', () {
    const families = {
      'DANGER': SignCategoryCode.a,
      'PRIORITY': SignCategoryCode.b,
      'PROHIBITION': SignCategoryCode.c,
      'MANDATORY': SignCategoryCode.d,
      'PARKING': SignCategoryCode.e,
      'INFORMATION': SignCategoryCode.f,
      'ROAD_MANAGEMENT': SignCategoryCode.f,
      'ADDITIONAL': SignCategoryCode.g,
      'CYCLIST': SignCategoryCode.m,
      'DELINEATION': SignCategoryCode.m,
      'ZONE': SignCategoryCode.z,
    };
    for (final entry in families.entries) {
      expect(SignCategoryCode.fromValue(entry.key), entry.value);
    }
    expect(SignCategoryCode.fromValue('B'), SignCategoryCode.b);
    expect(SignCategoryCode.fromValue('unknown'), SignCategoryCode.other);
  });
  final locales = <String, AppLocalizations>{};
  late _LayoutAuth auth;
  late _AccountFixture api;
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    await publicContentRepository.load();
    await loadAppFonts();
    for (final code in ['ar', 'en', 'nl', 'fr']) {
      await initializeDateFormatting(code);
    }
    for (final code in ['ar', 'en', 'nl', 'fr']) {
      final value = AppLocalizations(Locale(code));
      await value.load();
      locales[code] = value;
    }
  });
  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await getIt.reset();
    setupDependencies();
    await getIt.unregister<ApiClient>();
    getIt.registerSingleton<ApiClient>(_PublicFixture());
    await getIt.unregister<AuthenticatedApiClient>();
    api = _AccountFixture();
    getIt.registerSingleton<AuthenticatedApiClient>(api);
    await getIt.unregister<AuthBloc>();
    auth = _LayoutAuth();
    getIt.registerSingleton<AuthBloc>(auth);
  });
  tearDown(() async {
    await auth.close();
    await getIt.reset();
  });

  Future<void> mount(
    WidgetTester tester,
    Widget page,
    String code,
    Brightness brightness, {
    double textScale = 1,
    bool capturePage = true,
  }) async {
    SharedPreferences.setMockInitialValues({'readyroad_locale': code});
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          BlocProvider<AuthBloc>.value(value: auth),
          ChangeNotifierProvider(create: (_) => LanguageProvider()),
          ChangeNotifierProvider(create: (_) => ThemeProvider()),
          ChangeNotifierProvider(create: (_) => StatisticsProvider()),
          ChangeNotifierProvider(
            create: (_) => FavoritesProvider(gateway: _FavoritesFixture()),
          ),
        ],
        child: RepaintBoundary(
          key: captureBoundary,
          child: MaterialApp(
            debugShowCheckedModeBanner: false,
            key: UniqueKey(),
            locale: Locale(code),
            builder: (context, child) => MediaQuery(
              data: MediaQuery.of(
                context,
              ).copyWith(textScaler: TextScaler.linear(textScale)),
              child: child!,
            ),
            supportedLocales: AppLocalizations.supportedLocales,
            localizationsDelegates: [
              _LoadedLocale(locales[code]!),
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            theme: brightness == Brightness.dark
                ? AppTheme.darkTheme
                : AppTheme.lightTheme,
            home: page,
            onGenerateRoute: WebRouteRegistry.generate,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: '$page $code $brightness');
    if (!capturePage) return;
    if (captureStoryboard &&
        page is RijviaAppShell &&
        code == 'ar' &&
        tester.view.physicalSize.width == 390 &&
        brightness == Brightness.dark) {
      await capture(tester, 'contract-dark-home-widget');
    }
    if (captureStoryboard &&
        page is RijviaAppShell &&
        code == 'ar' &&
        tester.view.physicalSize.width == 1280 &&
        brightness == Brightness.light) {
      await capture(tester, 'contract-desktop-home-widget');
    }
    if (code == 'ar' &&
        brightness == Brightness.light &&
        tester.view.physicalSize.width == 390) {
      if (page is WelcomeScreen) {
        await capture(tester, 'contract-welcome-widget');
      }
      if (page is LoginScreen) {
        await capture(tester, 'contract-login-widget');
      }
      if (captureStoryboard && page is PlansScreen) {
        await capture(tester, 'contract-plans-widget');
        await tester.scrollUntilVisible(
          find.text(locales[code]!.t('home.pricing.feature_languages')),
          250,
          scrollable: find.byType(Scrollable).first,
        );
        await tester.pumpAndSettle();
        await capture(tester, 'contract-plans-benefits-widget');
      }
    }
  }

  const fourthNames = {
    'en':
        'Give way to all traffic on the priority road before entering the junction',
    'ar': 'أعط الأولوية لجميع المركبات على الطريق الرئيسي قبل دخول التقاطع',
    'nl':
        'Verleen voorrang aan alle voertuigen op de voorrangsweg voordat u het kruispunt oprijdt',
    'fr':
        'Cédez le passage à tous les véhicules sur la route prioritaire avant de vous engager',
  };
  const fourthQuestion = {
    'en': 'Which vehicle has priority in this road situation?',
    'ar': 'أي مركبة لها الأولوية في هذا الموقف المروري؟',
    'nl': 'Welk voertuig heeft voorrang in deze verkeerssituatie?',
    'fr': 'Quel véhicule a la priorité dans cette situation routière ?',
  };

  void fourthFixtures() {
    final public = getIt<ApiClient>() as _PublicFixture;
    final baseCategory = <String, dynamic>{
      'id': 1,
      'code': 'B',
      'signCount': 16,
      'nameEn': 'Priority signs',
      'nameAr': 'علامات الأولوية',
      'nameNl': 'Voorrangsborden',
      'nameFr': 'Signaux de priorité',
    };
    public.responses['/api/categories'] = [
      baseCategory,
      {...baseCategory, 'id': 2, 'code': 'A'},
    ];
    public.responses['/api/lessons/layout-test'] = {
      ..._lesson,
      'pages': [
        {
          'id': 1,
          'pageNumber': 1,
          'imageUrl': '/images/lessons/vehicles.png',
          for (final code in fourthNames.keys)
            'title${code[0].toUpperCase()}${code.substring(1)}':
                fourthNames[code],
          for (final code in fourthNames.keys)
            'content${code[0].toUpperCase()}${code.substring(1)}':
                'RIJVIA.BE — ${fourthNames[code]}',
        },
      ],
    };
    api.responses['/api/sign-quiz/user-progress'] = [
      for (var index = 0; index < 3; index++)
        {
          'signCode': 'B${index + 1}',
          'category': 'PRIORITY',
          'imagePath': '/images/signs/B1.png',
          'practiceBestScorePct': 33.3,
          'practiceStarted': true,
          for (final code in fourthNames.keys)
            'name${code[0].toUpperCase()}${code.substring(1)}': index == 0
                ? fourthNames[code]
                : 'B${index + 1}',
        },
    ];
    api.responses['/api/users/me/progress/overall'] = {
      'totalAttempted': 100,
      'totalCorrect': 88,
      'overallAccuracy': 88,
      'totalExamsTaken': 4,
      'passedExams': 2,
      'failedExams': 2,
      'passRate': 50,
      'lessonsCompletedCount': 1,
      'strongCategories': [
        {
          for (final code in fourthNames.keys)
            'categoryName${code[0].toUpperCase()}${code.substring(1)}':
                fourthNames[code],
          'accuracy': 88,
        },
      ],
      'weakSigns': [
        {
          'signCode': 'B22',
          'accuracy': 33.3,
          for (final code in fourthQuestion.keys)
            'questionText${code[0].toUpperCase()}${code.substring(1)}':
                fourthQuestion[code],
        },
      ],
    };
    api.responses['/api/users/me/analytics/weak-areas'] = {
      'weakAreas': [
        {
          'currentAccuracy': 76.8,
          for (final code in fourthNames.keys)
            'categoryName${code[0].toUpperCase()}${code.substring(1)}':
                fourthNames[code],
        },
      ],
    };
    api.responses['/api/users/me/progress/intelligence'] = {
      'dataStatus': 'LIMITED',
    };
    api.responses['/api/users/me/analytics/error-patterns'] = [
      for (final pattern in [
        'RULE_OVERGENERALIZATION',
        'SIGN_CONFUSION',
        'SUPPLEMENTARY_IGNORED',
        'PRIORITY_MISUNDERSTANDING',
        'SPEED_LIMIT_ERROR',
      ])
        {
          'patternType': pattern,
          'description': 'Raw untranslated backend description.',
          'count': pattern == 'SPEED_LIMIT_ERROR' ? 0 : 3,
        },
    ];
    api.responses['/api/exams/simulations/history'] = {
      'items': [
        {
          'examId': 1,
          'status': 'ABANDONED',
          'startedAt': '2026-10-13T20:02:48.622573Z',
          'scorePercentage': 88,
        },
        {'examId': 2, 'status': 'EXPIRED', 'startedAt': '2026-10-12T20:02:48Z'},
      ],
    };
  }

  Future<void> fourthPages(
    WidgetTester tester,
    double width,
    String code,
    Brightness brightness,
    double scale,
  ) async {
    tester.view.devicePixelRatio = 1;
    tester.view.physicalSize = Size(width, 844);
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.binding.setSurfaceSize(Size(width, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    fourthFixtures();
    // The former per-card baseline is replaced by the canonical web surfaces.
    for (final page in <Widget>[
      const HomeScreen(),
      const LessonsListScreen(),
      const LessonDetailScreen(lessonCode: 'layout-test'),
      const TrafficSignsScreen(),
      const WebPracticeScreen(),
      const RandomPracticeEntryScreen(),
      const DashboardWorkspace(section: 'overview'),
      const DashboardWorkspace(section: 'progress'),
      const DashboardWorkspace(section: 'exam-results'),
      const DashboardWorkspace(section: 'profile'),
      const ExamResultsScreen(examId: 1, initialResults: _score),
    ]) {
      await mount(
        tester,
        page,
        code,
        brightness,
        textScale: scale,
        capturePage: false,
      );
      expect(find.byType(NavigationRail), findsNothing);
      expect(find.byType(NavigationBar), findsNothing);
      expect(
        tester.takeException(),
        isNull,
        reason: page.runtimeType.toString(),
      );
    }
    expect(api.writes, everyElement(endsWith('/progress')));
  }

  for (final code in ['ar', 'en', 'nl', 'fr']) {
    testWidgets('fourth favorites menu preserves add load remove $code', (
      tester,
    ) async {
      await mount(
        tester,
        const HomeScreen(),
        code,
        Brightness.light,
        capturePage: false,
      );
      final t = locales[code]!;
      final context = tester.element(find.byType(HomeScreen));
      final favorites = context.read<FavoritesProvider>();
      await favorites.bindToUser('layout-test');
      await tester.pumpAndSettle();
      Future<void> account(String label) async {
        await tester.tap(find.byTooltip(t.navProfile));
        await tester.pumpAndSettle();
        await tester.tap(find.text(label).last);
        await tester.pumpAndSettle();
      }

      final public = getIt<ApiClient>() as _PublicFixture;
      public.responses['${ApiConstants.trafficSigns}/B1'] = {
        'id': 1,
        'signCode': 'B1',
        'categoryCode': 'B',
        'nameEn': 'Give way',
        'nameAr': 'أعط الأولوية',
        'nameNl': 'Voorrang',
        'nameFr': 'Cédez le passage',
      };
      await account(t.t('signs.library'));
      expect(find.byType(TrafficSignsScreen), findsOneWidget);
      final card = find.byType(TrafficSignCatalogCard).first;
      await tester.scrollUntilVisible(
        card,
        250,
        scrollable: find.byType(Scrollable).first,
      );
      await tester.pumpAndSettle();
      await tester.ensureVisible(card);
      await tester.tap(card);
      await tester.pumpAndSettle();
      final add = find.widgetWithText(OutlinedButton, t.t('favorites.web.add'));
      await tester.ensureVisible(add);
      await tester.tap(add);
      await tester.pumpAndSettle();
      expect(favorites.favoriteIds, {1});
      Navigator.of(tester.element(find.byType(SignDetailsScreen))).pop();
      await tester.pumpAndSettle();
      Navigator.of(tester.element(find.byType(TrafficSignsScreen))).pop();
      await tester.pumpAndSettle();
      await account(t.t('nav.favorites'));
      expect(
        tester
            .widget<TrafficSignsScreen>(find.byType(TrafficSignsScreen))
            .favoritesOnly,
        isTrue,
      );
      final saved = find.byType(TrafficSignCatalogCard).first;
      await tester.scrollUntilVisible(
        saved,
        250,
        scrollable: find.byType(Scrollable).first,
      );
      await tester.pumpAndSettle();
      await tester.ensureVisible(saved);
      await tester.tap(saved);
      await tester.pumpAndSettle();
      final remove = find.widgetWithText(
        OutlinedButton,
        t.t('favorites.web.remove'),
      );
      await tester.ensureVisible(remove);
      await tester.tap(remove);
      await tester.pumpAndSettle();
      expect(favorites.favoriteIds, isEmpty);
      Navigator.of(tester.element(find.byType(SignDetailsScreen))).pop();
      await tester.pumpAndSettle();
      expect(find.text(t.t('favorites.web.empty')), findsOneWidget);
      Navigator.of(tester.element(find.byType(TrafficSignsScreen))).pop();
      await tester.pumpAndSettle();
      final theme = context.read<ThemeProvider>();
      final wasDark = theme.isDarkMode;
      await account(t.t(wasDark ? 'theme.light' : 'theme.dark'));
      expect(theme.isDarkMode, !wasDark);
      await account(t.t(wasDark ? 'theme.dark' : 'theme.light'));
      expect(theme.isDarkMode, wasDark);
      await account(t.authLogout);
      expect(find.text(t.t('auth.logout_confirm')), findsOneWidget);
      await tester.tap(find.text(t.commonCancel));
      await tester.pumpAndSettle();
      expect(auth.state, isA<Authenticated>());

      expect(tester.takeException(), isNull);
    });
  }

  for (final width in [390.0, 1280.0]) {
    for (final code in ['ar', 'nl']) {
      for (final brightness in Brightness.values) {
        testWidgets('fifth catalog long title $width $code $brightness', (
          tester,
        ) async {
          tester.view.devicePixelRatio = 1;
          tester.view.physicalSize = Size(width, 844);
          addTearDown(tester.view.resetPhysicalSize);
          addTearDown(tester.view.resetDevicePixelRatio);
          await tester.binding.setSurfaceSize(Size(width, 844));
          addTearDown(() => tester.binding.setSurfaceSize(null));
          await mount(
            tester,
            CategorySignsScreen(
              category: models.Category(
                id: 1,
                nameEn: 'Priority',
                nameAr: 'الأولوية',
                nameNl: 'Voorrang',
                nameFr: 'Priorité',
              ),
            ),
            code,
            brightness,
            textScale: 2,
            capturePage: false,
          );
          final card = find.byType(RijviaSignCard);
          expect(card, findsOneWidget);
          final title = find
              .descendant(
                of: card,
                matching: find.byWidgetPredicate(
                  (w) =>
                      w is Text && w.data != 'B1' && w.data?.isNotEmpty == true,
                ),
              )
              .first;
          final cardRect = tester.getRect(card),
              titleRect = tester.getRect(title);
          expect(titleRect.left, greaterThanOrEqualTo(cardRect.left));
          expect(titleRect.right, lessThanOrEqualTo(cardRect.right));
          expect(
            titleRect.bottom,
            lessThan(
              tester
                  .getRect(find.byTooltip(locales[code]!.t('nav.favorites')))
                  .bottom,
            ),
          );
          expect(tester.widget<Text>(title).maxLines, isNull);
          if (code == 'ar' && width == 390 && brightness == Brightness.light) {
            await capture(tester, 'fifth-ar-200-catalog-widget');
          }
          expect(tester.takeException(), isNull);
        });
      }
    }
  }

  testWidgets(
    'fifth restored session binds language favorites and progress on first frame',
    (tester) async {
      fourthFixtures();
      auth.ignoreInitialCheck = true;
      SharedPreferences.setMockInitialValues({'readyroad_locale': 'en'});
      await tester.pumpWidget(const MyApp());
      await tester.runAsync(() async {
        await Future<void>.delayed(Duration.zero);
      });
      await tester.pumpAndSettle();
      expect(
        find.byType(HomeScreen),
        findsOneWidget,
        reason:
            'Initial auth: ${auth.state.runtimeType}; visible: ${tester.widgetList<Text>(find.byType(Text)).map((text) => text.data).toList()}',
      );
      final home = tester.element(find.byType(HomeScreen));
      expect(home.read<FavoritesProvider>().boundUserId, 'layout-test');
      expect(home.read<StatisticsProvider>().serverProgress?.accuracy, 88);
      expect(
        api.reads.where((path) => path == '/api/users/me/progress/overall'),
        hasLength(1),
      );
      await tester.pumpWidget(const MyApp());
      await tester.pumpAndSettle();
      expect(
        api.reads.where((path) => path == '/api/users/me/progress/overall'),
        hasLength(1),
      );
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox.shrink());
      await tester.pumpAndSettle();
    },
  );

  for (final code in ['ar', 'en', 'nl', 'fr']) {
    testWidgets('web overview shows the three latest server attempts $code', (
      tester,
    ) async {
      fourthFixtures();
      final t = locales[code]!;
      api.responses['/api/exams/simulations/history'] = {
        'items': [
          for (var i = 0; i < 7; i++)
            {
              'examId': i + 1,
              'status': 'COMPLETED',
              'scorePercentage': 81 + i,
              'startedAt':
                  '2026-10-${(14 - i).toString().padLeft(2, '0')}T12:00:00Z',
            },
        ],
      };
      await mount(
        tester,
        const DashboardWorkspace(section: 'overview'),
        code,
        Brightness.light,
        capturePage: false,
      );
      final section = find.text(t.t('dashboard.recent_activity'));
      await tester.scrollUntilVisible(
        section,
        250,
        scrollable: find.byType(Scrollable).first,
      );
      await tester.pumpAndSettle();
      String score(int value) =>
          '${t.t('exam.score')}: ${ProgressPresentation.percentage(value, code)}';
      expect(find.textContaining(score(81)), findsOneWidget);
      expect(find.textContaining(score(83)), findsOneWidget);
      expect(find.textContaining(score(87)), findsNothing);
      expect(tester.takeException(), isNull);
      expect(api.writes, isEmpty);
    });
  }

  for (final code in ['ar', 'en', 'nl', 'fr']) {
    for (final brightness in Brightness.values) {
      testWidgets('store public auth pages $code $brightness 200%', (
        tester,
      ) async {
        tester.view.devicePixelRatio = 1;
        tester.view.physicalSize = const Size(390, 844);
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        await tester.binding.setSurfaceSize(const Size(390, 844));
        addTearDown(() => tester.binding.setSurfaceSize(null));
        for (final page in [
          WelcomeScreen(onContinue: () {}),
          const LoginScreen(),
          const RegisterScreen(),
        ]) {
          await mount(
            tester,
            page,
            code,
            brightness,
            textScale: 2,
            capturePage: false,
          );
          if (page is! LoginScreen) {
            for (final label in [
              'wire.privacy',
              'wire.terms',
              'wire.support',
            ]) {
              final link = find.widgetWithText(
                TextButton,
                locales[code]!.t(label),
              );
              await tester.scrollUntilVisible(
                link,
                240,
                scrollable: find.byType(Scrollable).first,
              );
              expect(link, findsOneWidget, reason: '$page $code $label');
              await tester.ensureVisible(link);
              await tester.pumpAndSettle();
              expect(link.hitTestable(), findsOneWidget);
            }
          }
          if (page is WelcomeScreen) {
            expect(find.byType(AppBar), findsNothing);
          }
          if (code == 'ar' && brightness == Brightness.light) {
            final name = page is WelcomeScreen
                ? 'welcome'
                : page is LoginScreen
                ? 'login'
                : 'register';
            await tester.ensureVisible(
              page is LoginScreen
                  ? find.byKey(const ValueKey('google-auth-button'))
                  : find.widgetWithText(
                      TextButton,
                      locales[code]!.t('wire.support'),
                    ),
            );
            await tester.pumpAndSettle();
            await tester.pump(const Duration(milliseconds: 100));
            await capture(tester, 'store-$name-legal-200-widget');
          }
          expect(tester.takeException(), isNull);
        }
      });
    }
  }

  for (final width in [360.0, 390.0, 768.0, 1280.0]) {
    for (final code in ['ar', 'en', 'nl', 'fr']) {
      for (final brightness in Brightness.values) {
        testWidgets(
          'fifth corrected screens $width $code $brightness',
          (tester) => fourthPages(tester, width, code, brightness, 1),
        );
      }
    }
  }
  for (final code in ['ar', 'en', 'nl', 'fr']) {
    for (final brightness in Brightness.values) {
      testWidgets(
        'fifth 200 percent screens $code $brightness',
        (tester) => fourthPages(tester, 390, code, brightness, 2),
      );
    }
  }

  for (final width in [360.0, 390.0, 768.0, 1280.0]) {
    for (final code in ['ar', 'en', 'nl', 'fr']) {
      for (final brightness in Brightness.values) {
        testWidgets('review feedback layout $width $code $brightness', (
          tester,
        ) async {
          tester.view.devicePixelRatio = 1;
          tester.view.physicalSize = Size(width, 844);
          addTearDown(tester.view.resetPhysicalSize);
          addTearDown(tester.view.resetDevicePixelRatio);
          await tester.binding.setSurfaceSize(Size(width, 844));
          addTearDown(() => tester.binding.setSurfaceSize(null));
          await mount(
            tester,
            const RijviaAppShell(),
            code,
            brightness,
            capturePage: false,
          );
          final t = locales[code]!;
          expect(find.byType(NavigationRail), findsNothing);
          expect(find.byType(NavigationBar), findsNothing);
          for (final link in <(String, String)>[
            ('nav.lessons', 'nav.compact_lessons'),
            ('nav.practice', 'nav.compact_practice'),
            ('nav.exam', 'nav.compact_exam'),
          ]) {
            final menu = find.byTooltip(t.t('nav.open_menu'));
            if (menu.evaluate().isNotEmpty) {
              await tester.tap(menu);
              await tester.pumpAndSettle();
              await tester.tap(find.widgetWithText(ListTile, t.t(link.$1)));
            } else {
              await tester.tap(
                find.descendant(
                  of: find.byType(RijviaWebNavbar),
                  matching: find.widgetWithText(TextButton, t.t(link.$2)),
                ),
              );
            }
            await tester.pumpAndSettle();
            expect(find.byTooltip(t.navProfile), findsOneWidget);
            expect(tester.takeException(), isNull);
            final nav = Navigator.of(
              tester.element(find.byType(RijviaWebNavbar)),
            );
            nav.pop();
            await tester.pumpAndSettle();
          }
          expect(api.writes, isEmpty);
        });
      }
    }
  }

  for (final code in ['ar', 'nl']) {
    for (final brightness in Brightness.values) {
      testWidgets('review enlarged root navigation $code $brightness', (
        tester,
      ) async {
        tester.view.devicePixelRatio = 1;
        tester.view.physicalSize = const Size(360, 844);
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        await tester.binding.setSurfaceSize(const Size(360, 844));
        addTearDown(() => tester.binding.setSurfaceSize(null));
        await mount(
          tester,
          const RijviaAppShell(),
          code,
          brightness,
          textScale: 2,
        );
        final t = locales[code]!;
        expect(find.byType(NavigationRail), findsNothing);
        expect(find.byType(NavigationBar), findsNothing);
        for (final link in <(String, String)>[
          ('nav.lessons', 'nav.compact_lessons'),
          ('nav.practice', 'nav.compact_practice'),
          ('nav.exam', 'nav.compact_exam'),
        ]) {
          final menu = find.byTooltip(t.t('nav.open_menu'));
          if (menu.evaluate().isNotEmpty) {
            await tester.tap(menu);
            await tester.pumpAndSettle();
            final target = find.widgetWithText(ListTile, t.t(link.$1));
            await tester.scrollUntilVisible(
              target,
              150,
              scrollable: find.byType(Scrollable).last,
            );
            await Scrollable.ensureVisible(
              tester.element(target),
              alignment: .5,
            );
            await tester.pumpAndSettle();
            await tester.tap(target);
          } else {
            await tester.tap(
              find.descendant(
                of: find.byType(RijviaWebNavbar),
                matching: find.widgetWithText(TextButton, t.t(link.$2)),
              ),
            );
          }
          await tester.pumpAndSettle();
          expect(
            find.byType(switch (link.$1) {
              'nav.lessons' => LessonsListScreen,
              'nav.practice' => WebPracticeScreen,
              _ => ExamScreen,
            }),
            findsOneWidget,
          );
          expect(find.byTooltip(t.navProfile), findsOneWidget);
          expect(tester.takeException(), isNull);
          final nav = Navigator.of(
            tester.element(find.byType(RijviaWebNavbar)),
          );
          nav.pop();
          await tester.pumpAndSettle();
        }
        expect(api.writes, isEmpty);
      });
    }
  }

  for (final mode in ['PREVIEW', 'PAID']) {
    for (final count in [2, 3]) {
      for (final brightness in Brightness.values) {
        testWidgets('review exam feedback $mode $count $brightness', (
          tester,
        ) async {
          tester.view.devicePixelRatio = 1;
          tester.view.physicalSize = const Size(360, 844);
          addTearDown(tester.view.resetPhysicalSize);
          addTearDown(tester.view.resetDevicePixelRatio);
          await tester.binding.setSurfaceSize(const Size(360, 844));
          addTearDown(() => tester.binding.setSurfaceSize(null));
          api.activeExam = true;
          api.accessMode = mode;
          api.threeOptions = count == 3;
          api.questionImage = true;
          // Even if the response carries correctness, full exams must conceal it.
          api.answerResponse = {'correct': false, 'correctOptionId': 101};
          await mount(
            tester,
            const ExamScreen(),
            'ar',
            brightness,
            textScale: 2,
          );
          await tester.ensureVisible(
            find.byKey(const Key('rijvia_exam_entry_primary')),
          );
          await tester.pumpAndSettle();
          await tester.tap(find.byKey(const Key('rijvia_exam_entry_primary')));
          await tester.pumpAndSettle();
          expect(find.byType(RijviaAnswerOption), findsNWidgets(count));
          expect(
            tester
                .widgetList<RijviaAnswerOption>(find.byType(RijviaAnswerOption))
                .every((option) => option.state == RijviaAnswerState.idle),
            isTrue,
          );
          final answer = find.widgetWithText(
            RijviaAnswerOption,
            'السيارة الزرقاء',
          );
          await tester.scrollUntilVisible(
            answer,
            200,
            scrollable: find.byType(Scrollable).first,
          );
          await tester.pumpAndSettle();
          await tester.tap(answer);
          await tester.pumpAndSettle();
          final states = tester
              .widgetList<RijviaAnswerOption>(find.byType(RijviaAnswerOption))
              .map((option) => option.state)
              .toList();
          expect(
            states[0],
            mode == 'PREVIEW'
                ? RijviaAnswerState.incorrect
                : RijviaAnswerState.selected,
          );
          expect(
            states[1],
            mode == 'PREVIEW'
                ? RijviaAnswerState.correct
                : RijviaAnswerState.idle,
          );
          if (count == 3) {
            expect(
              states[2],
              mode == 'PREVIEW'
                  ? RijviaAnswerState.neutral
                  : RijviaAnswerState.idle,
            );
          }
          expect(
            api.writes.where((path) => path.endsWith('/answer')),
            hasLength(1),
          );
          expect(find.byIcon(Icons.timer_outlined), findsOneWidget);
          expect(tester.takeException(), isNull);
          await tester.pumpWidget(const SizedBox.shrink());
          await tester.pumpAndSettle();
        });
      }
    }
  }

  for (final width in [360.0, 390.0, 768.0, 1280.0]) {
    for (final code in ['ar', 'en', 'nl', 'fr']) {
      for (final brightness in Brightness.values) {
        testWidgets('wireframe pages $width $code $brightness', (tester) async {
          tester.view.devicePixelRatio = 1;
          tester.view.physicalSize = Size(width, 844);
          addTearDown(tester.view.resetPhysicalSize);
          addTearDown(tester.view.resetDevicePixelRatio);
          await tester.binding.setSurfaceSize(Size(width, 844));
          addTearDown(() => tester.binding.setSurfaceSize(null));
          final lesson = LessonSummary.fromJson(_lesson);
          for (final page in [
            WelcomeScreen(onContinue: () {}),
            const LoginScreen(),
            const RegisterScreen(),
            const ForgotPasswordScreen(),
            const ResetPasswordScreen(),
            const LessonsListScreen(),
            LessonDetailScreen(lesson: lesson),
            const SearchScreen(),
            const PlansScreen(),
            const DashboardScreen(),
            const ProfileScreen(),
            const AnalyticsScreen(),
            const NotificationsScreen(),
            const RijviaAppShell(),
            const ExamResultsScreen(examId: 1, initialResults: _score),
          ]) {
            await mount(tester, page, code, brightness);
          }
        });
      }
    }
  }
  for (final width in [360.0, 390.0, 768.0, 1280.0]) {
    for (final code in ['ar', 'en', 'nl', 'fr']) {
      for (final brightness in Brightness.values) {
        testWidgets('remaining wireframe pages $width $code $brightness', (
          tester,
        ) async {
          tester.view.devicePixelRatio = 1;
          tester.view.physicalSize = Size(width, 844);
          addTearDown(tester.view.resetPhysicalSize);
          addTearDown(tester.view.resetDevicePixelRatio);
          final category = models.Category(
            id: 1,
            nameEn: 'Priority',
            nameAr: 'علامات الأولوية',
            nameNl: 'Voorrang',
            nameFr: 'Priorité',
          );
          final content = ContentItem(
            id: 1,
            code: 'B1',
            nameEn: 'Give way',
            nameAr: 'أعط الأولوية',
            nameNl: 'Voorrang verlenen',
            nameFr: 'Cédez le passage',
          );
          for (final page in [
            CategorySignsScreen(category: category),
            SignDetailsScreen(content: content),
            const ExamScreen(),
            QuizResultScreen(
              result: QuizResult(
                totalQuestions: 50,
                correctAnswers: 42,
                wrongAnswers: 8,
                timeTaken: const Duration(minutes: 10),
                completedAt: DateTime(2026, 10, 13),
              ),
            ),
          ]) {
            await mount(tester, page, code, brightness);
          }
        });
      }
    }
  }
  for (final code in ['ar', 'nl']) {
    for (final brightness in Brightness.values) {
      testWidgets('contract enlarged text pages $code $brightness', (
        tester,
      ) async {
        tester.view.devicePixelRatio = 1;
        tester.view.physicalSize = const Size(390, 844);
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        await tester.binding.setSurfaceSize(const Size(390, 844));
        addTearDown(() => tester.binding.setSurfaceSize(null));
        for (final page in [
          WelcomeScreen(onContinue: () {}),
          const LoginScreen(),
          const RegisterScreen(),
          const PlansScreen(),
          const DashboardScreen(),
          const ProfileScreen(),
          const LessonsListScreen(),
          LessonDetailScreen(lesson: LessonSummary.fromJson(_lesson)),
          const ExamResultsScreen(examId: 1, initialResults: _score),
          const RijviaAppShell(),
        ]) {
          await mount(tester, page, code, brightness, textScale: 2);
        }
      });
    }
  }

  testWidgets('lesson catalogue uses web numbering and course metadata', (
    tester,
  ) async {
    await mount(tester, const LessonsListScreen(), 'en', Brightness.light);
    expect(
      find.text('${locales['en']!.t('lessons.lesson')} 1'),
      findsOneWidget,
    );
    expect(find.text('1 ${locales['en']!.t('lessons.pages')}'), findsOneWidget);
    expect(
      find.text('10 ${locales['en']!.t('lessons.minutes_short')}'),
      findsOneWidget,
    );
    expect(find.byType(RijviaIconBadge), findsNothing);
    await tester.tap(
      find.widgetWithText(
        FilledButton,
        locales['en']!.t('lessons.read_lesson'),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Road rules'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('favorite control never covers the traffic sign image', (
    tester,
  ) async {
    var favorites = 0;
    await mount(
      tester,
      Scaffold(
        body: RijviaAdaptiveGrid(
          children: [
            RijviaSignCard(
              item: ContentItem(
                id: 1,
                code: 'B1',
                nameEn: 'Give way',
                nameAr: 'أعط الأولوية',
                nameNl: 'Voorrang verlenen',
                nameFr: 'Cédez le passage',
              ),
              language: 'en',
              onTap: () {},
              onFavorite: () => favorites++,
            ),
          ],
        ),
      ),
      'en',
      Brightness.dark,
    );
    final sign = find.byType(RijviaSignCard);
    final picture = find
        .descendant(of: sign, matching: find.byType(Container))
        .first;
    final favorite = find.descendant(
      of: sign,
      matching: find.byType(IconButton),
    );
    expect(
      tester.getRect(favorite).top,
      greaterThanOrEqualTo(tester.getRect(picture).bottom),
    );
    await tester.tap(favorite);
    expect(favorites, 1);
    expect(tester.takeException(), isNull);
  });

  testWidgets('root web navigation is lazy and never starts an exam', (
    tester,
  ) async {
    await mount(
      tester,
      const RijviaAppShell(),
      'en',
      Brightness.light,
      capturePage: false,
    );
    expect(find.byType(NavigationBar), findsNothing);
    expect(find.byType(NavigationRail), findsNothing);
    expect(find.byType(DashboardScreen), findsNothing);
    expect(find.byType(ExamScreen), findsNothing);
    expect(api.reads.where((p) => p.contains('exams/simulations')), isEmpty);
    expect(api.writes, isEmpty);
    final context = tester.element(find.byType(HomeScreen));
    Navigator.pushNamed(context, '/exam');
    await tester.pumpAndSettle();
    expect(find.byType(ExamScreen), findsOneWidget);
    expect(api.writes, isEmpty);
    expect(find.byKey(const Key('rijvia_exam_entry_primary')), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
  testWidgets('catalog uses category and text filters together', (
    tester,
  ) async {
    await mount(tester, const SearchScreen(), 'en', Brightness.light);
    await tester.tap(find.text('Priority signs'));
    await tester.enterText(find.byType(TextField), 'no-match');
    await tester.pumpAndSettle();
    expect(find.text(locales['en']!.t('search.noResults')), findsOneWidget);
    await tester.enterText(find.byType(TextField), 'Give way');
    await tester.pumpAndSettle();
    expect(
      find.text('Give way to traffic on the priority road'),
      findsOneWidget,
    );
    expect(tester.takeException(), isNull);
  });

  testWidgets(
    'lesson sections share one scroll and only visible sections record progress',
    (tester) async {
      await mount(
        tester,
        LessonDetailScreen(lesson: LessonSummary.fromJson(_lesson)),
        'en',
        Brightness.light,
      );
      expect(find.byType(PageView), findsNothing);
      expect(find.text('Second section content.'), findsOneWidget);
      expect(find.byKey(const ValueKey('lesson-read-button')), findsNothing);
      expect(
        api.writes.where((path) => path.endsWith('/progress')),
        hasLength(1),
      );
      await Scrollable.ensureVisible(
        tester.element(find.text('Second section content.')),
        alignment: .4,
      );
      await tester.pumpAndSettle();
      expect(
        api.writes.where((path) => path.endsWith('/progress')),
        hasLength(2),
      );
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox.shrink());
      await tester.pumpAndSettle();
    },
  );

  testWidgets('welcome indicators navigate between onboarding pages', (
    tester,
  ) async {
    await mount(
      tester,
      WelcomeScreen(onContinue: () {}),
      'en',
      Brightness.light,
    );
    await tester.tap(find.byKey(const ValueKey('story-page-1')));
    await tester.pumpAndSettle();
    expect(
      find.text(locales['en']!.t('story.welcome_lessons')),
      findsOneWidget,
    );
    expect(tester.takeException(), isNull);
  });

  testWidgets('home hero and backend category cards preserve entry guards', (
    tester,
  ) async {
    await mount(tester, const HomeScreen(), 'en', Brightness.light);
    final t = locales['en']!;
    expect(find.byKey(const ValueKey('story-page-1')), findsNothing);
    expect(find.text(t.t('home.hero.subtitle')), findsOneWidget);
    expect(api.writes, isEmpty);
    final image = find.byType(RijviaCategoryImage).first;
    await tester.scrollUntilVisible(
      image,
      250,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();
    expect(tester.widget<RijviaCategoryImage>(image).sign?.code, 'B1');
    expect(tester.takeException(), isNull);
  });

  for (final language in ['ar', 'en', 'nl', 'fr']) {
    testWidgets(
      'plans explain actual web benefits without starting checkout $language',
      (tester) async {
        await mount(tester, const PlansScreen(), language, Brightness.light);
        for (final price in ['€2.99', '€6.99', '€14.99']) {
          expect(find.text(price), findsOneWidget);
        }
        final lastFeature = locales[language]!.t(
          'home.pricing.feature_languages',
        );
        await tester.scrollUntilVisible(
          find.text(lastFeature),
          250,
          scrollable: find.byType(Scrollable).first,
        );
        await tester.pumpAndSettle();
        for (final feature in [
          'questions',
          'exam',
          'explanations',
          'progress',
          'languages',
        ]) {
          final label = locales[language]!.t('home.pricing.feature_$feature');
          expect(label, isNot('home.pricing.feature_$feature'));
          expect(find.text(label), findsOneWidget);
        }
        expect(api.writes, isEmpty);
        expect(tester.takeException(), isNull);
      },
    );
    testWidgets(
      'dashboard progress uses web level and trend translations $language',
      (tester) async {
        api.progressLabels = true;
        await mount(
          tester,
          const DashboardWorkspace(),
          language,
          Brightness.dark,
        );
        final level = locales[language]!.t(
          'student_intelligence.level.advanced',
        );
        final trend = locales[language]!.t(
          'student_intelligence.trend.improving',
        );
        expect(level, isNot('student_intelligence.level.advanced'));
        await tester.scrollUntilVisible(
          find.textContaining(level),
          250,
          scrollable: find.byType(Scrollable).first,
        );
        await tester.pumpAndSettle();
        expect(find.textContaining('ADVANCED'), findsNothing);
        expect(find.textContaining('IMPROVING'), findsNothing);
        expect(find.textContaining(level), findsWidgets);
        expect(find.textContaining(trend), findsWidgets);
        expect(tester.takeException(), isNull);
      },
    );
  }

  testWidgets('dashboard completed lesson metric uses the server count', (
    tester,
  ) async {
    await mount(tester, const DashboardWorkspace(), 'en', Brightness.light);
    final label = find.text(locales['en']!.t('dashboard.lessons_completed'));
    final metric = find
        .ancestor(of: label, matching: find.byType(RijviaPageSection))
        .first;
    expect(
      find.descendant(of: metric, matching: find.text('1')),
      findsOneWidget,
    );
    expect(api.reads, contains('/api/users/me/progress/overall'));
    expect(tester.takeException(), isNull);
  });

  for (final language in ['ar', 'en', 'nl', 'fr']) {
    testWidgets(
      'notifications use web translations and show at most 15: $language',
      (tester) async {
        api.unreadCount = 16;
        api.notifications = [
          for (var index = 0; index < 16; index++)
            {
              'id': index + 1,
              'type': 'NEXT_STEP',
              'isRead': false,
              'title': 'Untranslated title',
              'message': 'Untranslated body',
              'messageKey': 'notif.msg.next_step',
              'messageParams': jsonEncode({
                'lessonAr': 'درس $index',
                'lessonEn': 'Lesson $index',
                'lessonNl': 'Les $index',
                'lessonFr': 'Leçon $index',
              }),
            },
        ];
        await mount(
          tester,
          const NotificationsScreen(),
          language,
          Brightness.light,
        );
        expect(find.text('Untranslated title'), findsNothing);
        expect(find.text('Untranslated body'), findsNothing);
        expect(api.writes, ['/api/users/me/notifications/read-all']);
        final list = tester.widget<ListView>(find.byType(ListView));
        expect(list.childrenDelegate.estimatedChildCount, 6);
        final more = find.text(locales[language]!.t('notif.show_latest_15'));
        await tester.scrollUntilVisible(more, 250);
        await tester.pumpAndSettle();
        await tester.tap(more);
        await tester.pumpAndSettle();
        expect(
          tester
              .widget<ListView>(find.byType(ListView))
              .childrenDelegate
              .estimatedChildCount,
          15,
        );
        expect(tester.takeException(), isNull);
      },
    );
  }

  testWidgets('localized notification links keep the exam result query', (
    tester,
  ) async {
    api.notifications = [
      {
        'id': 1,
        'type': 'EXAM_RESULT',
        'isRead': true,
        'message': 'Open stored result',
        'link': '/fr/dashboard?section=exam-results&examId=85',
      },
    ];
    await mount(tester, const NotificationsScreen(), 'en', Brightness.light);
    await tester.tap(find.text('Open stored result'));
    await tester.pumpAndSettle();
    expect(
      tester
          .widget<ExamHistoryScreen>(find.byType(ExamHistoryScreen))
          .highlightExamId,
      85,
    );
    expect(tester.takeException(), isNull);
  });

  for (final language in ['ar', 'en']) {
    testWidgets(
      'header controls use equal sizes and the web reading direction: $language',
      (tester) async {
        await mount(tester, const HomeScreen(), language, Brightness.light);
        final t = locales[language]!;
        final account = find.byTooltip(t.navProfile);
        final selector = find.byTooltip(t.navLanguage);
        final notifications = find.byTooltip(t.t('notif.title'));
        expect(
          tester.getCenter(account).dx,
          language == 'ar'
              ? lessThan(tester.getCenter(selector).dx)
              : greaterThan(tester.getCenter(selector).dx),
        );
        expect(tester.getSize(account), tester.getSize(notifications));
        expect(tester.getSize(account), tester.getSize(selector));
        expect(find.text(language == 'ar' ? 'Ar' : 'En'), findsOneWidget);
        await tester.tap(account);
        await tester.pumpAndSettle();
        await tester.tap(find.text(t.navProfile).last);
        await tester.pumpAndSettle();
        expect(find.byType(ProfileScreen), findsOneWidget);
        expect(tester.takeException(), isNull);
      },
    );
  }

  for (final language in ['ar', 'nl']) {
    testWidgets(
      'question image has complete fit and generic alt at 200 percent $language',
      (tester) async {
        tester.view.devicePixelRatio = 1;
        tester.view.physicalSize = const Size(390, 844);
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        await tester.binding.setSurfaceSize(const Size(390, 844));
        addTearDown(() => tester.binding.setSurfaceSize(null));
        api.activeExam = true;
        api.questionImage = true;
        await mount(
          tester,
          const ExamScreen(),
          language,
          Brightness.dark,
          textScale: 2,
        );
        await tester.ensureVisible(
          find.byKey(const Key('rijvia_exam_entry_primary')),
        );
        await tester.pumpAndSettle();
        await tester.tap(find.byKey(const Key('rijvia_exam_entry_primary')));
        await tester.pumpAndSettle();
        final image = tester.widget<Image>(
          find.byWidgetPredicate(
            (widget) =>
                widget is Image &&
                widget.semanticLabel ==
                    locales[language]!.t('media.question_image'),
          ),
        );
        expect(image.fit, BoxFit.contain);
        expect(
          image.semanticLabel,
          locales[language]!.t('media.question_image'),
        );
        expect(find.text('A'), findsOneWidget);
        expect(find.text('B'), findsOneWidget);
        expect(api.writes, everyElement(endsWith('/presented')));
        expect(tester.takeException(), isNull);
        await tester.pumpWidget(const SizedBox.shrink());
        await tester.pumpAndSettle();
      },
    );
  }

  testWidgets('API three-option question preserves A B C and web colors', (
    tester,
  ) async {
    tester.view.devicePixelRatio = 1;
    tester.view.physicalSize = const Size(390, 844);
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    api.activeExam = true;
    api.threeOptions = true;
    await mount(tester, const ExamScreen(), 'ar', Brightness.light);
    await tester.ensureVisible(
      find.byKey(const Key('rijvia_exam_entry_primary')),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('rijvia_exam_entry_primary')));
    await tester.pumpAndSettle();
    expect(find.text('A'), findsOneWidget);
    expect(find.text('B'), findsOneWidget);
    expect(find.text('C'), findsOneWidget);
    expect(api.writes, everyElement(endsWith('/presented')));
    expect(tester.takeException(), isNull);
    await capture(tester, '07-question-three-options');
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pumpAndSettle();
  });

  for (final language in ['ar', 'en']) {
    testWidgets(
      'storyboard question header and next footer use the persisted attempt $language',
      (tester) async {
        tester.view.devicePixelRatio = 1;
        tester.view.physicalSize = const Size(390, 844);
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        await tester.binding.setSurfaceSize(const Size(390, 844));
        addTearDown(() => tester.binding.setSurfaceSize(null));
        api.activeExam = true;
        await mount(tester, const ExamScreen(), language, Brightness.light);
        expect(api.writes, isEmpty);
        await tester.ensureVisible(
          find.byKey(const Key('rijvia_exam_entry_primary')),
        );
        await tester.pumpAndSettle();
        await tester.tap(find.byKey(const Key('rijvia_exam_entry_primary')));
        await tester.pumpAndSettle();
        expect(find.text('1/50'), findsOneWidget);
        expect(find.text('A'), findsOneWidget);
        expect(find.text('B'), findsOneWidget);
        expect(find.text('C'), findsNothing);
        expect(find.byIcon(Icons.timer_outlined), findsOneWidget);
        expect(
          find.text(language == 'ar' ? 'السيارة الزرقاء' : 'The blue car'),
          findsOneWidget,
        );
        expect(api.writes.where((path) => path.endsWith('/start')), isEmpty);
        expect(tester.takeException(), isNull);
        if (language == 'ar') await capture(tester, '07-question-widget');
        await tester.pumpWidget(const SizedBox.shrink());
        await tester.pumpAndSettle();
      },
    );
  }
  for (final code in ['ar', 'en', 'nl', 'fr']) {
    for (final width in [360.0, 1280.0]) {
      testWidgets('web parity home and full lesson $code $width', (
        tester,
      ) async {
        tester.view.physicalSize = Size(width, 900);
        tester.view.devicePixelRatio = 1;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        auth.seed(Unauthenticated());
        final scale = width == 360 ? 2.0 : 1.0;
        await mount(
          tester,
          const HomeScreen(),
          code,
          Brightness.light,
          textScale: scale,
          capturePage: false,
        );
        expect(find.byType(NavigationRail), findsNothing);
        expect(find.byType(NavigationBar), findsNothing);
        expect(
          find.text(locales[code]!.t('home.categories.title')),
          findsWidgets,
        );
        await mount(
          tester,
          const LessonsListScreen(),
          code,
          Brightness.light,
          textScale: scale,
          capturePage: false,
        );
        await tester.scrollUntilVisible(
          find.widgetWithText(
            FilledButton,
            locales[code]!.t('lessons.read_lesson'),
          ),
          250,
          scrollable: find.byType(Scrollable).first,
        );
        await tester.pumpAndSettle();
        expect(
          find.text(locales[code]!.t('lessons.read_lesson')),
          findsOneWidget,
        );
        await mount(
          tester,
          const LessonDetailScreen(lessonCode: 'layout-test'),
          code,
          Brightness.light,
          textScale: scale,
          capturePage: false,
        );
        expect(find.text('Second section content.'), findsOneWidget);
        expect(
          find.text(locales[code]!.t('lessons.pages_overview')),
          findsOneWidget,
        );
        expect(api.writes, isEmpty);
        expect(tester.takeException(), isNull);
      });
      testWidgets('web parity public surfaces $code $width', (tester) async {
        tester.view.physicalSize = Size(width, 900);
        tester.view.devicePixelRatio = 1;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        for (final page in [
          for (final document in [
            'about',
            'privacy',
            'cookies',
            'terms',
            'disclaimer',
            'faq',
          ])
            PublicDocumentScreen(page: document),
          const ContactScreen(),
          const TrafficSignsScreen(),
          const WebPracticeScreen(),
          const RandomPracticeEntryScreen(),
        ]) {
          await mount(
            tester,
            page,
            code,
            width == 360 ? Brightness.light : Brightness.dark,
            textScale: width == 360 ? 2 : 1,
            capturePage: false,
          );
          final scrollable = find.byType(Scrollable).first;
          for (var pass = 0; pass < 4; pass++) {
            final state = tester.state<ScrollableState>(scrollable);
            state.position.jumpTo(state.position.maxScrollExtent);
            await tester.pumpAndSettle();
          }
          expect(
            tester.takeException(),
            isNull,
            reason: page.runtimeType.toString(),
          );
        }
        expect(api.writes, isEmpty);
      });
    }
    testWidgets('web parity assessment server feedback $code', (tester) async {
      api.responses['/api/assessment/questions/1/check'] = {
        'correct': false,
        'correctChoiceId': 12,
      };
      api.responses['/api/assessment/categories/priority/questions'] = [
        {
          'id': 1,
          'question': 'Server question',
          'difficulty': 'BEGINNER',
          'explanation': 'Server explanation',
          'choices': [
            {'id': 11, 'sortOrder': 0, 'text': 'First choice'},
            {'id': 12, 'sortOrder': 1, 'text': 'Second choice'},
          ],
        },
      ];
      await mount(
        tester,
        const AssessmentScreen(category: 'priority', level: 'beginner'),
        code,
        Brightness.light,
        capturePage: false,
      );
      expect(find.text('A'), findsOneWidget);
      expect(find.text('B'), findsOneWidget);
      expect(find.text('C'), findsNothing);
      expect(find.text('Server explanation'), findsNothing);
      expect(api.writes, isEmpty);
      await tester.tap(find.text('First choice'));
      await tester.pumpAndSettle();
      expect(api.writes, ['/api/assessment/questions/1/check']);
      expect(find.text('Server explanation'), findsOneWidget);
      final options = tester
          .widgetList<RijviaAnswerOption>(find.byType(RijviaAnswerOption))
          .toList();
      expect(options[0].state, RijviaAnswerState.incorrect);
      expect(options[1].state, RijviaAnswerState.correct);
      expect(tester.takeException(), isNull);
    });
    testWidgets('web parity dashboard sections $code', (tester) async {
      tester.view.physicalSize = const Size(390, 900);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      api.responses['/api/users/me/progress/intelligence'] = {
        'studentLevel': 'ADVANCED',
        'overallLearningTrend': 'IMPROVING',
        'examReadinessScore': 73,
        'estimatedPassProbability': 65,
        'examAnalytics': {
          'recentScores': [90, 80, 70],
        },
        'learningPriorities': [
          {
            'categoryCode': 'TH01',
            'categoryNameEn': 'Priority',
            'accuracy': 55,
          },
        ],
        'recommendations': [],
      };
      for (final section in [
        'overview',
        'progress',
        'exam-results',
        'profile',
      ]) {
        await mount(
          tester,
          DashboardWorkspace(section: section),
          code,
          Brightness.dark,
          textScale: 2,
          capturePage: false,
        );
        expect(tester.takeException(), isNull, reason: section);
      }
      expect(api.writes, isEmpty);
    });
    testWidgets(
      'web parity deep analytics preserve improvements and simulation scope $code',
      (tester) async {
        api.responses['/api/users/me/analytics/weak-areas'] = {
          'weakAreas': [
            {
              'categoryId': 1,
              'categoryCode': 'TH01',
              'categoryNameEn': 'Priority rules',
              'currentAccuracy': 45,
              'questionsAttempted': 20,
              'estimatedTimeMinutes': 10,
              'recommendedQuestions': 6,
              'recommendedDifficulty': 'EASY',
              'accuracyGap': 35,
            },
          ],
          'totalPracticedCategories': 3,
          'overallAccuracy': 70,
        };
        api.responses['/api/users/me/analytics/error-patterns'] = [
          {
            'patternType': 'SIGN_CONFUSION',
            'count': 30,
            'currentCount': 0,
            'previousCount': 3,
            'delta': -3,
            'trend': 'IMPROVED',
            'percentage': 0,
            'uniqueQuestions': 2,
            'severity': 'LOW',
            'recentAttemptsCount': 2,
            'sourceScope': 'LAST_TWO_COMPLETED_EXAMS',
            'groups': [],
            'recommendationKey': 'error_patterns.rec_sign_confusion',
          },
        ];
        await mount(
          tester,
          const AnalyticsScreen(mode: 'weak-areas'),
          code,
          Brightness.light,
          textScale: 2,
          capturePage: false,
        );
        expect(find.text('Priority rules'), findsOneWidget);
        await mount(
          tester,
          const AnalyticsScreen(mode: 'error-patterns', simulationId: 7),
          code,
          Brightness.dark,
          textScale: 2,
          capturePage: false,
        );
        expect(
          find.text(locales[code]!.t('error_patterns.trend_improved')),
          findsOneWidget,
        );
        expect(
          find.text('0 ${locales[code]!.t('error_patterns.errors_label')}'),
          findsOneWidget,
        );
        expect(
          find.text('30 ${locales[code]!.t('error_patterns.errors_label')}'),
          findsNothing,
        );
        expect(api.requestQueries['/api/users/me/analytics/error-patterns'], {
          'simulationId': 7,
        });
        expect(api.writes, isEmpty);
        expect(tester.takeException(), isNull);
      },
    );
    testWidgets(
      'web parity category exam uses entitlement and server answers $code',
      (tester) async {
        api.responses['/api/account/access'] = {
          'active': true,
          'unlimited': true,
        };
        final category = {
          'categoryCode': 'TH01',
          'nameEn': 'Priority rules',
          'questionCount': 1,
        };
        api.responses['/api/practice/theory/categories/TH01/summary'] =
            category;
        api.responses['/api/practice/theory/categories/TH01/exam'] = {
          'category': category,
          'serverTime': DateTime.now().toUtc().toIso8601String(),
          'questions': [
            {
              'id': 1,
              'questionEn': 'A server supplied question',
              'options': [
                {'id': 11, 'optionTextEn': 'First choice'},
                {'id': 12, 'optionTextEn': 'Second choice'},
              ],
            },
          ],
        };
        api.responses['/api/practice/theory/categories/TH01/questions/1/answer'] =
            {
              'questionId': 1,
              'isCorrect': false,
              'correctOptionId': 12,
              'explanationEn': 'Backend explanation',
            };
        await mount(
          tester,
          const CategoryExamScreen(category: 'TH01'),
          code,
          Brightness.light,
          capturePage: false,
        );
        expect(find.text('A'), findsOneWidget);
        expect(find.text('B'), findsOneWidget);
        expect(find.text('C'), findsNothing);
        expect(api.writes, isEmpty);
        await tester.tap(find.text('First choice'));
        await tester.pumpAndSettle();
        await tester.tap(
          find.widgetWithText(
            FilledButton,
            locales[code]!.t('category_exam.finish'),
          ),
        );
        await tester.pumpAndSettle();
        expect(api.writes, [
          '/api/practice/theory/categories/TH01/questions/1/answer',
        ]);
        expect(find.text('Backend explanation'), findsOneWidget);
        final options = tester
            .widgetList<RijviaAnswerOption>(find.byType(RijviaAnswerOption))
            .toList();
        expect(options[0].state, RijviaAnswerState.incorrect);
        expect(options[1].state, RijviaAnswerState.correct);
        expect(tester.takeException(), isNull);
      },
    );
  }
  testWidgets(
    'web parity category exam never fetches paid questions for free access',
    (tester) async {
      api.responses['/api/practice/theory/categories/TH01/summary'] = {
        'categoryCode': 'TH01',
        'nameEn': 'Priority',
        'questionCount': 20,
      };
      await mount(
        tester,
        const CategoryExamScreen(category: 'TH01'),
        'en',
        Brightness.light,
        capturePage: false,
      );
      expect(
        find.text(locales['en']!.t('exam.paywall.choose_plan')),
        findsOneWidget,
      );
      expect(
        api.reads,
        isNot(contains('/api/practice/theory/categories/TH01/exam')),
      );
      expect(api.writes, isEmpty);
    },
  );
  for (final code in ['ar', 'en', 'nl', 'fr']) {
    for (final width in [360.0, 1280.0]) {
      testWidgets('web parity admin account and learning pages $code $width', (
        tester,
      ) async {
        tester.view.devicePixelRatio = 1;
        tester.view.physicalSize = Size(width, 900);
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        await tester.binding.setSurfaceSize(Size(width, 900));
        addTearDown(() => tester.binding.setSurfaceSize(null));
        auth.seed(
          Authenticated(
            User(
              id: '1',
              username: 'owner',
              email: 'owner@example.test',
              name: 'Owner',
              role: 'ADMIN',
            ),
          ),
        );
        const student = {
          'id': 2,
          'userId': 2,
          'username': 'student',
          'fullName': 'Test student',
          'displayName': 'Test student',
          'email': 'student@example.test',
          'role': 'USER',
          'isActive': true,
          'isLocked': false,
          'createdAt': '2026-10-14T12:00:00Z',
          'preferredLanguage': 'en',
          'totalCompletedExams': 1,
          'totalCompletedPractices': 2,
          'averageExamScore': 80,
          'learningTrend': 'STABLE',
          'strongestCategories': <Object>[],
          'weakestCategories': <Object>[],
        };
        const exam = {
          'examId': 5,
          'userId': 2,
          'username': 'student',
          'displayName': 'Test student',
          'examType': 'THEORY_EXAM',
          'startedAt': '2026-10-14T12:00:00Z',
          'completedAt': '2026-10-14T12:10:00Z',
          'durationSeconds': 600,
          'totalQuestions': 50,
          'correctAnswers': 42,
          'scorePercentage': 84,
          'passed': true,
          'languageCode': 'en',
        };
        api.responses.addAll({
          '/api/admin/dashboard': {
            'totalUsers': 2,
            'activeUsers': 2,
            'adminUsers': 1,
            'moderatorUsers': 0,
            'totalSigns': 184,
            'totalQuizQuestions': 100,
            'quizQuestionDifficultyCounts': {
              'EASY': 30,
              'MEDIUM': 40,
              'HARD': 30,
            },
            'totalQuizAttempts': 1,
          },
          '/api/admin/settings': {
            'siteName': 'RijVia',
            'defaultLanguage': 'en',
            'maintenanceMode': false,
            'allowRegistrations': true,
            'examQuestions': 50,
            'examDurationMinutes': 12.5,
            'passingScorePercent': 82,
            'siteNameEditable': false,
            'examSettingsEditable': false,
          },
          '/api/admin/signs': {
            'items': [
              {
                'id': 1,
                'signCode': 'B1',
                'categoryCode': 'B',
                'nameEn': 'Give way',
                'imageUrl': null,
                'isActive': true,
              },
            ],
            'totalItems': 1,
            'totalPages': 1,
          },
          '/api/admin/users': {
            'users': [student],
            'total': 1,
            'totalPages': 1,
          },
          '/api/admin/users/summary': {
            'total': 2,
            'active': 2,
            'locked': 0,
            'inactive': 0,
            'newThisWeek': 1,
          },
          '/api/admin/analytics/quiz-stats': {
            'averageScore': 84,
            'totalCompleted': 1,
            'totalPassed': 1,
            'passRate': 100,
          },
          '/api/admin/analytics/category-stats': [
            {
              'categoryId': 1,
              'categoryName': 'Priority',
              'totalAttempted': 10,
              'totalCorrect': 8,
              'avgAccuracy': 80,
              'userCount': 1,
            },
          ],
          '/api/admin/learning/exams': {
            'items': [exam],
            'totalPages': 1,
          },
          '/api/admin/learning/users': {
            'items': [student],
            'totalPages': 1,
          },
          '/api/admin/learning/users/2': student,
          '/api/admin/learning/users/2/exams': {
            'items': [exam],
            'totalPages': 1,
          },
          '/api/admin/learning/users/2/coverage': {
            'eligibleQuestions': 100,
            'uniqueQuestionsSeen': 20,
            'coveragePercentage': 20,
            'accuracyPercentage': 80,
            'confidenceState': 'LOW',
            'timesPresented': 20,
            'timesAnswered': 20,
            'categories': <Object>[],
          },
          '/api/admin/learning/users/2/difficulty': {
            'items': [
              {
                'difficulty': 'EASY',
                'correctAnswers': 8,
                'answeredQuestions': 10,
                'accuracy': 80,
              },
            ],
            'evidenceStatus': 'SNAPSHOT_COMPLETE',
            'snapshotBackedAnswers': 20,
            'legacyAnswersExcluded': 0,
          },
          '/api/admin/learning/users/2/categories': <Object>[],
          '/api/admin/learning/users/2/practices': {
            'items': <Object>[],
            'totalPages': 0,
          },
          '/api/admin/learning/users/2/lessons': {
            'items': <Object>[],
            'totalPages': 0,
          },
          '/api/admin/learning/users/2/signs': <Object>[],
          '/api/admin/learning/users/2/error-patterns': {
            'items': <Object>[],
            'totalPages': 0,
          },
          '/api/admin/learning/users/2/activity-availability': {
            'trafficSignStudyTrackingAvailable': false,
            'videoTrackingAvailable': false,
          },
          '/api/admin/learning/users/2/exams/THEORY_EXAM/5': {
            'examId': 5,
            'examType': 'THEORY_EXAM',
            'summary': exam,
            'historicalContentStatus': 'SNAPSHOT_PARTIAL',
            'result': {
              'allAnswers': [
                {
                  'questionId': 4,
                  'questionTextEn': 'Historical question',
                  'questionTextAr': 'Historical question',
                  'questionTextNl': 'Historical question',
                  'questionTextFr': 'Historical question',
                  'selectedOptionTextEn': 'Wrong answer',
                  'correctOptionTextEn': 'Stored correct answer',
                  'correctOptionTextAr': 'Stored correct answer',
                  'correctOptionTextNl': 'Stored correct answer',
                  'correctOptionTextFr': 'Stored correct answer',
                  'isCorrect': false,
                  'snapshotAvailable': true,
                },
              ],
            },
          },
        });
        final adminQuestion = <String, dynamic>{
          'id': 8,
          'version': 7,
          'categoryCode': 'TH01',
          'categoryNameEn': 'Priority',
          'difficultyLevel': 'EASY',
          'isActive': true,
          'isReferenced': true,
          'contentImageUrl': null,
          'optionsCount': 2,
          for (final suffix in ['En', 'Ar', 'Nl', 'Fr']) ...{
            'question$suffix': 'Which car must yield?',
            'explanation$suffix': 'Priority rule explanation',
          },
          'options': [
            for (var i = 0; i < 2; i++)
              {
                'id': i + 1,
                'displayOrder': i + 1,
                'isCorrect': i == 0,
                for (final suffix in ['En', 'Ar', 'Nl', 'Fr'])
                  'text$suffix': i == 0 ? 'Blue car' : 'Red car',
              },
          ],
        };
        final theoryCategory = <String, dynamic>{
          'id': 10,
          'code': 'TH01',
          for (final suffix in ['En', 'Ar', 'Nl', 'Fr'])
            'name$suffix': 'Priority',
          'displayOrder': 1,
          'examTargetWeight': 10,
          'active': true,
          'contentScope': 'THEORETICAL_EXAM',
          'totalQuestions': 10,
          'publishedQuestions': 10,
          'eligibleAllLocales': 10,
          'eligibleByDifficulty': {'EASY': 4, 'MEDIUM': 3, 'HARD': 3},
          'minimumRequired': 5,
          'questionsNeeded': 0,
          'examEligible': true,
        };
        final lessonDocument = <String, dynamic>{
          'schemaVersion': 1,
          'lesson': {
            'lessonCode': 'layout-test',
            'title': {
              for (final lang in ['ar', 'nl', 'fr', 'en'])
                lang: 'Lesson draft title',
            },
            'description': {
              for (final lang in ['ar', 'nl', 'fr', 'en'])
                lang: 'Lesson description',
            },
            'icon': null,
            'displayOrder': 1,
            'estimatedMinutes': 5,
            'isActive': true,
          },
          'pages': [
            {
              'pageNumber': 1,
              'title': {
                for (final lang in ['ar', 'nl', 'fr', 'en'])
                  lang: 'Draft section',
              },
              'content': {
                for (final lang in ['ar', 'nl', 'fr', 'en'])
                  lang: 'Section content',
              },
              'imageAssetId': null,
            },
          ],
          'structuredSections': [],
          'seo': {},
          'media': [],
          'categoryLinks': [],
        };
        final adminLesson = <String, dynamic>{
          ..._lesson,
          'active': true,
          'editorState': 'PUBLISHED_WITH_DRAFT',
          'displayOrder': 1,
          'pageCount': 1,
          'currentVersion': 2,
          'hasDraft': true,
          'draftRevision': 3,
          'updatedAt': '2026-10-14T12:00:00Z',
        };
        api.responses.addAll({
          '/api/admin/lessons': [adminLesson],
          '/api/admin/lessons/layout-test': {
            ...adminLesson,
            'publishedDocument': lessonDocument,
            'draft': {'revision': 3, 'document': lessonDocument},
            'categoryLinks': [],
            'mediaAssets': [],
            'versions': [],
          },
          '/api/admin/lessons/layout-test/versions': <Object>[],
          '/api/admin/quiz/questions': {
            'items': [adminQuestion],
            'totalItems': 1,
            'totalPages': 1,
          },
          '/api/admin/quiz/questions/8': adminQuestion,
          '/api/admin/quiz/categories': [theoryCategory],
          '/api/admin/quiz/categories/manage': [theoryCategory],
          '/api/admin/quiz/correct-answer-distribution': {
            'total': 10,
            'positions': [
              {'label': 'A', 'count': 5, 'percentage': 50},
              {'label': 'B', 'count': 5, 'percentage': 50},
            ],
          },
          '/api/admin/quiz/bank-health': {
            'summary': {'totalQuestions': 10, 'activeQuestions': 10},
            'locales': [
              {
                'locale': 'ar',
                'eligibleQuestions': 10,
                'translationGapQuestions': 0,
              },
            ],
            'questionsNeedingReview': [],
            'rarelyExposedQuestions': [],
            'heavilyExposedQuestions': [],
          },
        });
        for (final path in [
          '/admin/dashboard',
          '/admin/signs',
          '/admin/settings',
          '/admin/users',
          '/admin/moderation',
          '/admin/analytics',
          '/admin/quizzes',
          '/admin/quizzes/new',
          '/admin/quizzes/8/edit',
          '/admin/quizzes/categories',
          '/admin/lessons',
          '/admin/lessons/new',
          '/admin/lessons/layout-test/edit',
          '/admin/users/2/learning',
          '/admin/users/2/learning/exams/THEORY_EXAM/5',
        ]) {
          final page = AdminWorkspace.page(Uri.parse(path));
          expect(page, isNotNull, reason: path);
          await mount(
            tester,
            page!,
            code,
            width == 360 ? Brightness.light : Brightness.dark,
            textScale: width == 360 ? 2 : 1,
            capturePage: false,
          );
          expect(
            find.text(locales[code]!.t('admin.error_loading')),
            findsNothing,
            reason: path,
          );
          expect(tester.takeException(), isNull, reason: path);
        }
        expect(find.text('Historical question'), findsOneWidget);
        expect(find.text('Stored correct answer'), findsOneWidget);
        expect(api.writes, isEmpty);
      });
    }
  }
  for (final code in ['ar', 'en', 'nl', 'fr']) {
    for (final width in [360.0, 1280.0]) {
      testWidgets('web parity marketing and data import $code $width', (
        tester,
      ) async {
        tester.view.devicePixelRatio = 1;
        tester.view.physicalSize = Size(width, 900);
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        await tester.binding.setSurfaceSize(Size(width, 900));
        addTearDown(() => tester.binding.setSurfaceSize(null));
        auth.seed(
          Authenticated(
            User(
              id: '1',
              username: 'owner',
              email: 'owner@example.test',
              name: 'Owner',
              role: 'ADMIN',
            ),
          ),
        );
        api.responses['/api/admin/import/history'] = <Object>[];
        const base = '/api/admin/marketing';
        api.responses['$base/overview'] = {
          'tasksToday': 0,
          'tasksByStatus': <String, Object>{},
          'activeAgents': 0,
          'recentActivity': <Object>[],
          'automaticTasksEnabled': false,
        };
        api.responses['$base/agents'] = <Object>[];
        api.responses['$base/tasks'] = {'items': <Object>[]};
        api.responses['$base/errors'] = <Object>[];
        api.responses['$base/audit'] = <Object>[];
        api.responses['$base/settings'] = {
          'settings': <Object>[],
          'schedules': <Object>[],
        };
        api.responses['$base/worker-health'] = {'status': 'HEALTHY'};
        api.responses['$base/analytics/status'] = {
          'serviceAccountConfigured': false,
          'alerts': <Object>[],
          'sources': <Object>[],
        };
        api.responses['$base/analytics/settings'] = {
          'values': <String, Object>{},
          'policy': <String, Object>{},
          'thresholds': <String, Object>{},
        };
        api.responses['$base/analytics/organic-discovery'] = <String, Object>{};
        api.responses['$base/analytics/reports'] = <Object>[];
        api.responses['$base/youtube/status'] = {
          'readOnly': true,
          'apiKeyConfigured': false,
          'latestVideos': <Object>[],
          'bestVideos': <Object>[],
        };
        api.responses['$base/seo-migration/workspace'] = {
          'latestImport': <String, Object>{},
          'localImportEnabled': false,
          'ownerDecisionsRequired': <Object>[],
        };
        api.responses['$base/editorial/editor'] = {
          'languages': ['AR', 'NL', 'FR', 'EN'],
          'qualityGates': ['FACT_CHECKED'],
          'contentGraph': <String, Object>{},
          'topics': [
            {
              'topicId': 1,
              'topicKey': 'road-safety',
              'order': 1,
              'sourceType': 'OFFICIAL_STRATEGIC_BACKLOG',
              'title': 'Road safety',
              'titleLanguage': 'EN',
              'primaryLanguage': 'EN',
              'canonicalLanguage': 'EN',
              'strategyContextResolved': false,
              'lifecycleState': 'DRAFTING',
              'currentVersions': <Object>[],
              'targetQueries': ['road safety'],
            },
          ],
        };
        api.responses['$base/editorial/editor/topics/1/authoring-status'] = {
          'topicId': 1,
          'canCreateBrief': true,
          'canCollectSources': false,
          'canCreateDraft': false,
          'claimsTotal': 0,
          'claimsSupported': 0,
          'claimsRequiringReview': 0,
          'claimsMissing': 0,
        };
        api.responses['$base/strategy'] = {
          'usps': <Object>[],
          'icps': <Object>[],
          'contentPillars': <Object>[],
          'funnelStages': <Object>[],
          'conversionGoals': <Object>[],
        };
        await mount(
          tester,
          AdminWorkspace.page(Uri.parse('/admin/data-import'))!,
          code,
          width == 360 ? Brightness.light : Brightness.dark,
          textScale: width == 360 ? 2 : 1,
          capturePage: false,
        );
        expect(
          tester
              .widget<FilledButton>(
                find.widgetWithText(
                  FilledButton,
                  locales[code]!.t('admin.import.execute'),
                ),
              )
              .onPressed,
          isNull,
        );
        await mount(
          tester,
          AdminWorkspace.page(Uri.parse('/admin/marketing'))!,
          code,
          width == 360 ? Brightness.light : Brightness.dark,
          textScale: width == 360 ? 2 : 1,
          capturePage: false,
        );
        for (final view in [
          'overview',
          'analytics',
          'youtube',
          'discovery',
          'editorial',
          'seo',
          'agents',
          'tasks',
          'approvals',
          'errors',
          'audit',
          'settings',
        ]) {
          final chip = find.widgetWithText(
            ChoiceChip,
            locales[code]!.t('admin.marketing.tab_$view'),
          );
          await tester.ensureVisible(chip);
          await tester.tap(chip);
          await tester.pumpAndSettle();
          expect(
            find.text(locales[code]!.t('admin.error_loading')),
            findsNothing,
            reason: view,
          );
          expect(tester.takeException(), isNull, reason: view);
        }
        expect(api.writes, isEmpty);
      });
    }
  }
  for (final code in ['ar', 'en', 'nl', 'fr']) {
    for (final width in [360.0, 1280.0]) {
      testWidgets('web parity catalogues and recovery $code $width', (
        tester,
      ) async {
        tester.view.devicePixelRatio = 1;
        tester.view.physicalSize = Size(width, 900);
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        await tester.binding.setSurfaceSize(Size(width, 900));
        addTearDown(() => tester.binding.setSurfaceSize(null));
        final publicApi = getIt<ApiClient>() as _PublicFixture;
        const article = {
          'slug': 'test-article',
          'title': 'Server article',
          'summary': 'Published summary',
          'body':
              '# Safe driving\n\nFirst paragraph.\n\nSecond paragraph.\n\n**Third paragraph.**',
          'publishedAt': '2026-10-14T12:00:00Z',
          'typography': {'h1Size': 'LARGE'},
          'internalLinks': [
            {
              'targetPath': '/lessons/layout-test',
              'anchorText': 'Related lesson',
            },
          ],
        };
        publicApi.responses['/api/articles'] = [article];
        publicApi.responses['/api/articles/test-article'] = article;
        publicApi.responses['/api/youtube/videos'] = {
          'videos': [
            {
              'videoId': 'test-video',
              'title': 'Server video',
              'description': 'Published video',
              'embedUrl': 'https://www.youtube.com/embed/abc123',
              'watchUrl': 'https://www.youtube.com/watch?v=abc123',
            },
          ],
          'stale': false,
        };
        for (final page in <Widget>[
          const PublicCatalogScreen(kind: 'blog'),
          const PublicCatalogScreen(kind: 'blog', slug: 'test-article'),
          const PublicCatalogScreen(kind: 'videos'),
          const ForgotPasswordScreen(),
          const ResetPasswordScreen(token: 'test-only-token'),
          const ResetPasswordScreen(),
        ]) {
          await mount(
            tester,
            page,
            code,
            width == 360 ? Brightness.light : Brightness.dark,
            textScale: width == 360 ? 2 : 1,
            capturePage: false,
          );
          expect(
            tester.takeException(),
            isNull,
            reason: page.runtimeType.toString(),
          );
          if (page is PublicCatalogScreen && page.kind == 'videos') {
            await tester.scrollUntilVisible(
              find.text('Server video'),
              250,
              scrollable: find.byType(Scrollable).first,
            );
            await tester.ensureVisible(find.text('Server video'));
            await tester.pumpAndSettle();
            await tester.tap(find.text('Server video'));
            await tester.pumpAndSettle();
            expect(find.byType(RijviaVideoPlayer), findsOneWidget);
            expect(find.byType(Dialog), findsOneWidget);
            await tester.tap(find.byTooltip(locales[code]!.t('common.close')));
            await tester.pumpAndSettle();
          }
        }
        expect(api.writes, isEmpty);
      });
    }
  }
  testWidgets('web parity import requires preview for exact file and type', (
    tester,
  ) async {
    auth.seed(
      Authenticated(
        User(
          id: '1',
          email: 'owner@example.test',
          name: 'Owner',
          role: 'ADMIN',
        ),
      ),
    );
    api.responses['/api/admin/import/history'] = <Object>[];
    const previewPath = '/api/admin/import/categories/preview';
    const executePath = '/api/admin/import/categories/execute';
    api.responses[previewPath] = {
      'mode': 'PREVIEW',
      'recordsTotal': 1,
      'created': 1,
      'updated': 0,
      'skipped': 0,
      'warnings': <Object>[],
      'errors': ['Invalid category'],
    };
    api.responses[executePath] = {
      'mode': 'EXECUTE',
      'recordsTotal': 1,
      'created': 1,
      'updated': 0,
      'skipped': 0,
      'warnings': <Object>[],
      'errors': <Object>[],
    };
    await mount(
      tester,
      AdminWorkspace(
        uri: Uri.parse('/admin/data-import'),
        child: AdminDataImportScreen(
          filePicker: () async => AdminSelectedFile(
            name: 'categories.json',
            bytes: Uint8List.fromList(utf8.encode('[{"code":"B"}]')),
            mimeType: 'application/json',
          ),
        ),
      ),
      'en',
      Brightness.light,
      capturePage: false,
    );
    final execute = find.widgetWithText(
      FilledButton,
      locales['en']!.t('admin.import.execute'),
    );
    expect(tester.widget<FilledButton>(execute).onPressed, isNull);
    final choose = find.widgetWithText(
      OutlinedButton,
      locales['en']!.t('admin.import.upload_browse'),
    );
    await tester.ensureVisible(choose);
    await tester.tap(choose);
    await tester.pumpAndSettle();
    final preview = find.widgetWithText(
      OutlinedButton,
      locales['en']!.t('admin.import.preview'),
    );
    await tester.ensureVisible(preview);
    await tester.tap(preview);
    await tester.pumpAndSettle();
    expect(tester.widget<FilledButton>(execute).onPressed, isNull);
    api.responses[previewPath] = {
      'mode': 'PREVIEW',
      'recordsTotal': 1,
      'created': 1,
      'updated': 0,
      'skipped': 0,
      'warnings': <Object>[],
      'errors': <Object>[],
    };
    await tester.tap(preview);
    await tester.pumpAndSettle();
    expect(tester.widget<FilledButton>(execute).onPressed, isNotNull);
    final form = api.writeData[previewPath] as FormData;
    expect(form.files.single.key, 'file');
    expect(form.files.single.value.filename, 'categories.json');
    expect(form.files.single.value.contentType.toString(), 'application/json');
    final type = find.widgetWithText(
      ChoiceChip,
      locales['en']!.t('admin.import.type_quiz'),
    );
    await tester.ensureVisible(type);
    await tester.tap(type);
    await tester.pumpAndSettle();
    expect(tester.widget<FilledButton>(execute).onPressed, isNull);
    expect(api.writes, [previewPath, previewPath]);
    expect(tester.takeException(), isNull);
  });
  testWidgets('web parity guest exam makes no protected request', (
    tester,
  ) async {
    auth.seed(Unauthenticated());
    await mount(
      tester,
      const ExamScreen(allowAnonymousEntry: true),
      'en',
      Brightness.light,
      capturePage: false,
    );
    expect(api.reads.where((p) => p.contains('exams/simulations')), isEmpty);
    final start = find.byKey(const Key('rijvia_exam_entry_primary'));
    await tester.ensureVisible(start);
    await tester.tap(start);
    await tester.pumpAndSettle();
    expect(find.byType(LoginScreen), findsOneWidget);
    expect(api.reads.where((p) => p.contains('exams/simulations')), isEmpty);
    expect(api.writes, isEmpty);
  });
  testWidgets('web parity exam snapshot handoff does not present twice', (
    tester,
  ) async {
    api.activeExam = true;
    final response = await api.get('/api/exams/simulations/active');
    final snapshot = Map<String, dynamic>.from(
      response.data['activeExam'] as Map,
    );
    api.reads.clear();
    await mount(
      tester,
      ExamScreen(examId: 77, initialExam: snapshot),
      'en',
      Brightness.light,
      capturePage: false,
    );
    expect(find.text('1/50'), findsOneWidget);
    expect(find.text('A'), findsOneWidget);
    expect(find.text('B'), findsOneWidget);
    expect(api.reads.where((p) => p.contains('exams/simulations')), isEmpty);
    expect(api.writes, isEmpty);
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pumpAndSettle();
  });
  for (final code in ['ar', 'en', 'nl', 'fr']) {
    testWidgets('web parity mobile menu safe area $code', (tester) async {
      tester.view.devicePixelRatio = 1;
      tester.view.physicalSize = const Size(390, 900);
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      await tester.binding.setSurfaceSize(const Size(390, 900));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      await mount(
        tester,
        const HomeScreen(),
        code,
        Brightness.dark,
        textScale: 2,
        capturePage: false,
      );
      await tester.tap(find.byTooltip(locales[code]!.t('nav.open_menu')));
      await tester.pumpAndSettle();
      expect(find.byTooltip(locales[code]!.t('common.close')), findsOneWidget);
      final logout = find.widgetWithText(
        ListTile,
        locales[code]!.t('auth.logout'),
      );
      await tester.scrollUntilVisible(
        logout,
        250,
        scrollable: find.byType(Scrollable).last,
      );
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      await tester.tap(find.byTooltip(locales[code]!.t('common.close')));
      await tester.pumpAndSettle();
      expect(api.writes, isEmpty);
    });
  }
  for (final width in [390.0, 1280.0]) {
    testWidgets(
      'web parity admin sidebar navigates without popping its page $width',
      (tester) async {
        tester.view.devicePixelRatio = 1;
        tester.view.physicalSize = Size(width, 900);
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        await tester.binding.setSurfaceSize(Size(width, 900));
        addTearDown(() => tester.binding.setSurfaceSize(null));
        auth.seed(
          Authenticated(
            User(
              id: '1',
              username: 'owner',
              email: 'owner@example.test',
              name: 'Owner',
              role: 'ADMIN',
            ),
          ),
        );
        api.responses['/api/admin/signs'] = {
          'items': <Object>[],
          'totalItems': 0,
          'totalPages': 0,
        };
        api.responses['/api/categories'] = <Object>[];
        await mount(
          tester,
          AdminWorkspace(
            uri: Uri.parse('/admin/dashboard'),
            child: const Text('Starting admin page'),
          ),
          'en',
          Brightness.light,
          capturePage: false,
        );
        if (width < 1024) {
          await tester.tap(
            find.byTooltip(locales['en']!.t('admin.sidebar.panel_title')),
          );
          await tester.pumpAndSettle();
        }
        final signs = find.widgetWithText(
          ListTile,
          locales['en']!.t('admin.sidebar.signs'),
        );
        await tester.ensureVisible(signs);
        await tester.tap(signs);
        await tester.pumpAndSettle();
        expect(find.byType(AdminSignsScreen), findsOneWidget);
        expect(find.byType(Drawer), findsNothing);
        expect(tester.takeException(), isNull);
        expect(api.writes, isEmpty);
      },
    );
  }
}
