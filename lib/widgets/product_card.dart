import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../blocs/cart/cart_bloc.dart';
import '../blocs/cart/cart_event.dart';
import '../blocs/cart/cart_state.dart';
import '../blocs/wishlist/wishlist_bloc.dart';
import '../models/product.dart';
import '../theme/app_theme.dart';
import 'package:google_fonts/google_fonts.dart';

class ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback onTap;
  final bool compact;

  const ProductCard({
    super.key,
    required this.product,
    required this.onTap,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: SingleChildScrollView(
        physics: const NeverScrollableScrollPhysics(),
        child: Container(
          decoration: BoxDecoration(
            color: AppTheme.surface,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildImage(context),
              _buildInfo(context),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildImage(BuildContext context) {
    return Stack(
      children: [
        ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
          child: AspectRatio(
            aspectRatio: 0.8,
            child: product.images.first.startsWith('assets')
                ? Image.asset(
                    product.images.first,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => _buildErrorImage(),
                  )
                : Image.network(
                    product.images.first,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => _buildErrorImage(),
                    loadingBuilder: (_, child, progress) {
                      if (progress == null) return child;
                      return Container(
                        color: AppTheme.cardBg,
                        child: const Center(
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppTheme.accent,
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ),
        // Discount badge
        if (product.discountPercent != null)
          Positioned(
            top: 10,
            left: 10,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.error,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                '-${product.discountPercent!.toInt()}%',
                style: GoogleFonts.kumbhSans(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        // New badge
        if (product.isNew && product.discountPercent == null)
          Positioned(
            top: 10,
            left: 10,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.primary,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                'NEW',
                style: GoogleFonts.kumbhSans(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.8,
                ),
              ),
            ),
          ),
        // Wishlist button
        Positioned(
          top: 8,
          right: 8,
          child: BlocBuilder<WishlistBloc, WishlistState>(
            builder: (context, state) {
              final isWishlisted = state.contains(product.id);
              return GestureDetector(
                onTap: () =>
                    context.read<WishlistBloc>().add(ToggleWishlist(product)),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.all(7),
                  decoration: BoxDecoration(
                    color: isWishlisted
                        ? AppTheme.primary
                        : Colors.white.withValues(alpha: 0.9),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.1),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Icon(
                    isWishlisted ? Icons.favorite : Icons.favorite_border,
                    size: 16,
                    color: isWishlisted ? Colors.white : AppTheme.textDark,
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildInfo(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            product.name,
            style: GoogleFonts.kumbhSans(
              fontSize: compact ? 12 : 13,
              fontWeight: FontWeight.w600,
              color: AppTheme.textDark,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Text(
                'GH₵${product.price.toStringAsFixed(0)}',
                style: GoogleFonts.kumbhSans(
                  fontSize: compact ? 13 : 15,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.primary,
                ),
              ),
              if (product.originalPrice != null) ...[
                const SizedBox(width: 6),
                Text(
                  'GH₵${product.originalPrice!.toStringAsFixed(0)}',
                  style: GoogleFonts.kumbhSans(
                    fontSize: 11,
                    color: AppTheme.textLight,
                    decoration: TextDecoration.lineThrough,
                  ),
                ),
              ],
            ],
          ),
          if (!compact) ...[
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: BlocBuilder<CartBloc, CartState>(
                builder: (context, cartState) {
                  final inCart = cartState.containsProduct(product.id);
                  return GestureDetector(
                    onTap: () {
                      if (!inCart) {
                        context.read<CartBloc>().add(AddToCart(product));
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('${product.name} added to cart',
                                style: GoogleFonts.kumbhSans()),
                            backgroundColor: AppTheme.primary,
                            duration: const Duration(seconds: 2),
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8)),
                          ),
                        );
                      }
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        color: inCart ? AppTheme.accent : AppTheme.primary,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Center(
                        child: Text(
                          inCart ? '✓ IN CART' : 'ADD TO CART',
                          style: GoogleFonts.kumbhSans(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: inCart ? AppTheme.primary : Colors.white,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildErrorImage() {
    return Container(
      color: AppTheme.cardBg,
      child: const Icon(Icons.image_not_supported_outlined,
          color: AppTheme.textLight, size: 40),
    );
  }
}
