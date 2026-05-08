import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../blocs/cart/cart_bloc.dart';
import '../../blocs/cart/cart_state.dart';
import '../../blocs/navigation/navigation_bloc.dart';
import '../../blocs/wishlist/wishlist_bloc.dart';
import '../../models/product.dart';
import '../../theme/app_theme.dart';
import '../../widgets/product_card.dart';
import '../product_detail/product_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with TickerProviderStateMixin {
  String _selectedCategory = 'All';
  late AnimationController _bannerController;
  late Animation<double> _bannerFade;
  final ScrollController _scrollController = ScrollController();
  bool _isHeaderVisible = true;
  double _lastOffset = 0;

  @override
  void initState() {
    super.initState();
    _bannerController = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 800));
    _bannerFade =
        CurvedAnimation(parent: _bannerController, curve: Curves.easeOut);
    _bannerController.forward();

    _scrollController.addListener(() {
      final currentOffset = _scrollController.offset;

      if (currentOffset <= 0) {
        if (!_isHeaderVisible) setState(() => _isHeaderVisible = true);
      } else if (currentOffset > _lastOffset && currentOffset > 80) {
        // Scrolling down
        if (_isHeaderVisible) setState(() => _isHeaderVisible = false);
      } else if (currentOffset < _lastOffset) {
        // Scrolling up
        if (!_isHeaderVisible) setState(() => _isHeaderVisible = true);
      }
      _lastOffset = currentOffset;
    });
  }

  @override
  void dispose() {
    _bannerController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filteredProducts = ProductData.getByCategory(_selectedCategory);

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: Stack(
        children: [
          CustomScrollView(
            controller: _scrollController,
            slivers: [
              const SliverToBoxAdapter(child: SizedBox(height: 140)),
              SliverToBoxAdapter(child: _buildHeroBanner()),
              SliverToBoxAdapter(child: _buildFeatureStrip()),
              SliverToBoxAdapter(child: _buildSaleSection()),
              SliverToBoxAdapter(child: _buildCategoryBanners()),
              SliverToBoxAdapter(
                  child: _buildSectionHeader(
                      'All Products', 'Eckintosh essentials for every season')),
              SliverToBoxAdapter(child: _buildCategoryTabs()),
              SliverPadding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                sliver: SliverGrid(
                  delegate: SliverChildBuilderDelegate(
                    (context, i) => ProductCard(
                      product: filteredProducts[i],
                      onTap: () => _openProduct(context, filteredProducts[i]),
                    ),
                    childCount: filteredProducts.length,
                  ),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 0.62,
                  ),
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 110)),
            ],
          ),
          _buildFloatingHeader(),
        ],
      ),
    );
  }

  Widget _buildFloatingHeader() {
    final topPadding = MediaQuery.of(context).padding.top;
    return AnimatedPositioned(
      duration: const Duration(milliseconds: 300),
      top: _isHeaderVisible ? 0 : -(topPadding + 100),
      left: 0,
      right: 0,
      child: Container(
        padding: EdgeInsets.fromLTRB(16, topPadding + 10, 16, 15),
        decoration: BoxDecoration(
          color: AppTheme.background.withValues(alpha: 0.95),
          boxShadow: [
            if (_lastOffset > 10)
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: () => _showSearch(context),
                child: Container(
                  height: 48,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: AppTheme.surface,
                    borderRadius: BorderRadius.circular(15),
                    border: Border.all(color: AppTheme.divider),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.search,
                          color: AppTheme.textMed, size: 22),
                      const SizedBox(width: 12),
                      Text(
                        'Search bags, accessories...',
                        style: GoogleFonts.kumbhSans(
                          color: AppTheme.textMed,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            BlocBuilder<CartBloc, CartState>(
              builder: (context, state) => _buildCartAction(state),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCartAction(CartState state) {
    return Stack(
      children: [
        IconButton(
          icon:
              const Icon(Icons.shopping_bag_outlined, color: AppTheme.primary),
          onPressed: () =>
              context.read<NavigationBloc>().add(const NavigateTo(2)),
        ),
        if (state.totalItems > 0)
          Positioned(
            right: 6,
            top: 6,
            child: Container(
              width: 18,
              height: 18,
              decoration: const BoxDecoration(
                color: AppTheme.accent,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  '${state.totalItems}',
                  style: GoogleFonts.kumbhSans(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.primary),
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildHeroBanner() {
    return FadeTransition(
      opacity: _bannerFade,
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 20),
        height: 240,
        decoration: BoxDecoration(
          color: AppTheme.primary,
          borderRadius: BorderRadius.circular(16),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Stack(
            children: [
              // Background pattern
              Positioned.fill(
                child: CustomPaint(painter: _HeroPainter()),
              ),
              SingleChildScrollView(
                physics: const NeverScrollableScrollPhysics(),
                child: Padding(
                  padding: const EdgeInsets.all(28),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppTheme.accent.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(
                              color: AppTheme.accent.withValues(alpha: 0.5)),
                        ),
                        child: Text(
                          'EXCLUSIVE OFFER',
                          style: GoogleFonts.kumbhSans(
                            color: AppTheme.accent,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 2,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'For the\nStylish &\nFashionable',
                        style: GoogleFonts.kumbhSans(
                          color: Colors.white,
                          fontSize: 30,
                          fontWeight: FontWeight.w700,
                          height: 1.2,
                        ),
                      ),
                      const SizedBox(height: 16),
                      GestureDetector(
                        onTap: () {},
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 20, vertical: 10),
                          decoration: BoxDecoration(
                            color: AppTheme.accent,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'SHOP NOW',
                            style: GoogleFonts.kumbhSans(
                              color: AppTheme.primary,
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 1.5,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              // Decorative bag icon
              Positioned(
                right: -10,
                bottom: -10,
                child: Icon(
                  Icons.shopping_bag,
                  size: 160,
                  color: Colors.white.withValues(alpha: 0.05),
                ),
              ),
              Positioned(
                right: 24,
                top: 20,
                child: Icon(
                  Icons.star,
                  size: 16,
                  color: AppTheme.accent.withValues(alpha: 0.6),
                ),
              ),
              Positioned(
                right: 60,
                bottom: 40,
                child: Icon(
                  Icons.star,
                  size: 10,
                  color: AppTheme.accent.withValues(alpha: 0.4),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFeatureStrip() {
    final features = [
      (Icons.local_shipping_outlined, 'Free\nShipping'),
      (Icons.replay, 'Easy\nReturns'),
      (Icons.verified_outlined, '100%\nAuthentic'),
      (Icons.headset_mic_outlined, '24/7\nSupport'),
    ];
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 24),
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
          ),
        ],
      ),
      child: Row(
        children: features
            .map((f) => Expanded(
                  child: Column(
                    children: [
                      Icon(f.$1, color: AppTheme.accent, size: 22),
                      const SizedBox(height: 6),
                      Text(
                        f.$2,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.kumbhSans(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textMed,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ),
                ))
            .toList(),
      ),
    );
  }

  Widget _buildSaleSection() {
    final saleProducts = ProductData.getSaleProducts();
    if (saleProducts.isEmpty) return const SizedBox();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader(
            "This Week's Sales", 'Grab the best deals before they run out'),
        SizedBox(
          height: 280,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: saleProducts.length,
            itemBuilder: (context, i) => SizedBox(
              width: 180,
              child: Padding(
                padding: const EdgeInsets.only(right: 12),
                child: ProductCard(
                  product: saleProducts[i],
                  compact: true,
                  onTap: () => _openProduct(context, saleProducts[i]),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildCategoryBanners() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
      child: Row(
        children: [
          Expanded(
            child: _buildCategoryBanner(
              'Bags',
              '18 Products',
              AppTheme.primary,
              Icons.shopping_bag_outlined,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildCategoryBanner(
              'Accessories',
              '7 Products',
              AppTheme.badge,
              Icons.watch_outlined,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryBanner(
      String title, String subtitle, Color color, IconData icon) {
    return GestureDetector(
      onTap: () {
        setState(() => _selectedCategory = title);
      },
      child: Container(
        height: 100,
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(icon, color: Colors.white.withValues(alpha: 0.3), size: 40),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(title,
                    style: GoogleFonts.kumbhSans(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w700)),
                Text(subtitle,
                    style: GoogleFonts.kumbhSans(
                        color: Colors.white.withValues(alpha: 0.7),
                        fontSize: 11)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, String subtitle) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: GoogleFonts.kumbhSans(
                  fontSize: 26, fontWeight: FontWeight.w700)),
          if (subtitle.isNotEmpty)
            Text(subtitle,
                style: GoogleFonts.kumbhSans(
                    fontSize: 12, color: AppTheme.textMed)),
        ],
      ),
    );
  }

  Widget _buildCategoryTabs() {
    return SizedBox(
      height: 40,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: ProductData.categories.length,
        itemBuilder: (context, i) {
          final cat = ProductData.categories[i];
          final selected = cat == _selectedCategory;
          return GestureDetector(
            onTap: () => setState(() => _selectedCategory = cat),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
              decoration: BoxDecoration(
                color: selected ? AppTheme.primary : AppTheme.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: selected ? AppTheme.primary : AppTheme.divider,
                ),
              ),
              child: Text(
                cat,
                style: GoogleFonts.kumbhSans(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: selected ? Colors.white : AppTheme.textMed,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  void _openProduct(BuildContext context, Product product) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => MultiBlocProvider(
          providers: [
            BlocProvider.value(value: context.read<CartBloc>()),
            BlocProvider.value(value: context.read<WishlistBloc>()),
          ],
          child: ProductDetailScreen(product: product),
        ),
      ),
    );
  }

  void _showSearch(BuildContext context) {
    showSearch(
      context: context,
      delegate: _ProductSearchDelegate(
        onProductTap: (p) => _openProduct(context, p),
        cartBloc: context.read<CartBloc>(),
        wishlistBloc: context.read<WishlistBloc>(),
      ),
    );
  }
}

class _HeroPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppTheme.accent.withValues(alpha: 0.08)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    for (int i = 0; i < 6; i++) {
      canvas.drawCircle(
          Offset(size.width * 0.85, size.height * 0.5), 40.0 + i * 25, paint);
    }
  }

  @override
  bool shouldRepaint(_) => false;
}

class _ProductSearchDelegate extends SearchDelegate<Product?> {
  final void Function(Product) onProductTap;
  final CartBloc cartBloc;
  final WishlistBloc wishlistBloc;

  _ProductSearchDelegate({
    required this.onProductTap,
    required this.cartBloc,
    required this.wishlistBloc,
  });

  @override
  String get searchFieldLabel => 'Search bags, accessories...';

  @override
  @override
  TextStyle get searchFieldStyle =>
      GoogleFonts.kumbhSans(fontSize: 14, color: AppTheme.textDark);

  @override
  List<Widget> buildActions(BuildContext context) => [
        if (query.isNotEmpty)
          IconButton(
            icon: const Icon(Icons.clear, color: AppTheme.primary),
            onPressed: () => query = '',
          ),
      ];

  @override
  Widget buildLeading(BuildContext context) => IconButton(
        icon: const Icon(Icons.arrow_back, color: AppTheme.primary),
        onPressed: () => close(context, null),
      );

  @override
  Widget buildResults(BuildContext context) => _buildSearchResults(context);

  @override
  Widget buildSuggestions(BuildContext context) => _buildSearchResults(context);

  Widget _buildSearchResults(BuildContext context) {
    final results = query.isEmpty
        ? ProductData.products
        : ProductData.products
            .where((p) =>
                p.name.toLowerCase().contains(query.toLowerCase()) ||
                p.category.toLowerCase().contains(query.toLowerCase()))
            .toList();

    if (results.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.search_off, size: 64, color: AppTheme.textLight),
            const SizedBox(height: 16),
            Text('No products found for "$query"',
                style: GoogleFonts.kumbhSans(color: AppTheme.textMed)),
          ],
        ),
      );
    }

    return MultiBlocProvider(
      providers: [
        BlocProvider.value(value: cartBloc),
        BlocProvider.value(value: wishlistBloc),
      ],
      child: GridView.builder(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 110),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 0.62,
        ),
        itemCount: results.length,
        itemBuilder: (_, i) => ProductCard(
          product: results[i],
          onTap: () {
            close(context, null);
            onProductTap(results[i]);
          },
        ),
      ),
    );
  }
}
