import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart' show DateFormat;
import '../../core/di/service_locator.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/network/authenticated_api_client.dart';
import '../../core/providers/language_provider.dart';
import '../../design_system/widgets/rijvia_app_bar.dart';
import '../../features/auth/presentation/widgets/rijvia_auth_field.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_content.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import '../auth/data/services/google_oauth_service.dart';
import '../auth/presentation/bloc/auth_bloc.dart';
import '../auth/presentation/bloc/auth_event.dart';
import '../auth/presentation/bloc/auth_state.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key, this.embedded = false});
  final bool embedded;
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final api = getIt<AuthenticatedApiClient>();
  final fields = {
    for (final key in ['firstName', 'lastName', 'email', 'username'])
      key: TextEditingController(),
  };
  final formKey = GlobalKey<FormState>();
  Map<String, dynamic>? profile, stats;
  bool loading = true,
      failed = false,
      statsFailed = false,
      editing = false,
      saving = false,
      deleting = false,
      linking = false;
  int revision = 0;
  @override
  void initState() {
    super.initState();
    load();
  }

  @override
  void dispose() {
    revision++;
    for (final c in fields.values) {
      c.dispose();
    }
    super.dispose();
  }

  void hydrate() {
    final name = (profile?['fullName'] ?? '')
        .toString()
        .trim()
        .split(RegExp(r'\s+'))
        .where((v) => v.isNotEmpty)
        .toList();
    fields['firstName']!.text =
        profile?['firstName']?.toString().isNotEmpty == true
        ? profile!['firstName']
        : name.firstOrNull ?? '';
    fields['lastName']!.text =
        profile?['lastName']?.toString().isNotEmpty == true
        ? profile!['lastName']
        : name.skip(1).join(' ');
    for (final key in ['email', 'username']) {
      fields[key]!.text = profile?[key]?.toString() ?? '';
    }
  }

  Future<void> load() async {
    if (getIt<AuthBloc>().state is! Authenticated) return;
    final request = ++revision;
    setState(() {
      loading = true;
      failed = false;
      statsFailed = false;
    });
    final results = await Future.wait([
      api
          .get('/api/users/me')
          .then<Object>((r) => r.data as Object)
          .catchError((Object e) => e),
      api
          .get('/api/users/me/progress/overall')
          .then<Object>((r) => r.data as Object)
          .catchError((Object e) => e),
    ]);
    if (!mounted || request != revision) return;
    setState(() {
      if (results[0] is Map) {
        profile = Map<String, dynamic>.from(results[0] as Map);
        if (!editing) hydrate();
      } else {
        failed = true;
      }
      if (results[1] is Map) {
        stats = Map<String, dynamic>.from(results[1] as Map);
      } else {
        stats = null;
        statsFailed = true;
      }
      loading = false;
    });
  }

  void message(String key) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context).t(key))),
      );
    }
  }

  Future<void> save() async {
    if (saving || !formKey.currentState!.validate()) return;
    final request = revision;
    setState(() => saving = true);
    try {
      final response = await api.put(
        '/api/users/me',
        data: {
          'fullName': [
            fields['firstName']!.text.trim(),
            fields['lastName']!.text.trim(),
          ].where((v) => v.isNotEmpty).join(' '),
          'email': fields['email']!.text.trim(),
        },
      );
      if (!mounted || request != revision) return;
      setState(() {
        profile = Map<String, dynamic>.from(response.data as Map);
        hydrate();
        editing = false;
      });
      getIt<AuthBloc>().add(GetCurrentUserEvent());
      message('profile.saved');
    } catch (_) {
      message('profile.load_error');
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  Future<void> delete() async {
    if (deleting) return;
    final t = AppLocalizations.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(t.t('profile.delete_confirm_title')),
        content: Text(t.t('profile.delete_confirm_desc')),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(t.t('profile.cancel')),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            onPressed: () => Navigator.pop(context, true),
            child: Text(t.t('profile.delete_confirm_btn')),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    setState(() => deleting = true);
    try {
      await api.delete('/api/users/me');
      if (mounted) getIt<AuthBloc>().add(LogoutEvent());
    } catch (_) {
      message('profile.delete_error');
    } finally {
      if (mounted) setState(() => deleting = false);
    }
  }

  Future<void> linkGoogle() async {
    final state = context.read<AuthBloc>().state;
    if (linking || state is! Authenticated) return;
    setState(() => linking = true);
    try {
      await getIt<GoogleOAuthService>().start(
        context.read<LanguageProvider>().currentLanguage,
        linkOwnerId: state.user.id,
      );
    } on GoogleAuthFailure catch (e) {
      message(e.messageKey);
    } catch (_) {
      message('auth.google.failed');
    } finally {
      if (mounted) setState(() => linking = false);
    }
  }

  Widget info(String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 8),
    child: Wrap(
      alignment: WrapAlignment.spaceBetween,
      spacing: 12,
      runSpacing: 8,
      children: [
        Text(label, style: Theme.of(context).textTheme.bodySmall),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w700)),
      ],
    ),
  );
  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context),
        colors = Theme.of(context).colorScheme;
    final p = profile;
    final role = p?['role']?.toString() ?? '';
    final privileged = ['ADMIN', 'MODERATOR'].contains(role);
    final roleLabel = t.t(
      role == 'ADMIN'
          ? 'profile.role_admin'
          : role == 'MODERATOR'
          ? 'profile.role_moderator'
          : 'profile.role_user',
    );
    final displayName =
        (p?['fullName'] ?? p?['username'] ?? t.t('profile.default_user'))
            .toString();
    final parts = displayName
        .trim()
        .split(RegExp(r'\s+'))
        .where((v) => v.isNotEmpty)
        .toList();
    final initials = parts.isEmpty
        ? ''
        : (parts.first.characters.first +
                  (parts.length > 1 ? parts.last.characters.first : ''))
              .toUpperCase();
    final since = DateTime.tryParse(p?['createdAt']?.toString() ?? '');
    final memberSince = since == null
        ? '—'
        : DateFormat.yMMMM('en_GB').format(since);
    final verified = t.t(
      p?['emailVerified'] == true
          ? 'profile.badge_verified'
          : 'profile.badge_unverified',
    );
    final sidebar = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        RijviaPageSection(
          title: t.t('profile.section_statistics'),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (statsFailed) Text(t.t('common.not_available')),
              for (final metric in <(String, String, IconData, Color)>[
                (
                  'totalExamsTaken',
                  'profile.stat_exams_taken',
                  Icons.emoji_events_outlined,
                  const Color(0xfff97316),
                ),
                (
                  'overallAccuracy',
                  'profile.stat_avg_score',
                  Icons.track_changes,
                  const Color(0xff16a34a),
                ),
                (
                  'totalAttempted',
                  'profile.stat_practice_qs',
                  Icons.local_fire_department_outlined,
                  colors.primary,
                ),
              ])
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: RijviaMetricCard(
                    icon: metric.$3,
                    label: t.t(metric.$2),
                    value: stats?[metric.$1] is num
                        ? '${(stats![metric.$1] as num).round()}${metric.$1 == 'overallAccuracy' ? '%' : ''}'
                        : '—',
                    color: metric.$4,
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        RijviaPageSection(
          title: t.t('profile.section_account_status'),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              info(t.t('profile.account_type'), roleLabel),
              info(t.t('profile.member_since'), memberSince),
              info(t.t('profile.email_verified'), verified),
            ],
          ),
        ),
        const SizedBox(height: 24),
        if (privileged) ...[
          RijviaPageSection(
            title: t.t('profile.permissions_summary'),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                for (final key
                    in role == 'ADMIN'
                        ? ['users', 'content', 'settings']
                        : ['review', 'moderation'])
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Icon(
                      Icons.verified_user_outlined,
                      color: colors.primary,
                    ),
                    title: Text(t.t('profile.permission_$key')),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          RijviaPageSection(
            title: t.t('profile.security_information'),
            child: Text(
              t.t(
                role == 'ADMIN'
                    ? 'profile.admin_security_help'
                    : 'profile.moderator_security_help',
              ),
            ),
          ),
        ] else
          RijviaPageSection(
            title: t.t('profile.section_sign_in_methods'),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  t.t('profile.google_sign_in'),
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                const SizedBox(height: 8),
                Text(
                  t.t(
                    p?['googleLinked'] == true
                        ? 'profile.google_connected_help'
                        : 'profile.google_connect_help',
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  t.t(
                    p?['googleLinked'] == true
                        ? 'profile.google_connected'
                        : 'profile.google_not_connected',
                  ),
                  style: TextStyle(
                    color: p?['googleLinked'] == true
                        ? const Color(0xff16a34a)
                        : colors.onSurfaceVariant,
                  ),
                ),
                if (p?['googleLinked'] != true) ...[
                  const SizedBox(height: 12),
                  OutlinedButton(
                    onPressed: linking ? null : linkGoogle,
                    child: Text(t.t('profile.connect_google')),
                  ),
                ],
              ],
            ),
          ),
      ],
    );
    Widget field(String key, IconData icon, {bool editable = true}) =>
        RijviaAuthField(
          label: t.t(
            'profile.label_${switch (key) {
              'firstName' => 'first_name',
              'lastName' => 'last_name',
              _ => key,
            }}',
          ),
          child: TextFormField(
            controller: fields[key],
            enabled: editing && editable,
            keyboardType: key == 'email'
                ? TextInputType.emailAddress
                : TextInputType.text,
            decoration: InputDecoration(prefixIcon: Icon(icon)),
            validator: (value) {
              if (key == 'firstName' &&
                  (value?.trim().isEmpty ?? true) &&
                  fields['lastName']!.text.trim().isEmpty) {
                return t.t('auth.validation.first_name_required');
              }
              return null;
            },
          ),
        );
    final details = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        RijviaPageSection(
          title: t.t('profile.section_personal_info'),
          actions: [
            if (!editing)
              OutlinedButton.icon(
                onPressed: () => setState(() {
                  hydrate();
                  editing = true;
                }),
                icon: const Icon(Icons.edit_outlined),
                label: Text(t.t('profile.edit')),
              ),
          ],
          child: Form(
            key: formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                RijviaAdaptiveGrid(
                  minCellWidth: 250,
                  equalRowHeights: false,
                  children: [
                    field('firstName', Icons.person_outline),
                    field('lastName', Icons.person_outline),
                  ],
                ),
                const SizedBox(height: 16),
                field('email', Icons.mail_outline),
                const SizedBox(height: 16),
                field('username', Icons.alternate_email, editable: false),
                const SizedBox(height: 8),
                Text(
                  t.t('profile.username_cannot_change'),
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                if (editing) ...[
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      FilledButton.icon(
                        onPressed: saving ? null : save,
                        icon: const Icon(Icons.save_outlined),
                        label: Text(
                          t.t(
                            saving ? 'profile.saving' : 'profile.save_changes',
                          ),
                        ),
                      ),
                      OutlinedButton(
                        onPressed: saving
                            ? null
                            : () => setState(() {
                                hydrate();
                                editing = false;
                              }),
                        child: Text(t.t('profile.cancel')),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        RijviaPageSection(
          title: t.t('profile.section_language_prefs'),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              DropdownButtonFormField<String>(
                key: ValueKey(
                  context.watch<LanguageProvider>().currentLanguage,
                ),
                initialValue: context.watch<LanguageProvider>().currentLanguage,
                isExpanded: true,
                decoration: InputDecoration(
                  labelText: t.t('profile.label_preferred_language'),
                ),
                items: [
                  for (final l
                      in context.read<LanguageProvider>().supportedLanguages)
                    DropdownMenuItem(value: l.code, child: Text(l.name)),
                ],
                onChanged: (v) {
                  if (v != null) {
                    context.read<LanguageProvider>().setLanguage(v);
                  }
                },
              ),
              const SizedBox(height: 12),
              Text(
                t.t('profile.language_help'),
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ),
        if (!privileged) ...[
          const SizedBox(height: 24),
          RijviaPageSection(
            title: t.t('profile.section_danger_zone'),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  t.t('profile.delete_account'),
                  style: TextStyle(
                    color: colors.error,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                Text(t.t('profile.delete_account_desc')),
                const SizedBox(height: 16),
                Align(
                  alignment: AlignmentDirectional.centerStart,
                  child: FilledButton.icon(
                    style: FilledButton.styleFrom(
                      backgroundColor: colors.error,
                    ),
                    onPressed: deleting ? null : delete,
                    icon: const Icon(Icons.delete_outline),
                    label: Text(
                      t.t(deleting ? 'profile.deleting' : 'profile.delete'),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
    return BlocListener<AuthBloc, AuthState>(
      listenWhen: (_, next) => next is Unauthenticated,
      listener: (context, state) =>
          Navigator.pushNamedAndRemoveUntil(context, '/', (r) => false),
      child: Scaffold(
        appBar: widget.embedded ? null : const RijviaAppBar(),
        body: RijviaScrollFrame(
          maxWidth: 1024,
          child: RefreshIndicator(
            onRefresh: load,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (loading) const LinearProgressIndicator(),
                  if (failed)
                    RijviaEmptyState(
                      icon: Icons.error_outline,
                      title: t.t('profile.load_error'),
                      description: t.t('common.error_desc'),
                      action: TextButton(
                        onPressed: load,
                        child: Text(t.t('common.retry')),
                      ),
                    ),
                  if (p != null) ...[
                    RijviaPageSection(
                      child: LayoutBuilder(
                        builder: (context, c) {
                          final wide =
                              c.maxWidth /
                                  MediaQuery.textScalerOf(context).scale(1) >=
                              640;
                          final avatar = Container(
                            width: wide ? 96 : 80,
                            height: wide ? 96 : 80,
                            decoration: BoxDecoration(
                              color: colors.primary.withValues(alpha: .1),
                              border: Border.all(
                                color: colors.primary.withValues(alpha: .25),
                              ),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              initials,
                              style: TextStyle(
                                color: colors.primary,
                                fontSize: wide ? 36 : 30,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          );
                          final identity = Column(
                            crossAxisAlignment: wide
                                ? CrossAxisAlignment.start
                                : CrossAxisAlignment.center,
                            children: [
                              if (role == 'ADMIN')
                                Text(
                                  t.t('profile.admin_profile_title'),
                                  style: TextStyle(
                                    color: colors.primary,
                                    fontWeight: FontWeight.w900,
                                    fontSize: 12,
                                  ),
                                ),
                              Text(
                                displayName,
                                style: Theme.of(context)
                                    .textTheme
                                    .headlineMedium
                                    ?.copyWith(fontWeight: FontWeight.w900),
                                textAlign: wide
                                    ? TextAlign.start
                                    : TextAlign.center,
                              ),
                              const SizedBox(height: 8),
                              Text(
                                '@${p['username'] ?? ''}',
                                textDirection: TextDirection.ltr,
                                style: TextStyle(
                                  color: colors.onSurfaceVariant,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                alignment: wide
                                    ? WrapAlignment.start
                                    : WrapAlignment.center,
                                children: [
                                  for (final value in <(String, Color)>[
                                    (roleLabel, colors.primary),
                                    (
                                      verified,
                                      p['emailVerified'] == true
                                          ? const Color(0xff16a34a)
                                          : const Color(0xffb45309),
                                    ),
                                  ])
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 12,
                                        vertical: 6,
                                      ),
                                      decoration: BoxDecoration(
                                        color: value.$2.withValues(alpha: .1),
                                        border: Border.all(
                                          color: value.$2.withValues(alpha: .2),
                                        ),
                                        borderRadius: BorderRadius.circular(30),
                                      ),
                                      child: Text(
                                        value.$1,
                                        style: TextStyle(
                                          color: value.$2,
                                          fontSize: 12,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            ],
                          );
                          return wide
                              ? Row(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    avatar,
                                    const SizedBox(width: 20),
                                    Expanded(child: identity),
                                    const SizedBox(width: 16),
                                    Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.end,
                                      children: [
                                        Text(
                                          t.t('profile.member_since_label'),
                                          style: Theme.of(
                                            context,
                                          ).textTheme.bodySmall,
                                        ),
                                        Text(
                                          memberSince,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                )
                              : Column(
                                  children: [
                                    avatar,
                                    const SizedBox(height: 20),
                                    identity,
                                  ],
                                );
                        },
                      ),
                    ),
                    const SizedBox(height: 32),
                    LayoutBuilder(
                      builder: (context, c) => c.maxWidth >= 950
                          ? Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(child: sidebar),
                                const SizedBox(width: 24),
                                Expanded(flex: 2, child: details),
                              ],
                            )
                          : Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                sidebar,
                                const SizedBox(height: 24),
                                details,
                              ],
                            ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
