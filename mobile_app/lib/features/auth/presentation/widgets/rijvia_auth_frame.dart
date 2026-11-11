import 'package:flutter/material.dart';

import '../../../../core/constants/app_theme.dart';
import '../../../../core/localization/app_localizations.dart';
import '../../../../shared/widgets/language_selector.dart';
import '../../../../design_system/widgets/rijvia_components.dart';

/// The web AuthPageFrame/AuthShowcasePanel, using the existing native forms.
class RijviaAuthFrame extends StatelessWidget {
  const RijviaAuthFrame({
    super.key,
    required this.page,
    required this.child,
    required this.title,
    this.onBack,
  });
  final String page;
  final String title;
  final Widget child;
  final VoidCallback? onBack;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final fieldBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: BorderSide(color: colors.outline.withValues(alpha: .6)),
    );
    return LayoutBuilder(
      builder: (context, constraints) {
        final wide = constraints.maxWidth >= 1024;
        final prefix = 'auth.${page}_';
        final featureCount = page == 'login' || page == 'forgot' ? 4 : 3;
        final form = SingleChildScrollView(
          padding: EdgeInsets.symmetric(
            horizontal: wide ? 40 : 20,
            vertical: 24,
          ),
          child: Center(
            child: ConstrainedBox(
              constraints: BoxConstraints(
                maxWidth: page == 'register' ? 512 : 448,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      BackButton(
                        onPressed: onBack ?? () => Navigator.maybePop(context),
                      ),
                      const Spacer(),
                      const LanguageSelector(),
                    ],
                  ),
                  if (!wide)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Image.asset(
                            'assets/branding/rijvia-auth-mark.png',
                            width: 40,
                            height: 40,
                          ),
                          const SizedBox(width: 12),
                          Flexible(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  t.appName,
                                  style: theme.textTheme.titleLarge?.copyWith(
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                                Text(
                                  t.t('auth.mobile_brand_caption'),
                                  style: theme.textTheme.bodySmall,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  DecoratedBox(
                    decoration: BoxDecoration(
                      color: colors.surface,
                      borderRadius: BorderRadius.circular(32),
                      border: Border.all(
                        color: colors.outline.withValues(alpha: .6),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: .08),
                          blurRadius: 40,
                          offset: const Offset(0, 12),
                        ),
                      ],
                    ),
                    child: Theme(
                      data: theme.copyWith(
                        inputDecorationTheme: theme.inputDecorationTheme
                            .copyWith(
                              border: fieldBorder,
                              enabledBorder: fieldBorder,
                              focusedBorder: fieldBorder.copyWith(
                                borderSide: BorderSide(
                                  color: colors.primary,
                                  width: 2,
                                ),
                              ),
                            ),
                        elevatedButtonTheme: ElevatedButtonThemeData(
                          style: ElevatedButton.styleFrom(
                            minimumSize: const Size(80, 48),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                        ),
                        filledButtonTheme: FilledButtonThemeData(
                          style: FilledButton.styleFrom(
                            minimumSize: const Size(80, 48),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Padding(
                            padding: const EdgeInsetsDirectional.fromSTEB(
                              24,
                              24,
                              24,
                              8,
                            ),
                            child: Text(
                              title,
                              style: theme.textTheme.headlineSmall?.copyWith(
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                          child,
                        ],
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(top: 16),
                    child: Text(
                      '© ${DateTime.now().year} ${t.appName}. ${t.t('auth.copyright')}',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodySmall,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
        return ColoredBox(
          color: colors.surfaceContainerHigh,
          child: Row(
            children: [
              if (wide)
                SizedBox(
                  width:
                      constraints.maxWidth *
                      (constraints.maxWidth >= 1280 ? .4 : .42),
                  child: _AuthShowcase(
                    prefix: prefix,
                    page: page,
                    featureCount: featureCount,
                  ),
                ),
              Expanded(child: form),
            ],
          ),
        );
      },
    );
  }
}

class _AuthShowcase extends StatelessWidget {
  const _AuthShowcase({
    required this.prefix,
    required this.page,
    required this.featureCount,
  });
  final String prefix;
  final String page;
  final int featureCount;
  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    BoxDecoration glass({double radius = 20, Color? color}) => BoxDecoration(
      color: color ?? Colors.white.withValues(alpha: .08),
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(color: Colors.white.withValues(alpha: .12)),
    );
    return LayoutBuilder(
      builder: (context, box) => DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            stops: [0, .42, 1],
            colors: [
              AppColors.secondary,
              AppColors.secondary,
              AppColors.primary,
            ],
          ),
        ),
        child: SingleChildScrollView(
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: box.maxHeight),
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: DefaultTextStyle(
                style: const TextStyle(
                  fontFamily: AppTheme.fontFamily,
                  color: Colors.white,
                  fontWeight: FontWeight.w500,
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Container(
                      decoration: glass(radius: 25),
                      padding: const EdgeInsets.all(14),
                      child: Row(
                        children: [
                          Container(
                            width: 48,
                            height: 48,
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white.withValues(alpha: .95),
                              border: Border.all(
                                width: 2,
                                color: AppColors.primary.withValues(alpha: .35),
                              ),
                            ),
                            child: ClipOval(
                              child: Image.asset(
                                'assets/branding/rijvia-auth-mark.png',
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  t.appName,
                                  style: const TextStyle(
                                    fontSize: 23,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  t.t('auth.showcase_brand_caption'),
                                  style: const TextStyle(
                                    fontSize: 14,
                                    height: 1.3,
                                    color: Colors.white70,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 28),
                    Align(
                      alignment: AlignmentDirectional.centerStart,
                      child: Container(
                        decoration: glass(radius: 100),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        child: Text(
                          t.t(
                            '${page == 'reset' ? 'auth.forgot_' : prefix}panel_badge',
                          ),
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      t.t('${prefix}panel_heading'),
                      style: const TextStyle(
                        fontSize: 48,
                        fontWeight: FontWeight.w900,
                        height: 1.02,
                      ),
                    ),
                    Text(
                      t.t('${prefix}panel_heading2'),
                      style: const TextStyle(
                        fontSize: 48,
                        fontWeight: FontWeight.w900,
                        height: 1.02,
                        color: Colors.white70,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      t.t('${prefix}panel_subtitle'),
                      style: const TextStyle(
                        fontSize: 15,
                        height: 1.6,
                        color: Colors.white70,
                      ),
                    ),
                    const SizedBox(height: 20),
                    RijviaAdaptiveGrid(
                      minCellWidth: 200,
                      maxColumns: 2,
                      maxCellWidth: double.infinity,
                      children: [
                        for (var i = 1; i <= featureCount; i++)
                          Container(
                            decoration: glass(),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 12,
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: 36,
                                  height: 36,
                                  decoration: glass(
                                    radius: 16,
                                    color: Colors.white.withValues(alpha: .12),
                                  ),
                                  child: Icon(
                                    [
                                      Icons.menu_book_outlined,
                                      Icons.bar_chart_outlined,
                                      Icons.emoji_events_outlined,
                                      Icons.shield_outlined,
                                    ][i - 1],
                                    size: 16,
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    t.t('${prefix}feat_$i'),
                                    style: const TextStyle(
                                      fontSize: 13,
                                      height: 1.65,
                                      color: Colors.white70,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Container(
                      decoration: glass(
                        color: Colors.black.withValues(alpha: .15),
                      ),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 12,
                      ),
                      child: Text(
                        t.t('auth.panel_learners_text'),
                        style: const TextStyle(
                          fontSize: 13,
                          height: 1.65,
                          color: Colors.white70,
                        ),
                      ),
                    ),
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
