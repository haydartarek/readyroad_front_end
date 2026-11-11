import 'dart:js_interop';
import 'package:flutter/material.dart';

extension type _Frame(JSObject _) implements JSObject {
  external void setAttribute(String name, String value);
}
Widget player(
  String url,
  String title,
  VoidCallback onOpenExternal,
) => HtmlElementView.fromTagName(
  tagName: 'iframe',
  onElementCreated: (element) {
    final frame = _Frame(element as JSObject);
    frame.setAttribute('src', url);
    frame.setAttribute('title', title);
    frame.setAttribute('style', 'height:100%;width:100%;border:0');
    frame.setAttribute('loading', 'lazy');
    frame.setAttribute(
      'allow',
      'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
    );
    frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    frame.setAttribute('allowfullscreen', '');
  },
);
