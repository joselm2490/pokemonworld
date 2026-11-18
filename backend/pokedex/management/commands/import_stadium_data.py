import os
import json
import sqlite3
from pathlib import Path
from django.core.management.base import BaseCommand
from django.db import transaction
from pokedex.models import (
    Tipo, ClaseMovimiento, EfectividadTipo, Habilidad,
    Movimiento, Pokemon, EstadisticasBase, PokemonMovimiento
)

LEGENDARY_NAMES = {
    'ARTICUNO', 'ZAPDOS', 'MOLTRES', 'MEWTWO', 'MEW',
    'RAIKOU', 'ENTEI', 'SUICUNE', 'LUGIA', 'HO-OH', 'CELEBI',
    'REGIROCK', 'REGICE', 'REGISTEEL', 'LATIAS', 'LATIOS',
    'KYOGRE', 'GROUDON', 'RAYQUAZA', 'JIRACHI', 'DEOXYS',
    'UXIE', 'MESPRIT', 'AZELF', 'DIALGA', 'PALKIA', 'HEATRAN',
    'REGIGIGAS', 'GIRATINA', 'CRESSELIA', 'PHIONE', 'MANAPHY',
    'DARKRAI', 'SHAYMIN', 'ARCEUS',
    'VICTINI', 'COBALION', 'TERRAKION', 'VIRIZION', 'TORNADUS',
    'THUNDURUS', 'RESHIRAM', 'ZEKROM', 'LANDORUS', 'KYUREM',
    'KELDEO', 'MELOETTA', 'GENESECT',
    'XERNEAS', 'YVELTAL', 'ZYGARDE', 'DIANCIE', 'HOOPA', 'VOLCANION',
    'TYPE: NULL', 'SILVALLY', 'TAPU KOKO', 'TAPU LELE', 'TAPU BULU', 'TAPU FINI',
    'COSMOG', 'COSMOEM', 'SOLGALEO', 'LUNALA', 'NIHILEGO', 'BUZZWOLE',
    'PHEROMOSA', 'XURKITREE', 'CELESTEELA', 'KARTANA', 'GUZZLORD',
    'NECROZMA', 'MAGEARNA', 'MARSHADOW', 'POIPOLE', 'NAGANADEL',
    'STAKATAKA', 'BLACEPHALON', 'ZERAORA', 'MELTAN', 'MELMETAL',
    'ZACIAN', 'ZAMAZENTA', 'ETERNATUS', 'KUBFU', 'URSHIFU',
    'ZARUDE', 'REGIELEKI', 'REGIDRAGO', 'GLASTRIER', 'SPECTRIER',
    'CALYREX', 'ENAMORUS',
    'WO-CHIEN', 'CHIEN-PAO', 'TING-LU', 'CHI-YU', 'ROARING MOON',
    'IRON VALIANT', 'KORAIDON', 'MIRAIDON', 'WALKING WAKE', 'IRON LEAVES',
    'OKIDOGI', 'MUNKIDORI', 'FEZANDIPITI', 'OGERPON', 'ARCHALUDON',
    'GOUGING FIRE', 'RAGING BOLT', 'IRON BOULDER', 'IRON CROWN', 'TERAPAGOS', 'PECHARUNT'
}

PSEUDO_LEGENDARIES = {
    'DRAGONITE', 'TYRANITAR', 'SALAMENCE', 'METAGROSS', 'GARCHOMP',
    'HYDREIGON', 'GOODRA', 'KOMMO-O', 'DRAGAPULT', 'BAXCALIBUR'
}


