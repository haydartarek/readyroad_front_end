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
    return AuthResponseModel(
      accessToken: json['accessToken'] ?? json['token'] ?? '',
      refreshToken: json['refreshToken'],
      user: json['user'] ?? {},
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
