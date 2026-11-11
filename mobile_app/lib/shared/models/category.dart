/// Category Model
class Category {
  final int id;
  final String? code;
  final int? signCount;
  final String nameEn;
  final String nameAr;
  final String nameNl;
  final String nameFr;
  final String? descriptionEn;
  final String? descriptionAr;
  final String? descriptionNl;
  final String? descriptionFr;

  Category({
    required this.id,
    this.code,
    this.signCount,
    required this.nameEn,
    required this.nameAr,
    required this.nameNl,
    required this.nameFr,
    this.descriptionEn,
    this.descriptionAr,
    this.descriptionNl,
    this.descriptionFr,
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
  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'],
      code: json['code']?.toString(),
      signCount: (json['signCount'] as num?)?.toInt(),
      nameEn: json['nameEn'],
      nameAr: json['nameAr'],
      nameNl: json['nameNl'],
      nameFr: json['nameFr'],
      descriptionEn: json['descriptionEn'],
      descriptionAr: json['descriptionAr'],
      descriptionNl: json['descriptionNl'],
      descriptionFr: json['descriptionFr'],
    );
  }

  /// To JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      if (code != null) 'code': code,
      if (signCount != null) 'signCount': signCount,
      'nameEn': nameEn,
      'nameAr': nameAr,
      'nameNl': nameNl,
      'nameFr': nameFr,
      'descriptionEn': descriptionEn,
      'descriptionAr': descriptionAr,
      'descriptionNl': descriptionNl,
      'descriptionFr': descriptionFr,
    };
  }
}
