import os
import re
import json
import urllib.request
from django.core.management.base import BaseCommand
from django.db import transaction
from pokedex.models import Pokemon, EstadisticasBase, Habilidad, Movimiento, Tipo, ClaseMovimiento


def fetch_url(url: str) -> str:
    req = urllib.request.Request(
        url,
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode('utf-8')


def strip_html(text: str) -> str:
    # First remove <sup>...</sup> footnotes
    clean = re.sub(r'<sup[^>]*>.*?</sup>', '', text, flags=re.DOTALL)
    clean = re.sub(r'<[^>]+>', ' ', clean)
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean


def parse_stat_int(val: str) -> int:
    # Remove any lingering spaces or footnotes like '90 1' -> '90'
    first_token = val.strip().split()[0] if val.strip() else '0'
    match = re.search(r'\d+', first_token)
    return int(match.group(0)) if match else 0


class Command(BaseCommand):
    help = "Sincroniza y actualiza Pokémon, Estadísticas Base, Habilidades y Movimientos desde WikiDex"

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("=== INICIANDO SINCRONIZACIÓN CON WIKIDEX ==="))

        # ============================================================
        # 1. HABILIDADES (https://www.wikidex.net/wiki/Lista_de_habilidades)
        # ============================================================
        self.stdout.write("1. Descargando lista oficial de habilidades desde WikiDex...")
        try:
            hab_html = fetch_url("https://www.wikidex.net/wiki/Lista_de_habilidades")
            rows = re.findall(r'<tr[^>]*>(.*?)</tr>', hab_html, re.DOTALL)
            hab_count = 0
            hab_map_by_en = {}

            with transaction.atomic():
                for r in rows:
                    tds = re.findall(r'<td[^>]*>(.*?)</td>', r, re.DOTALL)
                    if len(tds) >= 5:
                        nombre_es = strip_html(tds[1]).split('/')[0].strip()
                        nombre_en = strip_html(tds[3]).strip()
                        desc_es = strip_html(tds[5]) if len(tds) > 5 else ''

                        if nombre_es and nombre_en:
                            hab_obj, _ = Habilidad.objects.update_or_create(
                                nombre_ingles__iexact=nombre_en,
                                defaults={
                                    'nombre': nombre_es,
                                    'nombre_ingles': nombre_en,
                                    'descripcion': desc_es,
                                }
                            )
                            hab_map_by_en[nombre_en.upper()] = hab_obj
                            hab_count += 1

            self.stdout.write(self.style.SUCCESS(f"-> {hab_count} Habilidades sincronizadas con éxito."))
        except Exception as e:
            self.stderr.write(f"Error descargando habilidades: {e}")
            hab_map_by_en = {h.nombre_ingles.upper(): h for h in Habilidad.objects.all()}

        # Asociar habilidades a cada Pokémon usando pokemon.json
        self.stdout.write("1.2 Asignando habilidades correctas a cada Pokémon...")
        json_path = "/home/jose/Pokemon-Stadium-World (Copiar)/frontend/database/pokemon.json"
        if os.path.exists(json_path):
            with open(json_path, 'r', encoding='utf-8') as f:
                pokemon_catalog = json.load(f)

            with transaction.atomic():
                for entry in pokemon_catalog:
                    p_id = entry.get('db_id') or entry.get('id')
                    abilities_list = entry.get('abilities', [])
                    if not p_id or not abilities_list:
                        continue

                    pkmn = Pokemon.objects.filter(id=p_id).first()
                    if not pkmn:
                        pkmn = Pokemon.objects.filter(numero_pokedex=entry.get('num')).first()

                    if pkmn:
                        matched_habs = []
                        for ab_name in abilities_list:
                            clean_ab = ab_name.strip().upper()
                            if clean_ab in hab_map_by_en:
                                matched_habs.append(hab_map_by_en[clean_ab])
                            else:
                                hab_fallback = Habilidad.objects.filter(nombre_ingles__iexact=ab_name).first()
                                if hab_fallback:
                                    matched_habs.append(hab_fallback)
                        if matched_habs:
                            pkmn.habilidades.set(matched_habs)

            self.stdout.write(self.style.SUCCESS("-> Habilidades vinculadas a cada Pokémon."))

        # ============================================================
        # 2. CARACTERÍSTICAS BASE DE POKÉMON
        # https://www.wikidex.net/wiki/Lista_de_Pok%C3%A9mon_con_sus_caracter%C3%ADsticas_base
        # ============================================================
        self.stdout.write("2. Descargando características base oficiales desde WikiDex...")
        try:
            stats_html = fetch_url("https://www.wikidex.net/wiki/Lista_de_Pok%C3%A9mon_con_sus_caracter%C3%ADsticas_base")
            rows = re.findall(r'<tr[^>]*>(.*?)</tr>', stats_html, re.DOTALL)
            stats_updated = 0

            with transaction.atomic():
                for r in rows:
                    tds = re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', r, re.DOTALL)
                    texts = [strip_html(td) for td in tds]
                    # Format: ['0001', 'Bulbasaur', '', '45', '49', '49', '65', '65', '45', '53,00', '9,47', '318']
                    if len(texts) >= 12 and texts[0].isdigit():
                        num_dex = int(texts[0])
                        p_name = texts[1]
                        hp = parse_stat_int(texts[3])
                        atk = parse_stat_int(texts[4])
                        defe = parse_stat_int(texts[5])
                        spa = parse_stat_int(texts[6])
                        spd = parse_stat_int(texts[7])
                        spe = parse_stat_int(texts[8])
                        total = parse_stat_int(texts[11]) or (hp + atk + defe + spa + spd + spe)

                        # Find matching pokemon
                        pkmn = Pokemon.objects.filter(numero_pokedex=num_dex).first()
                        if pkmn:
                            EstadisticasBase.objects.update_or_create(
                                pokemon=pkmn,
                                defaults={
                                    'hp': hp,
                                    'ataque': atk,
                                    'defensa': defe,
                                    'ataque_especial': spa,
                                    'defensa_especial': spd,
                                    'velocidad': spe,
                                    'total': total,
                                }
                            )
                            stats_updated += 1

            self.stdout.write(self.style.SUCCESS(f"-> {stats_updated} Pokémon actualizados con características base de WikiDex."))
        except Exception as e:
            self.stderr.write(f"Error actualizando características base: {e}")

        # ============================================================
        # 3. LISTA DE MOVIMIENTOS
        # https://www.wikidex.net/wiki/Lista_de_movimientos
        # ============================================================
        self.stdout.write("3. Descargando catálogo de movimientos desde WikiDex...")
        try:
            moves_html = fetch_url("https://www.wikidex.net/wiki/Lista_de_movimientos")
            tables = re.findall(r'<table[^>]*>(.*?)</table>', moves_html, re.DOTALL)
            moves_updated = 0

            # Target the table that contains move data
            for t in tables:
                if 'Potencia' in t and 'Precisión' in t:
                    rows = re.findall(r'<tr[^>]*>(.*?)</tr>', t, re.DOTALL)
                    with transaction.atomic():
                        for r in rows:
                            tds = re.findall(r'<td[^>]*>(.*?)</td>', r, re.DOTALL)
                            if len(tds) >= 9:
                                codigo = strip_html(tds[0])
                                # td[1] contains: <a ...>Nombre_ES</a><br><i>Nombre_EN</i>
                                raw_name = tds[1]
                                name_parts = re.split(r'<br\s*/?>', raw_name, flags=re.IGNORECASE)
                                nombre_es = strip_html(name_parts[0]).split('/')[0].strip()
                                nombre_en = strip_html(name_parts[1]).strip() if len(name_parts) > 1 else nombre_es
                                descripcion = strip_html(tds[3])
                                tipo_texto = strip_html(tds[4])
                                clase_texto = strip_html(tds[5])
                                potencia_txt = strip_html(tds[6])
                                precision_txt = strip_html(tds[7])
                                pp_txt = strip_html(tds[8])

                                potencia_val = int(potencia_txt) if potencia_txt.isdigit() else None
                                precision_val = int(precision_txt) if precision_txt.isdigit() else None
                                pp_val = int(pp_txt) if pp_txt.isdigit() else None

                                # Look up or match existing move by code or English name
                                mv_qs = Movimiento.objects.filter(
                                    codigo=codigo
                                ) | Movimiento.objects.filter(
                                    nombre_ingles__iexact=nombre_en
                                )
                                mv_obj = mv_qs.first()

                                if mv_obj:
                                    mv_obj.nombre = nombre_es
                                    mv_obj.nombre_ingles = nombre_en
                                    if descripcion:
                                        mv_obj.descripcion = descripcion
                                    if potencia_val is not None:
                                        mv_obj.potencia = potencia_val
                                    if precision_val is not None:
                                        mv_obj.precision = precision_val
                                    if pp_val is not None:
                                        mv_obj.pp = pp_val
                                    mv_obj.save()
                                    moves_updated += 1
                                elif codigo:
                                    # Create if missing
                                    Movimiento.objects.create(
                                        codigo=codigo,
                                        nombre=nombre_es,
                                        nombre_ingles=nombre_en,
                                        descripcion=descripcion,
                                        tipo_nombre=tipo_texto or 'Normal',
                                        clase_nombre=clase_texto or 'Físico',
                                        potencia=potencia_val,
                                        potencia_texto=potencia_txt,
                                        precision=precision_val,
                                        precision_texto=precision_txt,
                                        pp=pp_val or 15,
                                        pp_texto=pp_txt,
                                        gen=1,
                                    )
                                    moves_updated += 1

            self.stdout.write(self.style.SUCCESS(f"-> {moves_updated} Movimientos sincronizados con WikiDex."))
        except Exception as e:
            self.stderr.write(f"Error sincronizando movimientos: {e}")

        self.stdout.write(self.style.SUCCESS("=== SINCRONIZACIÓN WIKIDEX FINALIZADA EXITOSAMENTE ==="))
