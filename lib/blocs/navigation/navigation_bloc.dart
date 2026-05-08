import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

// Events
abstract class NavigationEvent extends Equatable {
  const NavigationEvent();
  @override
  List<Object?> get props => [];
}

class NavigateTo extends NavigationEvent {
  final int index;
  const NavigateTo(this.index);
  @override
  List<Object?> get props => [index];
}

// State
class NavigationState extends Equatable {
  final int currentIndex;
  const NavigationState({this.currentIndex = 0});

  NavigationState copyWith({int? currentIndex}) =>
      NavigationState(currentIndex: currentIndex ?? this.currentIndex);

  @override
  List<Object?> get props => [currentIndex];
}

// Bloc
class NavigationBloc extends Bloc<NavigationEvent, NavigationState> {
  NavigationBloc() : super(const NavigationState()) {
    on<NavigateTo>((event, emit) => emit(state.copyWith(currentIndex: event.index)));
  }
}
