import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/di/service_locator.dart';
import 'package:mobile_app/features/auth/domain/entities/user.dart';
import 'package:mobile_app/features/auth/domain/repositories/auth_repository.dart';
import 'package:mobile_app/features/auth/domain/usecases/get_current_user_usecase.dart';
import 'package:mobile_app/features/auth/domain/usecases/login_usecase.dart';
import 'package:mobile_app/features/auth/domain/usecases/logout_usecase.dart';
import 'package:mobile_app/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:mobile_app/main.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    await getIt.reset();
    SharedPreferences.setMockInitialValues({});

    final repository = _UnauthenticatedRepository();
    getIt.registerFactory<AuthBloc>(
      () => AuthBloc(
        loginUseCase: LoginUseCase(repository),
        logoutUseCase: LogoutUseCase(repository),
        getCurrentUserUseCase: GetCurrentUserUseCase(repository),
        authRepository: repository,
      ),
    );
  });

  tearDown(() => getIt.reset());

  testWidgets('builds the ReadyRoad root widget without an exception', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const MyApp());
    await tester.pumpAndSettle();

    expect(find.byType(MaterialApp), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}

class _UnauthenticatedRepository implements AuthRepository {
  @override
  Future<User> login(String email, String password) {
    throw UnimplementedError();
  }

  @override
  Future<User> register(String email, String password, String name) {
    throw UnimplementedError();
  }

  @override
  Future<void> logout() async {}

  @override
  Future<User> getCurrentUser() {
    throw UnimplementedError();
  }

  @override
  Future<bool> isAuthenticated() async => false;

  @override
  Future<void> refreshToken() async {}
}
