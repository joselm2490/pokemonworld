import random
import string
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import BattleRoom

def generate_room_code(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

class RoomCreateView(APIView):
    def post(self, request):
        player_name = request.data.get("player_name", "Trainer 1")
        is_ai = request.data.get("is_ai", False)
        room_code = request.data.get("room_code") or generate_room_code()

        room, created = BattleRoom.objects.get_or_create(
            room_code=room_code,
            defaults={
                "player1_name": player_name,
                "is_ai_match": is_ai,
                "status": "ACTIVE" if is_ai else "WAITING"
            }
        )
        return Response({
            "room_code": room.room_code,
            "player1_name": room.player1_name,
            "player2_name": room.player2_name,
            "is_ai": room.is_ai_match,
            "status": room.status
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

class OpenRoomsListView(APIView):
    def get(self, request):
        open_rooms = BattleRoom.objects.filter(status="WAITING", is_ai_match=False).order_by('-created_at')[:20]
        data = [{
            "room_code": r.room_code,
            "player1_name": r.player1_name,
            "created_at": r.created_at
        } for r in open_rooms]
        return Response(data)
