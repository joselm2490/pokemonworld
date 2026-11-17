from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'^ws/battle/(?P<room_code>[a-zA-Z0-9_\-]+)/$', consumers.BattleConsumer.as_asgi()),
]

