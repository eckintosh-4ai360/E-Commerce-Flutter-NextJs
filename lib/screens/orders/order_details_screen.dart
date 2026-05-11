import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_theme.dart';

class OrderDetailsScreen extends StatelessWidget {
  final String orderId;
  final String status;
  final Color statusColor;
  final String date;

  const OrderDetailsScreen({
    super.key,
    required this.orderId,
    required this.status,
    required this.statusColor,
    required this.date,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text('Order Details',
            style: GoogleFonts.kumbhSans(fontWeight: FontWeight.w600)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Card
            Container(
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
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Order #$orderId',
                        style: GoogleFonts.kumbhSans(
                          fontWeight: FontWeight.w700,
                          fontSize: 18,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: statusColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          status,
                          style: GoogleFonts.kumbhSans(
                            color: statusColor,
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Icon(Icons.calendar_today_outlined,
                          size: 16, color: AppTheme.textMed),
                      const SizedBox(width: 8),
                      Text(
                        date,
                        style: GoogleFonts.kumbhSans(
                            color: AppTheme.textMed, fontSize: 14),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Tracking / Timeline
            Text(
              'Order Status',
              style: GoogleFonts.kumbhSans(
                fontWeight: FontWeight.w700,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 16),
            Container(
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
              child: Column(
                children: [
                  _buildTimelineStep(
                      'Order Placed', 'May 10, 2026 - 10:00 AM', true, true),
                  _buildTimelineStep('Processing', 'May 10, 2026 - 11:30 AM',
                      status != 'Cancelled', status != 'Cancelled'),
                  _buildTimelineStep('Shipped', 'May 11, 2026 - 09:00 AM',
                      status == 'Delivered', status == 'Delivered'),
                  _buildTimelineStep('Delivered', 'May 12, 2026 - 02:00 PM',
                      status == 'Delivered', false),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Items List
            Text(
              'Items',
              style: GoogleFonts.kumbhSans(
                fontWeight: FontWeight.w700,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 16),
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: 2,
              itemBuilder: (context, index) {
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.surface,
                    borderRadius: BorderRadius.circular(12),
                    border:
                        Border.all(color: Colors.grey.withValues(alpha: 0.1)),
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
                        child: const Icon(Icons.checkroom,
                            color: AppTheme.primary, size: 30),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              index == 0
                                  ? 'Premium Cotton T-Shirt'
                                  : 'Classic Denim Jeans',
                              style: GoogleFonts.kumbhSans(
                                fontWeight: FontWeight.w600,
                                fontSize: 15,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Qty: 1  |  Color: Black',
                              style: GoogleFonts.kumbhSans(
                                color: AppTheme.textMed,
                                fontSize: 13,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              index == 0 ? 'GH₵ 250.00' : 'GH₵ 350.00',
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
                );
              },
            ),
            const SizedBox(height: 24),

            // Delivery Address
            Text(
              'Delivery Address',
              style: GoogleFonts.kumbhSans(
                fontWeight: FontWeight.w700,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 16),
            Container(
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
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.location_on,
                        color: AppTheme.primary, size: 20),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'John Doe',
                          style: GoogleFonts.kumbhSans(
                            fontWeight: FontWeight.w600,
                            fontSize: 15,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '123 Oxford Street, Osu\nAccra, Ghana\n+233 55 123 4567',
                          style: GoogleFonts.kumbhSans(
                            color: AppTheme.textMed,
                            fontSize: 14,
                            height: 1.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Order Summary
            Text(
              'Order Summary',
              style: GoogleFonts.kumbhSans(
                fontWeight: FontWeight.w700,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 16),
            Container(
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
              child: Column(
                children: [
                  _buildSummaryRow('Subtotal', 'GH₵ 600.00'),
                  const SizedBox(height: 12),
                  _buildSummaryRow('Shipping', 'GH₵ 20.00'),
                  const SizedBox(height: 12),
                  _buildSummaryRow('Tax', 'GH₵ 30.00'),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    child: Divider(height: 1),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Total',
                        style: GoogleFonts.kumbhSans(
                          fontWeight: FontWeight.w700,
                          fontSize: 16,
                        ),
                      ),
                      Text(
                        'GH₵ 650.00',
                        style: GoogleFonts.kumbhSans(
                          fontWeight: FontWeight.w800,
                          color: AppTheme.primary,
                          fontSize: 18,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildTimelineStep(
      String title, String subtitle, bool isCompleted, bool isLast) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: isCompleted ? AppTheme.primary : AppTheme.cardBg,
                shape: BoxShape.circle,
                border: isCompleted
                    ? null
                    : Border.all(color: Colors.grey.withValues(alpha: 0.3)),
              ),
              child: isCompleted
                  ? const Icon(Icons.check, color: Colors.white, size: 14)
                  : null,
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 40,
                color: isCompleted
                    ? AppTheme.primary
                    : Colors.grey.withValues(alpha: 0.2),
              ),
          ],
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.kumbhSans(
                  fontWeight: FontWeight.w600,
                  color: isCompleted ? AppTheme.textDark : AppTheme.textMed,
                  fontSize: 15,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: GoogleFonts.kumbhSans(
                  color: AppTheme.textLight,
                  fontSize: 13,
                ),
              ),
              if (!isLast) const SizedBox(height: 20),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryRow(String title, String amount) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: GoogleFonts.kumbhSans(
            color: AppTheme.textMed,
            fontSize: 14,
          ),
        ),
        Text(
          amount,
          style: GoogleFonts.kumbhSans(
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
        ),
      ],
    );
  }
}
