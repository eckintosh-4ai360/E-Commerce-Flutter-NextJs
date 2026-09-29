import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../config/app_config.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';
import '../order_tracking/order_tracking_screen.dart';

// Kept in step with the website's help centre.
const _faqs = [
  (
    'How do I track my order?',
    'Open Track Order from the Account tab and enter the 10-character tracking code from your confirmation email. Signed-in customers can also see every order in My Orders.',
  ),
  (
    'What is the return policy?',
    'We offer a ${AppConfig.returnWindowDays}-day return policy for unused items in their original packaging. Request a return from Account → Returns & Refunds once your order has been delivered.',
  ),
  (
    'How long does delivery take?',
    'Delivery within Accra typically takes 1-2 business days. Outside Accra it may take 3-5 business days.',
  ),
  (
    'How much is shipping?',
    'Shipping is a flat GH₵25, and free on orders of GH₵300 or more.',
  ),
  (
    'How do I pay?',
    'You pay on delivery, either in cash or with Mobile Money (MTN, Telecel or AirtelTigo). We never ask for card details.',
  ),
  (
    'Can I cancel my order?',
    'Yes, while it is still pending. Open the order in My Orders and tap Cancel order. Once we start processing it, contact support and we will help.',
  ),
  (
    'Do I need an account to shop?',
    'You can browse and fill your cart without one. To place an order, sign in with Google so we can email your confirmation and tracking updates.',
  ),
  (
    'Is my wishlist the same on the website and in the app?',
    'Yes. When you are signed in, your wishlist, saved addresses and orders are linked to your account and appear on both.',
  ),
];

class FaqHelpScreen extends StatefulWidget {
  const FaqHelpScreen({super.key});

  @override
  State<FaqHelpScreen> createState() => _FaqHelpScreenState();
}

class _FaqHelpScreenState extends State<FaqHelpScreen> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final needle = _query.trim().toLowerCase();
    final results = needle.isEmpty
        ? _faqs
        : _faqs
            .where((faq) =>
                faq.$1.toLowerCase().contains(needle) ||
                faq.$2.toLowerCase().contains(needle))
            .toList();

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text('FAQ & Help Center',
            style: GoogleFonts.kumbhSans(fontWeight: FontWeight.w600)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          TextField(
            decoration: InputDecoration(
              hintText: 'Search for help...',
              hintStyle: GoogleFonts.kumbhSans(color: AppTheme.textLight),
              prefixIcon: const Icon(Icons.search, color: AppTheme.textLight),
              filled: true,
              fillColor: AppTheme.surface,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Frequently Asked Questions',
            style: GoogleFonts.kumbhSans(
              fontWeight: FontWeight.w700,
              fontSize: 18,
              color: AppTheme.textDark,
            ),
          ),
          const SizedBox(height: 16),
          _buildFaqTile(
            'How do I track my order?',
            'You can track your order by going to the Track Order section on the Account page and entering your Order ID.',
          ),
          const SizedBox(height: 12),
          _buildFaqTile(
            'What is the return policy?',
            'We offer a 14-day return policy for unused items in their original packaging. Please visit the Returns & Refunds page for more details.',
          ),
          const SizedBox(height: 12),
          _buildFaqTile(
            'How long does delivery take?',
            'Delivery within Accra typically takes 1-2 business days. Outside Accra may take 3-5 business days.',
          ),
          const SizedBox(height: 32),
          Text(
            'Contact Support',
            style: GoogleFonts.kumbhSans(
              fontWeight: FontWeight.w700,
              fontSize: 18,
              color: AppTheme.textDark,
            ),
          ),
          const SizedBox(height: 16),
          _buildContactCard(Icons.phone, 'Call Us', '+233 59 859 9687'),
          const SizedBox(height: 12),
          _buildContactCard(Icons.email, 'Email Us', 'info@Eckintoshmall.com'),
        ],
      ),
    );
  }

  Widget _buildFaqTile(String question, String answer) {
    return Container(
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
      child: Theme(
        data: ThemeData(dividerColor: Colors.transparent),
        child: ExpansionTile(
          title: Text(
            question,
            style: GoogleFonts.kumbhSans(
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
          childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          expandedAlignment: Alignment.centerLeft,
          children: [
            Text(
              answer,
              style: GoogleFonts.kumbhSans(
                color: AppTheme.textMed,
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContactCard(IconData icon, String title, String detail) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: AppTheme.primary),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.kumbhSans(
                  color: AppTheme.textMed,
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                detail,
                style: GoogleFonts.kumbhSans(
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
