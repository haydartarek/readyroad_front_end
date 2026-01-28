/// User entity (domain model)
/// Pure business logic, no framework dependencies
class User {
  final String id;
  final String email;
  final String? name;
  final String? phone;
  final DateTime? createdAt;

  User({
    required this.id,
    required this.email,
    this.name,
    this.phone,
    this.createdAt,
  });

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is User && other.id == id && other.email == email;
  }

  @override
  int get hashCode => id.hashCode ^ email.hashCode;
}
