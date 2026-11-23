import random
import string
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import BattleRoom, SalaJugador, SalaMensaje, SalaEstadistica


def generate_room_code(length=6):
    return ''.join(random.choices(string.digits, k=length))


class RoomCreateView(APIView):
    """
    Creación de sala de combate 6 vs 6:
    - Código de sala de 6 dígitos numéricos
    - Contraseña opcional
    - Asignación inmediata del anfitrión con su equipo líder
    """
    def post(self, request):
        player_name = request.data.get("player_name", "").strip() or "Entrenador"
        password = request.data.get("password", "").strip() or None
        is_ai = bool(request.data.get("is_ai", False))
        raw_code = ''.join(ch for ch in str(request.data.get("room_code", "")) if ch.isdigit())
        room_code = raw_code[:6] if len(raw_code) == 6 else generate_room_code(6)
        pokemon_per_player = 6

        format_settings = request.data.get("format_settings", {})
        if not isinstance(format_settings, dict):
            format_settings = {}

        # Ajustes por defecto inspirados en Pokémon Stadium World
        format_settings.setdefault("generaciones", ["todas"])
        format_settings.setdefault("permitir_legendarios", False)
        format_settings.setdefault("modo", "estandar")

        room, created = BattleRoom.objects.get_or_create(
            room_code=room_code,
            defaults={
                "player1_name": player_name,
                "password": password,
                "is_ai_match": is_ai,
                "status": "ACTIVE" if is_ai else "WAITING",
                "pokemon_per_player": pokemon_per_player,
                "format_settings": format_settings,
            }
        )

        # Crear o actualizar registro de anfitrión
        p1_team = request.data.get("team", [])
        SalaJugador.objects.update_or_create(
            sala=room,
            apodo=player_name,
            defaults={
                "es_anfitrion": True,
                "equipo_pokemon": p1_team if isinstance(p1_team, list) else [],
                "listo": True if is_ai else False,
                "conectado": True
            }
        )

        # Mensaje de bienvenida en el chat
        SalaMensaje.objects.create(
            sala=room,
            emisor="SISTEMA",
            mensaje=f"Sala creada por {player_name}. Formato: {pokemon_per_player}v{pokemon_per_player}.",
            es_sistema=True
        )

        return Response({
            "room_code": room.room_code,
            "player1_name": room.player1_name,
            "player2_name": room.player2_name,
            "is_ai": room.is_ai_match,
            "status": room.status,
            "pokemon_per_player": room.pokemon_per_player,
            "requires_password": bool(room.password),
            "format_settings": room.format_settings,
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class OpenRoomsListView(APIView):
    """
    Listado de salas en espera públicas o con clave para unirse.
    """
    def get(self, request):
        open_rooms = BattleRoom.objects.filter(
            status="WAITING", is_ai_match=False
        ).prefetch_related('jugadores').order_by('-created_at')[:25]

        data = []
        for r in open_rooms:
            jugadores_count = r.jugadores.count()
            data.append({
                "room_code": r.room_code,
                "anfitrion": r.player1_name,
                "jugadores_actuales": jugadores_count,
                "max_jugadores": r.max_players,
                "pokemon_por_jugador": r.pokemon_per_player,
                "requiere_contrasena": bool(r.password),
                "format_settings": r.format_settings,
                "created_at": r.created_at,
            })
        return Response(data)


class RoomDetailView(APIView):
    """
    Detalle completo del estado de la sala: jugadores conectados, equipos y estado de listo.
    """
    def get(self, request, room_code):
        room = get_object_or_404(BattleRoom, room_code=room_code.upper())
        jugadores = room.jugadores.all()

        return Response({
            "room_code": room.room_code,
            "anfitrion": room.player1_name,
            "invitado": room.player2_name,
            "status": room.status,
            "pokemon_por_jugador": room.pokemon_per_player,
            "requiere_contrasena": bool(room.password),
            "format_settings": room.format_settings,
            "jugadores": [{
                "apodo": j.apodo,
                "es_anfitrion": j.es_anfitrion,
                "equipo_count": len(j.equipo_pokemon),
                "equipo": j.equipo_pokemon,
                "listo": j.listo,
                "conectado": j.conectado
            } for j in jugadores]
        })


class RoomJoinView(APIView):
    """
    Unirse a una sala con validación de contraseña si es privada.
    """
    def post(self, request, room_code):
        room = get_object_or_404(BattleRoom, room_code=room_code.upper())
        player_name = request.data.get("player_name", "").strip() or "Entrenador 2"
        password = request.data.get("password", "").strip()
        team = request.data.get("team", [])

        if room.status != 'WAITING':
            return Response({"error": "La sala ya no está disponible"}, status=status.HTTP_400_BAD_REQUEST)

        if room.player1_name.lower() == player_name.lower():
            return Response({"error": "No puedes unirte a tu propia sala como oponente."}, status=status.HTTP_400_BAD_REQUEST)

        if room.password and room.password != password:
            return Response({"error": "Contraseña incorrecta"}, status=status.HTTP_403_FORBIDDEN)

        # Asignar como jugador 2
        room.player2_name = player_name
        room.save(update_fields=['player2_name'])

        SalaJugador.objects.update_or_create(
            sala=room,
            apodo=player_name,
            defaults={
                "es_anfitrion": False,
                "equipo_pokemon": team if isinstance(team, list) else [],
                "listo": False,
                "conectado": True
            }
        )

        SalaMensaje.objects.create(
            sala=room,
            emisor="SISTEMA",
            mensaje=f"{player_name} se ha unido a la sala.",
            es_sistema=True
        )

        return Response({
            "message": "Te has unido a la sala con éxito",
            "room_code": room.room_code,
            "role": "p2"
        })


class RoomReadyToggleView(APIView):
    """
    Cambiar el estado de Listo (Ready check) del jugador y actualizar su equipo.
    """
    def post(self, request, room_code):
        room = get_object_or_404(BattleRoom, room_code=room_code.upper())
        player_name = request.data.get("player_name", "").strip()
        team = request.data.get("team", [])
        is_ready = request.data.get("ready")

        jugador = get_object_or_404(SalaJugador, sala=room, apodo=player_name)
        if is_ready is not None:
            jugador.listo = bool(is_ready)
        else:
            jugador.listo = not jugador.listo

        if isinstance(team, list) and team:
            jugador.equipo_pokemon = team[:room.pokemon_per_player]

        jugador.save()

        # Si ambos jugadores están listos, la sala pasa a ACTIVE
        jugadores = room.jugadores.filter(conectado=True)
        if jugadores.count() >= 2 and all(j.listo for j in jugadores):
            room.status = "ACTIVE"
            room.save(update_fields=['status'])
            SalaMensaje.objects.create(
                sala=room,
                emisor="SISTEMA",
                mensaje="¡Ambos entrenadores están listos! El combate va a comenzar.",
                es_sistema=True
            )

        return Response({
            "apodo": jugador.apodo,
            "listo": jugador.listo,
            "sala_status": room.status
        })


class RoomChatView(APIView):
    """
    Mensajes de chat del lobby de la sala.
    """
    def get(self, request, room_code):
        room = get_object_or_404(BattleRoom, room_code=room_code.upper())
        mensajes = room.mensajes.all().order_by('enviado_en')[:50]
        return Response([{
            "id": m.id,
            "emisor": m.emisor,
            "mensaje": m.mensaje,
            "es_sistema": m.es_sistema,
            "enviado_en": m.enviado_en
        } for m in mensajes])

    def post(self, request, room_code):
        room = get_object_or_404(BattleRoom, room_code=room_code.upper())
        emisor = request.data.get("emisor", "Entrenador").strip() or "Entrenador"
        mensaje = request.data.get("mensaje", "").strip()

        if not mensaje:
            return Response({"error": "Mensaje vacío"}, status=status.HTTP_400_BAD_REQUEST)

        msg = SalaMensaje.objects.create(
            sala=room,
            emisor=emisor,
            mensaje=mensaje,
            es_sistema=False
        )

        return Response({
            "id": msg.id,
            "emisor": msg.emisor,
            "mensaje": msg.mensaje,
            "es_sistema": msg.es_sistema,
            "enviado_en": msg.enviado_en
        }, status=status.HTTP_201_CREATED)
