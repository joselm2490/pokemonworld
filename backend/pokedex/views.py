from pathlib import Path
from django.conf import settings
from django.http import Http404, FileResponse
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import (
    Tipo, ClaseMovimiento, EfectividadTipo, Habilidad,
    Movimiento, Pokemon, EstadisticasBase, PokemonMovimiento
)

_AVAILABLE_SPRITES_CACHE = None


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


def format_pokemon_summary(pkmn):
    species_key = pkmn.nombre_ingles.upper().replace(' ', '_').replace('-', '_')
    types_list = [
        {"id": pkmn.tipo1.id, "nombre": pkmn.tipo1.nombre, "nombre_ingles": pkmn.tipo1.nombre_ingles, "color_hex": pkmn.tipo1.color_hex}
    ]
    if pkmn.tipo2:
        types_list.append(
            {"id": pkmn.tipo2.id, "nombre": pkmn.tipo2.nombre, "nombre_ingles": pkmn.tipo2.nombre_ingles, "color_hex": pkmn.tipo2.color_hex}
        )

    stats = None
    if hasattr(pkmn, 'estadisticas'):
        st = pkmn.estadisticas
        stats = {
            "hp": st.hp,
            "attack": st.ataque,
            "defense": st.defensa,
            "sp_attack": st.ataque_especial,
            "sp_defense": st.defensa_especial,
            "speed": st.velocidad,
            "total": st.total
        }

    habs = [
        {"id": h.id, "nombre": h.nombre, "nombre_ingles": h.nombre_ingles, "descripcion": h.descripcion}
        for h in pkmn.habilidades.all()
    ]

    return {
        "id": pkmn.id,
        "numero_pokedex": pkmn.numero_pokedex,
        "species": pkmn.nombre_ingles.upper(),
        "nombre": pkmn.nombre,
        "nombre_ingles": pkmn.nombre_ingles,
        "gen": pkmn.gen,
        "types": [t["nombre_ingles"].upper() for t in types_list],
        "types_detail": types_list,
        "habilidades": habs,
        "categoria_rareza": pkmn.categoria_rareza,
        "fase": pkmn.fase,
        "campeon": pkmn.campeon,
        "peso_kg": pkmn.peso_kg,
        "altura_m": pkmn.altura_m,
        "base_stats": stats,
        "front_sprite_url": f"/sprites/Graphics/Pokemon/Front/{species_key}.png",
        "back_sprite_url": f"/sprites/Graphics/Pokemon/Back/{species_key}.png",
        "icon_url": f"/sprites/Graphics/Pokemon/Icons/{species_key}.png",
    }


class PokemonListView(APIView):
    """
    Catálogo de Pokémon con soporte para búsqueda, filtros de tipo, generación,
    fase evolutiva y rareza.
    """
    def get(self, request):
        query = request.query_params.get('q', '').strip()
        tipo = request.query_params.get('tipo', '').strip()
        gen = request.query_params.get('gen', '').strip()
        rareza = request.query_params.get('rareza', '').strip()
        fase = request.query_params.get('fase', '').strip()
        campeon = request.query_params.get('campeon', '').strip()

        limit = int(request.query_params.get('limit', '100') or 100)
        offset = int(request.query_params.get('offset', '0') or 0)
        limit = max(1, min(limit, 500))

        qs = Pokemon.objects.select_related('tipo1', 'tipo2', 'estadisticas').prefetch_related('habilidades').all()

        if query:
            qs = qs.filter(
                Q(nombre__icontains=query) |
                Q(nombre_ingles__icontains=query) |
                Q(numero_pokedex__icontains=query)
            )

        if tipo:
            qs = qs.filter(
                Q(tipo1__nombre__iexact=tipo) |
                Q(tipo1__nombre_ingles__iexact=tipo) |
                Q(tipo2__nombre__iexact=tipo) |
                Q(tipo2__nombre_ingles__iexact=tipo)
            )

        if gen and gen.isdigit():
            qs = qs.filter(gen=int(gen))

        if rareza:
            qs = qs.filter(categoria_rareza__iexact=rareza)

        if fase and fase.isdigit():
            qs = qs.filter(fase=int(fase))

        if campeon in ('1', 'true', 'True'):
            qs = qs.filter(campeon=True)

        total_count = qs.count()
        results = qs[offset:offset + limit]

        data = [format_pokemon_summary(p) for p in results]
        return Response({
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "results": data
        })


