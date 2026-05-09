import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../blocs/catalog/catalog_cubit.dart';
import '../../blocs/cart/cart_bloc.dart';
import '../../blocs/wishlist/wishlist_bloc.dart';
import '../../models/product.dart';
import '../../theme/app_theme.dart';
import '../../widgets/product_card.dart';
import '../product_detail/product_detail_screen.dart';

class ShopScreen extends StatefulWidget {
  const ShopScreen({super.key});

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  String _selectedCategory = 'All';
  String _sortBy = 'Sort by latest';
  RangeValues _priceRange = const RangeValues(0, 500);
  final List<String> _selectedColors = [];
  final List<String> _selectedSizes = [];

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

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<CatalogCubit, CatalogState>(
      builder: (context, catalogState) {
        final showInitialLoader = catalogState.status == CatalogStatus.loading &&
            catalogState.products.isEmpty;
        final showFatalError = catalogState.status == CatalogStatus.failure &&
            catalogState.products.isEmpty;
        final categories = ['All', ...catalogState.categories];
        final selectedCategory =
            categories.contains(_selectedCategory) ? _selectedCategory : 'All';
        final maxCatalogPrice = catalogState.products.isEmpty
            ? 0.0
            : catalogState.products
                .map((product) => product.price)
                .reduce((current, next) => current > next ? current : next);
        final maxPrice = math.max(500.0, maxCatalogPrice).toDouble();
        final effectivePriceRange = _normalisePriceRange(maxPrice);
        final colorCounts =
            _buildFacetCounts(catalogState.products, (product) => product.colors);
        final sizeCounts =
            _buildFacetCounts(catalogState.products, (product) => product.sizes);

        var displayProducts =
            List<Product>.from(catalogState.byCategory(selectedCategory));

        displayProducts = displayProducts
            .where(
              (product) =>
                  product.price >= effectivePriceRange.start &&
                  product.price <= effectivePriceRange.end,
            )
            .toList();

        if (_selectedColors.isNotEmpty) {
          displayProducts = displayProducts
              .where(
                (product) =>
                    product.colors.any((color) => _selectedColors.contains(color)),
              )
              .toList();
        }

        if (_selectedSizes.isNotEmpty) {
          displayProducts = displayProducts
              .where(
                (product) =>
                    product.sizes.any((size) => _selectedSizes.contains(size)),
              )
              .toList();
        }

        if (_sortBy == 'Sort by price: low to high') {
          displayProducts.sort((a, b) => a.price.compareTo(b.price));
        } else if (_sortBy == 'Sort by price: high to low') {
          displayProducts.sort((a, b) => b.price.compareTo(a.price));
        } else if (_sortBy == 'Sort by popularity') {
          displayProducts.sort(
            (a, b) => b.reviewCount.compareTo(a.reviewCount),
          );
        }

        return Scaffold(
          key: _scaffoldKey,
          backgroundColor: AppTheme.background,
          endDrawer: _buildFilterDrawer(
            colorCounts,
            sizeCounts,
            maxPrice,
            effectivePriceRange,
          ),
          body: SafeArea(
            child: showInitialLoader
                ? const Center(
                    child: CircularProgressIndicator(color: AppTheme.primary),
                  )
                : showFatalError
                    ? _buildErrorState(context)
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Shop',
                                  style: GoogleFonts.kumbhSans(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 28,
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.filter_list),
                                  onPressed: () {
                                    _scaffoldKey.currentState?.openEndDrawer();
                                  },
                                ),
                              ],
                            ),
                          ),
                          if (catalogState.message != null)
                            Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 16),
                              child: _buildStatusBanner(catalogState.message!),
                            ),
                          Padding(
                            padding:
                                const EdgeInsets.symmetric(horizontal: 16.0),
                            child: Text(
                              'Product Categories',
                              style: GoogleFonts.kumbhSans(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.textMed,
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          SizedBox(
                            height: 40,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: categories.length,
                              itemBuilder: (context, index) {
                                final category = categories[index];
                                final isSelected =
                                    selectedCategory == category;
                                return GestureDetector(
                                  onTap: () {
                                    setState(() {
                                      _selectedCategory = category;
                                    });
                                  },
                                  child: AnimatedContainer(
                                    duration: const Duration(milliseconds: 200),
                                    margin:
                                        const EdgeInsets.only(right: 8),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 16,
                                      vertical: 8,
                                    ),
                                    decoration: BoxDecoration(
                                      color: isSelected
                                          ? AppTheme.primary
                                          : AppTheme.surface,
                                      borderRadius: BorderRadius.circular(4),
                                      border: Border.all(
                                        color: isSelected
                                            ? AppTheme.primary
                                            : AppTheme.divider,
                                      ),
                                    ),
                                    child: Row(
                                      children: [
                                        if (isSelected) ...[
                                          const Icon(
                                            Icons.check_box,
                                            color: Colors.white,
                                            size: 16,
                                          ),
                                          const SizedBox(width: 6),
                                        ],
                                        Text(
                                          category,
                                          style: GoogleFonts.kumbhSans(
                                            fontSize: 13,
                                            fontWeight: isSelected
                                                ? FontWeight.w600
                                                : FontWeight.w500,
                                            color: isSelected
                                                ? Colors.white
                                                : AppTheme.textMed,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                          const SizedBox(height: 16),
                          Padding(
                            padding:
                                const EdgeInsets.symmetric(horizontal: 16.0),
                            child: Row(
                              mainAxisAlignment:
                                  MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Showing ${displayProducts.length} results',
                                  style: GoogleFonts.kumbhSans(
                                    fontSize: 12,
                                    color: AppTheme.textLight,
                                  ),
                                ),
                                Row(
                                  children: [
                                    Text(
                                      'Sort: ',
                                      style: GoogleFonts.kumbhSans(
                                        fontSize: 12,
                                        color: AppTheme.textLight,
                                      ),
                                    ),
                                    DropdownButton<String>(
                                      value: _sortBy,
                                      icon: const Icon(
                                        Icons.keyboard_arrow_down,
                                        size: 16,
                                      ),
                                      underline: const SizedBox(),
                                      style: GoogleFonts.kumbhSans(
                                        fontSize: 13,
                                        color: AppTheme.textDark,
                                        fontWeight: FontWeight.w600,
                                      ),
                                      onChanged: (value) {
                                        if (value == null) {
                                          return;
                                        }

                                        setState(() {
                                          _sortBy = value;
                                        });
                                      },
                                      items: const [
                                        'Sort by latest',
                                        'Sort by popularity',
                                        'Sort by price: low to high',
                                        'Sort by price: high to low',
                                      ].map((value) {
                                        return DropdownMenuItem<String>(
                                          value: value,
                                          child: Text(value),
                                        );
                                      }).toList(),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 8),
                          Expanded(
                            child: displayProducts.isEmpty
                                ? _buildEmptyResults()
                                : GridView.builder(
                                    padding: const EdgeInsets.fromLTRB(
                                      16,
                                      8,
                                      16,
                                      110,
                                    ),
                                    gridDelegate:
                                        const SliverGridDelegateWithFixedCrossAxisCount(
                                      crossAxisCount: 2,
                                      crossAxisSpacing: 12,
                                      mainAxisSpacing: 12,
                                      childAspectRatio: 0.62,
                                    ),
                                    itemCount: displayProducts.length,
                                    itemBuilder: (context, index) =>
                                        ProductCard(
                                      product: displayProducts[index],
                                      onTap: () => _openProduct(
                                        context,
                                        displayProducts[index],
                                      ),
                                    ),
                                  ),
                          ),
                        ],
                      ),
          ),
        );
      },
    );
  }

  Map<String, int> _buildFacetCounts(
    List<Product> products,
    List<String> Function(Product) valuesBuilder,
  ) {
    final counts = <String, int>{};

    for (final product in products) {
      for (final value in valuesBuilder(product)) {
        counts.update(value, (count) => count + 1, ifAbsent: () => 1);
      }
    }

    final sortedEntries = counts.entries.toList()
      ..sort((a, b) => a.key.toLowerCase().compareTo(b.key.toLowerCase()));

    return {
      for (final entry in sortedEntries) entry.key: entry.value,
    };
  }

  RangeValues _normalisePriceRange(double maxPrice) {
    final start = _priceRange.start.clamp(0, maxPrice).toDouble();
    final end = _priceRange.end.clamp(start, maxPrice).toDouble();
    return RangeValues(start, end);
  }

  Widget _buildFilterDrawer(
    Map<String, int> colorCounts,
    Map<String, int> sizeCounts,
    double maxPrice,
    RangeValues effectivePriceRange,
  ) {
    return Drawer(
      backgroundColor: AppTheme.background,
      child: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  Text(
                    'Filters',
                    style: GoogleFonts.kumbhSans(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const Spacer(),
                  TextButton(
                    onPressed: () {
                      setState(() {
                        _selectedColors.clear();
                        _selectedSizes.clear();
                        _priceRange = RangeValues(0, maxPrice);
                      });
                    },
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: Text(
                      'Reset',
                      style: GoogleFonts.kumbhSans(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.primary,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Text(
                    'Filter by Color',
                    style: GoogleFonts.kumbhSans(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ...colorCounts.entries.map((entry) {
                    final isSelected = _selectedColors.contains(entry.key);
                    return InkWell(
                      onTap: () {
                        setState(() {
                          if (isSelected) {
                            _selectedColors.remove(entry.key);
                          } else {
                            _selectedColors.add(entry.key);
                          }
                        });
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        child: Row(
                          children: [
                            Icon(
                              isSelected
                                  ? Icons.check_box
                                  : Icons.check_box_outline_blank,
                              color: isSelected
                                  ? AppTheme.primary
                                  : AppTheme.textLight,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '${entry.key} (${entry.value})',
                              style: GoogleFonts.kumbhSans(
                                fontSize: 14,
                                color: isSelected
                                    ? AppTheme.textDark
                                    : AppTheme.textMed,
                                fontWeight: isSelected
                                    ? FontWeight.w600
                                    : FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
                  const SizedBox(height: 24),
                  Text(
                    'Filter by price',
                    style: GoogleFonts.kumbhSans(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildPriceInput(
                          effectivePriceRange.start.round().toString(),
                          'Min price',
                        ),
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 8.0),
                        child: Text('-'),
                      ),
                      Expanded(
                        child: _buildPriceInput(
                          effectivePriceRange.end.round().toString(),
                          'Max price',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  RangeSlider(
                    values: effectivePriceRange,
                    min: 0,
                    max: maxPrice,
                    activeColor: AppTheme.primary,
                    inactiveColor: AppTheme.divider,
                    onChanged: (values) {
                      setState(() {
                        _priceRange = values;
                      });
                    },
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Price: GHs${effectivePriceRange.start.round()} - GHs${effectivePriceRange.end.round()}',
                        style: GoogleFonts.kumbhSans(
                          fontSize: 13,
                          color: AppTheme.textMed,
                        ),
                      ),
                      ElevatedButton(
                        onPressed: () => Navigator.pop(context),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.surface,
                          foregroundColor: AppTheme.textDark,
                          elevation: 0,
                          side: const BorderSide(color: AppTheme.divider),
                        ),
                        child: Text(
                          'FILTER',
                          style: GoogleFonts.kumbhSans(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Filter by Size',
                    style: GoogleFonts.kumbhSans(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ...sizeCounts.entries.map((entry) {
                    final isSelected = _selectedSizes.contains(entry.key);
                    return InkWell(
                      onTap: () {
                        setState(() {
                          if (isSelected) {
                            _selectedSizes.remove(entry.key);
                          } else {
                            _selectedSizes.add(entry.key);
                          }
                        });
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 6.0),
                        child: Row(
                          children: [
                            Icon(
                              isSelected
                                  ? Icons.check_box
                                  : Icons.check_box_outline_blank,
                              color: isSelected
                                  ? AppTheme.primary
                                  : AppTheme.textLight,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '${entry.key} (${entry.value})',
                              style: GoogleFonts.kumbhSans(
                                fontSize: 14,
                                color: isSelected
                                    ? AppTheme.textDark
                                    : AppTheme.textMed,
                                fontWeight: isSelected
                                    ? FontWeight.w600
                                    : FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPriceInput(String value, String label) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.kumbhSans(
            fontSize: 12,
            color: AppTheme.textLight,
          ),
        ),
        const SizedBox(height: 4),
        Container(
          height: 40,
          decoration: BoxDecoration(
            color: AppTheme.surface,
            borderRadius: BorderRadius.circular(4),
          ),
          alignment: Alignment.centerLeft,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text(
            value,
            style: GoogleFonts.kumbhSans(
              fontSize: 14,
              color: AppTheme.textDark,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStatusBanner(String message) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.accent.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Icon(Icons.cloud_off_outlined, color: AppTheme.primary),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: GoogleFonts.kumbhSans(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppTheme.textDark,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyResults() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.inventory_2_outlined,
              size: 48,
              color: AppTheme.textLight,
            ),
            const SizedBox(height: 16),
            Text(
              'No products match the current filters.',
              textAlign: TextAlign.center,
              style: GoogleFonts.kumbhSans(
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              'Try widening the price range or clearing a few filters.',
              textAlign: TextAlign.center,
              style: GoogleFonts.kumbhSans(color: AppTheme.textMed),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.wifi_tethering_error_rounded,
              size: 48,
              color: AppTheme.textLight,
            ),
            const SizedBox(height: 16),
            Text(
              'We could not load the shop catalog.',
              textAlign: TextAlign.center,
              style: GoogleFonts.kumbhSans(
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              'Start the Next.js backend and retry.',
              textAlign: TextAlign.center,
              style: GoogleFonts.kumbhSans(color: AppTheme.textMed),
            ),
            const SizedBox(height: 18),
            ElevatedButton(
              onPressed: () => context.read<CatalogCubit>().loadCatalog(),
              child: const Text('RETRY'),
            ),
          ],
        ),
      ),
    );
  }
}
