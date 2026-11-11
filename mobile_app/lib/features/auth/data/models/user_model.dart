import '../../domain/entities/user.dart';

/// User Model (DTO) for API communication
/// Handles JSON serialization/deserialization
class UserModel {
  final String id;
  final String? username;
  final String email;
  final String? name;
  final String? phone;
  final String? createdAt;
  final String? role;
  final String? preferredLanguage;
  final bool? isActive;
  final bool? emailVerified;
  final List<String> linkedProviders;
  final bool googleLinked;

  UserModel({
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

  /// From JSON
  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      username: json['username']?.toString(),
      email: json['email'] ?? '',
      name: json['name'] ?? json['fullName'],
      phone: json['phone'],
      createdAt: json['createdAt'],
      role: json['role']?.toString(),
      preferredLanguage: json['preferredLanguage']?.toString(),
      isActive: json['isActive'] as bool?,
      emailVerified: json['emailVerified'] as bool?,
      linkedProviders:
          (json['linkedProviders'] as List?)
              ?.whereType<Object>()
              .map((value) => value.toString())
              .toList(growable: false) ??
          const [],
      googleLinked: json['googleLinked'] == true,
    );
  }

  /// To JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'name': name,
      'phone': phone,
      'createdAt': createdAt,
      'role': role,
      'preferredLanguage': preferredLanguage,
      'isActive': isActive,
      'emailVerified': emailVerified,
      'linkedProviders': linkedProviders,
      'googleLinked': googleLinked,
    };
  }

  /// Convert to domain entity
  User toEntity() {
    return User(
      id: id,
      username: username,
      email: email,
      name: name,
      phone: phone,
      createdAt: createdAt != null ? DateTime.tryParse(createdAt!) : null,
      role: role,
      preferredLanguage: preferredLanguage,
      isActive: isActive,
      emailVerified: emailVerified,
      linkedProviders: linkedProviders,
      googleLinked: googleLinked,
    );
  }
}
