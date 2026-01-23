/// Generic Content Item Model
/// 
/// LAW #5 - DELIBERATE IGNORANCE
/// This model is content-agnostic. It can represent:
/// - Traffic Signs
/// - Math Questions
/// - Medical Content
/// - Any future content type
/// 
/// The mobile app MUST NOT know what domain it's displaying.
class ContentItem {
  final int id;
  final String code;
  final String nameEn;
  final String nameAr;
  final String nameNl;
  final String nameFr;
  final String? descriptionEn;
  final String? descriptionAr;
  final String? descriptionNl;
  final String? descriptionFr;
  final String? imageUrl;
  final String? categoryCode;
  final String? contentType; // 'traffic_sign', 'math', 'medical', etc. (for UI hints only)

  ContentItem({
    required this.id,
    required this.code,
    required this.nameEn,
    required this.nameAr,
    required this.nameNl,
    required this.nameFr,
    this.descriptionEn,
    this.descriptionAr,
    this.descriptionNl,
    this.descriptionFr,
    this.imageUrl,
    this.categoryCode,
    this.contentType,
  });

  /// Get name by language code
  String getName(String languageCode) {
    switch (languageCode) {
      case 'ar':
        return nameAr;
      case 'nl':
        return nameNl;
      case 'fr':
        return nameFr;
      default:
        return nameEn;
    }
  }

  /// Get description by language code
  String? getDescription(String languageCode) {
    switch (languageCode) {
      case 'ar':
        return descriptionAr;
      case 'nl':
        return descriptionNl;
      case 'fr':
        return descriptionFr;
      default:
        return descriptionEn;
    }
  }

  /// From JSON
  factory ContentItem.fromJson(Map<String, dynamic> json) {
    return ContentItem(
      id: json['id'] as int,
      code: json['signCode'] as String? ?? json['code'] as String? ?? '',
      nameEn: json['nameEn'] as String? ?? '',
      nameAr: json['nameAr'] as String? ?? '',
      nameNl: json['nameNl'] as String? ?? '',
      nameFr: json['nameFr'] as String? ?? '',
      descriptionEn: json['descriptionEn'] as String?,
      descriptionAr: json['descriptionAr'] as String?,
      descriptionNl: json['descriptionNl'] as String?,
      descriptionFr: json['descriptionFr'] as String?,
      imageUrl: json['imageUrl'] as String?,
      categoryCode: json['categoryCode'] as String?,
      contentType: json['contentType'] as String?,
    );
  }

  /// To JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'code': code,
      'nameEn': nameEn,
      'nameAr': nameAr,
      'nameNl': nameNl,
      'nameFr': nameFr,
      'descriptionEn': descriptionEn,
      'descriptionAr': descriptionAr,
      'descriptionNl': descriptionNl,
      'descriptionFr': descriptionFr,
      'imageUrl': imageUrl,
      'categoryCode': categoryCode,
      'contentType': contentType,
    };
  }

  /// Equality check for collections and favorites
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ContentItem &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;

  /// Copy with method for immutability
  ContentItem copyWith({
    int? id,
    String? code,
    String? nameEn,
    String? nameAr,
    String? nameNl,
    String? nameFr,
    String? descriptionEn,
    String? descriptionAr,
    String? descriptionNl,
    String? descriptionFr,
    String? imageUrl,
    String? categoryCode,
    String? contentType,
  }) {
    return ContentItem(
      id: id ?? this.id,
      code: code ?? this.code,
      nameEn: nameEn ?? this.nameEn,
      nameAr: nameAr ?? this.nameAr,
      nameNl: nameNl ?? this.nameNl,
      nameFr: nameFr ?? this.nameFr,
      descriptionEn: descriptionEn ?? this.descriptionEn,
      descriptionAr: descriptionAr ?? this.descriptionAr,
      descriptionNl: descriptionNl ?? this.descriptionNl,
      descriptionFr: descriptionFr ?? this.descriptionFr,
      imageUrl: imageUrl ?? this.imageUrl,
      categoryCode: categoryCode ?? this.categoryCode,
      contentType: contentType ?? this.contentType,
    );
  }
}
