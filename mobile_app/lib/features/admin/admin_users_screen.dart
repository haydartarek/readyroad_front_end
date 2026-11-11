import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/providers/language_provider.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import '../auth/presentation/bloc/auth_bloc.dart';
import '../auth/presentation/bloc/auth_state.dart';
import 'admin_components.dart';

const adminUserRoles = ['USER', 'MODERATOR', 'ADMIN'];

class AdminUsersScreen extends StatefulWidget {
  const AdminUsersScreen({super.key});
  @override
  State<AdminUsersScreen> createState() => _AdminUsersScreenState();
}

class _AdminUsersScreenState extends AdminPageState<AdminUsersScreen> {
  List<AdminRecord> users = [];
  AdminRecord? summary;
  int page = 0;
  int? total;
  String query = '';
  Timer? debounce;
  @override
  void dispose() {
    debounce?.cancel();
    super.dispose();
  }

  @override
  Future<void> load() => fetch((request) async {
    final results = await Future.wait([
      api.get('/admin/users', {
        'page': page,
        'size': 20,
        'q': query,
        'sortField': 'createdAt',
        'sortDir': 'desc',
      }),
      api.get('/admin/users/summary'),
    ]);
    final response = AdminApi.record(results[0]);
    final items = AdminApi.records(response['users']);
    final stats = AdminApi.record(results[1]);
    if (mounted && request == revision) {
      setState(() {
        users = items;
        total = (response['total'] as num).toInt();
        summary = stats;
      });
    }
  });
  Future<void> _lock(AdminRecord user) async {
    final next = user['isLocked'] != true;
    if (!await adminConfirm(
          context,
          next ? 'admin.users.confirm_lock' : 'admin.users.confirm_unlock',
        ) ||
        !mounted) {
      return;
    }
    await mutate(
      () => api.put('/admin/users/${user['id']}/lock', {'isLocked': next}),
    );
  }

  Future<void> _role(AdminRecord user, String? role) async {
    if (role == null || role == user['role']) return;
    if (!await adminConfirm(context, 'admin.users.confirm_role') || !mounted) {
      return;
    }
    await mutate(
      () => api.put('/admin/users/${user['id']}/role', {'role': role}),
    );
  }

