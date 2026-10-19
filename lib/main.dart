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
import 'services/account_service.dart';
import 'services/api_client.dart';
import 'services/auth_service.dart';
import 'services/local_store.dart';
import 'services/order_service.dart';
import 'theme/app_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await _initializeFirebaseIfSupported();
  final store = await LocalStore.open();

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  runApp(
    DevicePreview(
      enabled: !kReleaseMode,
      builder: (_) => GlobalCartApp(store: store),
    ),
  );
}

class GlobalCartApp extends StatefulWidget {
  const GlobalCartApp({super.key, required this.store});

  final LocalStore store;

  @override
  State<GlobalCartApp> createState() => _GlobalCartAppState();
}

class _GlobalCartAppState extends State<GlobalCartApp> {
  late final AuthService _authService = AuthService();
  late final ApiClient _api = ApiClient(
    tokenProvider: () => _authService.getIdToken(),
  );
  late final OrderService _orderService = OrderService(_api);
  late final AccountService _accountService = AccountService(_api);

  @override
  Widget build(BuildContext context) {
    return MultiRepositoryProvider(
      providers: [
        RepositoryProvider.value(value: _orderService),
        RepositoryProvider.value(value: _accountService),
      ],
      child: MultiBlocProvider(
        providers: [
          BlocProvider(create: (_) => AuthCubit(authService: _authService)),
          BlocProvider(create: (_) => CatalogCubit()..loadCatalog()),
          BlocProvider(
            create: (_) =>
                CartBloc(store: widget.store)..add(const CartStarted()),
          ),
          BlocProvider(
            create: (_) => WishlistBloc(
              store: widget.store,
              accountService: _accountService,
            )..add(const WishlistStarted()),
          ),
          BlocProvider(create: (_) => NavigationBloc()),
        ],
        child: MultiBlocListener(
          listeners: [
            // Keep the wishlist in sync with whoever is signed in.
            BlocListener<AuthCubit, AuthState>(
              listenWhen: (previous, current) =>
                  previous.user?.uid != current.user?.uid ||
                  (previous.status != current.status &&
                      current.status == AuthStatus.ready),
              listener: (context, state) => context
                  .read<WishlistBloc>()
                  .add(WishlistUserChanged(state.user?.uid)),
            ),
            // Refresh cart prices and stock once the live catalog loads.
            BlocListener<CatalogCubit, CatalogState>(
              listenWhen: (previous, current) =>
                  current.status == CatalogStatus.success &&
                  !current.isFallback &&
                  previous.products != current.products,
              listener: (context, state) => context
                  .read<CartBloc>()
                  .add(SyncCartWithCatalog(state.products)),
            ),
          ],
          child: MaterialApp(
            title: 'GlobalCart GH',
            debugShowCheckedModeBanner: false,
            locale: DevicePreview.locale(context),
            theme: AppTheme.lightTheme,
            builder: (context, child) {
              return DevicePreview.appBuilder(
                context,
                Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [AppTheme.gradientStart, AppTheme.gradientEnd],
                    ),
                  ),
                  child: child,
                ),
              );
            },
            home: const SplashScreen(),
          ),
        ),
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
