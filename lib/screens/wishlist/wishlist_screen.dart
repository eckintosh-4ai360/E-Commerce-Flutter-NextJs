import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../blocs/cart/cart_bloc.dart';
import '../../blocs/navigation/navigation_bloc.dart';
import '../../blocs/wishlist/wishlist_bloc.dart';
import '../../theme/app_theme.dart';
import '../../widgets/product_card.dart';
import '../product_detail/product_detail_screen.dart';

class WishlistScreen extends StatelessWidget {
  const WishlistScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.cardBg,
      appBar: AppBar(
        title: const Text('Wishlist'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: BlocBuilder<WishlistBloc, WishlistState>(
        builder: (context, state) {
          if (state.items.isEmpty) {
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
                    child: const Icon(Icons.favorite_border,
                        size: 48, color: AppTheme.textLight),
                  ),
                  const SizedBox(height: 20),
                  Text('No items in wishlist',
                      style: GoogleFonts.kumbhSans(
                          fontSize: 24, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Text('Save your favourite pieces here',
                      style: GoogleFonts.kumbhSans(
                          color: AppTheme.textMed, fontSize: 13)),
                  const SizedBox(height: 28),
                  ElevatedButton(
                    onPressed: () =>
                        context.read<NavigationBloc>().add(const NavigateTo(0)),
                    child: const Text('EXPLORE'),
                  ),
                ],
              ),
            );
          }
          return GridView.builder(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 110),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 0.62,
            ),
            itemCount: state.items.length,
            itemBuilder: (context, i) => ProductCard(
              product: state.items[i],
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => MultiBlocProvider(
                    providers: [
                      BlocProvider.value(value: context.read<CartBloc>()),
                      BlocProvider.value(value: context.read<WishlistBloc>()),
                    ],
                    child: ProductDetailScreen(product: state.items[i]),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
