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
              style: GoogleFonts.kumbhSans(color: AppTheme.textMed, fontSize: 14),
            ),
            const SizedBox(height: 24),
            TextField(
              decoration: InputDecoration(
                hintText: 'Order ID (e.g., 10045)',
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
                onPressed: () {},
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
                child: Text(
                  'Track Now',
                  style: GoogleFonts.kumbhSans(
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 40),
            // Placeholder for tracking results
            Center(
              child: Column(
                children: [
                  Icon(Icons.local_shipping_outlined, size: 64, color: AppTheme.textLight.withValues(alpha: 0.3)),
                  const SizedBox(height: 16),
                  Text(
                    'Tracking information will appear here',
                    style: GoogleFonts.kumbhSans(color: AppTheme.textMed, fontSize: 14),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
