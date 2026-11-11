import 'package:url_launcher/url_launcher.dart';
import '../../core/providers/language_provider.dart';
import '../../features/auth/presentation/bloc/auth_event.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/localization/app_localizations.dart';
import '../../core/providers/theme_provider.dart';
import '../../features/auth/presentation/bloc/auth_bloc.dart';
import '../../features/auth/presentation/bloc/auth_state.dart';
import '../../features/notifications/notification_button.dart';
import '../../features/profile/account_menu.dart';
import '../../shared/widgets/language_selector.dart';

const rijviaPrimaryLinks = <(String, String)>[
  ('nav.home', '/'),
  ('nav.lessons', '/lessons'),
  ('nav.traffic_signs', '/traffic-signs'),
  ('nav.practice', '/practice'),
  ('nav.exam', '/exam'),
  ('nav.videos', '/videos'),
  ('nav.blog', '/blog'),
];

class RijviaWebNavbar extends StatelessWidget {
  const RijviaWebNavbar({super.key, this.account, this.notifications});
  final Widget? account;
  final Widget? notifications;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final colors = Theme.of(context).colorScheme;
    final state = context.watch<AuthBloc>().state;
    final signedIn = state is Authenticated;
    final currentPath =
        Uri.tryParse(ModalRoute.of(context)?.settings.name ?? '/')?.path ?? '/';
    final width =
        MediaQuery.sizeOf(context).width /
        MediaQuery.textScalerOf(context).scale(1);
    return SafeArea(
      bottom: false,
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1560),
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: colors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: colors.outline.withValues(alpha: .6)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: .03),
                    blurRadius: 8,
                  ),
                ],
              ),
              child: SizedBox(
                height: 58,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: Row(
                    children: [
                      Semantics(
                        label: t.appName,
                        button: true,
                        child: InkWell(
                          onTap: () => _go(context, '/'),
                          borderRadius: BorderRadius.circular(12),
                          child: SizedBox(
                            width: width < 360
                                ? 72
                                : width < 640
                                ? 100
                                : 132,
                            height: 44,
                            child: Image.asset(
                              Theme.of(context).brightness == Brightness.dark
                                  ? 'assets/branding/rijvia-wordmark-dark.png'
                                  : 'assets/branding/rijvia-wordmark.png',
                              fit: BoxFit.contain,
                            ),
                          ),
                        ),
                      ),
                      if (width >= 1280) ...[
                        const SizedBox(width: 16),
                        for (final link in rijviaPrimaryLinks)
                          Flexible(
                            child: TextButton(
                              style: TextButton.styleFrom(
                                foregroundColor: colors.onSurfaceVariant,
                                textStyle: TextStyle(
                                  fontFamily: 'Tajawal',
                                  fontWeight:
                                      (link.$2 == '/'
                                          ? currentPath == '/'
                                          : currentPath.startsWith(link.$2))
                                      ? FontWeight.w700
                                      : FontWeight.w500,
                                ),
                              ),
                              onPressed: () => _go(context, link.$2),
                              child: Text(
                                t.t(
                                  link.$1 == 'nav.blog'
                                      ? 'nav.blog'
                                      : link.$1.replaceFirst(
                                          'nav.',
                                          'nav.compact_',
                                        ),
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ),
                      ],
                      const Spacer(),
                      if (width >= 640) ...[
                        IconButton(
                          tooltip: t.commonSearch,
                          onPressed: () => _go(context, '/search'),
                          icon: const Icon(Icons.search, size: 20),
                        ),
                        IconButton(
                          tooltip: t.t(
                            context.watch<ThemeProvider>().isDarkMode
                                ? 'theme.light'
                                : 'theme.dark',
                          ),
                          onPressed: context.read<ThemeProvider>().toggleTheme,
                          icon: Icon(
                            context.watch<ThemeProvider>().isDarkMode
                                ? Icons.light_mode_outlined
                                : Icons.dark_mode_outlined,
                            size: 20,
                          ),
                        ),
                      ],
                      const SizedBox.square(
                        dimension: 48,
                        child: LanguageSelector(),
                      ),
                      if (signedIn)
                        SizedBox.square(
                          dimension: 48,
                          child: notifications ?? const NotificationButton(),
                        ),
                      if (!signedIn && width >= 1280) ...[
                        IconButton(
                          tooltip: t.t('auth.login'),
                          onPressed: () => _go(context, '/login'),
                          icon: const Icon(Icons.login, size: 20),
                        ),
                        IconButton.filled(
                          tooltip: t.t('auth.register'),
                          onPressed: () => _go(context, '/register'),
                          icon: const Icon(
                            Icons.person_add_alt_outlined,
                            size: 20,
                          ),
                        ),
                      ] else
                        SizedBox.square(
                          dimension: 48,
                          child: account ?? const RijviaAccountMenu(),
                        ),
                      if (width < 1280)
                        IconButton(
                          tooltip: t.t('nav.open_menu'),
                          icon: const Icon(Icons.menu, size: 20),
                          onPressed: () => _menu(context),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  static void _go(BuildContext context, String path) {
    if (ModalRoute.of(context)?.settings.name != path) {
      Navigator.of(context).pushNamed(path);
    }
  }

  static Future<void> _menu(BuildContext context) async {
    final t = AppLocalizations.of(context);
    final auth = context.read<AuthBloc>().state;
    final current =
        Uri.tryParse(ModalRoute.of(context)?.settings.name ?? '/')?.path ?? '/';
    final displayName = auth is Authenticated
        ? auth.user.name ?? auth.user.username ?? t.appName
        : t.appName;
    final links = [...rijviaPrimaryLinks];
    final accountLinks = auth is Authenticated
        ? [
            if (auth.user.role == 'ADMIN')
              ('admin.sidebar.panel_title', '/admin/dashboard'),
            ('nav.profile', '/dashboard?section=profile'),
            ('auth.logout', '__logout'),
          ]
        : [('auth.login', '/login'), ('auth.register', '/register')];
    final selected = await showGeneralDialog<String>(
      context: context,
      barrierDismissible: true,
      barrierLabel: t.t('common.close'),
      barrierColor: const Color(0x552c3e50),
      pageBuilder: (context, animation, secondary) {
        final colors = Theme.of(context).colorScheme;
        return Padding(
          padding: EdgeInsets.only(
            top: 75 + MediaQuery.viewPaddingOf(context).top,
          ),
          child: Material(
            color: colors.surface,
            child: SafeArea(
              top: false,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: colors.primary.withValues(alpha: .1),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Icon(Icons.menu, color: colors.primary),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    t.t('nav.open_menu'),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                  Text(
                                    displayName,
                                    style: Theme.of(
                                      context,
                                    ).textTheme.bodySmall,
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              tooltip: t.t('common.close'),
                              onPressed: () => Navigator.pop(context),
                              icon: const Icon(Icons.close),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Align(
                          alignment: AlignmentDirectional.centerStart,
                          child: IconButton.filledTonal(
                            tooltip: t.t(
                              Theme.of(context).brightness == Brightness.dark
                                  ? 'nav.theme_light'
                                  : 'nav.theme_dark',
                            ),
                            onPressed: context
                                .read<ThemeProvider>()
                                .toggleTheme,
                            icon: Icon(
                              Theme.of(context).brightness == Brightness.dark
                                  ? Icons.light_mode_outlined
                                  : Icons.dark_mode_outlined,
                            ),
                          ),
                        ),
                        if (auth is Authenticated) ...[
                          const SizedBox(height: 16),
                          ListTile(
                            contentPadding: const EdgeInsets.all(12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(24),
                              side: BorderSide(color: colors.outline),
                            ),
                            leading: CircleAvatar(
                              backgroundColor: colors.secondary,
                              foregroundColor: colors.onSecondary,
                              child: Text(
                                displayName.isEmpty
                                    ? ''
                                    : displayName.characters.first
                                          .toUpperCase(),
                              ),
                            ),
                            title: Text(displayName),
                            subtitle: Text(
                              auth.user.email,
                              textDirection: TextDirection.ltr,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const Divider(height: 1),
                  Expanded(
                    child: ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        for (final link in links)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: ListTile(
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 20,
                                vertical: 8,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(25),
                                side: BorderSide(color: colors.outline),
                              ),
                              tileColor:
                                  (link.$2 == '/'
                                      ? current == '/'
                                      : current.startsWith(link.$2))
                                  ? colors.primary.withValues(alpha: .07)
                                  : colors.surface,
                              title: Text(t.t(link.$1)),
                              trailing: Icon(
                                Icons.circle,
                                size: 10,
                                color:
                                    (link.$2 == '/'
                                        ? current == '/'
                                        : current.startsWith(link.$2))
                                    ? colors.primary
                                    : colors.outline,
                              ),
                              onTap: () => Navigator.pop(context, link.$2),
                            ),
                          ),
                        const SizedBox(height: 16),
                        for (final link in accountLinks)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(21),
                                side: BorderSide(color: colors.outline),
                              ),
                              leading: Icon(
                                link.$2 == '__logout'
                                    ? Icons.logout
                                    : link.$2.startsWith('/admin')
                                    ? Icons.admin_panel_settings_outlined
                                    : Icons.person_outline,
                                color: link.$2 == '__logout'
                                    ? colors.error
                                    : colors.onSurfaceVariant,
                              ),
                              title: Text(t.t(link.$1)),
                              onTap: () => Navigator.pop(context, link.$2),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
    if (selected != null && context.mounted) {
      if (selected == '__logout') {
        context.read<AuthBloc>().add(LogoutEvent());
      } else {
        _go(context, selected);
      }
    }
  }
}

class RijviaWebFooter extends StatelessWidget {
  const RijviaWebFooter({super.key});
  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final colors = Theme.of(context).colorScheme;
    final state = context.watch<AuthBloc>().state;
    final accountLinks = state is Authenticated
        ? [
            ('nav.dashboard', '/dashboard'),
            ('home.footer.profile', '/dashboard?section=profile'),
            ('home.footer.progress', '/dashboard?section=exam-results'),
          ]
        : [
            ('home.footer.login', '/login'),
            ('home.footer.register', '/register'),
            ('auth.forgot_password', '/forgot-password'),
            ('home.footer.support', '/contact'),
          ];
    Widget links(String title, List<(String, String)> links) => Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(t.t(title), style: Theme.of(context).textTheme.titleSmall),
        const SizedBox(height: 12),
        for (final link in links)
          TextButton(
            onPressed: () => RijviaWebNavbar._go(context, link.$2),
            child: Align(
              alignment: AlignmentDirectional.centerStart,
              child: Text(t.t(link.$1)),
            ),
          ),
        if (title == 'home.footer.col_account' && state is Authenticated)
          TextButton(
            onPressed: () => context.read<AuthBloc>().add(LogoutEvent()),
            child: Align(
              alignment: AlignmentDirectional.centerStart,
              child: Text(t.t('home.footer.logout')),
            ),
          ),
      ],
    );
    final brand = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Image.asset(
          Theme.of(context).brightness == Brightness.dark
              ? 'assets/branding/rijvia-wordmark-dark.png'
              : 'assets/branding/rijvia-wordmark.png',
          height: 60,
          width: 180,
        ),
        const SizedBox(height: 12),
        Text(
          t.t('home.footer.description'),
          style: const TextStyle(fontSize: 13, height: 1.85),
        ),
        const SizedBox(height: 12),
        Text(
          t.t('home.footer.disclaimer'),
          style: TextStyle(color: colors.onSurfaceVariant, fontSize: 14),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final social in [
              (
                'facebook',
                'https://www.facebook.com/profile.php?id=61559077906506',
                Icons.facebook,
              ),
              (
                'instagram',
                'https://www.instagram.com/a.rib.0/',
                Icons.camera_alt_outlined,
              ),
              (
                'youtube',
                'https://www.youtube.com/channel/UCs_IDQXCz6zADuHIdfS2C2w',
                Icons.play_circle_outline,
              ),
              (
                'tiktok',
                'https://www.tiktok.com/@trijbewijs',
                Icons.music_note_outlined,
              ),
            ])
              IconButton(
                tooltip: t.t('home.footer.social_${social.$1}'),
                onPressed: () async {
                  try {
                    await launchUrl(
                      Uri.parse(social.$2),
                      mode: LaunchMode.externalApplication,
                    );
                  } catch (_) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(t.t('wire.open_link_error'))),
                      );
                    }
                  }
                },
                icon: Icon(social.$3),
              ),
          ],
        ),
      ],
    );
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: colors.surfaceContainerHigh.withValues(alpha: .5),
        border: Border(
          top: BorderSide(color: colors.outline.withValues(alpha: .6)),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          LayoutBuilder(
            builder: (context, box) {
              final columns = box.maxWidth >= 768
                  ? 4
                  : box.maxWidth >= 500
                  ? 2
                  : 1;
              final width = (box.maxWidth - 24 * (columns - 1)) / columns;
              return Wrap(
                spacing: 24,
                runSpacing: 24,
                children: [
                  for (final column in [
                    brand,
                    links('home.footer.col_learn', [
                      ('home.footer.exam_sim', '/exam'),
                      ('home.footer.practice', '/practice'),
                      ('home.footer.lessons', '/lessons'),
                      ('home.footer.road_signs', '/traffic-signs'),
                    ]),
                    links('home.footer.col_account', accountLinks),
                    links('home.footer.col_popular', [
                      ('home.footer.right_of_way', '/lessons/les-19'),
                      ('home.footer.speed_limits', '/lessons/les-3'),
                      (
                        'home.footer.priority_signs',
                        '/traffic-signs?category=B',
                      ),
                      ('lessons.page_title', '/lessons'),
                    ]),
                  ])
                    SizedBox(width: width, child: column),
                ],
              );
            },
          ),
          const SizedBox(height: 24),
          Wrap(
            alignment: WrapAlignment.center,
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final link in [
                ('home.footer.about', '/about'),
                ('home.footer.faq', '/faq'),
                ('home.footer.privacy', '/privacy-policy'),
                ('home.footer.cookies', '/cookie-policy'),
                ('home.footer.terms', '/terms'),
                ('home.footer.disclaimer_link', '/disclaimer'),
                ('home.footer.contact', '/contact'),
              ])
                TextButton(
                  onPressed: () => RijviaWebNavbar._go(context, link.$2),
                  child: Text(t.t(link.$1)),
                ),
            ],
          ),
          Center(
            child: SizedBox(
              width: 280,
              child: Consumer<LanguageProvider>(
                builder: (context, language, _) =>
                    DropdownButtonFormField<String>(
                      isExpanded: true,
                      itemHeight: null,
                      initialValue: language.currentLanguage,
                      key: ValueKey(language.currentLanguage),
                      decoration: InputDecoration(
                        labelText: t.t('home.footer.language'),
                        prefixIcon: const Icon(Icons.language),
                      ),
                      items: [
                        for (final option in language.supportedLanguages)
                          DropdownMenuItem(
                            value: option.code,
                            child: Text(option.name),
                          ),
                      ],
                      onChanged: (value) {
                        if (value != null) language.setLanguage(value);
                      },
                    ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            '© ${DateTime.now().year} RijVia. ${t.t('home.footer.operator')} ${t.t('home.footer.rights')}',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: colors.onSurfaceVariant,
              fontSize: 12,
              height: 1.6,
            ),
          ),
        ],
      ),
    );
  }
}
