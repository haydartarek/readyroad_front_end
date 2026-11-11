import 'package:flutter/material.dart';

import '../rijvia_tokens.dart';
import 'rijvia_web_navigation.dart';

/// Shared Rijvia header used by feature screens.
///
/// The header only owns presentation. Screen-specific actions and navigation
/// remain supplied by each caller, so this cannot change feature behavior.
class RijviaAppBar extends StatelessWidget implements PreferredSizeWidget {
  const RijviaAppBar({
    super.key,
    this.title,
    this.actions,
    this.leading,
    this.bottom,
    this.automaticallyImplyLeading = true,
    this.centerTitle,
    this.titleSpacing,
    this.showWebNavigation = true,
  });

  final Widget? title;
  final List<Widget>? actions;
  final Widget? leading;
  final PreferredSizeWidget? bottom;
  final bool automaticallyImplyLeading;
  final bool? centerTitle;
  final double? titleSpacing;
  final bool showWebNavigation;

  @override
  Size get preferredSize => Size.fromHeight(
    (showWebNavigation ? 75 : 0) +
        (title != null ||
                leading != null ||
                actions != null ||
                !showWebNavigation
            ? 64
            : 0) +
        (bottom?.preferredSize.height ?? 0),
  );

  @override
  Widget build(BuildContext context) {
    final toolbar = AppBar(
      toolbarHeight: 64,
      title: title,
      actions: actions,
      leading: leading,
      bottom: bottom,
      automaticallyImplyLeading: automaticallyImplyLeading,
      centerTitle:
          centerTitle ??
          MediaQuery.sizeOf(context).width <
              RijviaDesignLayout.compactBreakpoint,
      titleSpacing: titleSpacing,
    );
    if (!showWebNavigation) return toolbar;
    return Column(
      children: [
        const SizedBox(height: 75, child: RijviaWebNavbar()),
        if (title != null ||
            leading != null ||
            actions != null ||
            bottom != null)
          Expanded(child: toolbar),
      ],
    );
  }
}
