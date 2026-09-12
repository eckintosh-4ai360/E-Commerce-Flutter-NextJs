import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';

import '../blocs/auth/auth_cubit.dart';
import '../blocs/cart/cart_bloc.dart';
import '../blocs/catalog/catalog_cubit.dart';
import '../models/account_models.dart';
import '../models/app_auth_user.dart';
import '../models/app_order.dart';
import '../services/account_service.dart';
import '../services/api_client.dart';
import '../services/order_service.dart';
import '../theme/app_theme.dart';
import 'common.dart';

String _newRequestId() {
  final random = Random.secure();
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return List.generate(32, (_) => alphabet[random.nextInt(alphabet.length)])
      .join();
}

/// Checkout for the current cart. Pops with the created [AppOrder].
class CheckoutSheet extends StatefulWidget {
  const CheckoutSheet({super.key});

  @override
  State<CheckoutSheet> createState() => _CheckoutSheetState();
}

class _CheckoutSheetState extends State<CheckoutSheet> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _streetController = TextEditingController();
  final _cityController = TextEditingController();
  final _notesController = TextEditingController();

  String _region = ghanaRegions.first;
  String _paymentMethod = 'CASH_ON_DELIVERY';
  String? _addressId; // null = new address
  bool _saveAddress = true;
  List<DeliveryAddress> _addresses = const [];
  String? _loadedFor;
  bool _loadingAccount = false;
  bool _isSubmitting = false;
  String? _errorMessage;

  // One key per cart contents, so retries never create duplicate orders.
  String _requestId = _newRequestId();
  String _cartSignature = '';

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _loadAccount(context.read<AuthCubit>().state.user);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _streetController.dispose();
    _cityController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _loadAccount(AppAuthUser? user) async {
    if (user == null || _loadedFor == user.uid) {
      return;
    }
    _loadedFor = user.uid;
    final accountService = context.read<AccountService>();
    setState(() => _loadingAccount = true);

    try {
      final results = await Future.wait([
        accountService.getProfile(),
        accountService.listAddresses(),
      ]);
      if (!mounted) return;
      final profile = results[0] as CustomerProfile;
      final addresses = results[1] as List<DeliveryAddress>;
      DeliveryAddress? preferred;
      for (final address in addresses) {
        if (address.isDefault) preferred = address;
      }
      preferred ??= addresses.isEmpty ? null : addresses.first;

      setState(() {
        _addresses = addresses;
        _addressId = preferred?.id;
        _paymentMethod = profile.preferredPaymentMethod;
        if (_nameController.text.trim().isEmpty) {
          _nameController.text = profile.name ?? user.displayName ?? '';
        }
        if (_phoneController.text.trim().isEmpty) {
          _phoneController.text = profile.phone ?? '';
        }
      });
    } catch (_) {
      if (!mounted) return;
      if (_nameController.text.trim().isEmpty) {
        _nameController.text = user.displayName ?? '';
      }
    } finally {
      if (mounted) setState(() => _loadingAccount = false);
    }
  }

  DeliveryAddress? get _selectedAddress {
    for (final address in _addresses) {
      if (address.id == _addressId) return address;
    }
    return null;
  }

  String? _validate() {
    if (_nameController.text.trim().length < 2) {
      return 'Enter your full name.';
    }
    if (_phoneController.text.replaceAll(RegExp(r'\D'), '').length < 7) {
      return 'Enter a valid phone number.';
    }
    if (_selectedAddress == null) {
      if (_streetController.text.trim().length < 3) {
        return 'Enter your street address or a landmark.';
      }
      if (_cityController.text.trim().length < 2) {
        return 'Enter your city or town.';
      }
    }
    return null;
  }

  Future<void> _submitOrder(CartState cart) async {
    final authState = context.read<AuthCubit>().state;
    if (!authState.isAuthenticated) {
      setState(() => _errorMessage = 'Sign in with Google to continue to checkout.');
      return;
    }
    final problem = _validate();
    if (problem != null) {
      setState(() => _errorMessage = problem);
      return;
    }

    final orderService = context.read<OrderService>();
    final accountService = context.read<AccountService>();
    final catalogCubit = context.read<CatalogCubit>();
    final selected = _selectedAddress;
    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();
    final deliveryAddress = selected?.oneLine ??
        '${_streetController.text.trim()}, ${_cityController.text.trim()}, $_region';

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    if (selected == null && _saveAddress) {
      // Saving the address must never block the order itself.
      unawaited(accountService.saveAddress({
        'label': _addresses.isEmpty ? 'Home' : 'Address ${_addresses.length + 1}',
        'recipientName': name,
        'phone': phone,
        'street': _streetController.text.trim(),
        'city': _cityController.text.trim(),
        'region': _region,
      }).then<void>((_) {}, onError: (Object _) {}));
    }

    try {
      final order = await orderService.createOrder(
        requestId: _requestId,
        customerName: name,
        customerPhone: phone,
        deliveryAddress: deliveryAddress,
        paymentMethod: _paymentMethod,
        notes: _notesController.text.trim().isEmpty
            ? null
            : _notesController.text.trim(),
        items: cart.items,
        expectedTotal: cart.total,
      );
      if (!mounted) return;
      Navigator.pop<AppOrder>(context, order);
    } on ApiException catch (error) {
      if (error.isConflict) {
        // Prices or stock changed: reload so the cart shows current values.
        catalogCubit.loadCatalog();
      }
      if (mounted) setState(() => _errorMessage = error.message);
    } catch (error) {
      if (mounted) setState(() => _errorMessage = friendlyError(error));
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final viewInsets = MediaQuery.of(context).viewInsets.bottom;

    return BlocListener<AuthCubit, AuthState>(
      listenWhen: (previous, current) =>
          previous.user != current.user ||
          previous.errorMessage != current.errorMessage,
      listener: (context, state) {
        _loadAccount(state.user);
        final errorMessage = state.errorMessage;
        if (errorMessage != null && mounted) {
          showAppSnack(context, errorMessage, error: true);
        }
      },
      child: BlocBuilder<CartBloc, CartState>(
        builder: (context, cart) {
          final signature =
              cart.items.map((item) => '${item.lineKey}x${item.quantity}').join(',');
          if (signature != _cartSignature) {
            _cartSignature = signature;
            _requestId = _newRequestId();
          }

          return BlocBuilder<AuthCubit, AuthState>(
            builder: (context, authState) {
              return SingleChildScrollView(
                padding: EdgeInsets.fromLTRB(24, 24, 24, viewInsets + 24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Checkout',
                      style: GoogleFonts.kumbhSans(
                          fontSize: 24, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Sign in with Google so we can email your confirmation and tracking updates.',
                      style: GoogleFonts.kumbhSans(
                          fontSize: 13, color: AppTheme.textMed),
                    ),
                    const SizedBox(height: 20),
                    _buildAuthCard(context, authState),
                    const SizedBox(height: 20),
                    ...cart.items.map((item) => _itemRow(
                          '${item.product.name} × ${item.quantity}'
                          '${item.optionsLabel.isEmpty ? '' : ' (${item.optionsLabel})'}',
                          formatMoney(item.totalPrice),
                        )),
                    const Divider(height: 28),
                    if (authState.isAuthenticated) ...[
                      if (_loadingAccount)
                        const Padding(
                          padding: EdgeInsets.only(bottom: 12),
                          child: LinearProgressIndicator(minHeight: 2),
                        ),
                      _sectionTitle('Contact'),
                      _buildField(_nameController, 'Full name'),
                      const SizedBox(height: 12),
                      _buildField(_phoneController, 'Phone number',
                          keyboardType: TextInputType.phone),
                      const SizedBox(height: 20),
                      _sectionTitle('Delivery address'),
                      RadioGroup<String?>(
                        groupValue: _addressId,
                        onChanged: (value) => setState(() => _addressId = value),
                        child: Column(
                          children: [
                            ..._addresses.map(_addressOption),
                            if (_addresses.isNotEmpty)
                              RadioListTile<String?>(
                                contentPadding: EdgeInsets.zero,
                                value: null,
                                title: Text('Use a new address',
                                    style: GoogleFonts.kumbhSans(
                                        fontWeight: FontWeight.w600)),
                              ),
                          ],
                        ),
                      ),
                      if (_selectedAddress == null) ...[
                        _buildField(_streetController, 'Street address or landmark'),
                        const SizedBox(height: 12),
                        _buildField(_cityController, 'City or town'),
                        const SizedBox(height: 12),
                        DropdownButtonFormField<String>(
                          initialValue: _region,
                          decoration: const InputDecoration(labelText: 'Region'),
                          items: ghanaRegions
                              .map((region) => DropdownMenuItem(
                                  value: region, child: Text(region)))
                              .toList(),
                          onChanged: (value) =>
                              setState(() => _region = value ?? _region),
                        ),
                        CheckboxListTile(
                          contentPadding: EdgeInsets.zero,
                          controlAffinity: ListTileControlAffinity.leading,
                          value: _saveAddress,
                          onChanged: (value) =>
                              setState(() => _saveAddress = value ?? false),
                          title: Text('Save this address to my account',
                              style: GoogleFonts.kumbhSans(fontSize: 14)),
                        ),
                      ],
                      const SizedBox(height: 12),
                      _sectionTitle('Payment'),
                      RadioGroup<String>(
                        groupValue: _paymentMethod,
                        onChanged: (value) => setState(
                            () => _paymentMethod = value ?? _paymentMethod),
                        child: Column(
                          children: paymentMethodOptions
                              .map(
                                (option) => RadioListTile<String>(
                                  contentPadding: EdgeInsets.zero,
                                  value: option.value,
                                  title: Text(option.label,
                                      style: GoogleFonts.kumbhSans(
                                          fontWeight: FontWeight.w600)),
                                  subtitle: Text(option.description,
                                      style: GoogleFonts.kumbhSans(fontSize: 12)),
                                ),
                              )
                              .toList(),
                        ),
                      ),
                      const SizedBox(height: 8),
                      _buildField(_notesController, 'Order notes (optional)',
                          maxLines: 3),
                    ],
                    if (_errorMessage != null) ...[
                      const SizedBox(height: 12),
                      Text(
                        _errorMessage!,
                        style: GoogleFonts.kumbhSans(
                          color: AppTheme.error,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                    const SizedBox(height: 18),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppTheme.cardBg,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        children: [
                          _itemRow('Subtotal', formatMoney(cart.subtotal)),
                          _itemRow(
                            'Shipping',
                            cart.shippingFee == 0
                                ? 'Free'
                                : formatMoney(cart.shippingFee),
                          ),
                          const Divider(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Total',
                                  style: GoogleFonts.kumbhSans(
                                      fontWeight: FontWeight.w700)),
                              Text(
                                formatMoney(cart.total),
                                style: GoogleFonts.kumbhSans(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.primary,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isSubmitting ||
                                !authState.isAuthenticated ||
                                _loadingAccount ||
                                cart.items.isEmpty
                            ? null
                            : () => _submitOrder(cart),
                        child: Text(
                          _isSubmitting
                              ? 'PLACING ORDER...'
                              : authState.isAuthenticated
                                  ? 'PLACE ORDER · ${formatMoney(cart.total)}'
                                  : 'SIGN IN TO CONTINUE',
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'You pay on delivery by cash or Mobile Money.',
                      style: GoogleFonts.kumbhSans(
                          fontSize: 12, color: AppTheme.textMed),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }

  Widget _sectionTitle(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Text(text,
            style: GoogleFonts.kumbhSans(
                fontSize: 15, fontWeight: FontWeight.w700)),
      );

  Widget _itemRow(String label, String value) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(label, style: GoogleFonts.kumbhSans(fontSize: 13)),
            ),
            Text(value,
                style: GoogleFonts.kumbhSans(
                    fontWeight: FontWeight.w600, fontSize: 13)),
          ],
        ),
      );

  Widget _addressOption(DeliveryAddress address) {
    return RadioListTile<String?>(
      contentPadding: EdgeInsets.zero,
      value: address.id,
      title: Text(
        '${address.label}${address.isDefault ? ' · Default' : ''}',
        style: GoogleFonts.kumbhSans(fontWeight: FontWeight.w600),
      ),
      subtitle: Text(
        '${address.recipientName}, ${address.oneLine} · ${address.phone}',
        style: GoogleFonts.kumbhSans(fontSize: 12),
      ),
    );
  }

  Widget _buildAuthCard(BuildContext context, AuthState authState) {
    if (!authState.isSupported) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.cardBg,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.divider),
        ),
        child: Text(
          'Google sign-in is available on Android, iOS and the web. Use one of those to complete checkout.',
          style: GoogleFonts.kumbhSans(color: AppTheme.textMed, fontSize: 13),
        ),
      );
    }

    final signedInUser = authState.user;
    if (signedInUser != null) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.accentLight,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.accent.withValues(alpha: 0.35)),
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 24,
              backgroundColor: AppTheme.primary,
              backgroundImage: signedInUser.photoUrl == null
                  ? null
                  : NetworkImage(signedInUser.photoUrl!),
              child: signedInUser.photoUrl == null
                  ? Text(
                      signedInUser.initials,
                      style: GoogleFonts.kumbhSans(
                          color: Colors.white, fontWeight: FontWeight.w700),
                    )
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    signedInUser.bestDisplayName,
                    style: GoogleFonts.kumbhSans(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                      color: AppTheme.textDark,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    signedInUser.email,
                    style: GoogleFonts.kumbhSans(
                        fontSize: 12, color: AppTheme.textMed),
                  ),
                ],
              ),
            ),
            TextButton(
              onPressed: authState.isBusy
                  ? null
                  : () => context.read<AuthCubit>().signOut(),
              child: Text(
                'Switch',
                style: GoogleFonts.kumbhSans(
                    fontWeight: FontWeight.w700, color: AppTheme.primary),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.cardBg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Sign in with Google',
            style: GoogleFonts.kumbhSans(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: AppTheme.textDark,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Checkout uses your Google account email for order confirmations and tracking updates.',
            style: GoogleFonts.kumbhSans(fontSize: 12, color: AppTheme.textMed),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: authState.isBusy
                  ? null
                  : () => context.read<AuthCubit>().signInWithGoogle(),
              icon: authState.isBusy
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.login),
              label: Text(
                  authState.isBusy ? 'SIGNING IN...' : 'CONTINUE WITH GOOGLE'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildField(
    TextEditingController controller,
    String label, {
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      decoration: InputDecoration(
        labelText: label,
        labelStyle: GoogleFonts.kumbhSans(color: AppTheme.textMed),
      ),
      style: GoogleFonts.kumbhSans(color: AppTheme.textDark),
    );
  }
}
