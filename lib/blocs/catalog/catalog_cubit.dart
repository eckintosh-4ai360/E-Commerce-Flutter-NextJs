import 'dart:async';

import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../models/product.dart';
import '../../repositories/catalog_repository.dart';

enum CatalogStatus { initial, loading, success, failure }

class CatalogState extends Equatable {
  const CatalogState({
    this.status = CatalogStatus.initial,
    this.products = const [],
    this.categories = const [],
    this.isFallback = false,
    this.source = 'unknown',
    this.message,
  });

  final CatalogStatus status;
  final List<Product> products;
  final List<String> categories;
  final bool isFallback;
  final String source;
  final String? message;

  List<Product> byCategory(String category) {
    if (category == 'All') {
      return products;
    }

    return products.where((product) => product.category == category).toList();
  }

  List<Product> get saleProducts =>
      products.where((product) => product.discountPercent != null).toList();

  CatalogState copyWith({
    CatalogStatus? status,
    List<Product>? products,
    List<String>? categories,
    bool? isFallback,
    String? source,
    String? message,
    bool clearMessage = false,
  }) {
    return CatalogState(
      status: status ?? this.status,
      products: products ?? this.products,
      categories: categories ?? this.categories,
      isFallback: isFallback ?? this.isFallback,
      source: source ?? this.source,
      message: clearMessage ? null : (message ?? this.message),
    );
  }

  @override
  List<Object?> get props =>
      [status, products, categories, isFallback, source, message];
}

class CatalogCubit extends Cubit<CatalogState> {
  CatalogCubit({
    CatalogRepository? repository,
    Duration retryDelay = const Duration(seconds: 10),
  })  : _retryDelay = retryDelay,
        _repository = repository ?? CatalogRepository(),
        super(const CatalogState());

  final CatalogRepository _repository;
  final Duration _retryDelay;
  Timer? _retryTimer;
  bool _requestInFlight = false;

  Future<void> loadCatalog({bool quietly = false}) async {
    if (_requestInFlight || isClosed) {
      return;
    }

    _requestInFlight = true;
    _retryTimer?.cancel();

    if (!quietly) {
      emit(
        state.copyWith(
          status: CatalogStatus.loading,
          clearMessage: true,
        ),
      );
    }

    try {
      final result = await _repository.fetchCatalog();
      if (isClosed) {
        return;
      }

      emit(
        state.copyWith(
          status: CatalogStatus.success,
          products: result.products,
          categories: result.categories,
          isFallback: result.isFallback,
          source: result.source,
          message: result.message,
          clearMessage: result.message == null,
        ),
      );

      if (result.isFallback) {
        _scheduleRetry();
      }
    } catch (error) {
      if (isClosed) {
        return;
      }

      if (quietly && state.products.isNotEmpty) {
        _scheduleRetry();
        return;
      }

      emit(
        state.copyWith(
          status: CatalogStatus.failure,
          message: 'Unable to load the catalog right now.',
        ),
      );
      _scheduleRetry();
    } finally {
      _requestInFlight = false;
    }
  }

  void _scheduleRetry() {
    _retryTimer?.cancel();
    _retryTimer = Timer(
      _retryDelay,
      () => loadCatalog(quietly: true),
    );
  }

  @override
  Future<void> close() {
    _retryTimer?.cancel();
    return super.close();
  }
}
