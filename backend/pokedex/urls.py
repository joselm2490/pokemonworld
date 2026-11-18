from django.urls import path
from .views import (
    PokemonListView,
    PokemonDetailView,
    MovimientosListView,
    TiposListView,
    HabilidadesListView,
    RosterListView,
)

urlpatterns = [
    path('pokemon/', PokemonListView.as_view(), name='pokemon-list'),
    path('pokemon/<str:pk_or_name>/', PokemonDetailView.as_view(), name='pokemon-detail'),
    path('movimientos/', MovimientosListView.as_view(), name='movimientos-list'),
    path('tipos/', TiposListView.as_view(), name='tipos-list'),
    path('habilidades/', HabilidadesListView.as_view(), name='habilidades-list'),
    path('roster/', RosterListView.as_view(), name='roster-list'),
]
