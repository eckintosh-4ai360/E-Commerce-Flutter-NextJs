import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../blocs/auth/auth_cubit.dart';
import '../../models/account_models.dart';
import '../../services/account_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';

class DeliveryAddressesScreen extends StatelessWidget {
  const DeliveryAddressesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text('Delivery Addresses',
            style: GoogleFonts.kumbhSans(fontWeight: FontWeight.w600)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: RequireSignIn(
        title: 'Sign in to manage addresses',
        message: 'Saved addresses appear at checkout on the app and website.',
        builder: (_) => const _AddressBook(),
      ),
    );
  }
}

class _AddressBook extends StatefulWidget {
  const _AddressBook();

  @override
  State<_AddressBook> createState() => _AddressBookState();
}

class _AddressBookState extends State<_AddressBook> {
  List<DeliveryAddress>? _addresses;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final addresses = await context.read<AccountService>().listAddresses();
      if (mounted) setState(() => _addresses = addresses);
    } catch (error) {
      if (mounted) setState(() => _error = friendlyError(error));
    }
  }

  Future<void> _edit([DeliveryAddress? address]) async {
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _AddressForm(
        address: address,
        makeDefaultByDefault: (_addresses ?? const []).isEmpty,
      ),
    );
    if (saved == true) {
      _load();
    }
  }

  Future<void> _setDefault(DeliveryAddress address) async {
    try {
      await context
          .read<AccountService>()
          .saveAddress(address.toRequest(makeDefault: true), id: address.id);
      _load();
    } catch (error) {
      if (mounted) showAppSnack(context, friendlyError(error), error: true);
    }
  }

  Future<void> _delete(DeliveryAddress address) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('Remove address?',
            style: GoogleFonts.kumbhSans(fontWeight: FontWeight.w700)),
        content: Text('${address.label}: ${address.oneLine}'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: Text('Remove',
                style: GoogleFonts.kumbhSans(
                    color: AppTheme.error, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    try {
      await context.read<AccountService>().deleteAddress(address.id);
      if (mounted) showAppSnack(context, 'Address removed');
      _load();
    } catch (error) {
      if (mounted) showAppSnack(context, friendlyError(error), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final addresses = _addresses;
    if (_error != null && addresses == null) {
      return EmptyView(icon: Icons.error_outline, title: 'Could not load', message: _error);
    }
    if (addresses == null) {
      return const Center(child: CircularProgressIndicator());
    }

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        if (addresses.isEmpty)
          const SizedBox(
            height: 320,
            child: EmptyView(
              icon: Icons.location_on_outlined,
              title: 'No saved addresses',
              message: 'Save an address to check out faster.',
            ),
          ),
        for (final address in addresses)
          SectionCard(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.location_on_outlined, color: AppTheme.primary),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(address.label,
                              style: GoogleFonts.kumbhSans(
                                  fontWeight: FontWeight.w700, fontSize: 15)),
                          if (address.isDefault) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppTheme.primary,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text('DEFAULT',
                                  style: GoogleFonts.kumbhSans(
                                      color: Colors.white,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700)),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text('${address.recipientName} · ${address.phone}',
                          style: GoogleFonts.kumbhSans(
                              fontSize: 13, color: AppTheme.textMed)),
                      Text(address.oneLine,
                          style: GoogleFonts.kumbhSans(
                              fontSize: 13, color: AppTheme.textMed)),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 4,
                        children: [
                          TextButton(
                              onPressed: () => _edit(address),
                              child: const Text('Edit')),
                          if (!address.isDefault)
                            TextButton(
                                onPressed: () => _setDefault(address),
                                child: const Text('Set as default')),
                          TextButton(
                            onPressed: () => _delete(address),
                            child: Text('Remove',
                                style: GoogleFonts.kumbhSans(color: AppTheme.error)),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        const SizedBox(height: 8),
        SizedBox(
          height: 52,
          child: ElevatedButton.icon(
            onPressed: addresses.length >= 10 ? null : () => _edit(),
            icon: const Icon(Icons.add),
            label: const Text('ADD NEW ADDRESS'),
          ),
        ),
        if (addresses.length >= 10)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text('You can save up to 10 addresses.',
                style: GoogleFonts.kumbhSans(fontSize: 12, color: AppTheme.textMed)),
          ),
      ],
    );
  }
}

class _AddressForm extends StatefulWidget {
  const _AddressForm({this.address, required this.makeDefaultByDefault});

  final DeliveryAddress? address;
  final bool makeDefaultByDefault;

  @override
  State<_AddressForm> createState() => _AddressFormState();
}

class _AddressFormState extends State<_AddressForm> {
  late final _label = TextEditingController(text: widget.address?.label ?? 'Home');
  late final _name = TextEditingController(
      text: widget.address?.recipientName ??
          context.read<AuthCubit>().state.user?.displayName ??
          '');
  late final _phone = TextEditingController(text: widget.address?.phone);
  late final _street = TextEditingController(text: widget.address?.street);
  late final _city = TextEditingController(text: widget.address?.city);
  late String _region = widget.address?.region ?? ghanaRegions.first;
  late bool _isDefault = widget.address?.isDefault ?? widget.makeDefaultByDefault;
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    for (final controller in [_label, _name, _phone, _street, _city]) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await context.read<AccountService>().saveAddress({
        'label': _label.text.trim(),
        'recipientName': _name.text.trim(),
        'phone': _phone.text.trim(),
        'street': _street.text.trim(),
        'city': _city.text.trim(),
        'region': _region,
        'isDefault': _isDefault,
      }, id: widget.address?.id);
      if (mounted) Navigator.pop(context, true);
    } catch (error) {
      if (mounted) setState(() => _error = friendlyError(error));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(
          24, 24, 24, MediaQuery.of(context).viewInsets.bottom + 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(widget.address == null ? 'New address' : 'Edit address',
              style: GoogleFonts.kumbhSans(fontSize: 22, fontWeight: FontWeight.w700)),
          const SizedBox(height: 18),
          TextField(controller: _label, decoration: const InputDecoration(labelText: 'Label (Home, Work…)')),
          const SizedBox(height: 12),
          TextField(controller: _name, decoration: const InputDecoration(labelText: 'Recipient name')),
          const SizedBox(height: 12),
          TextField(
              controller: _phone,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Phone number')),
          const SizedBox(height: 12),
          TextField(controller: _street, decoration: const InputDecoration(labelText: 'Street address or landmark')),
          const SizedBox(height: 12),
          TextField(controller: _city, decoration: const InputDecoration(labelText: 'City or town')),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _region,
            decoration: const InputDecoration(labelText: 'Region'),
            items: ghanaRegions
                .map((region) => DropdownMenuItem(value: region, child: Text(region)))
                .toList(),
            onChanged: (value) => setState(() => _region = value ?? _region),
          ),
          CheckboxListTile(
            contentPadding: EdgeInsets.zero,
            controlAffinity: ListTileControlAffinity.leading,
            value: _isDefault,
            onChanged: (value) => setState(() => _isDefault = value ?? false),
            title: const Text('Use as my default delivery address'),
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(_error!,
                  style: GoogleFonts.kumbhSans(
                      color: AppTheme.error, fontWeight: FontWeight.w600)),
            ),
          SizedBox(
            height: 52,
            child: ElevatedButton(
              onPressed: _saving ? null : _save,
              child: Text(_saving ? 'SAVING...' : 'SAVE ADDRESS'),
            ),
          ),
        ],
      ),
    );
  }
}
