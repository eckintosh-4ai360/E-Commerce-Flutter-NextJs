import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/app_theme.dart';

class GlobaCartMark extends StatelessWidget {
  const GlobaCartMark({super.key, this.size = 52});

  final double size;

  static const _assetPath = 'backend/public/logo.jpeg';
  static const _aspectRatio = 777 / 601;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(size * 0.16),
      child: Image.asset(
        _assetPath,
        width: size,
        height: size / _aspectRatio,
        fit: BoxFit.cover,
        excludeFromSemantics: true,
      ),
    );
  }
}

class GlobaCartLogo extends StatelessWidget {
  const GlobaCartLogo({
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
          GlobaCartMark(size: markSize),
          SizedBox(width: markSize * 0.2),
        ],
        RichText(
          text: TextSpan(
            style: baseStyle,
            children: [
              TextSpan(
                text: 'Globa',
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
