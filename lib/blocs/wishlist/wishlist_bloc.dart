import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../models/product.dart';
import '../../services/account_service.dart';
import '../../services/local_store.dart';

// Events
abstract class WishlistEvent extends Equatable {
  const WishlistEvent();
  @override
  List<Object?> get props => [];
}

class WishlistStarted extends WishlistEvent {
  const WishlistStarted();
}

class ToggleWishlist extends WishlistEvent {
  final Product product;
  const ToggleWishlist(this.product);
  @override
  List<Object?> get props => [product.id];
}

/// The signed-in account changed (null when signed out).
class WishlistUserChanged extends WishlistEvent {
  final String? uid;
  const WishlistUserChanged(this.uid);
  @override
  List<Object?> get props => [uid];
}

class ClearWishlist extends WishlistEvent {
  const ClearWishlist();
}

// State
class WishlistState extends Equatable {
  final List<Product> items;
  final bool isSynced;
  final String? errorMessage;

  const WishlistState({
    this.items = const [],
    this.isSynced = false,
    this.errorMessage,
  });

  bool contains(int productId) => items.any((p) => p.id == productId);

  WishlistState copyWith({
    List<Product>? items,
    bool? isSynced,
    String? errorMessage,
  }) =>
      WishlistState(
        items: items ?? this.items,
        isSynced: isSynced ?? this.isSynced,
        errorMessage: errorMessage,
      );

  @override
  List<Object?> get props => [items, isSynced, errorMessage];
}

/// Signed out, the wishlist is stored on the device. After sign-in it is
/// merged into the account so it matches the website.
class WishlistBloc extends Bloc<WishlistEvent, WishlistState> {
  WishlistBloc({LocalStore? store, AccountService? accountService})
      : _store = store,
        _accountService = accountService,
        super(const WishlistState()) {
    on<WishlistStarted>(_onStarted);
    on<ToggleWishlist>(_onToggle);
    on<WishlistUserChanged>(_onUserChanged);
    on<ClearWishlist>(_onClear);
  }

  final LocalStore? _store;
  final AccountService? _accountService;
  String? _syncedUid;

  void _onStarted(WishlistStarted event, Emitter<WishlistState> emit) {
    final saved = <Product>[];
    for (final json in _store?.readList(LocalStore.wishlistKey) ??
        const <Map<String, dynamic>>[]) {
      try {
        saved.add(Product.fromJson(json));
      } catch (_) {
        // Skip entries written by an older app version.
      }
    }
    if (saved.isNotEmpty) {
      emit(state.copyWith(items: saved));
    }
  }

  Future<void> _onUserChanged(
    WishlistUserChanged event,
    Emitter<WishlistState> emit,
  ) async {
    final service = _accountService;
    if (event.uid == null) {
      if (_syncedUid != null) {
        _syncedUid = null;
        _save(emit, const [], isSynced: false);
      }
      return;
    }
    if (service == null || event.uid == _syncedUid) {
      return;
    }

    try {
      final merged =
          await service.mergeWishlist(state.items.map((p) => p.id).toList());
      _syncedUid = event.uid;
      _save(emit, merged, isSynced: true);
    } catch (_) {
      // Keep the local list; the next sign-in or restart retries the merge.
    }
  }

  Future<void> _onToggle(
    ToggleWishlist event,
    Emitter<WishlistState> emit,
  ) async {
    final previous = state.items;
    final exists = previous.any((p) => p.id == event.product.id);
    final next = exists
        ? previous.where((p) => p.id != event.product.id).toList()
        : [event.product, ...previous];
    _save(emit, next);

    final service = _accountService;
    if (_syncedUid == null || service == null) {
      return;
    }
    try {
      if (exists) {
        await service.removeFromWishlist(event.product.id);
      } else {
        await service.mergeWishlist([event.product.id]);
      }
    } catch (error) {
      _save(emit, previous, error: 'Could not update your wishlist: $error');
    }
  }

  void _onClear(ClearWishlist event, Emitter<WishlistState> emit) {
    _save(emit, const []);
  }

  void _save(
    Emitter<WishlistState> emit,
    List<Product> items, {
    bool? isSynced,
    String? error,
  }) {
    emit(state.copyWith(items: items, isSynced: isSynced, errorMessage: error));
    _store?.writeList(
      LocalStore.wishlistKey,
      items.map((product) => product.toJson()).toList(),
    );
  }
}
