import '../../domain/entities/user.dart';

/// User Model (DTO) for API communication
/// Handles JSON serialization/deserialization
class UserModel {
  final String id;
  final String email;
  final String? name;
  final String? phone;
  final String? createdAt;

  UserModel({
    required this.id,
    required this.email,
    this.name,
    this.phone,
    this.createdAt,
  });

  /// From JSON
  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      email: json['email'] ?? '',
      name: json['name'],
      phone: json['phone'],
      createdAt: json['createdAt'],
    );
  }

  /// To JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'phone': phone,
      'createdAt': createdAt,
    };
  }

  /// Convert to domain entity
  User toEntity() {
    return User(
      id: id,
      email: email,
      name: name,
      phone: phone,
      createdAt: createdAt != null ? DateTime.tryParse(createdAt!) : null,
    );
  }
}
