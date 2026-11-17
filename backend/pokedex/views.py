import os
from pathlib import Path
from django.conf import settings
from django.http import HttpResponse, Http404, FileResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from battle.data_roster import POKEMON_ROSTER

_METRICS_CACHE = None

def load_metrics():
    global _METRICS_CACHE
    if _METRICS_CACHE is not None:
        return _METRICS_CACHE

    _METRICS_CACHE = {}
    pbs_file = settings.PBS_DIR / 'pokemon_metrics.txt'
    if not pbs_file.exists():
        return _METRICS_CACHE

    curr = None
    try:
        with open(pbs_file, 'r', encoding='utf-8-sig') as f:
            for line in f:
                line = line.strip()
                if line.startswith('[') and line.endswith(']'):
                    curr = line[1:-1].upper()
                    _METRICS_CACHE[curr] = {}
                elif curr and '=' in line:
                    k, v = line.split('=', 1)
                    _METRICS_CACHE[curr][k.strip()] = v.strip()
    except Exception as e:
        print("Error loading PBS metrics:", e)

    return _METRICS_CACHE

class RosterListView(APIView):
    def get(self, request):
        metrics = load_metrics()
        roster = []
        for key, data in POKEMON_ROSTER.items():
            species = data["species"]
            species_metrics = metrics.get(species, {})
            roster.append({
                "species": species,
                "name": data["name"],
                "types": data["types"],
                "base_stats": data["base_stats"],
                "moves": data["moves"],
                "front_sprite_url": f"/sprites/Graphics/Pokemon/Front/{species}.png",
                "back_sprite_url": f"/sprites/Graphics/Pokemon/Back/{species}.png",
                "icon_url": f"/sprites/Graphics/Pokemon/Icons/{species}.png",
                "metrics": {
                    "front_sprite": species_metrics.get("FrontSprite", "0,0"),
                    "back_sprite": species_metrics.get("BackSprite", "0,0"),
                }
            })
        return Response(roster)

class SpriteFileView(APIView):
    """Serves the sprite images directly from the local Animated Pokemon Sprites folder."""
    def get(self, request, sprite_path):
        clean_path = Path(sprite_path).as_posix()
        # Security check: prevent directory traversal
        if ".." in clean_path:
            raise Http404("Invalid path")

        full_path = settings.SPRITES_DIR / clean_path
        if not full_path.exists() or not full_path.is_file():
            # If shiny or form not found, fallback to standard or 000.png
            fallback = settings.SPRITES_DIR / "Graphics" / "Pokemon" / "Front" / "000.png"
            if fallback.exists():
                return FileResponse(open(fallback, 'rb'), content_type="image/png")
            raise Http404("Sprite not found")

        response = FileResponse(open(full_path, 'rb'), content_type="image/png")
        # Cache for 24 hours to maximize performance
        response['Cache-Control'] = 'public, max-age=86400'
        return response
