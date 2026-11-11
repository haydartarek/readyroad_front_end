import 'package:flutter/material.dart';

/// Native counterpart of Web ResultAnswerBlock, shared by answer reviews.
class RijviaResultAnswerBlock extends StatelessWidget {
  const RijviaResultAnswerBlock({
    super.key,
    required this.label,
    required this.text,
    this.correct,
    this.explanation = false,
    this.marker,
  });
  final String label, text;
  final bool? correct;
  final bool explanation;
  final String? marker;
  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final dark = Theme.of(context).brightness == Brightness.dark;
    final tone = correct == true
        ? const Color(0xff16a34a)
        : correct == false
        ? const Color(0xffef4444)
        : colors.primary;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: tone.withValues(alpha: dark ? .3 : .2)),
        color: tone.withValues(alpha: dark ? .07 : .025),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: colors.surface,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: tone.withValues(alpha: .2)),
                ),
                child: Icon(
                  explanation
                      ? Icons.lightbulb_outline
                      : correct == true
                      ? Icons.check_circle_outline
                      : correct == false
                      ? Icons.cancel_outlined
                      : Icons.lightbulb_outline,
                  size: 16,
                  color: tone,
                ),
              ),
              if (marker != null) ...[
                const SizedBox(width: 8),
                Text(
                  marker!,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ],
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: correct == null ? colors.onSurface : tone,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            text,
            style: const TextStyle(
              fontSize: 14,
              height: 1.75,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
