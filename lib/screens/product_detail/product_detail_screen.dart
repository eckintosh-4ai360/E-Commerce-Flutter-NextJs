import 'package:eckintosh/screens/cart/cart_screen.dart';
import 'package:eckintosh/screens/orders/orders_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../blocs/cart/cart_bloc.dart';
// import '../../blocs/cart/cart_event.dart';
// import '../../blocs/cart/cart_state.dart';
import '../../blocs/wishlist/wishlist_bloc.dart';
import '../../models/product.dart';
import '../../theme/app_theme.dart';

class ProductDetailScreen extends StatefulWidget {
  final Product product;
  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  String? _selectedColor;
  String? _selectedSize;
  int _quantity = 1;

  @override
  void initState() {
    super.initState();
    if (widget.product.colors.isNotEmpty) {
      _selectedColor = widget.product.colors.first;
    }
    if (widget.product.sizes.isNotEmpty) {
      _selectedSize = widget.product.sizes.first;
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.product;
    return Scaffold(
      backgroundColor: AppTheme.surface,
      body: CustomScrollView(
        slivers: [
          _buildSliverAppBar(context, p),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildTitleRow(p),
                  const SizedBox(height: 12),
                  _buildRatingRow(p),
                  const SizedBox(height: 20),
                  _buildPriceRow(p),
                  const SizedBox(height: 24),
                  if (p.colors.isNotEmpty) ...[
                    _buildColorPicker(p),
                    const SizedBox(height: 20),
                  ],
                  if (p.sizes.isNotEmpty) ...[
                    _buildSizePicker(p),
                    const SizedBox(height: 20),
                  ],
                  _buildQuantityPicker(),
                  const SizedBox(height: 24),
                  _buildDescription(p),
                  const SizedBox(height: 24),
                  _buildFeatures(),
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: _buildBottomBar(context, p),
    );
  }

  Widget _buildSliverAppBar(BuildContext context, Product p) {
    return SliverAppBar(
      expandedHeight: 380,
      pinned: true,
      backgroundColor: Colors.transparent,
      leading: GestureDetector(
        onTap: () => Navigator.pop(context),
        child: Container(
          margin: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.9),
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1), blurRadius: 8)
            ],
          ),
          child: const Icon(Icons.arrow_back_ios_new,
              size: 16, color: AppTheme.primary),
        ),
      ),
      actions: [
        BlocBuilder<WishlistBloc, WishlistState>(
          builder: (context, state) {
            final isWishlisted = state.contains(p.id);
            return GestureDetector(
              onTap: () => context.read<WishlistBloc>().add(ToggleWishlist(p)),
              child: Container(
                margin: const EdgeInsets.all(8),
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: isWishlisted
                      ? AppTheme.primary
                      : Colors.white.withValues(alpha: 0.9),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                        color: Colors.black.withValues(alpha: 0.1),
                        blurRadius: 8)
                  ],
                ),
                child: Icon(
                  isWishlisted ? Icons.favorite : Icons.favorite_border,
                  size: 18,
                  color: isWishlisted ? Colors.white : AppTheme.primary,
                ),
              ),
            );
          },
        ),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          children: [
            Positioned.fill(
              child: p.images.first.startsWith('assets')
                  ? Image.asset(
                      p.images.first,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _buildErrorImage(),
                    )
                  : Image.network(
                      p.images.first,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _buildErrorImage(),
                    ),
            ),
            // gradient
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              height: 100,
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.bottomCenter,
                    end: Alignment.topCenter,
                    colors: [
                      AppTheme.gradientEnd,
                      AppTheme.gradientEnd.withValues(alpha: 0),
                    ],
                  ),
                ),
              ),
            ),
            if (p.discountPercent != null)
              Positioned(
                top: 80,
                left: 16,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppTheme.error,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    '${p.discountPercent!.toInt()}% OFF',
                    style: GoogleFonts.kumbhSans(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w700),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildTitleRow(Product p) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Text(
            p.name,
            style: GoogleFonts.kumbhSans(
                fontSize: 28,
                fontWeight: FontWeight.w700,
                color: AppTheme.textDark),
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: p.inStock
                ? AppTheme.success.withValues(alpha: 0.1)
                : AppTheme.error.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(
            p.inStock ? 'In Stock' : 'Out of Stock',
            style: GoogleFonts.kumbhSans(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: p.inStock ? AppTheme.success : AppTheme.error,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRatingRow(Product p) {
    return Row(
      children: [
        RatingBarIndicator(
          rating: p.rating,
          itemBuilder: (_, __) =>
              const Icon(Icons.star, color: AppTheme.accent),
          itemCount: 5,
          itemSize: 16,
        ),
        const SizedBox(width: 8),
        Text(
          '${p.rating} (${p.reviewCount} reviews)',
          style: GoogleFonts.kumbhSans(fontSize: 12, color: AppTheme.textMed),
        ),
      ],
    );
  }

  Widget _buildPriceRow(Product p) {
    return Row(
      children: [
        Text(
          '₵${p.price.toStringAsFixed(0)}',
          style: GoogleFonts.kumbhSans(
              fontSize: 36,
              fontWeight: FontWeight.w700,
              color: AppTheme.primary),
        ),
        if (p.originalPrice != null) ...[
          const SizedBox(width: 12),
          Text(
            '₵${p.originalPrice!.toStringAsFixed(0)}',
            style: GoogleFonts.kumbhSans(
              fontSize: 18,
              color: AppTheme.textLight,
              decoration: TextDecoration.lineThrough,
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: AppTheme.accentLight,
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              'Save ₵${(p.originalPrice! - p.price).toStringAsFixed(0)}',
              style: GoogleFonts.kumbhSans(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF8B6914)),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildColorPicker(Product p) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text('Color',
                style: GoogleFonts.kumbhSans(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textDark)),
            const SizedBox(width: 8),
            Text(
              _selectedColor ?? '',
              style:
                  GoogleFonts.kumbhSans(fontSize: 13, color: AppTheme.textMed),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          children: p.colors.map((color) {
            final selected = _selectedColor == color;
            return GestureDetector(
              onTap: () => setState(() => _selectedColor = color),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: selected ? AppTheme.primary : AppTheme.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: selected ? AppTheme.primary : AppTheme.divider,
                    width: selected ? 2 : 1,
                  ),
                ),
                child: Text(
                  color,
                  style: GoogleFonts.kumbhSans(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: selected ? Colors.white : AppTheme.textDark,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildSizePicker(Product p) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Size',
            style: GoogleFonts.kumbhSans(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppTheme.textDark)),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          children: p.sizes.map((size) {
            final selected = _selectedSize == size;
            return GestureDetector(
              onTap: () => setState(() => _selectedSize = size),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: selected ? AppTheme.primary : AppTheme.surface,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: selected ? AppTheme.primary : AppTheme.divider,
                  ),
                ),
                child: Center(
                  child: Text(
                    size,
                    style: GoogleFonts.kumbhSans(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: selected ? Colors.white : AppTheme.textDark,
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildQuantityPicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Quantity',
            style: GoogleFonts.kumbhSans(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppTheme.textDark)),
        const SizedBox(height: 10),
        Row(
          children: [
            _qtyBtn(Icons.remove, () {
              if (_quantity > 1) setState(() => _quantity--);
            }),
            Container(
              width: 52,
              height: 44,
              alignment: Alignment.center,
              child: Text(
                '$_quantity',
                style: GoogleFonts.kumbhSans(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textDark),
              ),
            ),
            _qtyBtn(Icons.add, () => setState(() => _quantity++)),
          ],
        ),
      ],
    );
  }

  Widget _qtyBtn(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: AppTheme.cardBg,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppTheme.divider),
        ),
        child: Icon(icon, size: 18, color: AppTheme.primary),
      ),
    );
  }

  Widget _buildDescription(Product p) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Description',
            style: GoogleFonts.kumbhSans(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppTheme.textDark)),
        const SizedBox(height: 8),
        Text(
          p.description,
          style: GoogleFonts.kumbhSans(
              fontSize: 14, color: AppTheme.textMed, height: 1.7),
        ),
      ],
    );
  }

  Widget _buildFeatures() {
    final features = [
      (Icons.verified_outlined, 'Premium Quality', 'Hand-selected materials'),
      (
        Icons.local_shipping_outlined,
        'Fast Delivery',
        'Delivered across Accra'
      ),
      (Icons.replay, 'Easy Returns', 'Hassle-free returns'),
    ];
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.cardBg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: features
            .map((f) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: AppTheme.accent.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(f.$1, color: AppTheme.accent, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(f.$2,
                              style: GoogleFonts.kumbhSans(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.textDark)),
                          Text(f.$3,
                              style: GoogleFonts.kumbhSans(
                                  fontSize: 11, color: AppTheme.textMed)),
                        ],
                      ),
                    ],
                  ),
                ))
            .toList(),
      ),
    );
  }

  Widget _buildBottomBar(BuildContext context, Product p) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
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
      child: BlocBuilder<CartBloc, CartState>(
        builder: (context, state) {
          final inCart = state.containsProduct(p.id);
          return Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    context.read<CartBloc>().add(AddToCart(
                          p,
                          selectedColor: _selectedColor,
                          selectedSize: _selectedSize,
                        ));
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Added to cart!',
                            style: GoogleFonts.kumbhSans()),
                        backgroundColor: AppTheme.primary,
                        behavior: SnackBarBehavior.floating,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8)),
                        duration: const Duration(seconds: 2),
                      ),
                    );
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    height: 54,
                    decoration: BoxDecoration(
                      color: inCart ? AppTheme.cardBg : AppTheme.primary,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: inCart ? AppTheme.divider : AppTheme.primary,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        inCart ? '✓ IN CART' : 'ADD TO CART',
                        style: GoogleFonts.kumbhSans(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.2,
                          color: inCart ? AppTheme.textDark : Colors.white,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              GestureDetector(
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => const CartScreen(),
                    ),
                  );
                },
                child: Container(
                  height: 54,
                  width: 54,
                  decoration: BoxDecoration(
                    color: AppTheme.accent,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.shopping_bag_outlined,
                      color: AppTheme.primary, size: 22),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildErrorImage() {
    return Container(
      color: AppTheme.cardBg,
      child: const Icon(Icons.image_not_supported_outlined,
          size: 60, color: AppTheme.textLight),
    );
  }
}
