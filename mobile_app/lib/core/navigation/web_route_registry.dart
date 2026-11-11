import '../../features/dashboard/dashboard_workspace.dart';
import '../../features/admin/admin_workspace.dart';
import '../../features/categories/web_practice_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../localization/app_localizations.dart';
import '../../design_system/widgets/rijvia_app_bar.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import '../../features/auth/presentation/bloc/auth_bloc.dart';
import '../../features/auth/presentation/bloc/auth_event.dart';
import '../../features/auth/presentation/bloc/auth_state.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/register_screen.dart';
import '../../features/auth/presentation/screens/forgot_password_screen.dart';
import '../../features/auth/presentation/screens/reset_password_screen.dart';
import '../../features/home/rijvia_app_shell.dart';
import '../../features/lessons/lessons_list_screen.dart';
import '../../features/categories/traffic_signs_screen.dart';
import '../../features/categories/sign_quiz_screen.dart';
import '../../features/exam/exam_screen.dart';
import '../../features/exam/exam_results_screen.dart';
import '../../features/exam/exam_history_screen.dart';
import '../../features/exam/category_exam_screen.dart';
import '../../features/exam/checkout_screen.dart';
import '../../features/dashboard/dashboard_screen.dart';
import '../../features/assessment/assessment_screen.dart';
import '../../features/notifications/notifications_screen.dart';
import '../../features/search/search_screen.dart';
import '../../features/public/public_document_screen.dart';
import '../../features/public/public_catalog_screen.dart';
import '../../features/public/contact_screen.dart';

/// Canonical web paths, aliases, query parameters and access rules live here.
class WebRouteRegistry {
  static Uri normalize(String location) {
    final uri = Uri.tryParse(location) ?? Uri(path: '/404');
    if (uri.hasScheme || uri.hasAuthority || location.startsWith('//')) {
      return Uri(path: '/404');
    }
    if (uri.path == '/' && uri.fragment.startsWith('/')) {
      return normalize(uri.fragment);
    }
    final segments = uri.pathSegments.toList();
    if (segments.isNotEmpty &&
        ['ar', 'en', 'nl', 'fr'].contains(segments.first)) {
      segments.removeAt(0);
    }
    var path = '/${segments.join('/')}';
    path = switch (path) {
      '/home' => '/',
      '/privacy' => '/privacy-policy',
      '/admin' => '/admin/dashboard',
      _ => path,
    };
    return uri.replace(path: path);
  }

  static String safeReturn(String? location) {
    if (location == null ||
        !location.startsWith('/') ||
        location.startsWith('//')) {
      return '/dashboard';
    }
    final uri = normalize(location);
    if (uri.path == '/404' ||
        [
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
        ].contains(uri.path)) {
      return '/dashboard';
    }
    return uri.toString();
  }

  static String authDestination(String? current, String path) {
    final uri = normalize(current ?? '/');
    final returnTo = safeReturn(
      uri.queryParameters['returnUrl'] ??
          (requiresAuthentication(uri) ? uri.toString() : null),
    );
    return Uri(path: path, queryParameters: {'returnUrl': returnTo}).toString();
  }

  static bool requiresAuthentication(Uri uri) {
    final path = uri.path;
    if (path == '/exam') return _theoryCategory(uri) != null;
    if (['/practice', '/practice/random'].contains(path)) {
      return false;
    }
    if (RegExp(
      r'^/traffic-signs/[^/]+/(practice|exam)(/\d+)?$',
    ).hasMatch(path)) {
      return true;
    }
    return [
      '/checkout',
      '/dashboard',
      '/exam',
      '/practice',
      '/analytics',
      '/profile',
      '/assessment',
      '/admin',
      '/progress',
      '/notifications',
      '/favorites',
    ].any((p) => path == p || path.startsWith('$p/'));
  }

  static String? _theoryCategory(Uri uri) {
    final category = uri.queryParameters['category']?.trim().toUpperCase();
    return category != null && RegExp(r'^TH(0[1-9]|10)$').hasMatch(category)
        ? category
        : null;
  }

  static Route<dynamic> generate(RouteSettings settings) {
    final uri = normalize(settings.name ?? '/');
    return MaterialPageRoute(
      settings: RouteSettings(
        name: uri.toString(),
        arguments: settings.arguments,
      ),
      builder: (context) {
        final child = _page(context, uri, settings.arguments);
        if (!requiresAuthentication(uri)) return child;
        return _AuthenticatedRoute(uri: uri, child: child);
      },
    );
  }

