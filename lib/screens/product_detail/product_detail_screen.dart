import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:share_plus/share_plus.dart';

import '../../blocs/cart/cart_bloc.dart';
import '../../blocs/navigation/navigation_bloc.dart';
import '../../blocs/wishlist/wishlist_bloc.dart';
import '../../config/app_config.dart';
import '../../models/cart_item.dart';
import '../../models/product.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';

/// Opens a product page. Blocs are provided app-wide, so no re-wrapping is needed.
void openProduct(BuildContext context, Product product) {
  Navigator.push(
    context,
    MaterialPageRoute(builder: (_) => ProductDetailScreen(product: product)),
  );
}

/// Leaves any pushed screens and switches to the Cart tab.
void goToCartTab(BuildContext context) {
  final navigation = context.read<NavigationBloc>();
  Navigator.of(context).popUntil((route) => route.isFirst);
  navigation.add(const NavigateTo(3));
}

class ProductDetailScreen extends StatefulWidget {
  final Product product;
  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  String? _selectedColor;
  final Map<String, int> _sizeQuantities = {};
  int _quantity = 0;
  int _selectedImageIndex = 0;
  late final PageController _imagePageController;

  @override
  void initState() {
    super.initState();
    _imagePageController = PageController();
    if (widget.product.colors.isEmpty) _quantity = 1;
  }

