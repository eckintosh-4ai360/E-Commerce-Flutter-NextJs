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
            onChanged: (value) => setState(() => _query = value),
            decoration: InputDecoration(
              hintText: 'Search for help...',
              prefixIcon: const Icon(Icons.search),
              filled: true,
              fillColor: AppTheme.surface,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text('Frequently Asked Questions',
              style: GoogleFonts.kumbhSans(
                  fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          if (results.isEmpty)
            Text(
                'No answers match "$_query". Contact us below and we will help.',
                style: GoogleFonts.kumbhSans(color: AppTheme.textMed)),
          for (final faq in results)
            Container(
              margin: const EdgeInsets.only(bottom: 10),
              decoration: BoxDecoration(
                color: AppTheme.surface,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Theme(
                data: Theme.of(context)
                    .copyWith(dividerColor: Colors.transparent),
                child: ExpansionTile(
                  title: Text(faq.$1,
                      style: GoogleFonts.kumbhSans(
                          fontWeight: FontWeight.w600, fontSize: 14)),
                  childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  children: [
                    Text(faq.$2,
                        style: GoogleFonts.kumbhSans(
                            color: AppTheme.textMed, height: 1.6)),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 24),
          Text('Contact Support',
              style: GoogleFonts.kumbhSans(
                  fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          _contactTile(Icons.phone_outlined, 'Call us', AppConfig.supportPhone,
              () => openExternal(context, AppConfig.supportPhoneUri)),
          _contactTile(
              Icons.phone_outlined,
              'Second line',
              AppConfig.secondaryPhone,
              () => openExternal(context, AppConfig.secondaryPhoneUri)),
          _contactTile(
              Icons.chat_outlined,
              'WhatsApp us',
              AppConfig.supportPhone,
              () => openExternal(context, AppConfig.whatsappUrl)),
          _contactTile(
            Icons.local_shipping_outlined,
            'Track an order',
            'Check your delivery status',
            () => Navigator.push(context,
                MaterialPageRoute(builder: (_) => const OrderTrackingScreen())),
          ),
        ],
      ),
    );
  }

  Widget _contactTile(
      IconData icon, String title, String subtitle, VoidCallback onTap) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        leading: Icon(icon, color: AppTheme.primary),
        title: Text(title,
            style: GoogleFonts.kumbhSans(fontWeight: FontWeight.w600)),
        subtitle: Text(subtitle, style: GoogleFonts.kumbhSans(fontSize: 12)),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
