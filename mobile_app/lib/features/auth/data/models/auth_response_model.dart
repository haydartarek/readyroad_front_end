/// Auth Response Model (DTO)
/// Handles login/register API responses
class AuthResponseModel {
  final String accessToken;
  final String? refreshToken;
  final Map<String, dynamic> user;

  AuthResponseModel({
    required this.accessToken,
    this.refreshToken,
    required this.user,
  });

  /// From JSON
  factory AuthResponseModel.fromJson(Map<String, dynamic> json) {
    // The Spring Boot API returns a flat AuthResponse. Keep the nested shape
    // internally so the existing domain layer remains stable.
    final nestedUser = json['user'];
    final user = nestedUser is Map<String, dynamic>
        ? nestedUser
        : <String, dynamic>{
            'id': json['userId'],
            'username': json['username'],
            'email': json['email'],
            'fullName': json['fullName'],
            'preferredLanguage': json['preferredLanguage'],
            'role': json['role'],
            'emailVerified': json['emailVerified'],
            'linkedProviders': json['linkedProviders'],
            'googleLinked': json['googleLinked'],
          };
    return AuthResponseModel(
      accessToken: json['accessToken'] ?? json['token'] ?? '',
      refreshToken: json['refreshToken'],
      user: user,
    );
  }

  /// To JSON
  Map<String, dynamic> toJson() {
    return {
      'accessToken': accessToken,
      'refreshToken': refreshToken,
      'user': user,
    };
  }
}
