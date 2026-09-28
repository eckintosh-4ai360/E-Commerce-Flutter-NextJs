import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../models/account_models.dart';
import '../../services/account_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';

class PaymentMethodsScreen extends StatelessWidget {
  const PaymentMethodsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text('Payment Methods',
            style: GoogleFonts.kumbhSans(fontWeight: FontWeight.w600)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: RequireSignIn(
        title: 'Sign in to manage payment preferences',
        message: 'Your choice is pre-selected at checkout on the app and website.',
        builder: (_) => const _PaymentPreference(),
      ),
    );
  }
}

class _PaymentPreference extends StatefulWidget {
  const _PaymentPreference();

  @override
  State<_PaymentPreference> createState() => _PaymentPreferenceState();
}

class _PaymentPreferenceState extends State<_PaymentPreference> {
  String? _selected;
  String? _error;

  @override
  void initState() {
    super.initState();
    context.read<AccountService>().getProfile().then((profile) {
      if (mounted) setState(() => _selected = profile.preferredPaymentMethod);
    }).catchError((Object error) {
      if (mounted) setState(() => _error = friendlyError(error));
    });
  }

  Future<void> _choose(String? value) async {
    if (value == null || value == _selected) return;
    final previous = _selected;
    setState(() => _selected = value);
    try {
      await context
          .read<AccountService>()
          .updateProfile(preferredPaymentMethod: value);
      if (mounted) showAppSnack(context, 'Payment preference saved');
    } catch (error) {
      if (!mounted) return;
      setState(() => _selected = previous);
      showAppSnack(context, friendlyError(error), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return EmptyView(icon: Icons.error_outline, title: 'Could not load', message: _error);
    }
    if (_selected == null) {
      return const Center(child: CircularProgressIndicator());
    }

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        SectionCard(
          title: 'Preferred payment method',
          child: RadioGroup<String>(
            groupValue: _selected,
            onChanged: _choose,
            child: Column(
              children: paymentMethodOptions
                  .map(
                    (option) => RadioListTile<String>(
                      contentPadding: EdgeInsets.zero,
                      value: option.value,
                      title: Text(option.label,
                          style: GoogleFonts.kumbhSans(fontWeight: FontWeight.w600)),
                      subtitle: Text(option.description,
                          style: GoogleFonts.kumbhSans(fontSize: 12)),
                    ),
                  )
                  .toList(),
            ),
          ),
        ),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppTheme.accent.withValues(alpha: 0.18),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.info_outline, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  "We don't store card details. All orders are paid on delivery by cash or Mobile Money.",
                  style: GoogleFonts.kumbhSans(fontSize: 13),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