  static Widget _page(BuildContext context, Uri uri, Object? arguments) {
    final adminPage = AdminWorkspace.page(uri);
    if (adminPage != null) return adminPage;
    final path = uri.path;
    final parts = uri.pathSegments;
    final query = uri.queryParameters;
    switch (path) {
      case '/':
        return RijviaAppShell(
          initialSection: uri.fragment == 'pricing' ? 'pricing' : null,
        );
      case '/plans':
        return const RijviaAppShell(initialSection: 'pricing');
      case '/login':
        return _AuthPage(
          kind: 'login',
          returnTo: safeReturn(query['returnUrl']),
        );
      case '/register':
        return _AuthPage(
          kind: 'register',
          returnTo: safeReturn(query['returnUrl']),
        );
      case '/forgot-password':
        return const ForgotPasswordScreen();
      case '/reset-password':
        return ResetPasswordScreen(token: query['token']);
      case '/about':
        return const PublicDocumentScreen(page: 'about');
      case '/faq':
        return const PublicDocumentScreen(page: 'faq');
      case '/privacy-policy':
        return const PublicDocumentScreen(page: 'privacy');
      case '/cookie-policy':
        return const PublicDocumentScreen(page: 'cookies');
      case '/terms':
        return const PublicDocumentScreen(page: 'terms');
      case '/disclaimer':
        return const PublicDocumentScreen(page: 'disclaimer');
      case '/contact':
        return const ContactScreen();
      case '/blog':
        return const PublicCatalogScreen(kind: 'blog');
      case '/videos':
        return const PublicCatalogScreen(kind: 'videos');
      case '/traffic-signs':
        return TrafficSignsScreen(
          category: query['category'],
          search: query['search'] ?? '',
        );
      case '/favorites':
      case '/traffic-signs/favorites':
        return const TrafficSignsScreen(favoritesOnly: true);
      case '/lessons':
        return const LessonsListScreen();
      case '/practice':
        return const WebPracticeScreen();
      case '/practice/random':
        return const RandomPracticeEntryScreen();
      case '/practice/sign-history':
        return const SignQuizHistoryScreen();
      case '/exam':
        final category = _theoryCategory(uri);
        if (category != null) {
          return CategoryExamScreen(category: category);
        }
        return const ExamScreen(allowAnonymousEntry: true);
      case '/exam/results':
        return ExamHistoryScreen(
          highlightExamId: int.tryParse(query['examId'] ?? ''),
          highlightRandomSessionId: int.tryParse(
            query['randomSignExamId'] ?? '',
          ),
          highlightSignResultId: int.tryParse(query['signExamResultId'] ?? ''),
        );
      case '/dashboard':
        return DashboardWorkspace(section: query['section'], query: query);
      case '/analytics':
        return const DashboardWorkspace(section: 'weak-areas');
      case '/analytics/weak-areas':
        return DashboardWorkspace(section: 'weak-areas', query: query);
      case '/analytics/error-patterns':
        return DashboardWorkspace(section: 'error-patterns', query: query);
      case '/progress':
        return const DashboardScreen();
      case '/profile':
        return DashboardWorkspace(section: 'profile', query: query);
      case '/notifications':
        return const NotificationsScreen();
      case '/search':
        return const SearchScreen();
      case '/unauthorized':
        return const WebStatusScreen(unauthorized: true);
    }
    if (parts.length == 2 && parts.first == 'blog') {
      return PublicCatalogScreen(kind: 'blog', slug: parts[1]);
    }
    if (parts.length >= 2 && parts.first == 'lessons' && parts.length <= 3) {
      return LessonDetailScreen(lessonCode: parts[1]);
    }
    if (parts.length >= 2 && parts.first == 'traffic-signs') {
      if (parts.length == 2) return TrafficSignDetailRoute(code: parts[1]);
      if (parts.length == 3 && parts[2] == 'practice') {
        return SignQuizScreen(signCode: parts[1], examMode: false);
      }
      if (parts[2] == 'exam' && parts.length <= 4) {
        final number = parts.length == 4 ? int.tryParse(parts[3]) : 1;
        if (number != null && number > 0) {
          return SignQuizScreen(
            signCode: parts[1],
            examMode: true,
            examNumber: number,
          );
        }
      }
    }
    if (parts.firstOrNull == 'assessment' && parts.length <= 3) {
      if (parts.length == 3 &&
          ![
            'beginner',
            'intermediate',
            'advanced',
          ].contains(parts[2].toLowerCase())) {
        return const WebStatusScreen();
      }
      return AssessmentScreen(
        category: parts.length > 1 ? parts[1] : null,
        level: parts.length > 2 ? parts[2] : null,
      );
    }
    if (parts.length == 2 && parts.first == 'practice') {
      return WebPracticeScreen(category: parts[1]);
    }
    if (parts.length == 3 && parts[0] == 'exam' && parts[1] == 'results') {
      final id = int.tryParse(parts[2]);
      if (id != null && id > 0) return ExamResultsScreen(examId: id);
    }
    if (parts.length == 2 && parts.first == 'exam') {
      final id = int.tryParse(parts[1]);
      if (id != null && id > 0) {
        return ExamScreen(
          examId: id,
          initialExam: arguments is ExamEntrySnapshot && arguments.examId == id
              ? arguments.payload
              : null,
        );
      }
    }
    if (parts.length == 2 &&
        parts.first == 'checkout' &&
        ['success', 'cancel', 'expired'].contains(parts[1])) {
      return CheckoutScreen(kind: parts[1], purchaseId: query['purchaseId']);
    }
    return const WebStatusScreen();
  }
}

