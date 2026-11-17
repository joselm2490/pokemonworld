import uuid
from django.db import models

class BattleRoom(models.Model):
    STATUS_CHOICES = [
        ('WAITING', 'Waiting for Opponent'),
        ('ACTIVE', 'Active Battle'),
        ('FINISHED', 'Finished'),
    ]

    room_code = models.CharField(max_length=32, unique=True, db_index=True)
    player1_name = models.CharField(max_length=64, default="Player 1")
    player2_name = models.CharField(max_length=64, blank=True, null=True)
    is_ai_match = models.BooleanField(default=False)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='WAITING')
    winner = models.CharField(max_length=64, blank=True, null=True)
    state_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Room {self.room_code} [{self.status}]"
