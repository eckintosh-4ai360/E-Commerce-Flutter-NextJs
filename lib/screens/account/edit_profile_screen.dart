import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../blocs/auth/auth_cubit.dart';
import '../../models/account_models.dart';
import '../../services/account_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';

class EditProfileScreen extends StatelessWidget {
  const EditProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text('Edit Profile',
            style: GoogleFonts.kumbhSans(fontWeight: FontWeight.w600)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: RequireSignIn(
        title: 'Sign in to edit your profile',
        message: 'Your profile is shared between the app and the website.',
        builder: (_) => const _ProfileForm(),
      ),
    );
  }
}

class _ProfileForm extends StatefulWidget {
  const _ProfileForm();

  @override
  State<_ProfileForm> createState() => _ProfileFormState();
}

class _ProfileFormState extends State<_ProfileForm> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  CustomerProfile? _profile;
  String? _error;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final profile = await context.read<AccountService>().getProfile();
      if (!mounted) return;
      setState(() {
        _profile = profile;
        _nameController.text =
            profile.name ?? context.read<AuthCubit>().state.user?.displayName ?? '';
        _phoneController.text = profile.phone ?? '';
      });
    } catch (error) {
      if (mounted) setState(() => _error = friendlyError(error));
    }
  }

  Future<void> _save() async {
    FocusScope.of(context).unfocus();
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final profile = await context.read<AccountService>().updateProfile(
            name: _nameController.text.trim(),
            phone: _phoneController.text.trim(),
          );
      if (!mounted) return;
      setState(() => _profile = profile);
      showAppSnack(context, 'Profile saved');
    } catch (error) {
      if (mounted) setState(() => _error = friendlyError(error));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.read<AuthCubit>().state.user;
    if (_profile == null && _error == null) {
      return const Center(child: CircularProgressIndicator());
    }

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Center(
          child: CircleAvatar(
            radius: 46,
            backgroundColor: AppTheme.primary,
            backgroundImage:
                user?.photoUrl == null ? null : NetworkImage(user!.photoUrl!),
            child: user?.photoUrl == null
                ? Text(user?.initials ?? '',
                    style: GoogleFonts.kumbhSans(
                        color: AppTheme.accent,
                        fontSize: 26,
                        fontWeight: FontWeight.w700))
                : null,
          ),
        ),
        const SizedBox(height: 28),
        TextField(
          controller: _nameController,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(labelText: 'Full name'),
        ),
        const SizedBox(height: 16),
        TextFormField(
          initialValue: _profile?.email ?? user?.email,
          readOnly: true,
          decoration: const InputDecoration(
            labelText: 'Email address',
            helperText: 'Your email comes from your Google account.',
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _phoneController,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(
            labelText: 'Phone number',
            hintText: '059 859 9687',
            helperText: 'Pre-fills checkout and is used for delivery calls.',
          ),
        ),
        if (_error != null) ...[
          const SizedBox(height: 16),
          Text(_error!,
              style: GoogleFonts.kumbhSans(
                  color: AppTheme.error, fontWeight: FontWeight.w600)),
        ],
        const SizedBox(height: 28),
        SizedBox(
          height: 52,
          child: ElevatedButton(
            onPressed: _saving || _profile == null ? null : _save,
            child: Text(_saving ? 'SAVING...' : 'SAVE CHANGES'),
          ),
        ),
      ],
    );
  }
}
