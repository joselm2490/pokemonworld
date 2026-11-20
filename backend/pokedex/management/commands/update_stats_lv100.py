import math
import json
import shutil
from pathlib import Path
from django.core.management.base import BaseCommand
from django.db import transaction
from pokedex.models import Pokemon, BaseStat


def calc_lv100_favorable(base_hp, base_atk, base_def, base_spa, base_spd, base_spe, is_shedinja=False):
    """
    Calculates Pokemon Lv 100 Favorable stats (31 IVs, 252 EVs, +10% Nature).
    Matches PokemonDB official formula exactly:
      HP = 2 * Base + 204 (except Shedinja which is always 1)
      Other = floor((2 * Base + 99) * 1.1)
    """
    if is_shedinja or base_hp == 1:
        hp = 1
    else:
        hp = 2 * base_hp + 204

    atk = math.floor((2 * base_atk + 99) * 1.1)
    defense = math.floor((2 * base_def + 99) * 1.1)
    spa = math.floor((2 * base_spa + 99) * 1.1)
    spd = math.floor((2 * base_spd + 99) * 1.1)
    spe = math.floor((2 * base_spe + 99) * 1.1)
    total = hp + atk + defense + spa + spd + spe

    return hp, atk, defense, spa, spd, spe, total


class Command(BaseCommand):
    help = "Actualiza las estadísticas de todos los Pokémon en Supabase a Nivel 100 Favorable (PokemonDB)"

    def handle(self, *args, **options):
        seed_path = Path(__file__).resolve().parents[3] / "supabase_seed.json"
        backup_path = Path(__file__).resolve().parents[3] / "supabase_seed_original_bases.json"

        if not backup_path.exists() and seed_path.exists():
            shutil.copyfile(seed_path, backup_path)
            self.stdout.write(self.style.SUCCESS(f"Backup creado en: {backup_path}"))

        base_source = backup_path if backup_path.exists() else seed_path

        with open(base_source, "r", encoding="utf-8") as f:
            seed_data = json.load(f)

        seed_stats = {
            item["pk"]: item["fields"]
            for item in seed_data
            if item.get("model") == "pokedex.estadisticasbase"
        }

        self.stdout.write(f"Cargadas {len(seed_stats)} estadísticas base desde el seed.")

        # Obtener todos los registros BaseStat
        stats_qs = BaseStat.objects.select_related("pokemon").all()
        to_update = []
        updated_count = 0

        for stat in stats_qs:
            pk = stat.pokemon_id
            base = seed_stats.get(pk)
            if not base:
                # Si no está en seed, usar valores actuales del modelo
                base = {
                    "hp": stat.hp,
                    "ataque": stat.ataque,
                    "defensa": stat.defensa,
                    "ataque_especial": stat.ataque_especial,
                    "defensa_especial": stat.defensa_especial,
                    "velocidad": stat.velocidad,
                }

            is_shedinja = (
                stat.pokemon.numero_pokedex == 292
                or "SHEDINJA" in (stat.pokemon.nombre_ingles or "").upper()
            )

            hp, atk, df, spa, spd, spe, tot = calc_lv100_favorable(
                base["hp"],
                base["ataque"],
                base["defensa"],
                base["ataque_especial"],
                base["defensa_especial"],
                base["velocidad"],
                is_shedinja=is_shedinja,
            )

            stat.hp = hp
            stat.ataque = atk
            stat.defensa = df
            stat.ataque_especial = spa
            stat.defensa_especial = spd
            stat.velocidad = spe
            stat.total = tot
            to_update.append(stat)
            updated_count += 1

        with transaction.atomic():
            BaseStat.objects.bulk_update(
                to_update,
                ["hp", "ataque", "defensa", "ataque_especial", "defensa_especial", "velocidad", "total"],
                batch_size=500,
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"¡Éxito! Se actualizaron {updated_count} registros en la tabla base_stats de Supabase a Nivel 100 Favorable."
            )
        )

        # Actualizar también supabase_seed.json con los valores Lv 100 favorables
        for item in seed_data:
            if item.get("model") == "pokedex.estadisticasbase":
                pk = item["pk"]
                base = seed_stats.get(pk)
                if base:
                    # Encontrar si es Shedinja
                    is_shed = False
                    for p_item in seed_data:
                        if p_item.get("model") == "pokedex.pokemon" and p_item["pk"] == pk:
                            if p_item["fields"].get("numero_pokedex") == 292 or "shedinja" in p_item["fields"].get("nombre_ingles", "").lower():
                                is_shed = True
                            break

                    hp, atk, df, spa, spd, spe, tot = calc_lv100_favorable(
                        base["hp"],
                        base["ataque"],
                        base["defensa"],
                        base["ataque_especial"],
                        base["defensa_especial"],
                        base["velocidad"],
                        is_shedinja=is_shed,
                    )
                    item["fields"]["hp"] = hp
                    item["fields"]["ataque"] = atk
                    item["fields"]["defensa"] = df
                    item["fields"]["ataque_especial"] = spa
                    item["fields"]["defensa_especial"] = spd
                    item["fields"]["velocidad"] = spe
                    item["fields"]["total"] = tot

        with open(seed_path, "w", encoding="utf-8") as f:
            json.dump(seed_data, f, ensure_ascii=False)

        self.stdout.write(self.style.SUCCESS("supabase_seed.json actualizado con valores Nivel 100 Favorable."))

        # Verificación directa de Growlithe y otros
        growlithes = Pokemon.objects.filter(numero_pokedex=58)
        for g in growlithes:
            st = BaseStat.objects.get(pokemon=g)
            self.stdout.write(
                f"Verificación Growlithe #{g.numero_pokedex} ({g.nombre_ingles}): HP={st.hp}, ATK={st.ataque}, DEF={st.defensa}, SPA={st.ataque_especial}, SPD={st.defensa_especial}, SPE={st.velocidad}, Total={st.total}"
            )
