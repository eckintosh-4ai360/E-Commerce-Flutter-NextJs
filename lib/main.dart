import 'package:device_preview/device_preview.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'blocs/auth/auth_cubit.dart';
import 'blocs/catalog/catalog_cubit.dart';
import 'blocs/cart/cart_bloc.dart';
import 'blocs/navigation/navigation_bloc.dart';
import 'blocs/wishlist/wishlist_bloc.dart';
import 'firebase_options.dart';
import 'screens/splash_screen.dart';
import 'theme/app_theme.dart';

// void main() {
//   WidgetsFlutterBinding.ensureInitialized();
//   SystemChrome.setSystemUIOverlayStyle(
//     const SystemUiOverlayStyle(
//       statusBarColor: Colors.transparent,
//       statusBarIconBrightness: Brightness.dark,
//     ),
//   );
//   runApp(const EckintoshApp());
// }
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await _initializeFirebaseIfSupported();

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  runApp(
    DevicePreview(
      enabled: !kReleaseMode,
      builder: (context) => const EckintoshApp(),
    ),
  );
}

class EckintoshApp extends StatelessWidget {
  const EckintoshApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (_) => AuthCubit()),
        BlocProvider(create: (_) => CatalogCubit()..loadCatalog()),
        BlocProvider(create: (_) => CartBloc()),
        BlocProvider(create: (_) => WishlistBloc()),
        BlocProvider(create: (_) => NavigationBloc()),
      ],
      child: MaterialApp(
        title: 'Eckintosh',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        builder: (context, child) {
          return Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [AppTheme.gradientStart, AppTheme.gradientEnd],
              ),
            ),
            child: child,
          );
        },
        home: const SplashScreen(),
      ),
    );
  }
}

Future<void> _initializeFirebaseIfSupported() async {
  if (!(kIsWeb ||
      defaultTargetPlatform == TargetPlatform.android ||
      defaultTargetPlatform == TargetPlatform.iOS)) {
    return;
  }

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
}
