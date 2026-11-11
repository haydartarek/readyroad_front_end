import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../core/localization/app_localizations.dart';
import '../../core/providers/theme_provider.dart';
import '../../design_system/rijvia_tokens.dart';
import '../auth/presentation/bloc/auth_bloc.dart';
import '../auth/presentation/bloc/auth_event.dart';
import '../auth/presentation/bloc/auth_state.dart';

/// Shared account/settings entry for the main learning destinations.
class RijviaAccountMenu extends StatefulWidget {
  const RijviaAccountMenu({super.key});
  @override
  State<RijviaAccountMenu> createState() => _RijviaAccountMenuState();
}

class _RijviaAccountMenuState extends State<RijviaAccountMenu> {
  final _triggerFocus = FocusNode(debugLabel: 'Rijvia account menu');
  final _menuKey = GlobalKey<PopupMenuButtonState<_AccountMenuAction>>();
  bool _focused = false;
  @override
  void dispose() {
    _triggerFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final state = context.watch<AuthBloc>().state;
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          width: 2,
          color: _focused
              ? Theme.of(context).colorScheme.primary
              : Colors.transparent,
        ),
      ),
      child: Focus(
        focusNode: _triggerFocus,
        onFocusChange: (value) {
          if (mounted) setState(() => _focused = value);
        },
        onKeyEvent: (_, event) {
          if (event is KeyDownEvent &&
              (event.logicalKey == LogicalKeyboardKey.enter ||
                  event.logicalKey == LogicalKeyboardKey.space)) {
            _menuKey.currentState?.showButtonMenu();
            return KeyEventResult.handled;
          }
          return KeyEventResult.ignored;
        },
        child: ExcludeFocus(
          child: PopupMenuButton<_AccountMenuAction>(
            key: _menuKey,
            requestFocus: true,
            onOpened: () => _triggerFocus.requestFocus(),
            onCanceled: () => _triggerFocus.requestFocus(),
            icon: const Icon(RijviaIcons.account, size: 20),
            tooltip: t.navProfile,
            onSelected: (action) => _handleMenuAction(context, action),
            itemBuilder: (_) => [
              for (final item in [
                if (state is! Authenticated) ...[
                  (_AccountMenuAction.login, Icons.login, t.t('auth.login')),
                  (
                    _AccountMenuAction.register,
                    Icons.person_add_outlined,
                    t.t('auth.register'),
                  ),
                ] else ...[
                  if (state.user.role == 'ADMIN')
                    (
                      _AccountMenuAction.admin,
                      Icons.admin_panel_settings_outlined,
                      t.t('admin.sidebar.panel_title'),
                    ),
                  (
                    _AccountMenuAction.profile,
                    RijviaIcons.account,
                    t.navProfile,
                  ),
                  (
                    _AccountMenuAction.dashboard,
                    Icons.insights_outlined,
                    t.t('story.progress_title'),
                  ),
                  (
                    _AccountMenuAction.search,
                    Icons.traffic_outlined,
                    t.t('signs.library'),
                  ),
                  (
                    _AccountMenuAction.favorites,
                    Icons.favorite_border,
                    t.t('nav.favorites'),
                  ),
                  (
                    _AccountMenuAction.theme,
                    Icons.brightness_6_outlined,
                    context.read<ThemeProvider>().isDarkMode
                        ? t.t('theme.light')
                        : t.t('theme.dark'),
                  ),
                  (_AccountMenuAction.logout, Icons.logout, t.authLogout),
                ],
              ])
                PopupMenuItem(
                  value: item.$1,
                  child: ListTile(leading: Icon(item.$2), title: Text(item.$3)),
                ),
            ],
          ),
        ),
      ),
    );
  }

  void _showLogoutDialog(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(l10n.authLogout),
        content: Text(l10n.t('auth.logout_confirm')),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text(l10n.commonCancel),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              context.read<AuthBloc>().add(LogoutEvent());
            },
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            child: Text(l10n.authLogout),
          ),
        ],
      ),
    );
  }

  void _handleMenuAction(BuildContext context, _AccountMenuAction action) {
    _triggerFocus.requestFocus();
    switch (action) {
      case _AccountMenuAction.search:
        _openSearch(context);
      case _AccountMenuAction.favorites:
        Navigator.pushNamed(context, '/traffic-signs/favorites');
      case _AccountMenuAction.dashboard:
        _openDashboard(context);
      case _AccountMenuAction.profile:
        _openProfile(context);
      case _AccountMenuAction.logout:
        _showLogoutDialog(context);
      case _AccountMenuAction.theme:
        context.read<ThemeProvider>().toggleTheme();
      case _AccountMenuAction.login:
        Navigator.pushNamed(context, '/login');
      case _AccountMenuAction.register:
        Navigator.pushNamed(context, '/register');
      case _AccountMenuAction.admin:
        Navigator.pushNamed(context, '/admin/dashboard');
    }
  }

  void _openDashboard(BuildContext context) =>
      Navigator.pushNamed(context, '/dashboard');

  void _openProfile(BuildContext context) =>
      Navigator.pushNamed(context, '/dashboard?section=profile');

  void _openSearch(BuildContext context) =>
      Navigator.pushNamed(context, '/traffic-signs');
}

enum _AccountMenuAction {
  search,
  favorites,
  dashboard,
  profile,
  logout,
  theme,
  login,
  register,
  admin,
}
