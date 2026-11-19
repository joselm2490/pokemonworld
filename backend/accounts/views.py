import uuid
from django.contrib.auth import authenticate, get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

User = get_user_model()


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
