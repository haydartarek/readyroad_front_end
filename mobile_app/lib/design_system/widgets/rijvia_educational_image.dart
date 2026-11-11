import 'package:flutter/material.dart';

import '../../core/constants/api_constants.dart';
import 'rijvia_category_image.dart';

/// Web frame and image each own their corner clip; contain preserves the layout.
class RijviaEducationalImage extends StatelessWidget {
  const RijviaEducationalImage({
    super.key,
    required this.url,
    required this.radius,
    required this.label,
    this.maxHeight = 420,
    this.frameRadius,
  });
  final String url;
  final String label;
  final double radius;
  final double maxHeight;
  final double? frameRadius;

  @override
  Widget build(BuildContext context) {
    final resolved = ApiConstants.resolveMediaUrl(url);
    return ClipRRect(
      borderRadius: BorderRadius.circular(frameRadius ?? radius),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(
            color: Theme.of(context).colorScheme.outlineVariant,
          ),
          borderRadius: BorderRadius.circular(frameRadius ?? radius),
        ),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(radius),
            child: ConstrainedBox(
              constraints: BoxConstraints(maxHeight: maxHeight),
              child: resolved == null
                  ? SizedBox(
                      height: 96,
                      child: RijviaImagePlaceholder(label: label),
                    )
                  : Image.network(
                      resolved,
                      width: double.infinity,
                      fit: BoxFit.contain,
                      semanticLabel: label,
                      errorBuilder: (_, _, _) => SizedBox(
                        height: 96,
                        child: RijviaImagePlaceholder(label: label),
                      ),
                    ),
            ),
          ),
        ),
      ),
    );
  }
}
