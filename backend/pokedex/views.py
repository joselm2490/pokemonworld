from pathlib import Path
from django.conf import settings
from django.http import Http404, FileResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from battle.pbs_loader import get_all_pokemon

_METRICS_CACHE = None
_AVAILABLE_SPRITES_CACHE = None


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


def get_available_sprite_species():
    global _AVAILABLE_SPRITES_CACHE
    if _AVAILABLE_SPRITES_CACHE is not None:
        return _AVAILABLE_SPRITES_CACHE

    front_dir = settings.SPRITES_DIR / 'Graphics' / 'Pokemon' / 'Front'
    if not front_dir.exists():
        _AVAILABLE_SPRITES_CACHE = set()
        return _AVAILABLE_SPRITES_CACHE

    _AVAILABLE_SPRITES_CACHE = {
        p.stem.upper() for p in front_dir.glob('*.png')
    }
    return _AVAILABLE_SPRITES_CACHE


class RosterListView(APIView):
    def get(self, request):
        query = request.query_params.get('q', '').strip().lower()
        limit = int(request.query_params.get('limit', '151') or 151)
        limit = max(1, min(limit, 900))

        all_pkmn = get_all_pokemon()
        available_sprites = get_available_sprite_species()

        roster = []
        for species, data in all_pkmn.items():
            if available_sprites and species not in available_sprites:
                continue
            if query and query not in data["name"].lower() and query not in species.lower() and not any(query in t.lower() for t in data["types"]):
                continue
            roster.append({
                "species": species,
                "name": data["name"],
                "types": data["types"],
                "base_stats": data["base_stats"],
                "front_sprite_url": f"/sprites/Graphics/Pokemon/Front/{species}.png",
                "back_sprite_url": f"/sprites/Graphics/Pokemon/Back/{species}.png",
                "icon_url": f"/sprites/Graphics/Pokemon/Icons/{species}.png",
            })
            if len(roster) >= limit:
                break

        return Response(roster)


class SpriteFileView(APIView):
    """Serves the sprite images directly from the local Animated Pokemon Sprites folder."""
    def get(self, request, sprite_path):
        clean_path = Path(sprite_path).as_posix()
        if ".." in clean_path:
            raise Http404("Invalid path")

        full_path = settings.SPRITES_DIR / clean_path
        if not full_path.exists() or not full_path.is_file():
            fallback = settings.SPRITES_DIR / "Graphics" / "Pokemon" / "Front" / "000.png"
            if fallback.exists():
                return FileResponse(open(fallback, 'rb'), content_type="image/png")
            raise Http404("Sprite not found")

        response = FileResponse(open(full_path, 'rb'), content_type="image/png")
        response['Cache-Control'] = 'public, max-age=86400'
        return response
