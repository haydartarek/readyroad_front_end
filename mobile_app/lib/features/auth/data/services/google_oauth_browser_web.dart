import 'dart:js_interop';

@JS('sessionStorage')
external _SessionStorage get _storage;
@JS('history')
external _History get _history;

extension type _SessionStorage(JSObject _) implements JSObject {
  external String? getItem(String key);
  external void setItem(String key, String value);
  external void removeItem(String key);
}

extension type _History(JSObject _) implements JSObject {
  external void replaceState(JSAny? data, String title, String url);
}

/// Temporary PKCE values belong to this tab and are consumed once on return.
class GoogleOAuthBrowser {
  static const _key = 'rijvia_google_oauth_pending';
  bool get supported => true;
  String? readPending() => _storage.getItem(_key);
  void savePending(String value) => _storage.setItem(_key, value);
  void clearPending() => _storage.removeItem(_key);
  void clearCallbackUrl() => _history.replaceState(null, '', '/');
}
