/// Traffic Sign Model
class TrafficSign {
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

  TrafficSign({
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
  factory TrafficSign.fromJson(Map<String, dynamic> json) {
    return TrafficSign(
      id: json['id'] as int,
      code: json['signCode'] as String? ?? '',
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
    );
  }

  /// To JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'signCode': code,
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
    };
  }
}

