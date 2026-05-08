import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_theme.dart';

class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('Account'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            _buildProfileHeader(),
            const SizedBox(height: 28),
            _buildOrderTracking(context),
            const SizedBox(height: 20),
            _buildMenuSection('Shopping', [
              (Icons.receipt_long_outlined, 'My Orders', null),
              (Icons.local_shipping_outlined, 'Track Order', null),
              (Icons.replay, 'Returns & Refunds', null),
            ]),
            const SizedBox(height: 16),
            _buildMenuSection('Account', [
              (Icons.person_outline, 'Edit Profile', null),
              (Icons.location_on_outlined, 'Delivery Addresses', null),
              (Icons.payment_outlined, 'Payment Methods', null),
            ]),
            const SizedBox(height: 16),
            _buildMenuSection('Support', [
              (Icons.phone_outlined, 'Call: +233 59 859 9687', '+233598599687'),
              (Icons.email_outlined, 'info@esiarkomall.com', null),
              (Icons.help_outline, 'FAQ & Help Center', null),
            ]),
            const SizedBox(height: 16),
            _buildMenuSection('Follow Us', [
              (Icons.camera_alt_outlined, 'Instagram @esiarkomall', null),
              (Icons.facebook_outlined, 'Facebook: Esiarkomall', null),
              (Icons.alternate_email, 'Twitter @esiarko_mall', null),
            ]),
            const SizedBox(height: 32),
            _buildFooter(),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileHeader() {
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
            child: const Icon(Icons.person, size: 32, color: AppTheme.accent),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Welcome!',
                    style: GoogleFonts.kumbhSans(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text('Sign in for a personalised experience',
                    style: GoogleFonts.kumbhSans(
                        color: Colors.white.withValues(alpha: 0.7),
                        fontSize: 11)),
                const SizedBox(height: 10),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppTheme.accent,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'SIGN IN',
                    style: GoogleFonts.kumbhSans(
                        color: AppTheme.primary,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderTracking(BuildContext context) {
    return Container(
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
    );
  }

  Widget _buildMenuSection(
      String title, List<(IconData, String, String?)> items) {
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
                    onTap: () {},
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
          'https://esiarkomall.com/wp-content/uploads/2025/08/Esiarkomall-logo-black-on-white.png',
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
          'Copyright 2026 © Esiarkomall. All rights reserved.',
          style: GoogleFonts.kumbhSans(fontSize: 10, color: AppTheme.textLight),
        ),
      ],
    );
  }
}
