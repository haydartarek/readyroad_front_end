import 'package:flutter/material.dart';

/// The same responsive media/content columns used by Web FocusedQuestionCard.
class RijviaFocusedQuestionCard extends StatelessWidget {
  const RijviaFocusedQuestionCard({
    super.key,
    required this.title,
    required this.options,
    this.media,
    this.feedback,
    this.footer,
    this.badges,
  });
  final String title;
  final List<Widget> options;
  final Widget? media, feedback, footer, badges;
  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: colors.outline.withValues(alpha: .5)),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: .04), blurRadius: 10),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: LayoutBuilder(
        builder: (context, c) {
          final wide =
              c.maxWidth / MediaQuery.textScalerOf(context).scale(1) >= 1024;
          final content = Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (badges != null && wide) ...[
                badges!,
                const SizedBox(height: 10),
              ],
              Text(
                title,
                textAlign: wide ? TextAlign.start : TextAlign.center,
                style: TextStyle(
                  fontSize: wide ? 21.6 : 18,
                  fontWeight: FontWeight.w900,
                  height: 1.65,
                ),
              ),
              const SizedBox(height: 10),
              ...options,
              if (footer != null) ...[const SizedBox(height: 8), footer!],
              if (feedback != null) ...[const SizedBox(height: 8), feedback!],
            ],
          );
          if (wide && media != null) {
            return Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(flex: 95, child: media!),
                const SizedBox(width: 24),
                Expanded(flex: 105, child: content),
              ],
            );
          }
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (media != null) ...[media!, const SizedBox(height: 12)],
              content,
            ],
          );
        },
      ),
    );
  }
}

class RijviaExamInformation extends StatelessWidget {
  const RijviaExamInformation({
    super.key,
    required this.current,
    required this.total,
    this.seconds,
    this.difficulty,
  });
  final int current, total;
  final int? seconds;
  final String? difficulty;
  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final progress = total > 0 ? (current / total).clamp(0.0, 1.0) : 0.0;
    return Container(
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: colors.surface,
        border: Border.all(color: colors.outline.withValues(alpha: .5)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Directionality(
            textDirection: TextDirection.ltr,
            child: Wrap(
              alignment: WrapAlignment.spaceAround,
              crossAxisAlignment: WrapCrossAlignment.center,
              spacing: 16,
              runSpacing: 8,
              children: [
                Text(
                  '${(progress * 100).round()}%',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    color: colors.primary,
                  ),
                ),
                if (seconds != null)
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.timer_outlined, size: 18),
                      const SizedBox(width: 4),
                      Text(
                        '$seconds s',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          color: seconds! < 5 ? colors.error : colors.onSurface,
                        ),
                      ),
                    ],
                  ),
                if (difficulty != null) Text(difficulty!),
                Text(
                  '$current/$total',
                  semanticsLabel: '$current / $total',
                  style: const TextStyle(fontWeight: FontWeight.w900),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          LinearProgressIndicator(
            value: progress,
            minHeight: 6,
            borderRadius: BorderRadius.circular(12),
          ),
        ],
      ),
    );
  }
}
