from django.contrib import admin
from django.urls import path, include, re_path
from pokedex.views import SpriteFileView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/battle/', include('battle.urls')),
    path('api/pokedex/', include('pokedex.urls')),
    re_path(r'^sprites/(?P<sprite_path>.*)$', SpriteFileView.as_view(), name='sprite-serve'),
]
