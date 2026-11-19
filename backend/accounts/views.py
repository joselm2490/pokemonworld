import uuid
from django.contrib.auth import authenticate, get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import TrainerTeam

User = get_user_model()


def get_request_user(request):
    """
    Identifica al usuario por username o token en headers o payload.
    """
    username = (
        request.headers.get('X-Trainer-User') or
        request.query_params.get('username') or
        request.data.get('username')
    )
    if username:
        try:
            return User.objects.get(username__iexact=str(username).strip())
        except User.DoesNotExist:
            pass
    if request.user and request.user.is_authenticated:
        return request.user
    return None


class LoginView(APIView):
    """
    Endpoint para autenticación de entrenadores.
    Soporta login mediante username o email.
    """
    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '').strip()

        if not username or not password:
            return Response(
                {'error': 'Nombre de entrenador / email y contraseña requeridos.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(request, username=username, password=password)
        if user is None and '@' in username:
            try:
                user_obj = User.objects.get(email__iexact=username)
                user = authenticate(request, username=user_obj.username, password=password)
            except (User.DoesNotExist, User.MultipleObjectsReturned):
                user = None

        if user is not None:
            if not user.is_active:
                return Response(
                    {'error': 'Esta cuenta de entrenador se encuentra inactiva.'},
                    status=status.HTTP_403_FORBIDDEN
                )

            token = f"pkmn_{user.id}_{uuid.uuid4().hex[:16]}"
            return Response({
                'success': True,
                'username': user.username,
                'email': user.email,
                'token': token,
                'message': f'¡Bienvenido a la Arena, Entrenador {user.username}!'
            }, status=status.HTTP_200_OK)

        return Response(
            {'error': 'Credenciales inválidas. Revisa tu usuario y contraseña.'},
            status=status.HTTP_401_UNAUTHORIZED
        )


class RegisterView(APIView):
    """
    Endpoint para registro de nuevos entrenadores.
    """
    def post(self, request):
        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '').strip()

        if not username or not password:
            return Response(
                {'error': 'Debes ingresar un nombre de entrenador y una contraseña.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(username) < 3:
            return Response(
                {'error': 'El nombre de entrenador debe tener al menos 3 caracteres.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(password) < 6:
            return Response(
                {'error': 'La contraseña debe tener al menos 6 caracteres.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username__iexact=username).exists():
            return Response(
                {'error': 'Ese nombre de entrenador ya está en uso. Elige otro.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if email and User.objects.filter(email__iexact=email).exists():
            return Response(
                {'error': 'Ese correo electrónico ya está registrado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create_user(username=username, email=email, password=password)
        token = f"pkmn_{user.id}_{uuid.uuid4().hex[:16]}"

        return Response({
            'success': True,
            'username': user.username,
            'email': user.email,
            'token': token,
            'message': f'¡Cuenta creada con éxito! Bienvenido, {user.username}.'
        }, status=status.HTTP_201_CREATED)


class TrainerTeamsView(APIView):
    """
    Gestión de hasta 10 equipos de 6 Pokémon para cada entrenador.
    """
    DEFAULT_TEAMS = [
        {"slot": 1, "name": "Equipo 1", "pokemon_list": ["CHARIZARD", "PIKACHU", "BLASTOISE", "LUCARIO", "GENGAR", "GARCHOMP"], "is_active": True},
        {"slot": 2, "name": "Equipo 2 (Fuego)", "pokemon_list": ["CHARIZARD", "ARCANINE", "BLAZIKEN", "INFERNAPE", "VOLCARONA", "TYPHLOSION"], "is_active": False},
        {"slot": 3, "name": "Equipo 3 (Agua)", "pokemon_list": ["BLASTOISE", "GYARADOS", "SWAMPERT", "GRENINJA", "LAPRAS", "FERALIGATR"], "is_active": False},
        {"slot": 4, "name": "Equipo 4 (Dragón)", "pokemon_list": ["DRAGONITE", "GARCHOMP", "SALAMENCE", "HYDREIGON", "DRAGAPULT", "RAYQUAZA"], "is_active": False},
        {"slot": 5, "name": "Equipo 5 (Acero/Lucha)", "pokemon_list": ["LUCARIO", "METAGROSS", "SCIZOR", "CORVIKNIGHT", "MACHAMP", "GALLADE"], "is_active": False},
        {"slot": 6, "name": "Equipo 6 (Eléctrico)", "pokemon_list": ["PIKACHU", "RAICHU", "JOLTEON", "ELECTIVIRE", "LUXRAY", "ZAPDOS"], "is_active": False},
        {"slot": 7, "name": "Equipo 7 (Fantasma)", "pokemon_list": ["GENGAR", "CHANDELURE", "TYRANITAR", "ZOROARK", "MIMIKYU", "AEGISLASH"], "is_active": False},
        {"slot": 8, "name": "Equipo 8 (Planta)", "pokemon_list": ["VENUSAUR", "SCEPTILE", "DECIDUEYE", "ROSERADE", "AMOONGUSS", "TORTERRA"], "is_active": False},
        {"slot": 9, "name": "Equipo 9 (Psíquico)", "pokemon_list": ["MEWTWO", "ALAKAZAM", "GARDEVOIR", "TOGEKISS", "SYLVEON", "HATTERENE"], "is_active": False},
        {"slot": 10, "name": "Equipo 10 (Especial)", "pokemon_list": ["SNORLAX", "TOGEKISS", "TYRANITAR", "DRAGONITE", "LUCARIO", "CHARIZARD"], "is_active": False},
    ]

    def get(self, request):
        user = get_request_user(request)
        if not user:
            return Response({"teams": self.DEFAULT_TEAMS, "active_slot": 1})

        existing = list(TrainerTeam.objects.filter(user=user).order_by('slot'))
        existing_by_slot = {t.slot: t for t in existing}

        teams_data = []
        active_slot = 1
        for default_item in self.DEFAULT_TEAMS:
            slot = default_item["slot"]
            if slot in existing_by_slot:
                team_obj = existing_by_slot[slot]
                if team_obj.is_active:
                    active_slot = slot
                teams_data.append({
                    "slot": team_obj.slot,
                    "name": team_obj.name,
                    "pokemon_list": team_obj.pokemon_list,
                    "is_active": team_obj.is_active,
                })
            else:
                team_obj = TrainerTeam.objects.create(
                    user=user,
                    slot=slot,
                    name=default_item["name"],
                    pokemon_list=default_item["pokemon_list"],
                    is_active=default_item["is_active"]
                )
                if team_obj.is_active:
                    active_slot = slot
                teams_data.append({
                    "slot": team_obj.slot,
                    "name": team_obj.name,
                    "pokemon_list": team_obj.pokemon_list,
                    "is_active": team_obj.is_active,
                })

        return Response({"teams": teams_data, "active_slot": active_slot})

    def post(self, request):
        user = get_request_user(request)
        if not user:
            return Response({"error": "Usuario no identificado"}, status=status.HTTP_401_UNAUTHORIZED)

        slot = int(request.data.get("slot", 1))
        if slot < 1 or slot > 10:
            return Response({"error": "El slot debe estar entre 1 y 10"}, status=status.HTTP_400_BAD_REQUEST)

        name = str(request.data.get("name", f"Equipo {slot}")).strip()[:50] or f"Equipo {slot}"
        pokemon_list = request.data.get("pokemon_list", [])
        if not isinstance(pokemon_list, list):
            pokemon_list = []
        pokemon_list = pokemon_list[:6]
        is_active = bool(request.data.get("is_active", False))

        if is_active:
            TrainerTeam.objects.filter(user=user).update(is_active=False)

        team_obj, _ = TrainerTeam.objects.update_or_create(
            user=user,
            slot=slot,
            defaults={
                "name": name,
                "pokemon_list": pokemon_list,
                "is_active": is_active,
            }
        )

        return Response({
            "success": True,
            "slot": team_obj.slot,
            "name": team_obj.name,
            "pokemon_list": team_obj.pokemon_list,
            "is_active": team_obj.is_active,
            "message": f"Equipo #{slot} guardado correctamente"
        })