class PokemonDetailView(APIView):
    """
    Detalle completo de un Pokémon:
    - Estadísticas base
    - Árbol genealógico y fases evolutivas
    - Tabla de efectividad/multiplicadores elementales
    - Movimientos predeterminados (4 ataques)
    - Lista de movimientos aprendibles (learnset)
    """
    def get(self, request, pk_or_name):
        qs = Pokemon.objects.select_related(
            'tipo1', 'tipo2', 'estadisticas', 'preevolucion', 'evolucion'
        ).prefetch_related('habilidades')

        if str(pk_or_name).isdigit():
            pkmn = qs.filter(Q(id=int(pk_or_name)) | Q(numero_pokedex=int(pk_or_name))).first()
        else:
            pkmn = qs.filter(
                Q(nombre__iexact=pk_or_name) | Q(nombre_ingles__iexact=pk_or_name)
            ).first()

        if not pkmn:
            return Response({"error": "Pokémon no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        summary = format_pokemon_summary(pkmn)

        # 1. Árbol evolutivo
        evolutions = {
            "fase_actual": pkmn.fase,
            "es_campeon": pkmn.campeon,
            "preevolucion": None,
            "evolucion": None,
        }
        if pkmn.preevolucion:
            evolutions["preevolucion"] = {
                "id": pkmn.preevolucion.id,
                "numero_pokedex": pkmn.preevolucion.numero_pokedex,
                "nombre": pkmn.preevolucion.nombre,
                "nombre_ingles": pkmn.preevolucion.nombre_ingles,
                "icon_url": f"/sprites/Graphics/Pokemon/Icons/{pkmn.preevolucion.nombre_ingles.upper()}.png"
            }
        if pkmn.evolucion:
            evolutions["evolucion"] = {
                "id": pkmn.evolucion.id,
                "numero_pokedex": pkmn.evolucion.numero_pokedex,
                "nombre": pkmn.evolucion.nombre,
                "nombre_ingles": pkmn.evolucion.nombre_ingles,
                "icon_url": f"/sprites/Graphics/Pokemon/Icons/{pkmn.evolucion.nombre_ingles.upper()}.png"
            }

        # 2. Cálculo dinámico de efectividad defensiva (debilidades y resistencias)
        # Multiplicador contra cada tipo atacante existente
        tipos_all = Tipo.objects.all()
        effectiveness = {}
        for t_atq in tipos_all:
            mult = 1.0
            # Mult contra tipo 1
            ef1 = EfectividadTipo.objects.filter(tipo_ataque=t_atq, tipo_defensa=pkmn.tipo1).first()
            if ef1:
                mult *= ef1.multiplicador
            # Mult contra tipo 2 si existe
            if pkmn.tipo2:
                ef2 = EfectividadTipo.objects.filter(tipo_ataque=t_atq, tipo_defensa=pkmn.tipo2).first()
                if ef2:
                    mult *= ef2.multiplicador

            effectiveness[t_atq.nombre_ingles.upper()] = {
                "tipo": t_atq.nombre,
                "tipo_ingles": t_atq.nombre_ingles,
                "color_hex": t_atq.color_hex,
                "multiplicador": mult
            }

        # 3. Movimientos predeterminados
        default_moves = []
        if pkmn.movimientos_predeterminados:
            moves_ids = [m for m in pkmn.movimientos_predeterminados if isinstance(m, int)]
            if moves_ids:
                mv_qs = Movimiento.objects.select_related('tipo', 'clase').filter(id__in=moves_ids)
                for mv in mv_qs:
                    default_moves.append({
                        "id": mv.id,
                        "codigo": mv.codigo,
                        "nombre": mv.nombre,
                        "nombre_ingles": mv.nombre_ingles,
                        "tipo": mv.tipo_nombre,
                        "tipo_color": mv.tipo.color_hex if mv.tipo else '#777777',
                        "clase": mv.clase_nombre,
                        "potencia": mv.potencia,
                        "precision": mv.precision,
                        "pp": mv.pp,
                        "prioridad": mv.prioridad,
                        "descripcion": mv.descripcion,
                    })

        # 4. Movimientos aprendibles
        learnset = []
        aprende_qs = PokemonMovimiento.objects.filter(
            pokemon=pkmn
        ).select_related('movimiento', 'movimiento__tipo', 'movimiento__clase').order_by('nivel_aprendizaje', 'movimiento__nombre')[:60]

        for pm in aprende_qs:
            mv = pm.movimiento
            learnset.append({
                "metodo": pm.metodo_aprendizaje,
                "nivel": pm.nivel_aprendizaje,
                "movimiento": {
                    "id": mv.id,
                    "codigo": mv.codigo,
                    "nombre": mv.nombre,
                    "nombre_ingles": mv.nombre_ingles,
                    "tipo": mv.tipo_nombre,
                    "tipo_color": mv.tipo.color_hex if mv.tipo else '#777777',
                    "clase": mv.clase_nombre,
                    "potencia": mv.potencia,
                    "precision": mv.precision,
                    "pp": mv.pp,
                    "descripcion": mv.descripcion,
                }
            })

        return Response({
            **summary,
            "curva_crecimiento": pkmn.curva_crecimiento,
            "ratio_captura": pkmn.ratio_captura,
            "experiencia_base": pkmn.experiencia_base,
            "evoluciones": evolutions,
            "efectividades": effectiveness,
            "movimientos_predeterminados_data": default_moves,
            "learnset": learnset
        })


class MovimientosListView(APIView):
    """
    Catálogo de los 953 movimientos oficiales con filtros de tipo, categoría, generación.
    """
    def get(self, request):
        query = request.query_params.get('q', '').strip()
        tipo = request.query_params.get('tipo', '').strip()
        clase = request.query_params.get('clase', '').strip()
        gen = request.query_params.get('gen', '').strip()
        limit = int(request.query_params.get('limit', '50') or 50)
        offset = int(request.query_params.get('offset', '0') or 0)
        limit = max(1, min(limit, 953))

        qs = Movimiento.objects.select_related('tipo', 'clase').all()

        if query:
            qs = qs.filter(
                Q(nombre__icontains=query) |
                Q(nombre_ingles__icontains=query) |
                Q(codigo__icontains=query)
            )

        if tipo:
            qs = qs.filter(
                Q(tipo_nombre__iexact=tipo) |
                Q(tipo__nombre_ingles__iexact=tipo)
            )

        if clase:
            qs = qs.filter(
                Q(clase_nombre__iexact=clase) |
                Q(clase__nombre_ingles__iexact=clase)
            )

        if gen and gen.isdigit():
            qs = qs.filter(gen=int(gen))

        total_count = qs.count()
        results = qs[offset:offset + limit]

        data = [{
            "id": m.id,
            "codigo": m.codigo,
            "nombre": m.nombre,
            "nombre_alt": m.nombre_alt,
            "nombre_ingles": m.nombre_ingles,
            "gen": m.gen,
            "tipo": m.tipo_nombre,
            "tipo_color": m.tipo.color_hex if m.tipo else '#777777',
            "clase": m.clase_nombre,
            "clase_color": m.clase.color_hex if m.clase else '#777777',
            "potencia": m.potencia,
            "potencia_texto": m.potencia_texto,
            "precision": m.precision,
            "precision_texto": m.precision_texto,
            "pp": m.pp,
            "pp_texto": m.pp_texto,
            "prioridad": m.prioridad,
            "contacto": m.contacto,
            "es_gigamax": m.es_gigamax,
            "es_movimiento_z": m.es_movimiento_z,
            "probabilidad_efecto": m.probabilidad_efecto,
            "descripcion": m.descripcion,
            "efecto_secundario": m.efecto_secundario
        } for m in results]

        return Response({
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "results": data
        })


class TiposListView(APIView):
    """
    Listado de tipos elementales y matriz de efectividad.
    """
    def get(self, request):
        tipos = Tipo.objects.all()
        tipos_data = [{
            "id": t.id,
            "nombre": t.nombre,
            "nombre_ingles": t.nombre_ingles,
            "color_hex": t.color_hex
        } for t in tipos]

        chart = []
        efectividades = EfectividadTipo.objects.select_related('tipo_ataque', 'tipo_defensa').all()
        for ef in efectividades:
            chart.append({
                "ataque": ef.tipo_ataque.nombre,
                "ataque_en": ef.tipo_ataque.nombre_ingles,
                "defensa": ef.tipo_defensa.nombre,
                "defensa_en": ef.tipo_defensa.nombre_ingles,
                "multiplicador": ef.multiplicador
            })

        return Response({
            "tipos": tipos_data,
            "matriz_efectividad": chart
        })


class HabilidadesListView(APIView):
    """
    Listado de habilidades pasivas.
    """
    def get(self, request):
        query = request.query_params.get('q', '').strip()
        qs = Habilidad.objects.all()
        if query:
            qs = qs.filter(
                Q(nombre__icontains=query) | Q(nombre_ingles__icontains=query)
            )

        data = [{
            "id": h.id,
            "nombre": h.nombre,
            "nombre_ingles": h.nombre_ingles,
            "descripcion": h.descripcion
        } for h in qs[:100]]

        return Response({
            "total": qs.count(),
            "results": data
        })


class RosterListView(APIView):
    """
    Compatibilidad con el roster previo del TeamBuilder.
    """
    def get(self, request):
        query = request.query_params.get('q', '').strip()
        limit = int(request.query_params.get('limit', '48') or 48)
        limit = max(1, min(limit, 300))

        qs = Pokemon.objects.select_related('tipo1', 'tipo2', 'estadisticas').prefetch_related('habilidades').all()
        if query:
            qs = qs.filter(
                Q(nombre__icontains=query) |
                Q(nombre_ingles__icontains=query)
            )

        results = qs[:limit]
        roster = []
        for p in results:
            summary = format_pokemon_summary(p)
            roster.append({
                "species": summary["species"],
                "name": summary["nombre"],
                "types": summary["types"],
                "base_stats": summary["base_stats"],
                "front_sprite_url": summary["front_sprite_url"],
                "back_sprite_url": summary["back_sprite_url"],
                "icon_url": summary["icon_url"],
                "fase": summary["fase"],
                "campeon": summary["campeon"],
                "categoria_rareza": summary["categoria_rareza"],
            })

        return Response(roster)


class SpriteFileView(APIView):
    """Sirve sprites e iconos desde las carpetas locales de sprites."""
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


class DbStatusView(APIView):
    def get(self, request):
        from django.db import connection
        charizard = Pokemon.objects.filter(nombre_ingles__iexact='Charizard').first()
        st = BaseStat.objects.filter(pokemon=charizard).first() if charizard else None
        return Response({
            "db_engine": connection.settings_dict.get('ENGINE'),
            "db_host": connection.settings_dict.get('HOST'),
            "db_name": connection.settings_dict.get('NAME'),
            "commit_tag": "stats-lv100-v1",
            "charizard_hp": st.hp if st else None,
            "charizard_total": st.total if st else None,
        })
