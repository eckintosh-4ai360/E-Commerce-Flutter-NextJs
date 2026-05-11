import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../blocs/auth/auth_cubit.dart';
import '../../theme/app_theme.dart';
import '../orders/orders_screen.dart';
import '../order_tracking/order_tracking_screen.dart';
import 'returns_refunds_screen.dart';
import 'edit_profile_screen.dart';
import 'delivery_addresses_screen.dart';
import 'payment_methods_screen.dart';
import 'faq_help_screen.dart';

class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.cardBg,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 110),
          child: Column(
            children: [
              _buildProfileHeader(),
              const SizedBox(height: 28),
              _buildOrderTracking(context),
              const SizedBox(height: 20),
              _buildMenuSection(context, 'Shopping', [
                (
                  Icons.receipt_long_outlined,
                  'My Orders',
                  const OrdersScreen()
                ),
                (
                  Icons.local_shipping_outlined,
                  'Track Order',
                  const OrderTrackingScreen()
                ),
                (
                  Icons.replay,
                  'Returns & Refunds',
                  const ReturnsRefundsScreen()
                ),
              ]),
              const SizedBox(height: 16),
              _buildMenuSection(context, 'Account', [
                (
                  Icons.person_outline,
                  'Edit Profile',
                  const EditProfileScreen()
                ),
                (
                  Icons.location_on_outlined,
                  'Delivery Addresses',
                  const DeliveryAddressesScreen()
                ),
                (
                  Icons.payment_outlined,
                  'Payment Methods',
                  const PaymentMethodsScreen()
                ),
              ]),
              const SizedBox(height: 16),
              _buildMenuSection(context, 'Support', [
                (Icons.phone_outlined, 'Call: +233 59 859 9687', null),
                (Icons.email_outlined, 'info@Eckintoshmall.com', null),
                (
                  Icons.help_outline,
                  'FAQ & Help Center',
                  const FaqHelpScreen()
                ),
              ]),
              const SizedBox(height: 16),
              _buildMenuSection(context, 'Follow Us', [
                (Icons.camera_alt_outlined, 'Instagram @Eckintoshmall', null),
                (Icons.facebook_outlined, 'Facebook: Eckintoshmall', null),
                (Icons.alternate_email, 'Twitter @Eckintosh_mall', null),
              ]),
              const SizedBox(height: 32),
              _buildFooter(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProfileHeader() {
    return BlocBuilder<AuthCubit, AuthState>(
      builder: (context, authState) {
        final user = authState.user;

        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppTheme.primary,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: AppTheme.accent.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                  border: Border.all(color: AppTheme.accent, width: 2),
                ),
                child: ClipOval(
                  child: user?.photoUrl != null
                      ? Image.network(
                          user!.photoUrl!,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => _buildAvatarFallback(),
                        )
                      : _buildAvatarFallback(
                          initials: user?.initials,
                        ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user?.bestDisplayName ?? 'Welcome!',
                      style: GoogleFonts.kumbhSans(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      user?.email ??
                          'Sign in for personalised checkout and tracking emails',
                      style: GoogleFonts.kumbhSans(
                        color: Colors.white.withValues(alpha: 0.78),
                        fontSize: 11,
                      ),
                    ),
                    const SizedBox(height: 10),
                    _buildAuthAction(context, authState),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildAvatarFallback({String? initials}) {
    if (initials != null && initials.isNotEmpty) {
      return Center(
        child: Text(
          initials,
          style: GoogleFonts.kumbhSans(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: AppTheme.accent,
          ),
        ),
      );
    }

    return const Icon(Icons.person, size: 32, color: AppTheme.accent);
  }

  Widget _buildAuthAction(BuildContext context, AuthState authState) {
    if (!authState.isSupported) {
      return Text(
        'Google sign-in is available on Android, iOS, and web.',
        style: GoogleFonts.kumbhSans(
          color: Colors.white.withValues(alpha: 0.7),
          fontSize: 11,
        ),
      );
    }

    final isSignedIn = authState.isAuthenticated;
    return GestureDetector(
      onTap: authState.isBusy
          ? null
          : () {
              if (isSignedIn) {
                context.read<AuthCubit>().signOut();
              } else {
                context.read<AuthCubit>().signInWithGoogle();
              }
            },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSignedIn ? Colors.white : AppTheme.accent,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(
          authState.isBusy
              ? 'PLEASE WAIT'
              : isSignedIn
                  ? 'SIGN OUT'
                  : 'SIGN IN WITH GOOGLE',
          style: GoogleFonts.kumbhSans(
            color: isSignedIn ? AppTheme.primary : AppTheme.primary,
            fontSize: 11,
            fontWeight: FontWeight.w700,
            letterSpacing: 1,
          ),
        ),
      ),
    );
  }

  Widget _buildOrderTracking(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const OrderTrackingScreen()),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.accentLight,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.accent.withValues(alpha: 0.3)),
        ),
        child: Row(
          children: [
            const Icon(Icons.local_shipping_outlined,
                color: Color(0xFF8B6914), size: 28),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Track Your Order',
                      style: GoogleFonts.kumbhSans(
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                          color: AppTheme.textDark)),
                  Text('Enter your order ID to track delivery',
                      style: GoogleFonts.kumbhSans(
                          fontSize: 12, color: AppTheme.textMed)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppTheme.textMed),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuSection(BuildContext context, String title,
      List<(IconData, String, Widget?)> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Text(title,
              style: GoogleFonts.kumbhSans(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.5,
                  color: AppTheme.textLight)),
        ),
        Container(
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
          child: Column(
            children: items.asMap().entries.map((entry) {
              final i = entry.key;
              final item = entry.value;
              return Column(
                children: [
                  ListTile(
                    leading: Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: AppTheme.cardBg,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(item.$1, size: 18, color: AppTheme.primary),
                    ),
                    title: Text(item.$2,
                        style: GoogleFonts.kumbhSans(
                            fontSize: 13, fontWeight: FontWeight.w500)),
                    trailing: const Icon(Icons.chevron_right,
                        size: 18, color: AppTheme.textLight),
                    onTap: () {
                      if (item.$3 != null) {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => item.$3!),
                        );
                      }
                    },
                  ),
                  if (i < items.length - 1)
                    const Divider(indent: 66, height: 1),
                ],
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildFooter() {
    return Column(
      children: [
        Image.network(
          'https://Eckintoshmall.com/wp-content/uploads/2025/08/Eckintoshmall-logo-black-on-white.png',
          height: 48,
          errorBuilder: (_, __, ___) => Text(
            'ECKINTOSH',
            style: GoogleFonts.kumbhSans(
                fontSize: 22, fontWeight: FontWeight.w700, letterSpacing: 3),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Crafted in rich colors, delivered across Accra.',
          style: GoogleFonts.kumbhSans(fontSize: 12, color: AppTheme.textMed),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          'Copyright 2026 © Eckintoshmall. All rights reserved.',
          style: GoogleFonts.kumbhSans(fontSize: 10, color: AppTheme.textLight),
        ),
      ],
    );
  }
}
