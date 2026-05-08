import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../blocs/cart/cart_bloc.dart';
import '../../blocs/cart/cart_event.dart';
import '../../blocs/cart/cart_state.dart';
import '../../blocs/navigation/navigation_bloc.dart';
import '../../models/cart_item.dart';
import '../../theme/app_theme.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('My Cart'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          BlocBuilder<CartBloc, CartState>(
            builder: (context, state) {
              if (state.items.isEmpty) return const SizedBox();
              return TextButton(
                onPressed: () => _showClearDialog(context),
                child: Text('Clear',
                    style: GoogleFonts.kumbhSans(
                        color: AppTheme.error, fontWeight: FontWeight.w600)),
              );
            },
          ),
        ],
      ),
      body: BlocBuilder<CartBloc, CartState>(
        builder: (context, state) {
          if (state.items.isEmpty) return _buildEmpty(context);
          return Column(
            children: [
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: state.items.length,
                  itemBuilder: (_, i) => _CartItemCard(item: state.items[i]),
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
            decoration: BoxDecoration(
              color: AppTheme.cardBg,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.shopping_bag_outlined,
                size: 48, color: AppTheme.textLight),
          ),
          const SizedBox(height: 20),
          Text('Your cart is empty',
              style: GoogleFonts.kumbhSans(
                  fontSize: 24, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Text('Discover our beautiful collection',
              style: GoogleFonts.kumbhSans(color: AppTheme.textMed, fontSize: 13)),
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
    final freeShippingThreshold = 3000.0;
    final remaining = freeShippingThreshold - state.totalPrice;

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
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
                  const Icon(Icons.local_shipping_outlined,
                      size: 16, color: AppTheme.textMed),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Add ₵${remaining.toStringAsFixed(0)} more for free shipping',
                      style: GoogleFonts.kumbhSans(
                          fontSize: 12, color: AppTheme.textMed),
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
                  const Icon(Icons.local_shipping, size: 16, color: AppTheme.success),
                  const SizedBox(width: 6),
                  Text(
                    'You qualify for free shipping! 🎉',
                    style: GoogleFonts.kumbhSans(
                        fontSize: 12,
                        color: AppTheme.success,
                        fontWeight: FontWeight.w600),
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
                  Text('Total',
                      style: GoogleFonts.kumbhSans(
                          fontSize: 12, color: AppTheme.textMed)),
                  Text(
                    '₵${state.totalPrice.toStringAsFixed(2)}',
                    style: GoogleFonts.kumbhSans(
                        fontSize: 28,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.primary),
                  ),
                ],
              ),
              ElevatedButton(
                onPressed: () => _showCheckoutDialog(context, state),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  padding: const EdgeInsets.symmetric(horizontal: 36, vertical: 16),
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
        title: Text('Clear Cart',
            style: GoogleFonts.kumbhSans(fontWeight: FontWeight.w700)),
        content: Text('Remove all items from your cart?',
            style: GoogleFonts.kumbhSans(fontSize: 14)),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Cancel',
                  style: GoogleFonts.kumbhSans(color: AppTheme.textMed))),
          TextButton(
            onPressed: () {
              context.read<CartBloc>().add(ClearCart());
              Navigator.pop(context);
            },
            child: Text('Clear',
                style: GoogleFonts.kumbhSans(
                    color: AppTheme.error, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  void _showCheckoutDialog(BuildContext context, CartState state) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Order Summary',
                style: GoogleFonts.kumbhSans(
                    fontSize: 24, fontWeight: FontWeight.w700)),
            const SizedBox(height: 16),
            ...state.items.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                            '${item.product.name} × ${item.quantity}',
                            style: GoogleFonts.kumbhSans(fontSize: 13)),
                      ),
                      Text(
                        '₵${item.totalPrice.toStringAsFixed(2)}',
                        style: GoogleFonts.kumbhSans(
                            fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                    ],
                  ),
                )),
            const Divider(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Total',
                    style: GoogleFonts.kumbhSans(
                        fontWeight: FontWeight.w700, fontSize: 16)),
                Text(
                  '₵${state.totalPrice.toStringAsFixed(2)}',
                  style: GoogleFonts.kumbhSans(
                      fontSize: 24, fontWeight: FontWeight.w700),
                ),
              ],
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  context.read<CartBloc>().add(ClearCart());
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Order placed! We\'ll contact you shortly. Call +233 59 859 9687',
                          style: GoogleFonts.kumbhSans()),
                      backgroundColor: AppTheme.success,
                      behavior: SnackBarBehavior.floating,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8)),
                      duration: const Duration(seconds: 4),
                    ),
                  );
                },
                child: const Text('PLACE ORDER'),
              ),
            ),
            const SizedBox(height: 12),
            Center(
              child: Text(
                'Contact us: +233 59 859 9687 | info@esiarkomall.com',
                style: GoogleFonts.kumbhSans(fontSize: 11, color: AppTheme.textMed),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }
}

class _CartItemCard extends StatelessWidget {
  final CartItem item;
  const _CartItemCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: Key('cart_${item.product.id}'),
      direction: DismissDirection.endToStart,
      onDismissed: (_) => context
          .read<CartBloc>()
          .add(RemoveFromCart(item.product.id)),
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: AppTheme.error.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Icon(Icons.delete_outline, color: AppTheme.error, size: 28),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: item.product.images.first.startsWith('assets')
                  ? Image.asset(
                      item.product.images.first,
                      width: 80,
                      height: 90,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _buildErrorImage(),
                    )
                  : Image.network(
                      item.product.images.first,
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
                        fontSize: 14, fontWeight: FontWeight.w600),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (item.selectedColor != null)
                    Text(item.selectedColor!,
                        style: GoogleFonts.kumbhSans(
                            fontSize: 12, color: AppTheme.textMed)),
                  const SizedBox(height: 8),
                  Text(
                    '₵${item.product.price.toStringAsFixed(0)}',
                    style: GoogleFonts.kumbhSans(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.primary),
                  ),
                ],
              ),
            ),
            Column(
              children: [
                _qtyBtn(context, Icons.add, () {
                  context.read<CartBloc>().add(
                      UpdateCartQuantity(item.product.id, item.quantity + 1));
                }),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Text(
                    '${item.quantity}',
                    style: GoogleFonts.kumbhSans(
                        fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                ),
                _qtyBtn(context, Icons.remove, () {
                  context.read<CartBloc>().add(
                      UpdateCartQuantity(item.product.id, item.quantity - 1));
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
      child: const Icon(Icons.image_not_supported_outlined,
          color: AppTheme.textLight),
    );
  }
}
