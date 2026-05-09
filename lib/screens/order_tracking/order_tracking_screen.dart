import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../models/app_order.dart';
import '../../services/order_service.dart';
import '../../theme/app_theme.dart';

class OrderTrackingScreen extends StatefulWidget {
  const OrderTrackingScreen({super.key});

  @override
  State<OrderTrackingScreen> createState() => _OrderTrackingScreenState();
}

class _OrderTrackingScreenState extends State<OrderTrackingScreen> {
  final _controller = TextEditingController();
  final _orderService = OrderService();

  AppOrder? _order;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _trackOrder() async {
    final orderId = _controller.text.trim();
    if (orderId.isEmpty) {
      setState(() {
        _errorMessage = 'Enter an order ID first.';
        _order = null;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final order = await _orderService.trackOrder(orderId);
      setState(() {
        _order = order;
      });
    } catch (error) {
      setState(() {
        _order = null;
        _errorMessage = error.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(
          'Track Order',
          style: GoogleFonts.kumbhSans(fontWeight: FontWeight.w600),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Enter your order ID to get updates on your delivery status.',
              style: GoogleFonts.kumbhSans(
                color: AppTheme.textMed,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _controller,
              decoration: InputDecoration(
                hintText: 'Order ID',
                hintStyle: GoogleFonts.kumbhSans(color: AppTheme.textLight),
                prefixIcon: const Icon(Icons.search, color: AppTheme.textLight),
                filled: true,
                fillColor: AppTheme.surface,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _trackOrder,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
                child: Text(
                  _isLoading ? 'LOOKING UP ORDER...' : 'Track Now',
                  style: GoogleFonts.kumbhSans(
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                  ),
                ),
              ),
            ),
            if (_errorMessage != null) ...[
              const SizedBox(height: 16),
              Text(
                _errorMessage!,
                style: GoogleFonts.kumbhSans(
                  color: AppTheme.error,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
            const SizedBox(height: 40),
            _order == null ? _buildPlaceholder() : _buildOrderResult(_order!),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Center(
      child: Column(
        children: [
          Icon(
            Icons.local_shipping_outlined,
            size: 64,
            color: AppTheme.textLight.withValues(alpha: 0.3),
          ),
          const SizedBox(height: 16),
          Text(
            'Tracking information will appear here',
            style: GoogleFonts.kumbhSans(
              color: AppTheme.textMed,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderResult(AppOrder order) {
    final formatter = DateFormat('MMM d, yyyy - h:mm a');
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: AppTheme.surface,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Order ${order.id}',
                style: GoogleFonts.kumbhSans(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.accent.withValues(alpha: 0.25),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      order.status,
                      style: GoogleFonts.kumbhSans(
                        color: AppTheme.primary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      formatter.format(order.createdAt.toLocal()),
                      style: GoogleFonts.kumbhSans(color: AppTheme.textMed),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Text(
                'Customer: ${order.customerName}',
                style: GoogleFonts.kumbhSans(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 6),
              Text(
                'Phone: ${order.customerPhone}',
                style: GoogleFonts.kumbhSans(color: AppTheme.textMed),
              ),
              if (order.deliveryAddress != null &&
                  order.deliveryAddress!.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(
                  'Address: ${order.deliveryAddress}',
                  style: GoogleFonts.kumbhSans(color: AppTheme.textMed),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 20),
        Text(
          'Items',
          style: GoogleFonts.kumbhSans(
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 12),
        ...order.items.map(
          (item) => Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                Container(
                  width: 54,
                  height: 54,
                  decoration: BoxDecoration(
                    color: AppTheme.cardBg,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.shopping_bag_outlined,
                    color: AppTheme.primary,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.productName,
                        style: GoogleFonts.kumbhSans(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Qty ${item.quantity}'
                        '${item.selectedColor != null ? ' | ${item.selectedColor}' : ''}'
                        '${item.selectedSize != null ? ' | ${item.selectedSize}' : ''}',
                        style: GoogleFonts.kumbhSans(
                          color: AppTheme.textMed,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  'GHS ${item.totalPrice.toStringAsFixed(2)}',
                  style: GoogleFonts.kumbhSans(
                    color: AppTheme.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: AppTheme.surface,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              _buildSummaryRow('Subtotal', order.subtotal),
              const SizedBox(height: 10),
              _buildSummaryRow('Shipping', order.shippingFee),
              const Divider(height: 24),
              _buildSummaryRow('Total', order.total, emphasize: true),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryRow(
    String label,
    double amount, {
    bool emphasize = false,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.kumbhSans(
            color: emphasize ? AppTheme.textDark : AppTheme.textMed,
            fontWeight: emphasize ? FontWeight.w700 : FontWeight.w500,
          ),
        ),
        Text(
          'GHS ${amount.toStringAsFixed(2)}',
          style: GoogleFonts.kumbhSans(
            color: AppTheme.primary,
            fontWeight: FontWeight.w700,
            fontSize: emphasize ? 18 : 14,
          ),
        ),
      ],
    );
  }
}
