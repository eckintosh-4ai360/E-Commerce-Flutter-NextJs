import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../models/app_order.dart';
import '../../theme/app_theme.dart';

class OrderDetailsScreen extends StatelessWidget {
  const OrderDetailsScreen({
    super.key,
    required this.order,
  });

  final AppOrder order;

  @override
  Widget build(BuildContext context) {
    final formatter = DateFormat('MMM d, yyyy - h:mm a');

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(
          'Order Details',
          style: GoogleFonts.kumbhSans(fontWeight: FontWeight.w600),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Order #${order.trackingCode}',
                              style: GoogleFonts.kumbhSans(
                                fontWeight: FontWeight.w700,
                                fontSize: 18,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              order.id,
                              style: GoogleFonts.kumbhSans(
                                color: AppTheme.textLight,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: _statusColor(order.status).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          order.displayStatus,
                          style: GoogleFonts.kumbhSans(
                            color: _statusColor(order.status),
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildInfoRow('Placed', formatter.format(order.createdAt.toLocal())),
                  const SizedBox(height: 10),
                  _buildInfoRow('Customer', order.customerName),
                  const SizedBox(height: 10),
                  _buildInfoRow('Phone', order.customerPhone),
                  if (order.customerEmail != null && order.customerEmail!.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    _buildInfoRow('Email', order.customerEmail!),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Items',
              style: GoogleFonts.kumbhSans(
                fontWeight: FontWeight.w700,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 16),
            ...order.items.map(
              (item) => Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 70,
                      height: 70,
                      decoration: BoxDecoration(
                        color: AppTheme.cardBg,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: item.imageUrl == null
                          ? const Icon(
                              Icons.shopping_bag_outlined,
                              color: AppTheme.primary,
                              size: 30,
                            )
                          : ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.network(
                                item.imageUrl!,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => const Icon(
                                  Icons.shopping_bag_outlined,
                                  color: AppTheme.primary,
                                  size: 30,
                                ),
                              ),
                            ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.productName,
                            style: GoogleFonts.kumbhSans(
                              fontWeight: FontWeight.w600,
                              fontSize: 15,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _itemSubtitle(item),
                            style: GoogleFonts.kumbhSans(
                              color: AppTheme.textMed,
                              fontSize: 13,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'GHS ${item.totalPrice.toStringAsFixed(2)}',
                            style: GoogleFonts.kumbhSans(
                              fontWeight: FontWeight.w700,
                              color: AppTheme.primary,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Delivery',
              style: GoogleFonts.kumbhSans(
                fontWeight: FontWeight.w700,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 16),
            _buildSectionCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    order.deliveryAddress?.trim().isNotEmpty == true
                        ? order.deliveryAddress!
                        : 'No delivery address was provided for this order.',
                    style: GoogleFonts.kumbhSans(
                      color: order.deliveryAddress?.trim().isNotEmpty == true
                          ? AppTheme.textDark
                          : AppTheme.textMed,
                      fontSize: 14,
                      height: 1.5,
                    ),
                  ),
                  if (order.notes != null && order.notes!.trim().isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Text(
                      'Order Notes',
                      style: GoogleFonts.kumbhSans(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      order.notes!,
                      style: GoogleFonts.kumbhSans(
                        color: AppTheme.textMed,
                        fontSize: 13,
                        height: 1.5,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Order Summary',
              style: GoogleFonts.kumbhSans(
                fontWeight: FontWeight.w700,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 16),
            _buildSectionCard(
              child: Column(
                children: [
                  _buildSummaryRow('Subtotal', order.subtotal),
                  const SizedBox(height: 12),
                  _buildSummaryRow('Shipping', order.shippingFee),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    child: Divider(height: 1),
                  ),
                  _buildSummaryRow('Total', order.total, emphasize: true),
                ],
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionCard({required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: child,
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 72,
          child: Text(
            label,
            style: GoogleFonts.kumbhSans(
              color: AppTheme.textMed,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: GoogleFonts.kumbhSans(
              color: AppTheme.textDark,
              fontSize: 13,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryRow(
    String title,
    double amount, {
    bool emphasize = false,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
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

  String _itemSubtitle(AppOrderItem item) {
    final details = <String>['Qty ${item.quantity}'];
    if (item.selectedColor != null && item.selectedColor!.trim().isNotEmpty) {
      details.add(item.selectedColor!.trim());
    }
    if (item.selectedSize != null && item.selectedSize!.trim().isNotEmpty) {
      details.add(item.selectedSize!.trim());
    }
    return details.join(' | ');
  }

  Color _statusColor(String status) {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return AppTheme.success;
      case 'PROCESSING':
      case 'SHIPPED':
        return AppTheme.accent;
      case 'CANCELLED':
        return AppTheme.error;
      default:
        return AppTheme.primary;
    }
  }
}
