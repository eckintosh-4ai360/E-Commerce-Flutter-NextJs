import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../blocs/navigation/navigation_bloc.dart';
import '../../blocs/wishlist/wishlist_bloc.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';
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
      body: BlocConsumer<WishlistBloc, WishlistState>(
        listenWhen: (previous, current) =>
            current.errorMessage != null &&
            previous.errorMessage != current.errorMessage,
        listener: (context, state) =>
            showAppSnack(context, state.errorMessage!, error: true),
        builder: (context, state) {
          if (state.items.isEmpty) {
            return EmptyView(
              icon: Icons.favorite_border,
              title: 'No items in wishlist',
              message: 'Save your favourite pieces here',
              action: ElevatedButton(
                onPressed: () =>
                    context.read<NavigationBloc>().add(const NavigateTo(0)),
                child: const Text('EXPLORE'),
              ),
            );
          }

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
                child: Text(
                  state.isSynced
                      ? 'Synced with your account on the app and website.'
                      : 'Saved on this device. Sign in from the Account tab to sync it with the website.',
                  style: GoogleFonts.kumbhSans(
                      fontSize: 12, color: AppTheme.textMed),
                ),
              ),
              Expanded(
                child: GridView.builder(
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
                    onTap: () => openProduct(context, state.items[i]),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
