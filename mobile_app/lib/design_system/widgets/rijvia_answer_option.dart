import 'package:flutter/material.dart';

enum RijviaAnswerState { idle, selected, correct, incorrect, neutral }

/// Mirrors web_app's ExamOptionCard: option identity and feedback are distinct.
class RijviaAnswerOption extends StatelessWidget {
  const RijviaAnswerOption({
    super.key,
    required this.index,
    required this.text,
    required this.onSelect,
    this.state = RijviaAnswerState.idle,
  });

  final int index;
  final String text;
  final VoidCallback? onSelect;
  final RijviaAnswerState state;

  String get label => index < 3 ? const ['A', 'B', 'C'][index] : '${index + 1}';

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    // sRGB values from the installed web Tailwind palette, not brand overrides.
    final palette = const [
      [
        Color(0xFFECFDF5),
        Color(0xFFA4F4CF),
        Color(0xFF5EE9B5),
        Color(0xFFD0FAE5),
        Color(0xFF006045),
      ],
      [
        Color(0xFFFFFBEB),
        Color(0xFFFEE685),
        Color(0xFFFFD230),
        Color(0xFFFEF3C6),
        Color(0xFF973C00),
      ],
      [
        Color(0xFFFFF1F2),
        Color(0xFFFFCCD3),
        Color(0xFFFFA1AD),
        Color(0xFFFFE4E6),
        Color(0xFFA50036),
      ],
    ][index.clamp(0, 2)];
    final primary = theme.colorScheme.primary;
    final selected = state == RijviaAnswerState.selected;
    final correct = state == RijviaAnswerState.correct;
    final incorrect = state == RijviaAnswerState.incorrect;
    final feedback = correct || incorrect;
    final badgeSize =
        36.0 +
        (MediaQuery.textScalerOf(context).scale(16) - 16)
            .clamp(0.0, double.infinity)
            .toDouble();
    final accent = correct
        ? const Color(0xFF009966)
        : incorrect
        ? const Color(0xFFE7000B)
        : primary;
    final borderColor = selected
        ? primary
        : correct
        ? const Color(0xFF00D492)
        : incorrect
        ? const Color(0xFFFF6467)
        : state == RijviaAnswerState.neutral
        ? theme.colorScheme.outlineVariant.withValues(alpha: 0.6)
        : palette[1].withValues(alpha: 0.9);
    final badgeBorder = correct
        ? const Color(0xFF00BC7D)
        : incorrect
        ? const Color(0xFFFB2C36)
        : selected
        ? primary
        : palette[2];
    final background = switch (state) {
      RijviaAnswerState.selected => primary.withValues(alpha: 0.10),
      RijviaAnswerState.correct => const Color(0xFFECFDF5),
      RijviaAnswerState.incorrect => const Color(0xFFFEF2F2),
      RijviaAnswerState.neutral => theme.colorScheme.surface,
      _ => Color.alphaBlend(
        palette[0].withValues(
          alpha: theme.brightness == Brightness.dark ? 0.12 : 0.45,
        ),
        theme.colorScheme.surface,
      ),
    };
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Semantics(
        button: true,
        selected: selected,
        enabled: onSelect != null,
        child: Material(
          color: background,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(color: borderColor, width: 2),
          ),
          child: InkWell(
            onTap: onSelect,
            borderRadius: BorderRadius.circular(16),
            child: ConstrainedBox(
              constraints: const BoxConstraints(minHeight: 48),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 12,
                ),
                child: Row(
                  children: [
                    Container(
                      width: badgeSize,
                      height: badgeSize,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: correct
                            ? const Color(0xFF006045)
                            : selected || incorrect
                            ? accent
                            : palette[3],
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: badgeBorder),
                      ),
                      child: Text(
                        label,
                        textDirection: TextDirection.ltr,
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: selected || feedback
                              ? Colors.white
                              : palette[4],
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        text,
                        style: theme.textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: theme.brightness == Brightness.dark && feedback
                              ? const Color(0xFF171717)
                              : theme.colorScheme.onSurface,
                        ),
                      ),
                    ),
                    if (feedback) ...[
                      const SizedBox(width: 8),
                      Icon(
                        correct
                            ? Icons.check_circle_outline
                            : Icons.cancel_outlined,
                        size: 20,
                        color: accent,
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
