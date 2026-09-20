import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../blocs/cart/cart_bloc.dart';
import '../../blocs/catalog/catalog_cubit.dart';
import '../../models/app_order.dart';
import '../../services/order_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';
import '../account/returns_refunds_screen.dart';
import '../product_detail/product_detail_screen.dart';

/// Pops with the latest [AppOrder] when something changed (e.g. cancelled).
class OrderDetailsScreen extends StatefulWidget {
  const OrderDetailsScreen({
    super.key,
    required this.order,
    this.justPlaced = false,
  });

  final AppOrder order;
  final bool justPlaced;

  @override
  State<OrderDetailsScreen> createState() => _OrderDetailsScreenState();
}

class _OrderDetailsScreenState extends State<OrderDetailsScreen> {
  late AppOrder _order = widget.order;
  bool _changed = false;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    try {
      final latest =
          await context.read<OrderService>().trackOrder(_order.id);
      if (mounted && !latest.isRedacted) {
        setState(() => _order = latest);
      }
    } catch (_) {
      // Keep showing what we have; this is only a freshness check.
    }
  }

  Future<void> _cancel() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('Cancel this order?',
            style: GoogleFonts.kumbhSans(fontWeight: FontWeight.w700)),
        content: Text(
          "We'll stop preparing it and email you a confirmation. This can't be undone.",
          style: GoogleFonts.kumbhSans(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Keep order'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: Text('Cancel order',
                style: GoogleFonts.kumbhSans(
                    color: AppTheme.error, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() => _busy = true);
    try {
      final updated = await context.read<OrderService>().cancelOrder(_order.id);
      if (!mounted) return;
      setState(() {
        _order = updated;
        _changed = true;
      });
      showAppSnack(context, 'Your order has been cancelled.');
    } catch (error) {
      if (mounted) showAppSnack(context, friendlyError(error), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _buyAgain() {
    final catalog = context.read<CatalogCubit>().state.products;
    final byId = {for (final product in catalog) product.id: product};
    var added = 0;
    for (final item in _order.items) {
      final product = byId[item.productId];
      if (product != null && product.inStock) {
        context.read<CartBloc>().add(AddToCart(
              product,
              quantity: item.quantity,
              selectedColor: item.selectedColor,
              selectedSize: item.selectedSize,
            ));
        added++;
      }
    }
    if (added == 0) {
      showAppSnack(context, 'These items are no longer available.', error: true);
      return;
    }
    showAppSnack(
      context,
      added == _order.items.length
          ? 'All items were added to your cart.'
          : '$added of ${_order.items.length} items were added; the rest are unavailable.',
    );
    goToCartTab(context);
  }

  @override
  Widget build(BuildContext context) {
    final order = _order;
    final formatter = DateFormat('MMM d, yyyy · h:mm a');

    return PopScope<AppOrder>(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) {
          Navigator.pop(context, _changed ? _order : null);
        }
      },
      child: Scaffold(
        backgroundColor: AppTheme.background,
        appBar: AppBar(
          title: Text('Order Details',
              style: GoogleFonts.kumbhSans(fontWeight: FontWeight.w600)),
          backgroundColor: Colors.transparent,
          elevation: 0,
        ),
        body: RefreshIndicator(
          onRefresh: _refresh,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              if (widget.justPlaced)
                Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppTheme.success.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle, color: AppTheme.success),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Order placed! A confirmation is on its way to ${order.customerEmail ?? 'your email'}. Tracking code: ${order.trackingCode}',
                          style: GoogleFonts.kumbhSans(
                              color: AppTheme.success,
                              fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                ),
              SectionCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Order #${order.trackingCode}',
                                  style: GoogleFonts.kumbhSans(
                                      fontWeight: FontWeight.w700, fontSize: 18)),
                              const SizedBox(height: 4),
                              Text(
                                'Placed ${formatter.format(order.createdAt.toLocal())}',
                                style: GoogleFonts.kumbhSans(
                                    color: AppTheme.textMed, fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                        StatusChip(status: order.status),
                      ],
                    ),
                    const SizedBox(height: 18),
                    OrderProgress(status: order.status),
                  ],
                ),
              ),
              SectionCard(
                title: 'Items (${order.items.length})',
                child: Column(
                  children: [
                    for (final item in order.items)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Row(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: ProductThumb(
                                  imageUrl: item.imageUrl, width: 54, height: 54),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(item.productName,
                                      style: GoogleFonts.kumbhSans(
                                          fontWeight: FontWeight.w600)),
                                  Text(
                                    [
                                      'Qty ${item.quantity}',
                                      if (item.selectedColor != null) item.selectedColor!,
                                      if (item.selectedSize != null) 'Size ${item.selectedSize}',
                                    ].join(' · '),
                                    style: GoogleFonts.kumbhSans(
                                        fontSize: 12, color: AppTheme.textMed),
                                  ),
                                ],
                              ),
                            ),
                            Text(formatMoney(item.totalPrice),
                                style: GoogleFonts.kumbhSans(
                                    fontWeight: FontWeight.w700)),
                          ],
                        ),
                      ),
                    const Divider(height: 20),
                    _summaryRow('Subtotal', formatMoney(order.subtotal)),
                    _summaryRow('Shipping',
                        order.shippingFee == 0 ? 'Free' : formatMoney(order.shippingFee)),
                    _summaryRow('Total', formatMoney(order.total), bold: true),
                  ],
                ),
              ),
              SectionCard(
                title: 'Delivery',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _detailRow(Icons.person_outline, order.customerName),
                    if (order.deliveryAddress != null)
                      _detailRow(Icons.location_on_outlined, order.deliveryAddress!),
                    _detailRow(Icons.phone_outlined, order.customerPhone),
                    if (order.customerEmail != null)
                      _detailRow(Icons.email_outlined, order.customerEmail!),
                    _detailRow(Icons.account_balance_wallet_outlined,
                        paymentMethodLabel(order.paymentMethod)),
                    if (order.notes != null && order.notes!.isNotEmpty)
                      _detailRow(Icons.sticky_note_2_outlined, order.notes!),
                  ],
                ),
              ),
              SectionCard(
                title: 'Timeline',
                child: OrderTimeline(events: order.events),
              ),
              if (order.returnRequests.isNotEmpty)
                SectionCard(
                  title: 'Returns',
                  child: Column(
                    children: [
                      for (final request in order.returnRequests)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  request.adminNote == null
                                      ? request.reason
                                      : '${request.reason} — ${request.adminNote}',
                                  style: GoogleFonts.kumbhSans(fontSize: 13),
                                ),
                              ),
                              StatusChip(status: request.status),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
              if (order.canRequestReturn)
                OutlinedButton.icon(
                  onPressed: () async {
                    await Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) =>
                            ReturnsRefundsScreen(initialOrderId: order.id),
                      ),
                    );
                    _changed = true;
                    _refresh();
                  },
                  icon: const Icon(Icons.replay),
                  label: const Text('REQUEST A RETURN'),
                ),
              const SizedBox(height: 10),
              OutlinedButton.icon(
                onPressed: _buyAgain,
                icon: const Icon(Icons.shopping_bag_outlined),
                label: const Text('BUY AGAIN'),
              ),
              if (order.canCancel) ...[
                const SizedBox(height: 10),
                TextButton.icon(
                  onPressed: _busy ? null : _cancel,
                  icon: const Icon(Icons.cancel_outlined, color: AppTheme.error),
                  label: Text(
                    _busy ? 'CANCELLING...' : 'CANCEL ORDER',
                    style: GoogleFonts.kumbhSans(
                        color: AppTheme.error, fontWeight: FontWeight.w700),
                  ),
                ),
              ],
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _summaryRow(String label, String value, {bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: GoogleFonts.kumbhSans(
                  color: bold ? AppTheme.textDark : AppTheme.textMed,
                  fontWeight: bold ? FontWeight.w700 : FontWeight.w500)),
          Text(value,
              style: GoogleFonts.kumbhSans(
                  fontWeight: FontWeight.w700, fontSize: bold ? 17 : 14)),
        ],
      ),
    );
  }

  Widget _detailRow(IconData icon, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: AppTheme.textLight),
          const SizedBox(width: 10),
          Expanded(child: Text(value, style: GoogleFonts.kumbhSans(fontSize: 14))),
        ],
      ),
    );
  }
}
