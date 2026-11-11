import 'package:flutter/material.dart';
import '../../core/localization/app_localizations.dart';
import '../../design_system/widgets/rijvia_web_navigation.dart';
import '../../shared/widgets/language_selector.dart';
import 'admin_overview_screen.dart';
import 'admin_signs_screen.dart';
import 'admin_settings_screen.dart';
import 'admin_users_screen.dart';
import 'admin_learning_screen.dart';
import 'admin_analytics_screen.dart';
import 'admin_moderation_screen.dart';
import 'admin_quiz_editor.dart';
import 'admin_quizzes_screen.dart';
import 'admin_theory_categories_screen.dart';
import 'admin_lessons_screen.dart';
import 'admin_lesson_editor.dart';
import 'admin_data_import_screen.dart';
import 'admin_marketing_screen.dart';
import 'marketing_editorial_panel.dart';

class AdminDestination {
  const AdminDestination(
    this.path,
    this.label,
    this.icon,
    this.group, {
    this.children = const [],
  });
  final String path;
  final String label;
  final IconData icon;
  final String group;
  final List<(String, String)> children;
}

const adminDestinations = [
  AdminDestination(
    '/admin/dashboard',
    'admin.sidebar.dashboard',
    Icons.speed,
    'overview',
  ),
  AdminDestination(
    '/admin/signs',
    'admin.sidebar.signs',
    Icons.traffic_outlined,
    'content',
    children: [('/admin/signs', 'admin.sidebar.signs_all')],
  ),
  AdminDestination(
    '/admin/quizzes',
    'admin.sidebar.quizzes',
    Icons.fact_check_outlined,
    'content',
    children: [
      ('/admin/quizzes', 'admin.sidebar.quizzes_all'),
      (
        '/admin/quizzes/categories',
        'admin.quizzes.health.category_management_title',
      ),
      ('/admin/quizzes/new', 'admin.sidebar.quizzes_add'),
    ],
  ),
  AdminDestination(
    '/admin/lessons',
    'admin.sidebar.lessons',
    Icons.menu_book_outlined,
    'content',
    children: [('/admin/lessons', 'admin.sidebar.lessons_all')],
  ),
  AdminDestination(
    '/admin/data-import',
    'admin.sidebar.data_import',
    Icons.drive_folder_upload_outlined,
    'data',
  ),
  AdminDestination(
    '/admin/users',
    'admin.sidebar.users',
    Icons.people_outline,
    'users',
  ),
  AdminDestination(
    '/admin/moderation',
    'admin.sidebar.moderation',
    Icons.verified_user_outlined,
    'trust',
  ),
  AdminDestination(
    '/admin/marketing',
    'admin.sidebar.marketing',
    Icons.campaign_outlined,
    'insights',
  ),
  AdminDestination(
    '/admin/analytics',
    'admin.sidebar.analytics',
    Icons.bar_chart,
    'insights',
  ),
  AdminDestination(
    '/admin/settings',
    'admin.sidebar.settings',
    Icons.tune,
    'system',
  ),
];

