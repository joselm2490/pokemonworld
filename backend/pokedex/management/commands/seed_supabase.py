import os
import json
import time
from django.core.management.base import BaseCommand
from django.db import connection
from django.conf import settings
from pokedex.models import (
    Type, MoveCategory, TypeEffectiveness, Ability,
    Move, Pokemon, BaseStat, PokemonMove
)
from battle.models import BattleRoom

class Command(BaseCommand):
    help = "Carga rápida por lotes de todas las tablas de Supabase PostgreSQL a partir de supabase_seed.json"

    def handle(self, *args, **options):
        seed_file = os.path.join(settings.BASE_DIR, 'supabase_seed.json')
        if not os.path.exists(seed_file):
            # Fallback a raíz del repo
            seed_file = os.path.join(settings.BASE_DIR.parent, 'backend', 'supabase_seed.json')

        if not os.path.exists(seed_file):
            self.stderr.write(f"No se encontró el archivo de datos: {seed_file}")
            return

        self.stdout.write(f"Leyendo archivo de semilla: {seed_file}...")
        t0 = time.time()
        with open(seed_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        by_model = {}
        for item in data:
            m = item['model']
            by_model.setdefault(m, []).append(item)

        # 1. Type
        self.stdout.write("1. Insertando Types...")
        tipos = [
            Type(
                id=item['pk'],
                nombre=item['fields']['nombre'],
                nombre_ingles=item['fields']['nombre_ingles'],
                color_hex=item['fields']['color_hex']
            )
            for item in by_model.get('pokedex.tipo', [])
        ]
        Type.objects.bulk_create(tipos, ignore_conflicts=True)

        # 2. MoveCategory
        self.stdout.write("2. Insertando MoveCategories...")
        clases = [
            MoveCategory(
                id=item['pk'],
                nombre=item['fields']['nombre'],
                nombre_ingles=item['fields']['nombre_ingles'],
                color_hex=item['fields']['color_hex']
            )
            for item in by_model.get('pokedex.clasemovimiento', [])
        ]
        MoveCategory.objects.bulk_create(clases, ignore_conflicts=True)

        # 3. TypeEffectiveness
        self.stdout.write("3. Insertando TypeEffectiveness...")
        efectividades = [
            TypeEffectiveness(
                id=item['pk'],
                tipo_ataque_id=item['fields']['tipo_ataque'],
                tipo_defensa_id=item['fields']['tipo_defensa'],
                multiplicador=item['fields']['multiplicador']
            )
            for item in by_model.get('pokedex.efectividadtipo', [])
        ]
        TypeEffectiveness.objects.bulk_create(efectividades, ignore_conflicts=True)

        # 4. Ability
        self.stdout.write("4. Insertando Abilities...")
        habilidades = [
            Ability(
                id=item['pk'],
                nombre=item['fields']['nombre'],
                nombre_ingles=item['fields']['nombre_ingles'],
                descripcion=item['fields'].get('descripcion'),
                gen=item['fields'].get('gen')
            )
            for item in by_model.get('pokedex.habilidad', [])
        ]
        Ability.objects.bulk_create(habilidades, ignore_conflicts=True)

        # 5. Move
        self.stdout.write("5. Insertando Moves...")
        movimientos = []
        for item in by_model.get('pokedex.movimiento', []):
            f = item['fields']
            movimientos.append(Move(
                id=item['pk'],
                codigo=f['codigo'],
                nombre=f['nombre'],
                nombre_alt=f.get('nombre_alt'),
                nombre_ingles=f['nombre_ingles'],
                gen=f.get('gen', 1),
                descripcion=f.get('descripcion'),
                tipo_id=f.get('tipo'),
                tipo_nombre=f.get('tipo_nombre', ''),
                clase_id=f.get('clase'),
                clase_nombre=f.get('clase_nombre', ''),
                potencia=f.get('potencia'),
                potencia_texto=f.get('potencia_texto'),
                precision=f.get('precision'),
                precision_texto=f.get('precision_texto'),
                pp=f.get('pp'),
                pp_texto=f.get('pp_texto'),
                prioridad=f.get('prioridad', 0),
                es_gigamax=f.get('es_gigamax', False),
                es_movimiento_z=f.get('es_movimiento_z', False),
                contacto=f.get('contacto', False),
                probabilidad_efecto=f.get('probabilidad_efecto', 0),
                efecto_secundario=f.get('efecto_secundario')
            ))
        Move.objects.bulk_create(movimientos, batch_size=1000, ignore_conflicts=True)

        # 6. Pokemon
        self.stdout.write("6. Insertando Pokémon y relaciones...")
        pokemons = []
        pokemon_habilidades_rels = []
        evol_map = {}
        ThroughModel = Pokemon.habilidades.through

        for item in by_model.get('pokedex.pokemon', []):
            f = item['fields']
            pk = item['pk']
            pokemons.append(Pokemon(
                id=pk,
                numero_pokedex=f['numero_pokedex'],
                nombre=f['nombre'],
                nombre_ingles=f['nombre_ingles'],
                gen=f['gen'],
                tipo1_id=f['tipo1'],
                tipo2_id=f.get('tipo2'),
                peso_kg=f.get('peso_kg'),
                altura_m=f.get('altura_m'),
                ratio_captura=f.get('ratio_captura'),
                experiencia_base=f.get('experiencia_base'),
                curva_crecimiento=f.get('curva_crecimiento'),
                categoria_rareza=f.get('categoria_rareza', 'estandar'),
                movimientos_predeterminados=f.get('movimientos_predeterminados', []),
                campeon=f.get('campeon', False),
                fase=f.get('fase', 1),
                preevolucion_id=None,
                evolucion_id=None
            ))
            if f.get('preevolucion') or f.get('evolucion'):
                evol_map[pk] = (f.get('preevolucion'), f.get('evolucion'))

            for hab_id in f.get('habilidades', []):
                pokemon_habilidades_rels.append(ThroughModel(
                    pokemon_id=pk,
                    habilidad_id=hab_id
                ))

        Pokemon.objects.bulk_create(pokemons, batch_size=1000, ignore_conflicts=True)

        update_pokemons = [
            Pokemon(id=pk, preevolucion_id=pre_id, evolucion_id=evo_id)
            for pk, (pre_id, evo_id) in evol_map.items()
        ]
        if update_pokemons:
            Pokemon.objects.bulk_update(update_pokemons, ['preevolucion', 'evolucion'], batch_size=500)

        ThroughModel.objects.bulk_create(pokemon_habilidades_rels, batch_size=2000, ignore_conflicts=True)

        # 7. BaseStat
        self.stdout.write("7. Insertando BaseStats...")
        stats = [
            BaseStat(
                pokemon_id=item['pk'],
                hp=item['fields']['hp'],
                ataque=item['fields']['ataque'],
                defensa=item['fields']['defensa'],
                ataque_especial=item['fields']['ataque_especial'],
                defensa_especial=item['fields']['defensa_especial'],
                velocidad=item['fields']['velocidad'],
                total=item['fields']['total']
            )
            for item in by_model.get('pokedex.estadisticasbase', [])
        ]
        BaseStat.objects.bulk_create(stats, batch_size=1000, ignore_conflicts=True)

        # 8. PokemonMove
        self.stdout.write("8. Insertando PokemonMoves...")
        pm_list = []
        for item in by_model.get('pokedex.pokemonmovimiento', []):
            f = item['fields']
            pm_list.append(PokemonMove(
                id=item['pk'],
                pokemon_id=f['pokemon'],
                movimiento_id=f['movimiento'],
                metodo_aprendizaje=f['metodo_aprendizaje'],
                nivel_aprendizaje=f['nivel_aprendizaje']
            ))
            if len(pm_list) >= 2000:
                PokemonMove.objects.bulk_create(pm_list, batch_size=2000, ignore_conflicts=True)
                pm_list = []

        if pm_list:
            PokemonMove.objects.bulk_create(pm_list, batch_size=2000, ignore_conflicts=True)

        # 9. BattleRoom
        self.stdout.write("9. Insertando Salas de Batalla...")
        rooms = [
            BattleRoom(
                id=item['pk'],
                room_code=item['fields']['room_code'],
                password=item['fields'].get('password'),
                player1_name=item['fields']['player1_name'],
                player2_name=item['fields'].get('player2_name'),
                is_ai_match=item['fields'].get('is_ai_match', False),
                status=item['fields'].get('status', 'ACTIVE'),
                pokemon_per_player=item['fields'].get('pokemon_per_player', 6),
                max_players=item['fields'].get('max_players', 2),
                format_settings=item['fields'].get('format_settings', {}),
                winner=item['fields'].get('winner'),
                state_data=item['fields'].get('state_data', {})
            )
            for item in by_model.get('battle.battleroom', [])
        ]
        BattleRoom.objects.bulk_create(rooms, ignore_conflicts=True)

        # 10. PostgreSQL Sequences
        self.stdout.write("10. Sincronizando secuencias ID en PostgreSQL...")
        with connection.cursor() as cursor:
            tables = [
                'types', 'move_categories', 'type_effectiveness', 'abilities',
                'moves', 'pokemon', 'pokemon_abilities', 'pokemon_moves',
                'battle_rooms', 'room_players', 'room_messages', 'battle_statistics',
                'accounts_trainerteam', 'auth_user'
            ]
            for tbl in tables:
                try:
                    cursor.execute(f"""
                        SELECT setval(
                            pg_get_serial_sequence('{tbl}', 'id'),
                            COALESCE((SELECT MAX(id) FROM {tbl}), 1),
                            true
                        );
                    """)
                except Exception as e:
                    self.stdout.write(f"   Aviso sobre secuencia {tbl}: {e}")

        self.stdout.write(self.style.SUCCESS(f"¡Carga completada en {time.time() - t0:.2f}s!"))
