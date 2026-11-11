import 'package:flutter/material.dart';
import 'video_player_stub.dart'
    if (dart.library.js_interop) 'video_player_web.dart'
    as platform;

/// YouTube stays inside a dialog on Flutter Web, as in the source gallery.
class RijviaVideoPlayer extends StatelessWidget {
  const RijviaVideoPlayer({
    super.key,
    required this.url,
    required this.title,
    required this.onOpenExternal,
  });
  final String url, title;
  final VoidCallback onOpenExternal;
  @override
  Widget build(BuildContext context) =>
      platform.player(url, title, onOpenExternal);
}
