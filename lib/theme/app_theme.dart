import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // GlobaCart GH brand colours, derived from the supplied identity artwork.
  static const Color primary = Color(0xFF001A3A);
  static const Color primaryBlue = Color(0xFF0B4AA2);
  static const Color accent = Color(0xFFFFB000);
  static const Color accentLight = Color(0xFFFFEDB3);
  static const Color background = Color(0xFFF7F9FC);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color cardBg = Color(0xFFEEF3F8);
  static const Color textDark = Color(0xFF001A3A);
  static const Color textMed = Color(0xFF45556C);
  static const Color textLight = Color(0xFF7D8999);
  static const Color success = Color(0xFF168A45);
  static const Color error = Color(0xFFD64545);
  static const Color divider = Color(0xFFDCE3EC);
  static const Color badge = Color(0xFF0B4AA2);

  // Gradient Colors
  static const Color gradientStart = Color(0xFFF7FAFF);
  static const Color gradientEnd = Color(0xFFEAF1FB);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: Colors.transparent,
      colorScheme: const ColorScheme.light(
        primary: primary,
        secondary: accent,
        surface: surface,
        error: error,
      ),
      textTheme: GoogleFonts.kumbhSansTextTheme().copyWith(
        displayLarge: GoogleFonts.kumbhSans(
          fontSize: 48,
          fontWeight: FontWeight.w700,
          color: textDark,
          letterSpacing: -1,
        ),
        displayMedium: GoogleFonts.kumbhSans(
          fontSize: 36,
          fontWeight: FontWeight.w600,
          color: textDark,
          letterSpacing: -0.5,
        ),
        headlineLarge: GoogleFonts.kumbhSans(
          fontSize: 28,
          fontWeight: FontWeight.w600,
          color: textDark,
        ),
        headlineMedium: GoogleFonts.kumbhSans(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: textDark,
        ),
        titleLarge: GoogleFonts.kumbhSans(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: textDark,
        ),
        titleMedium: GoogleFonts.kumbhSans(
          fontSize: 16,
          fontWeight: FontWeight.w500,
          color: textDark,
        ),
        bodyLarge: GoogleFonts.kumbhSans(
          fontSize: 15,
          fontWeight: FontWeight.w400,
          color: textDark,
        ),
        bodyMedium: GoogleFonts.kumbhSans(
          fontSize: 13,
          fontWeight: FontWeight.w400,
          color: textMed,
        ),
        labelLarge: GoogleFonts.kumbhSans(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: textDark,
          letterSpacing: 0.8,
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: GoogleFonts.kumbhSans(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: textDark,
        ),
        iconTheme: const IconThemeData(color: textDark),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
          textStyle: GoogleFonts.kumbhSans(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            letterSpacing: 1.2,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primary,
          side: const BorderSide(color: primary, width: 1.5),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: cardBg,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: primary, width: 1.5),
        ),
        hintStyle: GoogleFonts.kumbhSans(color: textLight, fontSize: 14),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: surface,
        selectedItemColor: primary,
        unselectedItemColor: textLight,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      dividerTheme:
          const DividerThemeData(color: divider, thickness: 1, space: 1),
    );
  }
}
