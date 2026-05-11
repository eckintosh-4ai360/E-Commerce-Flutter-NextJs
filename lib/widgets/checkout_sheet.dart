import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';

import '../blocs/auth/auth_cubit.dart';
import '../models/app_auth_user.dart';
import '../models/app_order.dart';
import '../models/cart_item.dart';
import '../services/order_service.dart';
import '../theme/app_theme.dart';

class CheckoutSheet extends StatefulWidget {
  const CheckoutSheet({
    super.key,
    required this.items,
    required this.cartTotal,
  });

  final List<CartItem> items;
  final double cartTotal;

  @override
  State<CheckoutSheet> createState() => _CheckoutSheetState();
}

class _CheckoutSheetState extends State<CheckoutSheet> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _addressController = TextEditingController();
  final _notesController = TextEditingController();
  final _orderService = OrderService();

  bool _isSubmitting = false;
  String? _errorMessage;
  String? _lastAuthedEmail;
  String? _lastAuthedName;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _syncAuthFields(context.read<AuthCubit>().state.user);
  }

  Future<void> _submitOrder() async {
    final authCubit = context.read<AuthCubit>();
    final authState = authCubit.state;
    final signedInUser = authState.user;
    final customerName = _nameController.text.trim();
    final customerPhone = _phoneController.text.trim();

    if (!authState.isAuthenticated || signedInUser == null) {
      setState(() {
        _errorMessage = 'Sign in with Google to continue to checkout.';
      });
      return;
    }

    if (customerName.isEmpty || customerPhone.isEmpty) {
      setState(() {
        _errorMessage = 'Name and phone number are required.';
      });
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      final idToken = await authCubit.getIdToken(forceRefresh: true);
      if (idToken == null || idToken.isEmpty) {
        throw Exception(
            'We could not verify your Google session. Please sign in again.');
      }

      final order = await _orderService.createOrder(
        idToken: idToken,
        customerName: customerName,
        customerPhone: customerPhone,
        customerEmail: signedInUser.email,
        deliveryAddress: _addressController.text.trim().isEmpty
            ? null
            : _addressController.text.trim(),
        notes: _notesController.text.trim().isEmpty
            ? null
            : _notesController.text.trim(),
        items: widget.items,
      );

      if (!mounted) {
        return;
      }

      Navigator.pop<AppOrder>(context, order);
    } catch (error) {
      setState(() {
        _errorMessage = error.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
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
        _syncAuthFields(state.user);
        final errorMessage = state.errorMessage;
        if (errorMessage != null && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(errorMessage)),
          );
        }
      },
      child: BlocBuilder<AuthCubit, AuthState>(
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
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Sign in with Google before placing your order so we can send tracking updates to your email.',
                  style: GoogleFonts.kumbhSans(
                    fontSize: 13,
                    color: AppTheme.textMed,
                  ),
                ),
                const SizedBox(height: 20),
                _buildAuthCard(context, authState),
                const SizedBox(height: 20),
                ...widget.items.map(
                  (item) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            '${item.product.name} x ${item.quantity}',
                            style: GoogleFonts.kumbhSans(fontSize: 13),
                          ),
                        ),
                        Text(
                          'GHS ${item.totalPrice.toStringAsFixed(2)}',
                          style: GoogleFonts.kumbhSans(
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const Divider(height: 28),
                _buildField(_nameController, 'Full name'),
                const SizedBox(height: 12),
                _buildField(
                  _phoneController,
                  'Phone number',
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 12),
                _buildField(
                  _emailController,
                  'Google account email',
                  keyboardType: TextInputType.emailAddress,
                  readOnly: true,
                ),
                const SizedBox(height: 12),
                _buildField(
                  _addressController,
                  'Delivery address',
                  maxLines: 2,
                ),
                const SizedBox(height: 12),
                _buildField(
                  _notesController,
                  'Order notes',
                  maxLines: 3,
                ),
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
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Cart subtotal',
                        style: GoogleFonts.kumbhSans(color: AppTheme.textMed),
                      ),
                      Text(
                        'GHS ${widget.cartTotal.toStringAsFixed(2)}',
                        style: GoogleFonts.kumbhSans(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.primary,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isSubmitting || !authState.isAuthenticated
                        ? null
                        : _submitOrder,
                    child: Text(
                      _isSubmitting
                          ? 'PLACING ORDER...'
                          : authState.isAuthenticated
                              ? 'PLACE ORDER'
                              : 'SIGN IN TO CONTINUE',
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _syncAuthFields(AppAuthUser? user) {
    if (!mounted) {
      return;
    }

    if (user == null) {
      if (_lastAuthedEmail != null &&
          _emailController.text.trim() == _lastAuthedEmail) {
        _emailController.clear();
      }
      if (_lastAuthedName != null &&
          _nameController.text.trim() == _lastAuthedName) {
        _nameController.clear();
      }
      _lastAuthedEmail = null;
      _lastAuthedName = null;
      return;
    }

    final trimmedName = user.displayName?.trim();
    if ((_nameController.text.trim().isEmpty ||
            _nameController.text.trim() == (_lastAuthedName ?? '')) &&
        trimmedName != null &&
        trimmedName.isNotEmpty) {
      _nameController.text = trimmedName;
      _lastAuthedName = trimmedName;
    }

    _emailController.text = user.email;
    _lastAuthedEmail = user.email;
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
          'Google sign-in is available on Android, iOS, and web builds. Use one of those targets to complete checkout with email tracking updates.',
          style: GoogleFonts.kumbhSans(
            color: AppTheme.textMed,
            fontSize: 13,
          ),
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
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
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
                      fontSize: 12,
                      color: AppTheme.textMed,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'We will send order status updates to this Google account.',
                    style: GoogleFonts.kumbhSans(
                      fontSize: 11,
                      color: AppTheme.textMed,
                    ),
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
                  fontWeight: FontWeight.w700,
                  color: AppTheme.primary,
                ),
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
            style: GoogleFonts.kumbhSans(
              fontSize: 12,
              color: AppTheme.textMed,
            ),
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
                authState.isBusy ? 'SIGNING IN...' : 'CONTINUE WITH GOOGLE',
              ),
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
    bool readOnly = false,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      readOnly: readOnly,
      decoration: InputDecoration(
        labelText: label,
        labelStyle: GoogleFonts.kumbhSans(color: AppTheme.textMed),
      ),
      style: GoogleFonts.kumbhSans(color: AppTheme.textDark),
    );
  }
}
