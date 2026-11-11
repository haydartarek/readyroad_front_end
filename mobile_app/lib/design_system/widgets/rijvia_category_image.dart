import 'package:flutter/material.dart';

import '../../core/constants/api_constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../shared/models/content_item.dart';

class RijviaCategoryImage extends StatelessWidget {
  const RijviaCategoryImage({
    super.key,
    required this.sign,
    required this.label,
  });
  final ContentItem? sign;
  final String label;

  @override
  Widget build(BuildContext context) =>
      RijviaSignImage(url: sign?.imageUrl, label: label);
}

/// Preserve the legal sign shape; the fallback never impersonates a road sign.
class RijviaSignImage extends StatelessWidget {
  const RijviaSignImage({
    super.key,
    required this.url,
    required this.label,
    this.size = 72,
  });
  final String? url;
  final String label;
  final double size;

  @override
  Widget build(BuildContext context) {
    final resolved = ApiConstants.resolveMediaUrl(url);
    Widget fallback() => RijviaImagePlaceholder(label: label);
    return SizedBox.square(
      dimension: size,
      child: resolved == null
          ? fallback()
          : Image.network(
              resolved,
              fit: BoxFit.contain,
              semanticLabel: label,
              errorBuilder: (_, _, _) => fallback(),
            ),
    );
  }
}

class RijviaImagePlaceholder extends StatelessWidget {
  const RijviaImagePlaceholder({super.key, this.label});
  final String? label;

  @override
  Widget build(BuildContext context) {
    final text = AppLocalizations.of(context).t('media.image_unavailable');
    final colors = Theme.of(context).colorScheme;
    return Tooltip(
      message: label == null ? text : '$label: $text',
      child: Semantics(
        image: true,
        label: label == null ? text : '$label: $text',
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: colors.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: colors.outlineVariant),
          ),
          child: Center(
            child: Icon(
              Icons.image_outlined,
              size: 28,
              color: colors.onSurfaceVariant,
            ),
          ),
        ),
      ),
    );
  }
}
