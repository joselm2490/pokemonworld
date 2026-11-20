import uuid
from django.db import models


class BattleRoom(models.Model):
    STATUS_CHOICES = [
        ('WAITING', 'Esperando Oponente'),
        ('ACTIVE', 'En Combate'),
        ('FINISHED', 'Finalizada'),
        ('CANCELLED', 'Cancelada'),
    ]

    room_code = models.CharField(max_length=32, unique=True, db_index=True)
    password = models.CharField(max_length=128, blank=True, null=True)
    player1_name = models.CharField(max_length=64, default="Anfitrión")
    player2_name = models.CharField(max_length=64, blank=True, null=True)
    is_ai_match = models.BooleanField(default=False)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='WAITING')
    pokemon_per_player = models.IntegerField(default=6)  # Duelo 6 vs 6 por defecto
    max_players = models.IntegerField(default=2)
    format_settings = models.JSONField(
        default=dict,
        blank=True,
        help_text="Filtros: generaciones permitidas, permitir_legendarios, etc."
    )
    winner = models.CharField(max_length=64, blank=True, null=True)
    state_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'battle_rooms'
        ordering = ['-created_at']

    def __str__(self):
        return f"BattleRoom {self.room_code} [{self.status}]"


class RoomPlayer(models.Model):
    sala = models.ForeignKey(
        BattleRoom, on_delete=models.CASCADE, related_name='jugadores'
    )
    apodo = models.CharField(max_length=64)
    es_anfitrion = models.BooleanField(default=False)
    equipo_pokemon = models.JSONField(default=list, blank=True)
    listo = models.BooleanField(default=False)
    conectado = models.BooleanField(default=True)
    unido_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'room_players'
        unique_together = ('sala', 'apodo')

    @property
    def room(self):
        return self.sala

    @property
    def nickname(self):
        return self.apodo

    def __str__(self):
        role = "Host" if self.es_anfitrion else "Guest"
        return f"{self.apodo} ({role}) in BattleRoom {self.sala.room_code}"


class RoomMessage(models.Model):
    sala = models.ForeignKey(
        BattleRoom, on_delete=models.CASCADE, related_name='mensajes'
    )
    emisor = models.CharField(max_length=64)
    mensaje = models.TextField()
    es_sistema = models.BooleanField(default=False)
    enviado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'room_messages'
        ordering = ['enviado_en']

    @property
    def room(self):
        return self.sala

    @property
    def sender(self):
        return self.emisor

    @property
    def content(self):
        return self.mensaje

    def __str__(self):
        return f"[{self.sala.room_code}] {self.emisor}: {self.mensaje[:30]}"


class BattleStatistic(models.Model):
    sala = models.OneToOneField(
        BattleRoom, on_delete=models.CASCADE, related_name='estadisticas', primary_key=True
    )
    total_turnos = models.IntegerField(default=0)
    total_dano_causado = models.IntegerField(default=0)
    pokemon_debilitados = models.IntegerField(default=0)
    movimientos_usados = models.IntegerField(default=0)
    duracion_segundos = models.IntegerField(default=0)
    mvp_pokemon = models.CharField(max_length=100, blank=True, null=True)
    datos_combate = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'battle_statistics'

    @property
    def room(self):
        return self.sala

    def __str__(self):
        return f"Statistics for BattleRoom {self.sala.room_code}"


# Backward compatibility aliases
SalaJugador = RoomPlayer
SalaMensaje = RoomMessage
SalaEstadistica = BattleStatistic