class AdminWorkspace extends StatelessWidget {
  const AdminWorkspace({super.key, required this.uri, required this.child});
  final Uri uri;
  final Widget child;
  static Widget? page(Uri uri) {
    final parts = uri.pathSegments;
    if (parts.length == 4 &&
        parts[0] == 'admin' &&
        parts[1] == 'lessons' &&
        parts[3] == 'edit') {
      return AdminWorkspace(
        uri: uri,
        child: AdminLessonEditor(lessonCode: parts[2]),
      );
    }
    if (parts.length == 4 &&
        parts[0] == 'admin' &&
        parts[1] == 'quizzes' &&
        parts[3] == 'edit') {
      final id = int.tryParse(parts[2]);
      if (id != null && id > 0) {
        return AdminWorkspace(
          uri: uri,
          child: AdminQuizEditor(
            questionId: id,
            returnTo: uri.queryParameters['returnTo'] ?? '/admin/quizzes',
          ),
        );
      }
      return null;
    }
    if (parts.length >= 4 &&
        parts[0] == 'admin' &&
        parts[1] == 'users' &&
        parts[3] == 'learning') {
      final userId = int.tryParse(parts[2]);
      if (userId == null || userId <= 0) return null;
      if (parts.length == 4) {
        return AdminWorkspace(
          uri: uri,
          child: AdminLearningScreen(userId: userId),
        );
      }
      if (parts.length == 7 &&
          parts[4] == 'exams' &&
          [
            'THEORY_EXAM',
            'RANDOM_EXAM',
            'TRAFFIC_SIGN_EXAM',
          ].contains(parts[5])) {
        final examId = int.tryParse(parts[6]);
        if (examId != null && examId > 0) {
          return AdminWorkspace(
            uri: uri,
            child: AdminLearningExamScreen(
              userId: userId,
              examType: parts[5],
              examId: examId,
            ),
          );
        }
      }
      return null;
    }
    return switch (uri.path) {
      '/admin/dashboard' => AdminWorkspace(
        uri: uri,
        child: const AdminOverviewScreen(),
      ),
      '/admin/signs' => AdminWorkspace(
        uri: uri,
        child: AdminSignsScreen(query: uri.queryParameters),
      ),
      '/admin/settings' => AdminWorkspace(
        uri: uri,
        child: const AdminSettingsScreen(),
      ),
      '/admin/users' => AdminWorkspace(
        uri: uri,
        child: const AdminUsersScreen(),
      ),
      '/admin/analytics' => AdminWorkspace(
        uri: uri,
        child: const AdminAnalyticsScreen(),
      ),
      '/admin/moderation' => AdminWorkspace(
        uri: uri,
        child: const AdminModerationScreen(),
      ),
      '/admin/quizzes' => AdminWorkspace(
        uri: uri,
        child: AdminQuizzesScreen(query: uri.queryParameters),
      ),
      '/admin/quizzes/new' => AdminWorkspace(
        uri: uri,
        child: const AdminQuizEditor(),
      ),
      '/admin/quizzes/categories' => AdminWorkspace(
        uri: uri,
        child: const AdminTheoryCategoriesScreen(),
      ),
      '/admin/lessons' => AdminWorkspace(
        uri: uri,
        child: const AdminLessonsScreen(),
      ),
      '/admin/lessons/new' => AdminWorkspace(
        uri: uri,
        child: const AdminNewLessonScreen(),
      ),
      '/admin/data-import' => AdminWorkspace(
        uri: uri,
        child: const AdminDataImportScreen(),
      ),
      '/admin/marketing' => AdminWorkspace(
        uri: uri,
        child: AdminMarketingScreen(
          editorialBuilder: (workspace, strategy, refresh) =>
              MarketingEditorialPanel(
                workspace: workspace,
                strategy: strategy,
                onRefresh: refresh,
              ),
        ),
      ),
      _ => null,
    };
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final current = adminDestinations
        .where((d) => uri.path == d.path || uri.path.startsWith('${d.path}/'))
        .firstOrNull;
    return LayoutBuilder(
      builder: (context, box) {
        final wide =
            box.maxWidth / MediaQuery.textScalerOf(context).scale(1) >= 1024;
        return Scaffold(
          appBar: uri.path == '/admin/dashboard'
              ? const PreferredSize(
                  preferredSize: Size.fromHeight(75),
                  child: RijviaWebNavbar(),
                )
              : wide
              ? null
              : AppBar(
                  title: Text(t.t('admin.sidebar.panel_title')),
                  actions: const [LanguageSelector()],
                ),
          drawer: wide
              ? null
              : Drawer(
                  width: 288,
                  child: SafeArea(
                    child: _sidebar(context, current, drawer: true),
                  ),
                ),
          body: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (wide)
                Container(
                  width: 288,
                  decoration: BoxDecoration(
                    border: BorderDirectional(
                      end: BorderSide(
                        color: Theme.of(context).colorScheme.outlineVariant,
                      ),
                    ),
                  ),
                  child: _sidebar(context, current),
                ),
              Expanded(
                child: SingleChildScrollView(
                  padding: EdgeInsets.symmetric(
                    horizontal: wide ? 32 : 12,
                    vertical: wide ? 32 : 16,
                  ),
                  child: Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 1280),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Wrap(
                            crossAxisAlignment: WrapCrossAlignment.center,
                            spacing: 8,
                            children: [
                              if (!wide && uri.path == '/admin/dashboard')
                                Builder(
                                  builder: (context) => IconButton(
                                    tooltip: t.t('admin.sidebar.panel_title'),
                                    onPressed: () =>
                                        Scaffold.of(context).openDrawer(),
                                    icon: const Icon(Icons.menu),
                                  ),
                                ),
                              TextButton(
                                onPressed: () => Navigator.pushNamed(
                                  context,
                                  '/admin/dashboard',
                                ),
                                child: Text(t.t('admin.sidebar.panel_title')),
                              ),
                              const Icon(Icons.chevron_right, size: 16),
                              Text(
                                current == null
                                    ? t.t('common.not_found_title')
                                    : t.t(current.label),
                              ),
                              if (wide && uri.path != '/admin/dashboard')
                                const LanguageSelector(),
                            ],
                          ),
                          const SizedBox(height: 16),
                          child,
                          if (uri.path == '/admin/dashboard') ...[
                            const SizedBox(height: 32),
                            const RijviaWebFooter(),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _sidebar(
    BuildContext context,
    AdminDestination? current, {
    bool drawer = false,
  }) {
    final t = AppLocalizations.of(context);
    final colors = Theme.of(context).colorScheme;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        for (final group in const [
          'overview',
          'content',
          'data',
          'users',
          'trust',
          'insights',
          'system',
        ]) ...[
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
            child: Text(
              t.t('admin.group.$group'),
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: colors.onSurfaceVariant,
              ),
            ),
          ),
          for (final destination in adminDestinations.where(
            (d) => d.group == group,
          )) ...[
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: ListTile(
                selected: current == destination,
                selectedTileColor: colors.primary.withValues(alpha: .08),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                leading: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: colors.primary.withValues(alpha: .08),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(destination.icon, size: 18),
                ),
                title: Text(
                  t.t(destination.label),
                  style: const TextStyle(fontSize: 14),
                ),
                onTap: () {
                  if (drawer) Navigator.pop(context);
                  Navigator.pushNamed(context, destination.path);
                },
              ),
            ),
            if (current == destination)
              for (final link in destination.children)
                Padding(
                  padding: const EdgeInsetsDirectional.only(start: 48),
                  child: TextButton(
                    onPressed: () {
                      if (drawer) Navigator.pop(context);
                      Navigator.pushNamed(context, link.$1);
                    },
                    child: Align(
                      alignment: AlignmentDirectional.centerStart,
                      child: Text(t.t(link.$2)),
                    ),
                  ),
                ),
          ],
        ],
        TextButton.icon(
          onPressed: () {
            if (drawer) Navigator.pop(context);
            Navigator.pushNamed(context, '/');
          },
          icon: const Icon(Icons.home_outlined),
          label: Text(t.t('nav.home')),
        ),
      ],
    );
  }
}
