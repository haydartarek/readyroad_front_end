import 'package:flutter/material.dart';

Widget player(String url, String title, VoidCallback onOpenExternal) => Center(
  child: IconButton.filled(
    tooltip: title,
    onPressed: onOpenExternal,
    icon: const Icon(Icons.play_arrow),
    iconSize: 48,
  ),
);