  @override
  void dispose() {
    _imagePageController.dispose();
    super.dispose();
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
                  if (p.sizes.isEmpty) _buildQuantityPicker(p),
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
    final images = p.images.take(100).toList(growable: false);

    return SliverAppBar(
      expandedHeight: images.length > 1 ? 430 : 380,
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
        GestureDetector(
          onTap: () => _share(p),
          child: Container(
            margin: const EdgeInsets.all(8),
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.9),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1), blurRadius: 8)
              ],
            ),
            child: const Icon(Icons.share_outlined,
                size: 18, color: AppTheme.primary),
          ),
        ),
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
              child: images.isEmpty
                  ? _buildErrorImage()
                  : PageView.builder(
                      controller: _imagePageController,
                      itemCount: images.length,
                      onPageChanged: (index) =>
                          setState(() => _selectedImageIndex = index),
                      itemBuilder: (context, index) =>
                          _buildProductImage(images[index]),
                    ),
            ),
            // gradient
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              height: images.length > 1 ? 140 : 100,
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
            if (images.length > 1)
              Positioned(
                left: 16,
                right: 16,
                bottom: 16,
                height: 58,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: images.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, index) {
                    final selected = _selectedImageIndex == index;
                    return Semantics(
                      button: true,
                      selected: selected,
                      label: 'Show product image ${index + 1}',
                      child: GestureDetector(
                        onTap: () => _imagePageController.animateToPage(
                          index,
                          duration: const Duration(milliseconds: 220),
                          curve: Curves.easeOut,
                        ),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 150),
                          width: 58,
                          clipBehavior: Clip.antiAlias,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(9),
                            border: Border.all(
                              color: selected
                                  ? AppTheme.accent
                                  : Colors.white.withValues(alpha: 0.8),
                              width: selected ? 3 : 2,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.16),
                                blurRadius: 8,
                              ),
                            ],
                          ),
                          child: _buildProductImage(images[index]),
                        ),
                      ),
                    );
                  },
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

  Widget _buildProductImage(String imagePath, {BoxFit fit = BoxFit.cover}) {
    if (imagePath.isEmpty) return _buildErrorImage();
    if (imagePath.startsWith('assets/')) {
      return Image.asset(
        imagePath,
        fit: fit,
        errorBuilder: (_, __, ___) => _buildErrorImage(),
      );
    }

    return CachedNetworkImage(
      imageUrl: imagePath,
      fit: fit,
      placeholder: (context, url) => Container(
        color: AppTheme.cardBg,
        child: const Center(
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: AppTheme.accent,
          ),
        ),
      ),
      errorWidget: (context, url, error) => _buildErrorImage(),
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
        RatingStars(rating: p.rating),
        const SizedBox(width: 8),
        Text(
          '${p.rating} (${p.reviewCount} reviews)',
          style: GoogleFonts.kumbhSans(fontSize: 12, color: AppTheme.textMed),
        ),
      ],
    );
  }

  bool _colorReady(Product p) => p.colors.isEmpty || _selectedColor != null;

  List<({String? size, int quantity})> _selectedLines(Product p) {
    if (!_colorReady(p)) return [];
    if (p.sizes.isEmpty) {
      return _quantity > 0 ? [(size: null, quantity: _quantity)] : [];
    }
    return [
      for (final size in p.sizes)
        if ((_sizeQuantities[size] ?? 0) > 0)
          (size: size, quantity: _sizeQuantities[size]!),
    ];
  }

  Widget _buildPriceRow(Product p) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              formatPrice(p.price),
              style: GoogleFonts.kumbhSans(
                  fontSize: 36,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.primary),
            ),
            if (p.originalPrice != null) ...[
              const SizedBox(width: 12),
              Text(
                formatPrice(p.originalPrice!),
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
                  'Save ${formatPrice(p.originalPrice! - p.price)}',
                  style: GoogleFonts.kumbhSans(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF946300)),
                ),
              ),
            ],
          ],
        ),
        Text('Price per item',
            style:
                GoogleFonts.kumbhSans(fontSize: 12, color: AppTheme.textMed)),
      ],
    );
  }

  Widget _buildColorPicker(Product p) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text('1. Choose a color',
                style: GoogleFonts.kumbhSans(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textDark)),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                _selectedColor ?? 'Select one to continue',
                style: GoogleFonts.kumbhSans(
                    fontSize: 13, color: AppTheme.textMed),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: p.colors.map((color) {
            final selected = _selectedColor == color;
            return Semantics(
              button: true,
              selected: selected,
              label: 'Color $color',
              child: InkWell(
                onTap: () => setState(() {
                  if (selected) return;
                  _selectedColor = color;
                  _sizeQuantities.clear();
                  _quantity = 1;
                }),
                borderRadius: BorderRadius.circular(10),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  width: 108,
                  padding: const EdgeInsets.all(5),
                  decoration: BoxDecoration(
                    color: selected ? AppTheme.accentLight : AppTheme.surface,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: selected ? AppTheme.accent : AppTheme.divider,
                      width: selected ? 2 : 1,
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: SizedBox(
                          width: 94,
                          height: 94,
                          child: _buildProductImage(
                            p.colorImages[color] ?? p.primaryImage ?? '',
                            fit: BoxFit.contain,
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(color,
                          textAlign: TextAlign.center,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.kumbhSans(
                            fontSize: 11,
                            fontWeight:
                                selected ? FontWeight.w700 : FontWeight.w600,
                            color: AppTheme.textDark,
                          )),
                    ],
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
        Text(
            p.colors.isNotEmpty
                ? '2. Choose sizes and quantities'
                : 'Choose sizes and quantities',
            style: GoogleFonts.kumbhSans(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppTheme.textDark)),
        const SizedBox(height: 10),
        if (!_colorReady(p))
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.cardBg,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text('Choose a color to set quantities for each size.',
                style: GoogleFonts.kumbhSans(
                    fontSize: 13, color: AppTheme.textMed)),
          )
        else
          Container(
            decoration: BoxDecoration(
              border: Border.all(color: AppTheme.divider),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Column(
              children: [
                for (var index = 0; index < p.sizes.length; index++) ...[
                  if (index > 0) const Divider(height: 1),
                  _buildSizeRow(p, p.sizes[index]),
                ],
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildSizeRow(Product p, String size) {
    final quantity = _sizeQuantities[size] ?? 0;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(size,
                    style: GoogleFonts.kumbhSans(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textDark)),
                Text('${formatPrice(p.price)} each',
                    style: GoogleFonts.kumbhSans(
                        fontSize: 12, color: AppTheme.textMed)),
              ],
            ),
          ),
          _qtyBtn(
              Icons.remove,
              quantity == 0
                  ? null
                  : () {
                      setState(() => _sizeQuantities[size] = quantity - 1);
                    },
              label: 'Remove one $size',
              key: ValueKey('size-minus-$size')),
          SizedBox(
            width: 34,
            child: Text('$quantity',
                textAlign: TextAlign.center,
                style: GoogleFonts.kumbhSans(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textDark)),
          ),
          _qtyBtn(
              Icons.add,
              quantity >= AppConfig.maxQuantityPerLine
                  ? null
                  : () {
                      setState(() => _sizeQuantities[size] = quantity + 1);
                    },
              label: 'Add one $size',
              key: ValueKey('size-plus-$size')),
        ],
      ),
    );
  }

  Widget _buildQuantityPicker(Product p) {
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
            _qtyBtn(
                Icons.remove,
                !_colorReady(p) || _quantity <= 1
                    ? null
                    : () => setState(() => _quantity--)),
            Container(
              width: 52,
              height: 44,
              alignment: Alignment.center,
              child: Text(
                '${_colorReady(p) ? _quantity : 0}',
                style: GoogleFonts.kumbhSans(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textDark),
              ),
            ),
            _qtyBtn(
                Icons.add,
                !_colorReady(p) || _quantity >= AppConfig.maxQuantityPerLine
                    ? null
                    : () => setState(() => _quantity++)),
          ],
        ),
      ],
    );
  }

  Widget _qtyBtn(IconData icon, VoidCallback? onTap,
      {String? label, Key? key}) {
    return IconButton(
      key: key,
      onPressed: onTap,
      tooltip: label,
      icon: Icon(icon, size: 18),
      color: AppTheme.primary,
      disabledColor: AppTheme.textLight,
      style: IconButton.styleFrom(
        backgroundColor: AppTheme.cardBg,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: const BorderSide(color: AppTheme.divider),
        ),
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
    final lines = _selectedLines(p);
    final totalCount = lines.fold<int>(0, (sum, line) => sum + line.quantity);
    final totalPrice = p.price * totalCount;
    final canAdd = p.inStock && _colorReady(p) && totalCount > 0;

    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
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
        child: Row(
          children: [
            Expanded(
              flex: 3,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('$totalCount selected',
                      style: GoogleFonts.kumbhSans(
                          fontSize: 11, color: AppTheme.textMed)),
                  Text(formatPrice(totalPrice),
                      style: GoogleFonts.kumbhSans(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.primary)),
                  Text('Delivery at checkout',
                      style: GoogleFonts.kumbhSans(
                          fontSize: 10, color: AppTheme.textMed)),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              flex: 3,
              child: SizedBox(
                height: 52,
                child: FilledButton(
                  onPressed: canAdd ? () => _addToCart(context, p) : null,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8)),
                  ),
                  child: Text(
                    !p.inStock
                        ? 'Out of stock'
                        : !_colorReady(p)
                            ? 'Choose color'
                            : totalCount == 0
                                ? 'Select quantity'
                                : 'Add $totalCount to cart',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.kumbhSans(
                        fontSize: 12, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            IconButton.filledTonal(
              onPressed: () => goToCartTab(context),
              icon: const Icon(Icons.shopping_cart_outlined, size: 22),
              color: AppTheme.primary,
              style: IconButton.styleFrom(
                backgroundColor: AppTheme.accentLight,
                minimumSize: const Size(48, 52),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _addToCart(BuildContext context, Product p) {
    final lines = _selectedLines(p);
    final totalCount = lines.fold<int>(0, (sum, line) => sum + line.quantity);
    if (!p.inStock || totalCount == 0) return;
    final cart = context.read<CartBloc>();
    for (final line in lines) {
      final key = CartItem.keyFor(p.id, _selectedColor, line.size);
      final existing = cart.state.itemFor(key)?.quantity ?? 0;
      if (existing + line.quantity > AppConfig.maxQuantityPerLine) {
        showAppSnack(context,
            'You can order at most ${AppConfig.maxQuantityPerLine} of one size and color.',
            error: true);
        return;
      }
    }
    final totalPrice = p.price * totalCount;

    for (final line in lines) {
      cart.add(AddToCart(
        p,
        quantity: line.quantity,
        selectedColor: _selectedColor,
        selectedSize: line.size,
      ));
    }

    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(
              'Added $totalCount × ${p.name} to cart (${formatPrice(totalPrice)})',
              style: GoogleFonts.kumbhSans()),
          backgroundColor: AppTheme.primary,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          duration: const Duration(seconds: 3),
          action: SnackBarAction(
            label: 'VIEW CART',
            textColor: AppTheme.accent,
            onPressed: () => goToCartTab(context),
          ),
        ),
      );
    setState(() {
      _sizeQuantities.clear();
      _quantity = 1;
    });
  }

  Future<void> _share(Product p) async {
    final url = AppConfig.webUri('/product/${p.id}').toString();
    try {
      await SharePlus.instance.share(
        ShareParams(
          text: '${p.name} — ${formatPrice(p.price)} at GlobaCart GH\n$url',
          subject: p.name,
        ),
      );
    } catch (_) {
      if (mounted) {
        showAppSnack(context, 'Could not open the share sheet.', error: true);
      }
    }
  }

  Widget _buildErrorImage() {
    return Container(
      color: AppTheme.cardBg,
      child: const Icon(Icons.image_not_supported_outlined,
          size: 60, color: AppTheme.textLight),
    );
  }
}
