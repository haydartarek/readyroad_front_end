import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/constants/app_theme.dart';
import 'package:mobile_app/core/localization/app_localizations.dart';
import 'package:mobile_app/core/providers/language_provider.dart';
import 'package:mobile_app/features/auth/domain/repositories/auth_repository.dart';
import 'package:mobile_app/features/auth/domain/usecases/get_current_user_usecase.dart';
import 'package:mobile_app/features/auth/domain/usecases/login_usecase.dart';
import 'package:mobile_app/features/auth/domain/usecases/logout_usecase.dart';
import 'package:mobile_app/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:mobile_app/features/auth/presentation/bloc/auth_event.dart';
import 'package:mobile_app/features/auth/presentation/bloc/auth_state.dart';
import 'package:mobile_app/features/auth/presentation/screens/login_screen.dart';
import 'package:mobile_app/features/auth/presentation/screens/register_screen.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../support/load_app_fonts.dart';

class _Repository extends AuthRepository {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _ButtonBloc extends AuthBloc {
  final List<AuthEvent> received = [];
  _ButtonBloc(AuthRepository repository)
    : super(
        loginUseCase: LoginUseCase(repository),
        logoutUseCase: LogoutUseCase(repository),
        getCurrentUserUseCase: GetCurrentUserUseCase(repository),
        authRepository: repository,
      );
  @override
  void add(AuthEvent event) => received.add(event);
  void loading() => emit(AuthLoading());
}

class _LoadedLocale extends LocalizationsDelegate<AppLocalizations> {
  final AppLocalizations value;
  const _LoadedLocale(this.value);
  @override
  bool isSupported(Locale locale) => locale == value.locale;
  @override
  Future<AppLocalizations> load(Locale locale) => SynchronousFuture(value);
  @override
  bool shouldReload(_LoadedLocale old) => old.value.locale != value.locale;
}

void main() {
  final locales = <String, AppLocalizations>{};
  setUpAll(() async {
    await loadAppFonts();
    for (final code in ['ar', 'en', 'nl', 'fr']) {
      final value = AppLocalizations(Locale(code));
      await value.load();
      locales[code] = value;
    }
  });
  for (final language in ['ar', 'en', 'nl', 'fr']) {
    for (final width in [360.0, 1280.0]) {
      for (final registration in [false, true]) {
        testWidgets(
          'Google button $language $width registration=$registration',
          (tester) async {
            SharedPreferences.setMockInitialValues({
              'readyroad_locale': language,
            });
            tester.view.devicePixelRatio = 1;
            tester.view.physicalSize = Size(width, 844);
            addTearDown(tester.view.resetDevicePixelRatio);
            addTearDown(tester.view.resetPhysicalSize);
            await tester.binding.setSurfaceSize(Size(width, 844));
            addTearDown(() => tester.binding.setSurfaceSize(null));
            final bloc = _ButtonBloc(_Repository());
            addTearDown(bloc.close);
            await tester.pumpWidget(
              ChangeNotifierProvider(
                create: (_) => LanguageProvider(),
                child: BlocProvider<AuthBloc>.value(
                  value: bloc,
                  child: MaterialApp(
                    locale: Locale(language),
                    supportedLocales: AppLocalizations.supportedLocales,
                    localizationsDelegates: [
                      _LoadedLocale(locales[language]!),
                      GlobalMaterialLocalizations.delegate,
                      GlobalWidgetsLocalizations.delegate,
                      GlobalCupertinoLocalizations.delegate,
                    ],
                    theme: language == 'ar'
                        ? AppTheme.darkTheme
                        : AppTheme.lightTheme,
                    home: registration
                        ? const RegisterScreen()
                        : const LoginScreen(),
                  ),
                ),
              ),
            );
            await tester.pumpAndSettle();
            final button = find.byKey(const ValueKey('google-auth-button'));
            expect(button, findsOneWidget);
            await tester.ensureVisible(button);
            expect(tester.getSize(button).height, greaterThanOrEqualTo(48));
            await tester.tap(button);
            await tester.pump();
            final event = bloc.received.single as GoogleSignInEvent;
            expect(event.language, language);
            // Google is independent of the empty email/password form validators.
            expect(
              find.text(
                AppLocalizations.of(
                  tester.element(button),
                ).authValidationRequired,
              ),
              findsNothing,
            );
            bloc.loading();
            await tester.pump();
            expect(tester.widget<OutlinedButton>(button).onPressed, isNull);
            expect(tester.takeException(), isNull);
          },
        );
      }
    }
  }
}