  Future<void> _create() async {
    final created = await showDialog<bool>(
      context: context,
      builder: (context) => const _CreateAdminUserDialog(),
    );
    if (created == true && mounted) {
      page = 0;
      await load();
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final auth = context.watch<AuthBloc>().state;
    final current = auth is Authenticated ? auth.user : null;
    final language = context.watch<LanguageProvider>().currentLanguage;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AdminHeader(
          title: t.t('admin.users.title'),
          description: t.t('admin.users.description'),
          icon: Icons.people_outline,
          actions: [
            FilledButton.icon(
              onPressed: saving ? null : _create,
              icon: const Icon(Icons.person_add_outlined),
              label: Text(t.t('admin.users.create')),
            ),
            OutlinedButton.icon(
              onPressed: loading ? null : load,
              icon: const Icon(Icons.refresh),
              label: Text(t.t('admin.users.refresh')),
            ),
          ],
        ),
        const SizedBox(height: 24),
        messages(),
        if (summary != null)
          RijviaAdaptiveGrid(
            equalRowHeights: false,
            minCellWidth: 220,
            maxColumns: 3,
            maxCellWidth: double.infinity,
            children: [
              for (final field in [
                ('total', 'total_users', Icons.people_outline),
                ('active', 'active_users', Icons.verified_user_outlined),
                ('locked', 'locked_users', Icons.lock_outline),
              ])
                RijviaMetricCard(
                  label: t.t('admin.users.${field.$2}'),
                  value: summary![field.$1]?.toString() ?? '—',
                  icon: field.$3,
                ),
            ],
          ),
        const SizedBox(height: 24),
        TextField(
          decoration: InputDecoration(
            labelText: t.t('admin.users.search_placeholder'),
            prefixIcon: const Icon(Icons.search),
          ),
          onChanged: (value) {
            debounce?.cancel();
            debounce = Timer(const Duration(milliseconds: 250), () {
              page = 0;
              query = value.trim();
              load();
            });
          },
        ),
        const SizedBox(height: 16),
        if (!loading && error == null && users.isEmpty)
          RijviaPageSection(child: Text(t.t('admin.users.no_users'))),
        if (users.isNotEmpty)
          RijviaPageSection(
            child: AdminTable(
              columns: [
                for (final key in [
                  'col_user',
                  'col_email',
                  'col_role',
                  'col_status',
                  'col_joined',
                ])
                  t.t('admin.users.$key'),
                t.t('admin.signs.col_actions'),
              ],
              rows: [
                for (final user in users)
                  [
                    SizedBox(
                      width: 180,
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 16,
                            child: Text(
                              (user['fullName']?.toString().isNotEmpty == true
                                      ? user['fullName'].toString()
                                      : user['username']?.toString() ?? '?')
                                  .characters
                                  .first
                                  .toUpperCase(),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  user['fullName']?.toString() ??
                                      user['username']?.toString() ??
                                      '—',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                Text(
                                  '@${user['username'] ?? '—'}',
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    Text(user['email']?.toString() ?? '—'),
                    SizedBox(
                      width: 145,
                      child: DropdownButtonFormField<String>(
                        key: ValueKey('${user['id']}-${user['role']}'),
                        initialValue: adminUserRoles.contains(user['role'])
                            ? user['role'] as String
                            : null,
                        isExpanded: true,
                        items: [
                          for (final role in adminUserRoles)
                            DropdownMenuItem(value: role, child: Text(role)),
                        ],
                        onChanged:
                            saving ||
                                user['id'].toString() == current?.id ||
                                user['username'] == current?.username
                            ? null
                            : (value) => _role(user, value),
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          t.t(
                            user['isActive'] == true
                                ? 'admin.users.status_active'
                                : 'admin.users.status_inactive',
                          ),
                        ),
                        if (user['isLocked'] == true)
                          Text(
                            t.t('admin.users.status_locked'),
                            style: TextStyle(
                              color: Theme.of(context).colorScheme.error,
                            ),
                          ),
                      ],
                    ),
                    Text(adminDate(user['createdAt'], language)),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        if (user['role'] == 'USER')
                          OutlinedButton.icon(
                            onPressed: () => Navigator.pushNamed(
                              context,
                              '/admin/users/${user['id']}/learning',
                            ),
                            icon: const Icon(Icons.bar_chart, size: 18),
                            label: Text(t.t('admin.users.learning_profile')),
                          ),
                        OutlinedButton.icon(
                          onPressed:
                              saving ||
                                  user['id'].toString() == current?.id ||
                                  user['username'] == current?.username
                              ? null
                              : () => _lock(user),
                          icon: Icon(
                            user['isLocked'] == true
                                ? Icons.lock_open
                                : Icons.lock_outline,
                            size: 18,
                          ),
                          label: Text(
                            t.t(
                              user['isLocked'] == true
                                  ? 'admin.users.unlock'
                                  : 'admin.users.lock',
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
              ],
            ),
          ),
        if (total != null)
          AdminPagination(
            page: page,
            pages: (total! / 20).ceil(),
            busy: loading,
            onPage: (value) {
              page = value;
              load();
            },
          ),
      ],
    );
  }
}

class _CreateAdminUserDialog extends StatefulWidget {
  const _CreateAdminUserDialog();
  @override
  State<_CreateAdminUserDialog> createState() => _CreateAdminUserDialogState();
}

class _CreateAdminUserDialogState extends State<_CreateAdminUserDialog> {
  final form = GlobalKey<FormState>();
  final values = <String, dynamic>{
    'firstName': '',
    'lastName': '',
    'email': '',
    'username': '',
    'password': '',
    'preferredLanguage': 'en',
    'role': 'USER',
    'isActive': true,
    'emailVerified': false,
  };
  bool saving = false;
  bool failed = false;
  Future<void> submit() async {
    if (saving || !form.currentState!.validate()) return;
    form.currentState!.save();
    setState(() {
      saving = true;
      failed = false;
    });
    try {
      await AdminApi().post('/admin/users', values);
      if (mounted) Navigator.pop(context, true);
    } catch (_) {
      if (mounted) setState(() => failed = true);
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return AlertDialog(
      title: Text(t.t('admin.users.create_title')),
      content: SizedBox(
        width: 600,
        child: SingleChildScrollView(
          child: Form(
            key: form,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(t.t('admin.users.create_description')),
                const SizedBox(height: 16),
                if (failed)
                  Text(
                    t.t('admin.users.create_error'),
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                RijviaAdaptiveGrid(
                  equalRowHeights: false,
                  minCellWidth: 220,
                  maxColumns: 2,
                  maxCellWidth: double.infinity,
                  children: [
                    for (final field in [
                      ('firstName', 'first_name'),
                      ('lastName', 'last_name'),
                      ('email', 'email'),
                      ('username', 'username'),
                      ('password', 'password'),
                    ])
                      TextFormField(
                        enabled: !saving,
                        obscureText: field.$1 == 'password',
                        keyboardType: field.$1 == 'email'
                            ? TextInputType.emailAddress
                            : TextInputType.text,
                        decoration: InputDecoration(
                          labelText: t.t('admin.users.${field.$2}'),
                          helperText: field.$1 == 'password'
                              ? t.t('admin.users.password_hint')
                              : null,
                          helperMaxLines: 4,
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return t.t('auth.validation.required');
                          }
                          if (field.$1 == 'password' && value.length < 8) {
                            return t.t('auth.validation.password_short');
                          }
                          if (field.$1 == 'email' &&
                              !RegExp(
                                r'^[^\s@]+@[^\s@]+\.[^\s@]+$',
                              ).hasMatch(value)) {
                            return t.t('auth.validation.email_invalid');
                          }
                          return null;
                        },
                        onSaved: (value) => values[field.$1] =
                            field.$1 == 'password' ? value! : value!.trim(),
                      ),
                    DropdownButtonFormField<String>(
                      initialValue: 'en',
                      isExpanded: true,
                      decoration: InputDecoration(
                        labelText: t.t('admin.users.preferred_language'),
                      ),
                      items: [
                        for (final language in ['en', 'ar', 'nl', 'fr'])
                          DropdownMenuItem(
                            value: language,
                            child: Text(
                              t.t('admin.settings_page.language_$language'),
                            ),
                          ),
                      ],
                      onChanged: saving
                          ? null
                          : (value) => values['preferredLanguage'] = value,
                    ),
                    DropdownButtonFormField<String>(
                      initialValue: 'USER',
                      isExpanded: true,
                      decoration: InputDecoration(
                        labelText: t.t('admin.users.col_role'),
                      ),
                      items: [
                        for (final role in adminUserRoles)
                          DropdownMenuItem(value: role, child: Text(role)),
                      ],
                      onChanged: saving
                          ? null
                          : (value) => values['role'] = value,
                    ),
                  ],
                ),
                for (final field in [
                  ('isActive', 'status_active'),
                  ('emailVerified', 'email_verified'),
                ])
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(t.t('admin.users.${field.$2}')),
                    value: values[field.$1] == true,
                    onChanged: saving
                        ? null
                        : (value) => setState(() => values[field.$1] = value),
                  ),
              ],
            ),
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: saving ? null : () => Navigator.pop(context, false),
          child: Text(t.t('common.cancel')),
        ),
        FilledButton(
          onPressed: saving ? null : submit,
          child: Text(t.t(saving ? 'common.loading' : 'admin.users.create')),
        ),
      ],
    );
  }
}
