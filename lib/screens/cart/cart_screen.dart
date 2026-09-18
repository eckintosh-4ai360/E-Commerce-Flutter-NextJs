import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../blocs/cart/cart_bloc.dart';
import '../../blocs/navigation/navigation_bloc.dart';
import '../../config/app_config.dart';
import '../../models/app_order.dart';
import '../../models/cart_item.dart';
import '../../theme/app_theme.dart';
import '../../widgets/checkout_sheet.dart';
import '../../widgets/common.dart';
import '../orders/order_details_screen.dart';
import '../product_detail/product_detail_screen.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocListener<CartBloc, CartState>(
      listenWhen: (previous, current) =>
          current.removedProducts.isNotEmpty &&
          previous.removedProducts != current.removedProducts,
      listener: (context, state) => showAppSnack(
        context,
        '${state.removedProducts.join(', ')} ${state.removedProducts.length == 1 ? 'is' : 'are'} no longer available and was removed from your cart.',
        error: true,
      ),
      child: Scaffold(
        backgroundColor: AppTheme.background,
        appBar: AppBar(
          title: const Text('My Cart'),
          backgroundColor: Colors.transparent,
          elevation: 0,
          actions: [
            BlocBuilder<CartBloc, CartState>(
              builder: (context, state) {
                if (state.items.isEmpty) {
                  return const SizedBox();
                }
                return TextButton(
                  onPressed: () => _showClearDialog(context),
                  child: Text(
                    'Clear',
                    style: GoogleFonts.kumbhSans(
                      color: AppTheme.error,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                );
              },
            ),
          ],
        ),
        body: BlocBuilder<CartBloc, CartState>(
          builder: (context, state) {
            if (state.items.isEmpty) {
              return EmptyView(
                icon: Icons.shopping_bag_outlined,
                title: 'Your cart is empty',
                message: 'Discover our beautiful collection',
                action: ElevatedButton(
                  onPressed: () =>
                      context.read<NavigationBloc>().add(const NavigateTo(1)),
                  child: const Text('SHOP NOW'),
                ),
              );
            }

            return Column(
              children: [
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: state.items.length,
                    itemBuilder: (_, index) =>
                        _CartItemCard(item: state.items[index]),
                  ),
                ),
                _buildCheckoutBar(context, state),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildCheckoutBar(BuildContext context, CartState state) {
    final remaining = AppConfig.freeShippingThreshold - state.subtotal;
    final progress =
        (state.subtotal / AppConfig.freeShippingThreshold).clamp(0.0, 1.0);

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(
                remaining > 0 ? Icons.local_shipping_outlined : Icons.local_shipping,
                size: 16,
                color: remaining > 0 ? AppTheme.textMed : AppTheme.success,
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  remaining > 0
                      ? 'Add ${formatPrice(remaining)} more for free shipping'
                      : 'You qualify for free shipping.',
                  style: GoogleFonts.kumbhSans(
                    fontSize: 12,
                    color: remaining > 0 ? AppTheme.textMed : AppTheme.success,
                    fontWeight: remaining > 0 ? FontWeight.w400 : FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 5,
              backgroundColor: AppTheme.cardBg,
              color: AppTheme.accent,
            ),
          ),
          const SizedBox(height: 12),
          _summaryRow('Subtotal (${state.totalItems} items)', formatMoney(state.subtotal)),
          _summaryRow(
            'Shipping',
            state.shippingFee == 0 ? 'Free' : formatMoney(state.shippingFee),
          ),
          const Divider(height: 18),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Total',
                      style: GoogleFonts.kumbhSans(
                          fontSize: 12, color: AppTheme.textMed)),
                  Text(
                    formatMoney(state.total),
                    style: GoogleFonts.kumbhSans(
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.primary,
                    ),
                  ),
                ],
              ),
              ElevatedButton(
                onPressed: state.hasUnavailableItems
                    ? null
                    : () => _showCheckout(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                ),
                child: const Text('CHECKOUT'),
              ),
            ],
          ),
          if (state.hasUnavailableItems)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                'Remove out-of-stock items to continue.',
                style: GoogleFonts.kumbhSans(color: AppTheme.error, fontSize: 12),
              ),
            ),
        ],
      ),
    );
  }

  Widget _summaryRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: GoogleFonts.kumbhSans(fontSize: 13, color: AppTheme.textMed)),
          Text(value,
              style: GoogleFonts.kumbhSans(
                  fontSize: 13, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  void _showClearDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: Text(
          'Clear Cart',
          style: GoogleFonts.kumbhSans(fontWeight: FontWeight.w700),
        ),
        content: Text(
          'Remove all items from your cart?',
          style: GoogleFonts.kumbhSans(fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text(
              'Cancel',
              style: GoogleFonts.kumbhSans(color: AppTheme.textMed),
            ),
          ),
          TextButton(
            onPressed: () {
              context.read<CartBloc>().add(const ClearCart());
              Navigator.pop(dialogContext);
            },
            child: Text(
              'Clear',
              style: GoogleFonts.kumbhSans(
                color: AppTheme.error,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showCheckout(BuildContext context) async {
    final order = await showModalBottomSheet<AppOrder>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => const CheckoutSheet(),
    );

    if (order == null || !context.mounted) {
      return;
    }

    context.read<CartBloc>().add(const ClearCart());
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => OrderDetailsScreen(order: order, justPlaced: true),
      ),
    );
  }
}

class _CartItemCard extends StatelessWidget {
  const _CartItemCard({required this.item});

  final CartItem item;

  @override
  Widget build(BuildContext context) {
    final options = item.optionsLabel;

    return Dismissible(
      key: ValueKey('cart_${item.lineKey}'),
      direction: DismissDirection.endToStart,
      onDismissed: (_) =>
          context.read<CartBloc>().add(RemoveFromCart(item.lineKey)),
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: AppTheme.error.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Icon(Icons.delete_outline, color: AppTheme.error, size: 28),
      ),
      child: GestureDetector(
        onTap: () => openProduct(context, item.product),
        child: Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppTheme.surface,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: ProductThumb(
                  imageUrl: item.product.primaryImage,
                  width: 80,
                  height: 90,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.product.name,
                      style: GoogleFonts.kumbhSans(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (options.isNotEmpty)
                      Text(
                        options,
                        style: GoogleFonts.kumbhSans(
                          fontSize: 12,
                          color: AppTheme.textMed,
                        ),
                      ),
                    if (!item.product.inStock)
                      Text(
                        'Out of stock',
                        style: GoogleFonts.kumbhSans(
                          fontSize: 12,
                          color: AppTheme.error,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    const SizedBox(height: 8),
                    Text(
                      formatPrice(item.product.price),
                      style: GoogleFonts.kumbhSans(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.primary,
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                children: [
                  _qtyBtn(
                    Icons.add,
                    item.quantity >= AppConfig.maxQuantityPerLine
                        ? null
                        : () => context.read<CartBloc>().add(
                              UpdateCartQuantity(item.lineKey, item.quantity + 1),
                            ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Text(
                      '${item.quantity}',
                      style: GoogleFonts.kumbhSans(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  _qtyBtn(
                    Icons.remove,
                    () => context.read<CartBloc>().add(
                          UpdateCartQuantity(item.lineKey, item.quantity - 1),
                        ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _qtyBtn(IconData icon, VoidCallback? onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: AppTheme.cardBg,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: AppTheme.divider),
        ),
        child: Icon(icon,
            size: 14,
            color: onTap == null ? AppTheme.textLight : AppTheme.primary),
      ),
    );
  }
}