class Command(BaseCommand):
    help = "Importa datos completos de Pokémon Stadium World (Pokémon, Movimientos, Habilidades y Tipos)"

    def handle(self, *args, **options):
        db_path = "/home/jose/Pokemon-Stadium-World (Copiar)/frontend/database/pokemon_game.db"
        if not os.path.exists(db_path):
            self.stderr.write(f"No se encontró {db_path}")
            return

        self.stdout.write("Conectando a base de datos de origen...")
        src = sqlite3.connect(db_path)
        src.row_factory = sqlite3.Row
        cur = src.cursor()

        with transaction.atomic():
            # 1. Tipos
            self.stdout.write("1. Importando tipos...")
            cur.execute("SELECT id, nombre, nombre_ingles, color_hex FROM tipos")
            for r in cur.fetchall():
                Tipo.objects.update_or_create(
                    id=r['id'],
                    defaults={
                        'nombre': r['nombre'],
                        'nombre_ingles': r['nombre_ingles'],
                        'color_hex': r['color_hex'],
                    }
                )

            # 2. Clases de Movimiento
            self.stdout.write("2. Importando clases de movimiento...")
            cur.execute("SELECT id, nombre, nombre_ingles, color_hex FROM clases_movimiento")
            for r in cur.fetchall():
                ClaseMovimiento.objects.update_or_create(
                    id=r['id'],
                    defaults={
                        'nombre': r['nombre'],
                        'nombre_ingles': r['nombre_ingles'],
                        'color_hex': r['color_hex'],
                    }
                )

            # 3. Efectividad de Tipos
            self.stdout.write("3. Importando efectividad de tipos...")
            cur.execute("SELECT tipo_ataque_id, tipo_defensa_id, multiplicador FROM efectividad_tipos")
            for r in cur.fetchall():
                EfectividadTipo.objects.update_or_create(
                    tipo_ataque_id=r['tipo_ataque_id'],
                    tipo_defensa_id=r['tipo_defensa_id'],
                    defaults={'multiplicador': r['multiplicador']}
                )

            # 4. Habilidades (desde abilities.txt si existe)
            self.stdout.write("4. Importando habilidades...")
            pbs_file = Path("/home/jose/pokemonworld/backend/battle/pbs_data/abilities.txt")
            if pbs_file.exists():
                curr_code = None
                curr_name = ""
                curr_desc = ""
                with open(pbs_file, "r", encoding="utf-8-sig") as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith('[') and line.endswith(']'):
                            if curr_code and curr_name:
                                Habilidad.objects.update_or_create(
                                    nombre=curr_name,
                                    defaults={
                                        'nombre_ingles': curr_name,
                                        'descripcion': curr_desc,
                                    }
                                )
                            curr_code = line[1:-1]
                            curr_name = ""
                            curr_desc = ""
                        elif '=' in line:
                            k, v = line.split('=', 1)
                            k, v = k.strip().lower(), v.strip()
                            if k == 'name':
                                curr_name = v
                            elif k == 'description':
                                curr_desc = v
                if curr_code and curr_name:
                    Habilidad.objects.update_or_create(
                        nombre=curr_name,
                        defaults={
                            'nombre_ingles': curr_name,
                            'descripcion': curr_desc,
                        }
                    )

            # 5. Movimientos (953 registros)
            self.stdout.write("5. Importando 953 movimientos...")
            cur.execute("SELECT * FROM movimientos")
            for r in cur.fetchall():
                Movimiento.objects.update_or_create(
                    id=r['id'],
                    defaults={
                        'codigo': r['codigo'],
                        'nombre': r['nombre'],
                        'nombre_alt': r['nombre_alt'],
                        'nombre_ingles': r['nombre_ingles'],
                        'gen': r['gen'],
                        'descripcion': r['descripcion'],
                        'tipo_id': r['tipo_id'],
                        'tipo_nombre': r['tipo'],
                        'clase_id': r['clase_id'],
                        'clase_nombre': r['clase'],
                        'potencia': r['potencia'],
                        'potencia_texto': r['potencia_texto'],
                        'precision': r['precision'],
                        'precision_texto': r['precision_texto'],
                        'pp': r['pp'],
                        'pp_texto': r['pp_texto'],
                        'prioridad': r['prioridad'] or 0,
                        'es_gigamax': bool(r['es_gigamax']),
                        'es_movimiento_z': bool(r['es_movimiento_z']),
                        'contacto': bool(r['contacto']),
                        'probabilidad_efecto': r['probabilidad_efecto'] or 0,
                        'efecto_secundario': r['efecto_secundario'],
                    }
                )

            # 6. Pokémon (1082 registros)
            self.stdout.write("6. Importando 1082 Pokémon...")
            cur.execute("SELECT * FROM pokemon")
            # First pass: create without FK to self
            raw_pokemon = cur.fetchall()
            for r in raw_pokemon:
                moves_list = []
                if r['movimientos_predeterminados']:
                    try:
                        moves_list = json.loads(r['movimientos_predeterminados'])
                    except Exception:
                        moves_list = []

                name_en = (r['nombre_ingles'] or '').upper()
                rareza = 'estandar'
                if name_en in LEGENDARY_NAMES:
                    rareza = 'legendario'
                elif name_en in PSEUDO_LEGENDARIES:
                    rareza = 'pseudolegendario'

                Pokemon.objects.update_or_create(
                    id=r['id'],
                    defaults={
                        'numero_pokedex': r['numero_pokedex'],
                        'nombre': r['nombre'],
                        'nombre_ingles': r['nombre_ingles'],
                        'gen': r['gen'],
                        'tipo1_id': r['tipo1_id'],
                        'tipo2_id': r['tipo2_id'],
                        'peso_kg': r['peso_kg'],
                        'altura_m': r['altura_m'],
                        'ratio_captura': r['ratio_captura'],
                        'experiencia_base': r['experiencia_base'],
                        'curva_crecimiento': r['curva_crecimiento'],
                        'categoria_rareza': rareza,
                        'movimientos_predeterminados': moves_list,
                        'campeon': bool(r['campeon']),
                        'fase': r['fase'] or 1,
                    }
                )

            # Second pass: link evolutions
            self.stdout.write("6.2 Vinculando fases evolutivas...")
            for r in raw_pokemon:
                p_id = r['id']
                preevo_id = r['preevolucion']
                evo_id = r['evolucion']
                if preevo_id or evo_id:
                    Pokemon.objects.filter(id=p_id).update(
                        preevolucion_id=preevo_id,
                        evolucion_id=evo_id,
                    )

            # 7. Estadísticas Base
            self.stdout.write("7. Importando estadísticas base...")
            cur.execute("SELECT * FROM estadisticas_base")
            for r in cur.fetchall():
                total = (
                    r['hp'] + r['ataque'] + r['defensa'] +
                    r['ataque_especial'] + r['defensa_especial'] + r['velocidad']
                )
                EstadisticasBase.objects.update_or_create(
                    pokemon_id=r['pokemon_id'],
                    defaults={
                        'hp': r['hp'],
                        'ataque': r['ataque'],
                        'defensa': r['defensa'],
                        'ataque_especial': r['ataque_especial'],
                        'defensa_especial': r['defensa_especial'],
                        'velocidad': r['velocidad'],
                        'total': total,
                    }
                )

            # 8. Pokemon Movimientos (batch insert for speed)
            self.stdout.write("8. Importando movimientos aprendibles por Pokémon...")
            cur.execute("SELECT pokemon_id, movimiento_id, metodo_aprendizaje, nivel_aprendizaje FROM pokemon_movimientos")
            batch = []
            PokemonMovimiento.objects.all().delete()
            for r in cur.fetchall():
                batch.append(PokemonMovimiento(
                    pokemon_id=r['pokemon_id'],
                    movimiento_id=r['movimiento_id'],
                    metodo_aprendizaje=r['metodo_aprendizaje'],
                    nivel_aprendizaje=r['nivel_aprendizaje'] or 1,
                ))
                if len(batch) >= 5000:
                    PokemonMovimiento.objects.bulk_create(batch, ignore_conflicts=True)
                    batch = []
            if batch:
                PokemonMovimiento.objects.bulk_create(batch, ignore_conflicts=True)

        self.stdout.write(self.style.SUCCESS("¡Importación completada con éxito!"))
