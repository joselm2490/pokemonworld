from django.urls import path
from .views import RoomCreateView, OpenRoomsListView

urlpatterns = [
    path('rooms/create/', RoomCreateView.as_view(), name='room-create'),
    path('rooms/open/', OpenRoomsListView.as_view(), name='rooms-open'),
]

