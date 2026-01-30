import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:app_links/app_links.dart';
import 'core/di/service_locator.dart';
import 'core/constants/app_theme.dart';
import 'core/localization/app_localizations.dart';
import 'core/providers/language_provider.dart';
import 'core/providers/favorites_provider.dart';
import 'core/providers/theme_provider.dart';
import 'core/providers/statistics_provider.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/auth/presentation/bloc/auth_event.dart';
import 'features/auth/presentation/bloc/auth_state.dart';
import 'features/auth/presentation/screens/login_screen.dart';
import 'features/home/home_screen.dart';
import 'features/exam/exam_screen.dart';
import 'features/quiz/quiz_screen.dart';
import 'features/statistics/statistics_screen.dart';
import 'features/lessons/lessons_list_screen.dart';
import 'features/favorites/favorites_screen.dart';
import 'features/search/search_screen.dart';

void main() {
  // Setup Dependency Injection
  setupDependencies();

  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  late AppLinks _appLinks;
  StreamSubscription? _deepLinkSubscription;

  /// Pending deep link stored as Uri to preserve query parameters
  Uri? _pendingDeepLink;

  /// Global navigator key for navigation from outside BuildContext
  final GlobalKey<NavigatorState> _navigatorKey = GlobalKey<NavigatorState>();

  @override
  void initState() {
    super.initState();
    _initDeepLinks();
  }

  @override
  void dispose() {
    _deepLinkSubscription?.cancel();
    super.dispose();
  }

  /// Initialize deep link handling
  Future<void> _initDeepLinks() async {
    _appLinks = AppLinks();

    // Handle initial deep link (app was closed)
    try {
      final initialUri = await _appLinks.getInitialLink();
      if (initialUri != null) {
        _handleDeepLink(initialUri);
      }
    } catch (e) {
      debugPrint('Failed to get initial URI: $e');
    }

    // Handle deep links while app is running
    _deepLinkSubscription = _appLinks.uriLinkStream.listen(
      (Uri uri) {
        _handleDeepLink(uri);
      },
      onError: (err) {
        debugPrint('Deep link error: $err');
      },
    );
  }

  /// Handle deep link navigation
  void _handleDeepLink(Uri uri) {
    debugPrint('Deep link received: $uri');

    // Normalize path
    String path = uri.path;
    if (path.isEmpty || path == '/') {
      path = '/home';
    }

    // Protected routes requiring authentication
    const protectedRoutes = [
      '/dashboard',
      '/exam',
      '/practice',
      '/analytics',
      '/profile',
      '/lessons',
      '/favorites',
      '/search',
      '/quiz',
    ];

    final isProtectedRoute = protectedRoutes.any(
      (route) => path.startsWith(route),
    );

    // Check auth state
    final authBloc = getIt<AuthBloc>();
    final authState = authBloc.state;

    // Store pending deep link if protected and not authenticated
    if (isProtectedRoute && authState is! Authenticated) {
      // Store full URI to preserve query parameters
      _pendingDeepLink = uri;
      debugPrint('Pending deep link (requires auth): $uri');
      return;
    }

    // Navigate immediately if authenticated or public route
    _navigateToDeepLink(uri);
  }

  /// Execute navigation to deep link destination
  void _navigateToDeepLink(Uri uri) {
    final navigator = _navigatorKey.currentState;
    if (navigator == null) {
      debugPrint('Navigator not ready, storing deep link: $uri');
      _pendingDeepLink = uri;
      return;
    }

    final path = uri.path.isEmpty ? '/home' : uri.path;
    final queryParams = uri.queryParameters;

    debugPrint('Navigating to: $path with params: $queryParams');

    // Route mapping - match path to screen
    Widget? targetScreen;

    if (path.startsWith('/exam')) {
      targetScreen = const ExamScreen();
    } else if (path.startsWith('/quiz') || path.startsWith('/practice')) {
      targetScreen = const QuizScreen();
    } else if (path.startsWith('/analytics') || path.startsWith('/statistics')) {
      targetScreen = const StatisticsScreen();
    } else if (path.startsWith('/lessons')) {
      targetScreen = const LessonsListScreen();
    } else if (path.startsWith('/favorites')) {
      targetScreen = const FavoritesScreen();
    } else if (path.startsWith('/search')) {
      targetScreen = const SearchScreen();
    } else if (path.startsWith('/home') || path.startsWith('/dashboard')) {
      // Already on home, no navigation needed
      debugPrint('Deep link to home - no navigation needed');
      return;
    } else {
      // Unknown route - fallback to home with warning
      debugPrint('Unknown deep link route: $path - fallback to home');
      return;
    }

    // Push the target screen
    navigator.push(
      MaterialPageRoute(builder: (context) => targetScreen!),
    );
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        // Auth BLoC (global)
        BlocProvider<AuthBloc>(
          create: (context) => getIt<AuthBloc>()..add(CheckAuthEvent()),
        ),
      ],
      child: MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => LanguageProvider()),
          ChangeNotifierProvider(create: (_) => FavoritesProvider()),
          ChangeNotifierProvider(create: (_) => ThemeProvider()),
          ChangeNotifierProvider(create: (_) => StatisticsProvider()),
        ],
        child: Consumer2<ThemeProvider, LanguageProvider>(
          builder: (context, themeProvider, languageProvider, child) {
            // Get current locale from LanguageProvider
            final locale = Locale(languageProvider.currentLanguage);

            // Determine text direction (RTL for Arabic)
            final textDirection = languageProvider.currentLanguage == 'ar'
                ? TextDirection.rtl
                : TextDirection.ltr;

            return MaterialApp(
              title: 'ReadyRoad',
              debugShowCheckedModeBanner: false,
              navigatorKey: _navigatorKey,

              // Localization Setup
              locale: locale,
              supportedLocales: AppLocalizations.supportedLocales,
              localizationsDelegates: const [
                AppLocalizations.delegate,
                GlobalMaterialLocalizations.delegate,
                GlobalWidgetsLocalizations.delegate,
                GlobalCupertinoLocalizations.delegate,
              ],
              localeResolutionCallback: (deviceLocale, supportedLocales) {
                // Use LanguageProvider's locale as source of truth
                return locale;
              },

              // RTL Support
              builder: (context, child) {
                return Directionality(
                  textDirection: textDirection,
                  child: child!,
                );
              },

              // Theme
              theme: AppTheme.lightTheme,
              darkTheme: AppTheme.darkTheme,
              themeMode: themeProvider.isDarkMode
                  ? ThemeMode.dark
                  : ThemeMode.light,

              // Home Route (Auth-based)
              home: BlocConsumer<AuthBloc, AuthState>(
                listener: (context, state) {
                  // Handle pending deep link after successful authentication
                  if (state is Authenticated && _pendingDeepLink != null) {
                    final deepLink = _pendingDeepLink!;
                    _pendingDeepLink = null;
                    debugPrint('Processing pending deep link after auth: $deepLink');

                    // Delay navigation to ensure HomeScreen is mounted
                    WidgetsBinding.instance.addPostFrameCallback((_) {
                      _navigateToDeepLink(deepLink);
                    });
                  }
                },
                builder: (context, state) {
                  // Show appropriate screen based on auth state
                  if (state is AuthLoading || state is AuthInitial) {
                    return const Scaffold(
                      body: Center(child: CircularProgressIndicator()),
                    );
                  } else if (state is Authenticated) {
                    return const HomeScreen();
                  } else {
                    return const LoginScreen();
                  }
                },
              ),
            );
          },
        ),
      ),
    );
  }
}
