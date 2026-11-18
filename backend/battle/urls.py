from django.urls import path
from .views import (
    RoomCreateView,
    OpenRoomsListView,
    RoomDetailView,
    RoomJoinView,
    RoomReadyToggleView,
    RoomChatView,
)

urlpatterns = [
    path('rooms/create/', RoomCreateView.as_view(), name='room-create'),
    path('rooms/open/', OpenRoomsListView.as_view(), name='rooms-open'),
    path('rooms/<str:room_code>/', RoomDetailView.as_view(), name='room-detail'),
    path('rooms/<str:room_code>/join/', RoomJoinView.as_view(), name='room-join'),
    path('rooms/<str:room_code>/ready/', RoomReadyToggleView.as_view(), name='room-ready'),
    path('rooms/<str:room_code>/chat/', RoomChatView.as_view(), name='room-chat'),
]
