import 'package:flutter/material.dart';

import 'rijvia_web_navigation.dart';

/// Account stays at the physical right; language and notifications share a size.
class RijviaMainHeader extends StatelessWidget implements PreferredSizeWidget {
  const RijviaMainHeader({
    super.key,
    required this.account,
    required this.notifications,
  });
  final Widget account;
  final Widget notifications;

  @override
  Size get preferredSize => const Size.fromHeight(75);

  @override
  Widget build(BuildContext context) {
    return RijviaWebNavbar(account: account, notifications: notifications);
  }
}
