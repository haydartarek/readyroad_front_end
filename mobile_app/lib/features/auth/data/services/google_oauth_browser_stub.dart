class GoogleOAuthBrowser {
  bool get supported => false;
  String? readPending() => null;
  void savePending(String value) =>
      throw UnsupportedError('Google OAuth platform');
  void clearPending() {}
  void clearCallbackUrl() {}
}
