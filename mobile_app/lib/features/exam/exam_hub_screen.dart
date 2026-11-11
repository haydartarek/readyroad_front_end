import '../profile/account_menu.dart';
import 'package:flutter/material.dart';
import '../../core/localization/app_localizations.dart';
import '../../design_system/widgets/rijvia_app_bar.dart';
import '../../design_system/widgets/rijvia_action_card.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_content.dart';
import 'exam_screen.dart';
import 'exam_history_screen.dart';

class ExamHubScreen extends StatelessWidget {
  const ExamHubScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Scaffold(
      appBar: RijviaAppBar(
        title: Text(t.navExam),
        actions: const [RijviaAccountMenu()],
      ),
      body: RijviaScrollFrame(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            RijviaSectionHeading(
              title: t.t('exam.entry.title'),
              subtitle: t.t('exam.entry.subtitle'),
            ),
            RijviaActionCard(
              title: t.examStart,
              subtitle: t.t('wire.exam_hint'),
              icon: Icons.assignment_outlined,
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ExamScreen()),
              ),
            ),
            const SizedBox(height: 12),
            RijviaActionCard(
              title: t.t('exam.results_history_title'),
              icon: Icons.history_outlined,
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ExamHistoryScreen()),
              ),
            ),
            const SizedBox(height: 12),
            RijviaActionCard(
              title: t.t('plans.title'),
              icon: Icons.workspace_premium_outlined,
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const PlansScreen()),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
