/// User entity (domain model)
/// Pure business logic, no framework dependencies
class User {
  final String id;
  final String? username;
  final String email;
  final String? name;
  final String? phone;
  final DateTime? createdAt;
  final String? role;
  final String? preferredLanguage;
  final bool? isActive;
  final bool? emailVerified;
  final List<String> linkedProviders;
  final bool googleLinked;

  User({
    required this.id,
    this.username,
    required this.email,
    this.name,
    this.phone,
    this.createdAt,
    this.role,
    this.preferredLanguage,
    this.isActive,
    this.emailVerified,
    this.linkedProviders = const [],
    this.googleLinked = false,
  });

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is User && other.id == id && other.email == email;
  }

  @override
  int get hashCode => id.hashCode ^ email.hashCode;
}
