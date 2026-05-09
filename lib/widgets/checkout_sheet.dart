import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

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

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submitOrder() async {
    final customerName = _nameController.text.trim();
    final customerPhone = _phoneController.text.trim();

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
      final order = await _orderService.createOrder(
        customerName: customerName,
        customerPhone: customerPhone,
        customerEmail: _emailController.text.trim().isEmpty
            ? null
            : _emailController.text.trim(),
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
            'The order will be created by the Next.js backend and saved in the database.',
            style: GoogleFonts.kumbhSans(
              fontSize: 13,
              color: AppTheme.textMed,
            ),
          ),
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
            'Email address',
            keyboardType: TextInputType.emailAddress,
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
              onPressed: _isSubmitting ? null : _submitOrder,
              child: Text(_isSubmitting ? 'PLACING ORDER...' : 'PLACE ORDER'),
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
