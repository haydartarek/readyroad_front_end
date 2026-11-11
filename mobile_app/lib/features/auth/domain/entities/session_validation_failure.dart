/// Why a persisted session could not be revalidated against the server.
/// This is distinct from a server-confirmed invalid session (HTTP 401).
enum SessionValidationIssue {
  offline,
  serverUnavailable,
  forbidden,
  unexpected,
}

class SessionValidationFailure implements Exception {
  final SessionValidationIssue issue;
  const SessionValidationFailure(this.issue);

  @override
  String toString() => 'Session validation unavailable: ${issue.name}';
}