class _AuthPage extends StatelessWidget {
  const _AuthPage({required this.kind, required this.returnTo});
  final String kind;
  final String returnTo;
  @override
  Widget build(BuildContext context) => BlocBuilder<AuthBloc, AuthState>(
    builder: (context, state) => state is Authenticated
        ? _RouteRedirect(target: returnTo)
        : kind == 'login'
        ? LoginScreen(onAuthenticated: () {})
        : RegisterScreen(onAuthenticated: () {}),
  );
}

class _RouteRedirect extends StatefulWidget {
  const _RouteRedirect({required this.target});
  final String target;
  @override
  State<_RouteRedirect> createState() => _RouteRedirectState();
}

class _RouteRedirectState extends State<_RouteRedirect> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final navigator = Navigator.of(context);
      var found = false;
      navigator.popUntil((route) {
        found = route.settings.name == widget.target;
        return found || route.isFirst;
      });
      if (!found) navigator.pushNamed(widget.target);
    });
  }

  @override
  Widget build(BuildContext context) =>
      const Scaffold(body: Center(child: CircularProgressIndicator()));
}

class _AuthenticatedRoute extends StatelessWidget {
  const _AuthenticatedRoute({required this.uri, required this.child});
  final Uri uri;
  final Widget child;
  @override
  Widget build(BuildContext context) => BlocBuilder<AuthBloc, AuthState>(
    builder: (context, state) {
      if (state is AuthLoading || state is AuthInitial) {
        return const Scaffold(body: Center(child: CircularProgressIndicator()));
      }
      if (state is! Authenticated) return LoginScreen(onAuthenticated: () {});
      if (uri.path.startsWith('/admin') && state.user.role != 'ADMIN') {
        return const WebStatusScreen(unauthorized: true);
      }
      return child;
    },
  );
}

class WebStatusScreen extends StatelessWidget {
  const WebStatusScreen({super.key, this.unauthorized = false});
  final bool unauthorized;
  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Scaffold(
      appBar: const RijviaAppBar(),
      body: SingleChildScrollView(
        child: Center(
          child: Container(
            constraints: const BoxConstraints(maxWidth: 600),
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Icon(
                  unauthorized
                      ? Icons.shield_outlined
                      : Icons.search_off_outlined,
                  size: 64,
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(height: 24),
                RijviaPageHero(
                  title: t.t(
                    unauthorized
                        ? 'unauthorized.title'
                        : 'common.not_found_title',
                  ),
                  description: t.t(
                    unauthorized
                        ? 'unauthorized.subtitle'
                        : 'common.not_found_desc',
                  ),
                ),
                if (unauthorized) ...[
                  const SizedBox(height: 24),
                  RijviaPageSection(
                    title: t.t('unauthorized.reason_heading'),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        for (var i = 1; i <= 3; i++)
                          Text('• ${t.t('unauthorized.reason_$i')}'),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: () => Navigator.pushNamed(context, '/'),
                  child: Text(t.t('nav.home')),
                ),
                if (unauthorized)
                  TextButton(
                    onPressed: () =>
                        context.read<AuthBloc>().add(LogoutEvent()),
                    child: Text(t.t('auth.logout')),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
