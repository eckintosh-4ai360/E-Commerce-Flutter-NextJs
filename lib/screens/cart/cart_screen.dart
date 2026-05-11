// ignore_for_file: prefer_const_declarations

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../blocs/cart/cart_bloc.dart';
import '../../blocs/navigation/navigation_bloc.dart';
import '../../models/app_order.dart';
import '../../models/cart_item.dart';
import '../../theme/app_theme.dart';
import '../../widgets/checkout_sheet.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
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
            return _buildEmpty(context);
          }

          return Column(
            children: [
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: state.items.length,
                  itemBuilder: (_, index) => _CartItemCard(
                    item: state.items[index],
                  ),
                ),
              ),
              _buildCheckoutBar(context, state),
            ],
          );
        },
      ),
    );
  }

  Widget _buildEmpty(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 100,
            height: 100,
            decoration: const BoxDecoration(
              color: AppTheme.cardBg,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.shopping_bag_outlined,
              size: 48,
              color: AppTheme.textLight,
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Your cart is empty',
            style: GoogleFonts.kumbhSans(
              fontSize: 24,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Discover our beautiful collection',
            style: GoogleFonts.kumbhSans(
              color: AppTheme.textMed,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 28),
          ElevatedButton(
            onPressed: () =>
                context.read<NavigationBloc>().add(const NavigateTo(0)),
            child: const Text('SHOP NOW'),
          ),
        ],
      ),
    );
  }

  Widget _buildCheckoutBar(BuildContext context, CartState state) {
    final freeShippingThreshold = 300.0;
    final remaining = freeShippingThreshold - state.totalPrice;

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
          if (remaining > 0)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  const Icon(
                    Icons.local_shipping_outlined,
                    size: 16,
                    color: AppTheme.textMed,
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Add GHS ${remaining.toStringAsFixed(0)} more for free shipping',
                      style: GoogleFonts.kumbhSans(
                        fontSize: 12,
                        color: AppTheme.textMed,
                      ),
                    ),
                  ),
                ],
              ),
            )
          else
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  const Icon(
                    Icons.local_shipping,
                    size: 16,
                    color: AppTheme.success,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'You qualify for free shipping.',
                    style: GoogleFonts.kumbhSans(
                      fontSize: 12,
                      color: AppTheme.success,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Total',
                    style: GoogleFonts.kumbhSans(
                      fontSize: 12,
                      color: AppTheme.textMed,
                    ),
                  ),
                  Text(
                    'GHS ${state.totalPrice.toStringAsFixed(2)}',
                    style: GoogleFonts.kumbhSans(
                      fontSize: 28,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.primary,
                    ),
                  ),
                ],
              ),
              ElevatedButton(
                onPressed: () => _showCheckoutDialog(context, state),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 36,
                    vertical: 16,
                  ),
                ),
                child: const Text('CHECKOUT'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showClearDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
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
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Cancel',
              style: GoogleFonts.kumbhSans(color: AppTheme.textMed),
            ),
          ),
          TextButton(
            onPressed: () {
              context.read<CartBloc>().add(ClearCart());
              Navigator.pop(context);
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

  Future<void> _showCheckoutDialog(
    BuildContext context,
    CartState state,
  ) async {
    final order = await showModalBottomSheet<AppOrder>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => CheckoutSheet(
        items: state.items,
        cartTotal: state.totalPrice,
      ),
    );

    if (order == null || !context.mounted) {
      return;
    }

    context.read<CartBloc>().add(ClearCart());
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Order ${order.id} placed successfully. Tracking is now available in the app.',
          style: GoogleFonts.kumbhSans(),
        ),
        backgroundColor: AppTheme.success,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        duration: const Duration(seconds: 4),
      ),
    );
  }
}

class _CartItemCard extends StatelessWidget {
  const _CartItemCard({required this.item});

  final CartItem item;

  @override
  Widget build(BuildContext context) {
    final imagePath = item.product.primaryImage;

    return Dismissible(
      key: Key('cart_${item.product.id}'),
      direction: DismissDirection.endToStart,
      onDismissed: (_) =>
          context.read<CartBloc>().add(RemoveFromCart(item.product.id)),
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: AppTheme.error.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child:
            const Icon(Icons.delete_outline, color: AppTheme.error, size: 28),
      ),
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
              child: imagePath == null
                  ? _buildErrorImage()
                  : imagePath.startsWith('assets')
                      ? Image.asset(
                          imagePath,
                          width: 80,
                          height: 90,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => _buildErrorImage(),
                        )
                      : Image.network(
                          imagePath,
                          width: 80,
                          height: 90,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => _buildErrorImage(),
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
                  if (item.selectedColor != null)
                    Text(
                      item.selectedColor!,
                      style: GoogleFonts.kumbhSans(
                        fontSize: 12,
                        color: AppTheme.textMed,
                      ),
                    ),
                  const SizedBox(height: 8),
                  Text(
                    'GHS ${item.product.price.toStringAsFixed(0)}',
                    style: GoogleFonts.kumbhSans(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.primary,
                    ),
                  ),
                ],
              ),
            ),
            Column(
              children: [
                _qtyBtn(context, Icons.add, () {
                  context.read<CartBloc>().add(
                        UpdateCartQuantity(item.product.id, item.quantity + 1),
                      );
                }),
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
                _qtyBtn(context, Icons.remove, () {
                  context.read<CartBloc>().add(
                        UpdateCartQuantity(item.product.id, item.quantity - 1),
                      );
                }),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _qtyBtn(BuildContext context, IconData icon, VoidCallback onTap) {
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
        child: Icon(icon, size: 14, color: AppTheme.primary),
      ),
    );
  }

  Widget _buildErrorImage() {
    return Container(
      width: 80,
      height: 90,
      color: AppTheme.cardBg,
      child: const Icon(
        Icons.image_not_supported_outlined,
        color: AppTheme.textLight,
      ),
    );
  }
}
