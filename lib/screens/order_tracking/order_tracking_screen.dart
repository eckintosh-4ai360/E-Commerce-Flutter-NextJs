import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../models/app_order.dart';
import '../../services/order_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';
import '../orders/order_details_screen.dart';

class OrderTrackingScreen extends StatefulWidget {
  const OrderTrackingScreen({super.key, this.initialCode});

  final String? initialCode;

  @override
  State<OrderTrackingScreen> createState() => _OrderTrackingScreenState();
}

class _OrderTrackingScreenState extends State<OrderTrackingScreen> {
  late final _controller = TextEditingController(text: widget.initialCode);

  AppOrder? _order;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    if ((widget.initialCode ?? '').isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _trackOrder());
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _trackOrder() async {
    final code = _controller.text.trim().replaceFirst('#', '');
    if (code.isEmpty) {
      setState(() {
        _errorMessage = 'Enter your tracking code first.';
        _order = null;
      });
      return;
    }

    FocusScope.of(context).unfocus();
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final order = await context.read<OrderService>().trackOrder(code);
      if (mounted) setState(() => _order = order);
    } catch (error) {
      if (mounted) {
        setState(() {
          _order = null;
          _errorMessage = friendlyError(error);
        });
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text('Track Order',
            style: GoogleFonts.kumbhSans(fontWeight: FontWeight.w600)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            'Enter the 10-character tracking code from your confirmation email or My Orders.',
            style: GoogleFonts.kumbhSans(color: AppTheme.textMed, fontSize: 14),
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _controller,
            textCapitalization: TextCapitalization.characters,
            textInputAction: TextInputAction.search,
            onSubmitted: (_) => _trackOrder(),
            decoration: InputDecoration(
              hintText: 'e.g. 7K2M9QX4PA',
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
          const SizedBox(height: 16),
          SizedBox(
            height: 50,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _trackOrder,
              style: ElevatedButton.styleFrom(
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(_isLoading ? 'LOOKING UP ORDER...' : 'TRACK NOW'),
            ),
          ),
          if (_errorMessage != null) ...[
            const SizedBox(height: 16),
            Text(
              _errorMessage!,
              style: GoogleFonts.kumbhSans(
                  color: AppTheme.error, fontWeight: FontWeight.w600),
            ),
          ],
          const SizedBox(height: 28),
          if (_order == null)
            _buildPlaceholder()
          else
            _buildResult(_order!),
        ],
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Column(
      children: [
        Icon(Icons.local_shipping_outlined,
            size: 64, color: AppTheme.textLight.withValues(alpha: 0.4)),
        const SizedBox(height: 12),
        Text('Tracking information will appear here',
            style: GoogleFonts.kumbhSans(color: AppTheme.textMed)),
      ],
    );
  }

  Widget _buildResult(AppOrder order) {
    final formatter = DateFormat('MMM d, yyyy · h:mm a');
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text('Order #${order.trackingCode}',
                        style: GoogleFonts.kumbhSans(
                            fontSize: 20, fontWeight: FontWeight.w700)),
                  ),
                  StatusChip(status: order.status),
                ],
              ),
              const SizedBox(height: 4),
              Text('Placed ${formatter.format(order.createdAt.toLocal())}',
                  style: GoogleFonts.kumbhSans(color: AppTheme.textMed)),
              const SizedBox(height: 18),
              OrderProgress(status: order.status),
              const SizedBox(height: 14),
              Text('For: ${order.customerName}',
                  style: GoogleFonts.kumbhSans(fontWeight: FontWeight.w600)),
              if (order.isRedacted)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    'Contact and address details are hidden. Sign in with the account that placed this order to see them.',
                    style: GoogleFonts.kumbhSans(
                        fontSize: 12, color: AppTheme.textMed),
                  ),
                ),
            ],
          ),
        ),
        SectionCard(
          title: 'Timeline',
          child: OrderTimeline(events: order.events),
        ),
        SectionCard(
          title: 'Items',
          child: Column(
            children: [
              for (final item in order.items)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: ProductThumb(
                            imageUrl: item.imageUrl, width: 50, height: 50),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text('${item.productName} × ${item.quantity}',
                            style: GoogleFonts.kumbhSans(
                                fontWeight: FontWeight.w600)),
                      ),
                      Text(formatMoney(item.totalPrice),
                          style: GoogleFonts.kumbhSans(
                              fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),
              const Divider(),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Total',
                      style: GoogleFonts.kumbhSans(fontWeight: FontWeight.w700)),
                  Text(formatMoney(order.total),
                      style: GoogleFonts.kumbhSans(
                          fontWeight: FontWeight.w700, fontSize: 17)),
                ],
              ),
            ],
          ),
        ),
        if (!order.isRedacted)
          OutlinedButton(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (_) => OrderDetailsScreen(order: order)),
            ),
            child: const Text('MANAGE THIS ORDER'),
          ),
      ],
    );
  }
}
