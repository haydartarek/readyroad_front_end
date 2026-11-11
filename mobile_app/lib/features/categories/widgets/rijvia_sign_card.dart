import '../../../design_system/rijvia_tokens.dart';
import '../../../design_system/widgets/rijvia_category_image.dart';
import 'package:flutter/material.dart';

import '../../../core/localization/app_localizations.dart';
import '../../../shared/models/content_item.dart';

/// A content-sized card shared by the catalog, category and favorites screens.
class RijviaSignCard extends StatelessWidget {
  const RijviaSignCard({
    super.key,
    required this.item,
    required this.language,
    required this.onTap,
    this.isFavorite = false,
    this.onFavorite,
  });

  final ContentItem item;
  final String language;
  final VoidCallback onTap;
  final bool isFavorite;
  final VoidCallback? onFavorite;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(RijviaDesignLayout.signCardRadius),
        side: BorderSide(color: colors.outlineVariant),
      ),
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                height: 96,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.all(12),
                child: RijviaSignImage(
                  url: item.imageUrl,
                  label: item.getName(language),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                item.getName(language),
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleSmall,
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      item.code,
                      textDirection: TextDirection.ltr,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: colors.onSurfaceVariant,
                      ),
                    ),
                  ),
                  if (onFavorite != null)
                    IconButton(
                      tooltip: AppLocalizations.of(context).t('nav.favorites'),
                      onPressed: onFavorite,
                      icon: Icon(
                        isFavorite ? Icons.favorite : Icons.favorite_border,
                        color: colors.primary,
                      ),
                    )
                  else if (isFavorite)
                    Icon(Icons.favorite, color: colors.primary),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
