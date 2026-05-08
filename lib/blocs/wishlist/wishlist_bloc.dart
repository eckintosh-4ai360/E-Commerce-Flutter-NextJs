import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../models/product.dart';

// Events
abstract class WishlistEvent extends Equatable {
  const WishlistEvent();
  @override
  List<Object?> get props => [];
}

class ToggleWishlist extends WishlistEvent {
  final Product product;
  const ToggleWishlist(this.product);
  @override
  List<Object?> get props => [product.id];
}

class ClearWishlist extends WishlistEvent {}

// State
class WishlistState extends Equatable {
  final List<Product> items;
  const WishlistState({this.items = const []});

  bool contains(int productId) => items.any((p) => p.id == productId);

  WishlistState copyWith({List<Product>? items}) =>
      WishlistState(items: items ?? this.items);

  @override
  List<Object?> get props => [items];
}

// Bloc
class WishlistBloc extends Bloc<WishlistEvent, WishlistState> {
  WishlistBloc() : super(const WishlistState()) {
    on<ToggleWishlist>(_onToggle);
    on<ClearWishlist>(_onClear);
  }

  void _onToggle(ToggleWishlist event, Emitter<WishlistState> emit) {
    final items = List<Product>.from(state.items);
    final exists = items.any((p) => p.id == event.product.id);
    if (exists) {
      items.removeWhere((p) => p.id == event.product.id);
    } else {
      items.add(event.product);
    }
    emit(state.copyWith(items: items));
  }

  void _onClear(ClearWishlist event, Emitter<WishlistState> emit) {
    emit(const WishlistState());
  }
}
