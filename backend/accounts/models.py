from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class TrainerTeam(models.Model):
    """
    Cada entrenador puede guardar hasta 10 equipos de 6 Pokémon cada uno.
    Uno de los equipos se marca como activo para los combates (is_active).
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='teams')
    slot = models.PositiveSmallIntegerField(default=1)  # 1 a 10
    name = models.CharField(max_length=50, default='Equipo 1')
    pokemon_list = models.JSONField(default=list)  # Lista de hasta 6 nombres de especies
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'slot')
        ordering = ['slot']
        verbose_name = 'Equipo de Entrenador'
        verbose_name_plural = 'Equipos de Entrenadores'

    def __str__(self):
        return f"{self.user.username} - Slot {self.slot}: {self.name}"
