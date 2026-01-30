import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../shared/models/category.dart';
import '../../core/di/service_locator.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/providers/language_provider.dart';
import '../../core/providers/favorites_provider.dart';
import '../../core/providers/theme_provider.dart';
import '../../shared/widgets/language_selector.dart';
import '../categories/category_service.dart';
import '../categories/category_signs_screen.dart';
import '../favorites/favorites_screen.dart';
import '../search/search_screen.dart';
import '../quiz/quiz_screen.dart';
import '../statistics/statistics_screen.dart';
import '../lessons/lessons_list_screen.dart';
import '../exam/exam_screen.dart';
import '../auth/presentation/bloc/auth_bloc.dart';
import '../auth/presentation/bloc/auth_event.dart';

/// Home Screen - Main entry point
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final CategoryService _categoryService = getIt<CategoryService>();
  List<Category> _categories = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final categories = await _categoryService.getAllCategories();
      setState(() {
        _categories = categories;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  /// Show logout confirmation dialog
  void _showLogoutDialog(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(l10n.authLogout),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text(l10n.commonCancel),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              // Dispatch logout event to AuthBloc
              context.read<AuthBloc>().add(LogoutEvent());
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: Text(l10n.authLogout),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.appName),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.bar_chart),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const StatisticsScreen(),
                ),
              );
            },
            tooltip: l10n.navAnalytics,
          ),
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const SearchScreen()),
              );
            },
          ),
          Consumer<FavoritesProvider>(
            builder: (context, favoritesProvider, child) {
              final count = favoritesProvider.favoritesCount;
              return Stack(
                children: [
                  IconButton(
                    icon: const Icon(Icons.favorite),
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const FavoritesScreen(),
                        ),
                      );
                    },
                  ),
                  if (count > 0)
                    Positioned(
                      right: 8,
                      top: 8,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 16,
                          minHeight: 16,
                        ),
                        child: Text(
                          count > 9 ? '9+' : '$count',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
          Consumer<ThemeProvider>(
            builder: (context, themeProvider, child) {
              return IconButton(
                icon: Icon(
                  themeProvider.isDarkMode ? Icons.light_mode : Icons.dark_mode,
                ),
                onPressed: () {
                  themeProvider.toggleTheme();
                },
                tooltip: themeProvider.isDarkMode ? 'Light Mode' : 'Dark Mode',
              );
            },
          ),
          const LanguageSelector(),
          // Logout Button
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => _showLogoutDialog(context),
            tooltip: l10n.authLogout,
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _buildBody(),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const QuizScreen()),
          );
        },
        icon: const Icon(Icons.quiz),
        label: Text(l10n.navPractice),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              'Error loading data',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Text(
                _error!,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _loadCategories,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_categories.isEmpty) {
      return const Center(child: Text('No categories found'));
    }

    return RefreshIndicator(
      onRefresh: _loadCategories,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _categories.length + 3, // Quick access + title + spacing
        itemBuilder: (context, index) {
          final l10n = AppLocalizations.of(context);

          // Quick Access Section
          if (index == 0) {
            return _buildQuickAccessSection(context);
          }

          // Spacing
          if (index == 1) {
            return const SizedBox(height: 24);
          }

          // Categories Section Title
          if (index == 2) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.navTrafficSigns,
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
              ],
            );
          }

          // Category Items (lazy loaded)
          final categoryIndex = index - 3;
          final category = _categories[categoryIndex];
          final languageCode = context
              .watch<LanguageProvider>()
              .currentLanguage;

          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              leading: CircleAvatar(child: Text('${category.id}')),
              title: Text(category.getName(languageCode)),
              subtitle: category.getDescription(languageCode) != null
                  ? Text(
                      category.getDescription(languageCode)!,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    )
                  : null,
              trailing: const Icon(Icons.arrow_forward_ios, size: 16),
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) =>
                        CategorySignsScreen(category: category),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildQuickAccessSection(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          l10n.navHome,
          style: Theme.of(
            context,
          ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildQuickAccessCard(
                context,
                title: l10n.navLessons,
                subtitle: l10n.navLessons,
                icon: Icons.school,
                color: Colors.blue,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const LessonsListScreen(),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildQuickAccessCard(
                context,
                title: l10n.navExam,
                subtitle: l10n.examStart,
                icon: Icons.quiz,
                color: Colors.green,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const ExamScreen()),
                  );
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildQuickAccessCard(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Card(
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, size: 40, color: color),
              const SizedBox(height: 12),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
