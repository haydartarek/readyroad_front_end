import 'core/navigation/web_route_registry.dart';
import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:app_links/app_links.dart';
import 'core/di/service_locator.dart';
import 'core/network/authenticated_api_client.dart';
import 'core/constants/app_theme.dart';
import 'core/constants/api_constants.dart';
import 'core/localization/app_localizations.dart';
import 'core/providers/language_provider.dart';
import 'core/providers/favorites_provider.dart';
import 'core/providers/favorites_api_gateway.dart';
import 'core/providers/theme_provider.dart';
import 'core/providers/statistics_provider.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/auth/presentation/bloc/auth_event.dart';
import 'features/auth/presentation/bloc/auth_state.dart';
import 'features/auth/presentation/auth_session_messages.dart';
import 'features/auth/data/services/google_oauth_service.dart';
import 'features/home/rijvia_app_shell.dart';

void main() {
  ApiConstants.validateConfiguration();
  // Setup Dependency Injection
  setupDependencies();

  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> with WidgetsBindingObserver {
  String? _boundAuthUserId;
  // One AuthBloc instance drives both session checks and the UI.
  // This also holds when dependency injection uses registerFactory in tests.
  late final AuthBloc _authBloc;
  late AppLinks _appLinks;
  StreamSubscription? _deepLinkSubscription;

  /// Pending deep link stored as Uri to preserve query parameters
  Uri? _pendingDeepLink;
  bool _handledGoogleCallback = false;

  /// Global navigator key for navigation from outside BuildContext
  final GlobalKey<NavigatorState> _navigatorKey = GlobalKey<NavigatorState>();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _authBloc = getIt<AuthBloc>();
    // A 401 means the stored session must be rechecked locally; do not
    // send a second remote logout request with an already invalid token.
    if (getIt.isRegistered<AuthenticatedApiClient>()) {
      getIt<AuthenticatedApiClient>().onUnauthorized = () {
        if (mounted && !_authBloc.isClosed) {
          _authBloc.add(CheckAuthEvent());
        }
      };
    }
    // Run the initial auth check once, not on each MaterialApp rebuild.
    if (!(kIsWeb && _handleGoogleCallback(Uri.base))) {
      _authBloc.add(CheckAuthEvent());
    }
    _initDeepLinks();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _deepLinkSubscription?.cancel();
    if (getIt.isRegistered<AuthenticatedApiClient>()) {
      getIt<AuthenticatedApiClient>().onUnauthorized = null;
    }
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state != AppLifecycleState.resumed || _authBloc.isClosed) return;
    final current = _authBloc.state;
    if (current is AuthRevalidationRequired ||
        (current is Authenticated && current.validationIssue != null)) {
      _authBloc.add(CheckAuthEvent());
    }
  }

  /// Initialize deep link handling
  Future<void> _initDeepLinks() async {
    if (kIsWeb) {
      if (!_handledGoogleCallback &&
          (Uri.base.path != "/" || Uri.base.hasFragment)) {
        _handleDeepLink(Uri.base);
      }
      return;
    }
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

  bool _handleGoogleCallback(Uri uri) {
    if (!getIt.isRegistered<GoogleOAuthService>()) return false;
    final oauth = getIt<GoogleOAuthService>();
    if (!oauth.isCallback(uri)) return false;
    if (_handledGoogleCallback) return true;
    _handledGoogleCallback = true;
    try {
      final callback = oauth.consumeCallback(uri);
      _pendingDeepLink = Uri.parse(
        WebRouteRegistry.safeReturn(callback.returnPath),
      );
      _authBloc.add(GoogleCallbackEvent(callback));
    } on GoogleAuthFailure catch (error) {
      _authBloc.add(GoogleCallbackEvent.failed(error.messageKey));
    } catch (_) {
      _authBloc.add(GoogleCallbackEvent.failed('auth.google.invalid_callback'));
    }
    return true;
  }

  /// Deep links and in-app links use the same route and access rules.
  void _handleDeepLink(Uri uri) {
    if (_handleGoogleCallback(uri)) return;
    _navigateToDeepLink(uri);
  }

  void _navigateToDeepLink(Uri uri) {
    final navigator = _navigatorKey.currentState;
    if (navigator == null) {
      _pendingDeepLink = uri;
      return;
    }
    final local = Uri(
      path: uri.path,
      query: uri.hasQuery ? uri.query : null,
      fragment: uri.hasFragment ? uri.fragment : null,
    );
    navigator.pushNamed(local.toString());
  }

  void _flushPendingDeepLink() {
    final pending = _pendingDeepLink;
    if (pending == null || _navigatorKey.currentState == null) return;
    _pendingDeepLink = null;
    _navigateToDeepLink(pending);
  }

  void _syncUserProviders(BuildContext context, AuthState state) {
    if (state is Authenticated) {
      if (_boundAuthUserId != state.user.id) {
        _boundAuthUserId = state.user.id;
        context.read<LanguageProvider>().applyAccountLanguage(
          state.user.preferredLanguage,
        );
        context.read<FavoritesProvider>().bindToUser(state.user.id);
        context.read<StatisticsProvider>().bindToUser(state.user.id);
      }
    } else if (state is Unauthenticated) {
      if (_boundAuthUserId != null) {
        _boundAuthUserId = null;
        context.read<FavoritesProvider>().bindToUser(null);
        context.read<StatisticsProvider>().bindToUser(null);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => _flushPendingDeepLink(),
    );
    return MultiBlocProvider(
      providers: [
        // Auth BLoC (global)
        BlocProvider<AuthBloc>.value(value: _authBloc),
      ],
      child: MultiProvider(
        providers: [
          ChangeNotifierProvider(
            create: (_) => LanguageProvider(
              persistAccountLanguage: (language) async {
                if (_authBloc.state is! Authenticated) return;
                final response = await getIt<AuthenticatedApiClient>().patch(
                  '/api/users/me/preferred-language',
                  data: {'preferredLanguage': language},
                );
                if ((response.statusCode ?? 500) >= 400) {
                  throw StateError('Language preference was not saved');
                }
              },
            ),
          ),
          ChangeNotifierProvider(
            create: (_) => FavoritesProvider(
              gateway: FavoritesApiGateway(getIt<AuthenticatedApiClient>()),
            ),
          ),
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
              title: 'Rijvia',
              debugShowCheckedModeBanner: false,
              navigatorKey: _navigatorKey,
              initialRoute: "/",
              onGenerateRoute: WebRouteRegistry.generate,

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
                  _syncUserProviders(context, state);

                  final messenger = ScaffoldMessenger.of(context);
                  if (state is AuthError && state.messageKey != null) {
                    final message = AppLocalizations.of(
                      context,
                    ).t(state.messageKey!);
                    WidgetsBinding.instance.addPostFrameCallback((_) {
                      if (mounted) {
                        messenger.showSnackBar(
                          SnackBar(content: Text(message)),
                        );
                      }
                    });
                  }
                  messenger.clearMaterialBanners();
                  if (state is Authenticated && state.validationIssue != null) {
                    final language = Localizations.localeOf(
                      context,
                    ).languageCode;
                    messenger.showMaterialBanner(
                      MaterialBanner(
                        leading: const Icon(Icons.wifi_off_outlined),
                        content: Text(
                          AuthSessionMessages.issue(
                            state.validationIssue!,
                            language,
                          ),
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => _authBloc.add(CheckAuthEvent()),
                            child: Text(AuthSessionMessages.retry(language)),
                          ),
                        ],
                      ),
                    );
                  }
                  // Handle pending deep link after successful authentication
                  if (state is Authenticated && _pendingDeepLink != null) {
                    final deepLink = _pendingDeepLink!;
                    _pendingDeepLink = null;
                    debugPrint(
                      'Processing pending deep link after auth: $deepLink',
                    );

                    // Delay navigation to ensure HomeScreen is mounted
                    WidgetsBinding.instance.addPostFrameCallback((_) {
                      _navigateToDeepLink(deepLink);
                    });
                  }
                },
                builder: (context, state) {
                  // Restored auth may precede this listener while locales load.
                  // Apply the same binding once after the initial frame.
                  if (state is Authenticated &&
                      _boundAuthUserId != state.user.id) {
                    WidgetsBinding.instance.addPostFrameCallback((_) {
                      if (context.mounted) {
                        _syncUserProviders(context, _authBloc.state);
                      }
                    });
                  }
                  // Show appropriate screen based on auth state
                  if (state is AuthLoading || state is AuthInitial) {
                    return const Scaffold(
                      body: Center(child: CircularProgressIndicator()),
                    );
                  } else if (state is Authenticated) {
                    return const RijviaAppShell();
                  } else if (state is AuthRevalidationRequired) {
                    final language = Localizations.localeOf(
                      context,
                    ).languageCode;
                    return Scaffold(
                      body: SafeArea(
                        child: Center(
                          child: Padding(
                            padding: const EdgeInsets.all(24),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.cloud_off_outlined, size: 44),
                                const SizedBox(height: 16),
                                Text(
                                  AuthSessionMessages.issue(
                                    state.issue,
                                    language,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                                const SizedBox(height: 16),
                                FilledButton.icon(
                                  onPressed: () =>
                                      _authBloc.add(CheckAuthEvent()),
                                  icon: const Icon(Icons.refresh),
                                  label: Text(
                                    AuthSessionMessages.retry(language),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    );
                  } else {
                    return const RijviaAppShell();
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
