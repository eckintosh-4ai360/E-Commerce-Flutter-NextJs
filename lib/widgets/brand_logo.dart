import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/app_theme.dart';

class GlobalCartMark extends StatelessWidget {
  const GlobalCartMark({super.key, this.size = 52});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppTheme.primaryBlue,
        borderRadius: BorderRadius.circular(size * 0.25),
        border: Border.all(color: AppTheme.accent, width: size * 0.045),
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          Icon(Icons.public, color: AppTheme.accent, size: size * 0.58),
          Positioned(
            bottom: size * 0.08,
            right: size * 0.06,
            child: Icon(
              Icons.shopping_cart_rounded,
              color: Colors.white,
              size: size * 0.42,
            ),
          ),
        ],
      ),
    );
  }
}

class GlobalCartLogo extends StatelessWidget {
  const GlobalCartLogo({
    super.key,
    this.markSize = 52,
    this.fontSize = 28,
    this.onDark = false,
    this.showMark = true,
  });

  final double markSize;
  final double fontSize;
  final bool onDark;
  final bool showMark;

  @override
  Widget build(BuildContext context) {
    final baseStyle = GoogleFonts.kumbhSans(
      fontSize: fontSize,
      fontWeight: FontWeight.w800,
      letterSpacing: -0.8,
    );

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (showMark) ...[
          GlobalCartMark(size: markSize),
          SizedBox(width: markSize * 0.2),
        ],
        RichText(
          text: TextSpan(
            style: baseStyle,
            children: [
              TextSpan(
                text: 'Global',
                style: TextStyle(
                  color: onDark ? Colors.white : AppTheme.primary,
                ),
              ),
              const TextSpan(
                text: 'Cart',
                style: TextStyle(color: AppTheme.accent),
              ),
              WidgetSpan(
                alignment: PlaceholderAlignment.middle,
                child: Container(
                  margin: const EdgeInsets.only(left: 4),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryBlue,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'GH',
                    style: baseStyle.copyWith(
                      color: Colors.white,
                      fontSize: fontSize * 0.54,
                      letterSpacing: 0.4,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
