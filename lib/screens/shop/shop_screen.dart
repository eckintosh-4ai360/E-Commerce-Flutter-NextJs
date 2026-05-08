import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
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
  String _selectedCategory = 'All products';
  String _sortBy = 'Sort by latest';
  RangeValues _priceRange = const RangeValues(0, 350);

  final List<String> _categories = [
    'All products',
    'Accessories',
    'Baby',
    'Bags',
    'Beauty and skin',
    'Belts',
    'Cargo Trousers',
    'CENNA',
    'Kids',
    'Men',
    'Outerwear',
    'Shoes',
    'Watches'
  ];

  final Map<String, int> _colors = {
    'Army Green': 2, 'Ash': 1, 'blue black': 4, 'Brown': 13,
    'cocoa': 1, 'coconut': 1, 'Cream': 2, 'Gold': 1,
    'Nude': 7, 'Orange': 1, 'Rose': 1, 'silver': 2,
    'wine': 4, 'Black': 25, 'Blue': 2, 'Green': 1,
    'Pink': 10, 'Red': 5, 'White': 5, 'Yellow': 1
  };

  final Map<String, int> _sizes = {
    '36': 1, '36/37': 2, '37': 3, '38': 5, '39': 4, '40': 2
  };

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
    // Determine the product list to show
    List<Product> displayProducts = ProductData.products;
    if (_selectedCategory != 'All products' && _selectedCategory != 'All') {
      displayProducts = ProductData.products
          .where((p) => p.category.toLowerCase() == _selectedCategory.toLowerCase())
          .toList();
    }
    // If no products found for a category, let's just show all as fallback for UI demonstration
    if (displayProducts.isEmpty) {
      displayProducts = ProductData.products;
    }

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text('Shop', style: GoogleFonts.kumbhSans(fontWeight: FontWeight.w700, fontSize: 28)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () {
              _scaffoldKey.currentState?.openEndDrawer();
            },
          ),
        ],
      ),
      endDrawer: _buildFilterDrawer(),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Text(
              'Product Categories',
              style: GoogleFonts.kumbhSans(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.textMed),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 40,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _categories.length,
              itemBuilder: (context, index) {
                final cat = _categories[index];
                final isSelected = _selectedCategory == cat;
                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedCategory = cat;
                    });
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: isSelected ? AppTheme.primary : AppTheme.surface,
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(
                        color: isSelected ? AppTheme.primary : AppTheme.divider,
                      ),
                    ),
                    child: Row(
                      children: [
                        if (isSelected) ...[
                          const Icon(Icons.check_box, color: Colors.white, size: 16),
                          const SizedBox(width: 6),
                        ],
                        Text(
                          cat,
                          style: GoogleFonts.kumbhSans(
                            fontSize: 13,
                            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                            color: isSelected ? Colors.white : AppTheme.textMed,
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
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Showing 1–${displayProducts.length} of ${displayProducts.length} results',
                  style: GoogleFonts.kumbhSans(fontSize: 12, color: AppTheme.textLight),
                ),
                Row(
                  children: [
                    Text('Sort: ', style: GoogleFonts.kumbhSans(fontSize: 12, color: AppTheme.textLight)),
                    DropdownButton<String>(
                      value: _sortBy,
                      icon: const Icon(Icons.keyboard_arrow_down, size: 16),
                      underline: const SizedBox(),
                      style: GoogleFonts.kumbhSans(fontSize: 13, color: AppTheme.textDark, fontWeight: FontWeight.w600),
                      onChanged: (String? newValue) {
                        if (newValue != null) {
                          setState(() {
                            _sortBy = newValue;
                          });
                        }
                      },
                      items: <String>['Sort by latest', 'Sort by popularity', 'Sort by price: low to high', 'Sort by price: high to low']
                          .map<DropdownMenuItem<String>>((String value) {
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
            child: GridView.builder(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 110), // Padding for bottom nav
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 0.62,
              ),
              itemCount: displayProducts.length,
              itemBuilder: (context, i) => ProductCard(
                product: displayProducts[i],
                onTap: () => _openProduct(context, displayProducts[i]),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterDrawer() {
    return Drawer(
      backgroundColor: AppTheme.background,
      child: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Filters', style: GoogleFonts.kumbhSans(fontSize: 20, fontWeight: FontWeight.w700)),
                  IconButton(
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
                  // Filter by Color
                  Text('Filter by Color', style: GoogleFonts.kumbhSans(fontSize: 16, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 12),
                  ..._colors.entries.map((e) => Padding(
                        padding: const EdgeInsets.only(bottom: 8.0),
                        child: Text('${e.key} (${e.value})', style: GoogleFonts.kumbhSans(fontSize: 14, color: AppTheme.textMed)),
                      )),
                  
                  const SizedBox(height: 24),
                  
                  // Filter by price
                  Text('Filter by price', style: GoogleFonts.kumbhSans(fontSize: 16, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _buildPriceInput(_priceRange.start.round().toString(), 'Min price')),
                      const Padding(padding: EdgeInsets.symmetric(horizontal: 8.0), child: Text('-')),
                      Expanded(child: _buildPriceInput(_priceRange.end.round().toString(), 'Max price')),
                    ],
                  ),
                  const SizedBox(height: 8),
                  RangeSlider(
                    values: _priceRange,
                    min: 0,
                    max: 500,
                    activeColor: AppTheme.primary,
                    inactiveColor: AppTheme.divider,
                    onChanged: (RangeValues values) {
                      setState(() {
                        _priceRange = values;
                      });
                    },
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Price: GH₵${_priceRange.start.round()} — GH₵${_priceRange.end.round()}', 
                        style: GoogleFonts.kumbhSans(fontSize: 13, color: AppTheme.textMed)),
                      ElevatedButton(
                        onPressed: () => Navigator.pop(context),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.surface,
                          foregroundColor: AppTheme.textDark,
                          elevation: 0,
                          side: const BorderSide(color: AppTheme.divider),
                        ),
                        child: Text('FILTER', style: GoogleFonts.kumbhSans(fontSize: 12, fontWeight: FontWeight.w700)),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Filter by Size
                  Text('Filter by Size', style: GoogleFonts.kumbhSans(fontSize: 16, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 12),
                  ..._sizes.entries.map((e) => Padding(
                        padding: const EdgeInsets.only(bottom: 8.0),
                        child: Text('${e.key} (${e.value})', style: GoogleFonts.kumbhSans(fontSize: 14, color: AppTheme.textMed)),
                      )),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPriceInput(String val, String label) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.kumbhSans(fontSize: 12, color: AppTheme.textLight)),
        const SizedBox(height: 4),
        Container(
          height: 40,
          decoration: BoxDecoration(
            color: AppTheme.surface,
            borderRadius: BorderRadius.circular(4),
          ),
          alignment: Alignment.centerLeft,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text(val, style: GoogleFonts.kumbhSans(fontSize: 14, color: AppTheme.textDark)),
        ),
      ],
    );
  }
}
