from django.db import models


class Type(models.Model):
    nombre = models.CharField(max_length=50, unique=True)
    nombre_ingles = models.CharField(max_length=50)
    color_hex = models.CharField(max_length=10)

    class Meta:
        db_table = 'types'
        ordering = ['id']

    def __str__(self):
        return f"{self.nombre_ingles} ({self.nombre})"


class MoveCategory(models.Model):
    nombre = models.CharField(max_length=50, unique=True)
    nombre_ingles = models.CharField(max_length=50)
    color_hex = models.CharField(max_length=10)

    class Meta:
        db_table = 'move_categories'
        ordering = ['id']

    def __str__(self):
        return f"{self.nombre_ingles} ({self.nombre})"


class TypeEffectiveness(models.Model):
    tipo_ataque = models.ForeignKey(
        Type, on_delete=models.CASCADE, related_name='efectividades_ataque'
    )
    tipo_defensa = models.ForeignKey(
        Type, on_delete=models.CASCADE, related_name='efectividades_defensa'
    )
    multiplicador = models.FloatField(default=1.0)

    class Meta:
        db_table = 'type_effectiveness'
        unique_together = ('tipo_ataque', 'tipo_defensa')

    def __str__(self):
        return f"{self.tipo_ataque} -> {self.tipo_defensa}: x{self.multiplicador}"


class Ability(models.Model):
    nombre = models.CharField(max_length=100, db_index=True)
    nombre_ingles = models.CharField(max_length=100, db_index=True)
    descripcion = models.TextField(blank=True, null=True)
    gen = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'abilities'
        ordering = ['id']

    def __str__(self):
        return f"{self.nombre_ingles} ({self.nombre})"


class Move(models.Model):
    codigo = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=100, db_index=True)
    nombre_alt = models.CharField(max_length=100, blank=True, null=True)
    nombre_ingles = models.CharField(max_length=100, db_index=True)
    gen = models.IntegerField(db_index=True, default=1)
    descripcion = models.TextField(blank=True, null=True)
    tipo = models.ForeignKey(
        Type, on_delete=models.SET_NULL, null=True, blank=True, related_name='movimientos'
    )
    tipo_nombre = models.CharField(max_length=50, db_index=True)
    clase = models.ForeignKey(
        MoveCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='movimientos'
    )
    clase_nombre = models.CharField(max_length=50, db_index=True)
    potencia = models.IntegerField(null=True, blank=True)
    potencia_texto = models.CharField(max_length=50, blank=True, null=True)
    precision = models.IntegerField(null=True, blank=True)
    precision_texto = models.CharField(max_length=50, blank=True, null=True)
    pp = models.IntegerField(null=True, blank=True)
    pp_texto = models.CharField(max_length=50, blank=True, null=True)
    prioridad = models.IntegerField(default=0)
    es_gigamax = models.BooleanField(default=False)
    es_movimiento_z = models.BooleanField(default=False)
    contacto = models.BooleanField(default=False)
    probabilidad_efecto = models.IntegerField(default=0)
    efecto_secundario = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'moves'
        ordering = ['id']

    def __str__(self):
        return f"{self.nombre_ingles} ({self.tipo_nombre})"


class Pokemon(models.Model):
    numero_pokedex = models.IntegerField(db_index=True)
    nombre = models.CharField(max_length=100, db_index=True)
    nombre_ingles = models.CharField(max_length=100, db_index=True)
    gen = models.IntegerField(db_index=True)
    tipo1 = models.ForeignKey(
        Type, on_delete=models.PROTECT, related_name='pokemon_tipo1'
    )
    tipo2 = models.ForeignKey(
        Type, on_delete=models.SET_NULL, null=True, blank=True, related_name='pokemon_tipo2'
    )
    peso_kg = models.FloatField(null=True, blank=True)
    altura_m = models.FloatField(null=True, blank=True)
    ratio_captura = models.IntegerField(null=True, blank=True)
    experiencia_base = models.IntegerField(null=True, blank=True)
    curva_crecimiento = models.CharField(max_length=100, blank=True, null=True)
    categoria_rareza = models.CharField(
        max_length=50, default='estandar', db_index=True
    )  # 'estandar', 'legendario', 'pseudolegendario'
    movimientos_predeterminados = models.JSONField(default=list, blank=True)
    abilities = models.ManyToManyField(
        Ability, related_name='associated_pokemon', blank=True, db_table='pokemon_abilities'
    )
    preevolucion = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True, related_name='evoluciones_siguientes'
    )
    evolucion = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True, related_name='preevoluciones_anteriores'
    )
    campeon = models.BooleanField(default=False, db_index=True)
    fase = models.IntegerField(default=1, db_index=True)  # 1: básica, 2: 1ra evolución, 3: 2da evolución

    class Meta:
        db_table = 'pokemon'
        ordering = ['numero_pokedex', 'id']

    @property
    def habilidades(self):
        return self.abilities

    @property
    def base_stats(self):
        return getattr(self, 'estadisticas', None)

    def __str__(self):
        return f"#{self.numero_pokedex:03d} {self.nombre_ingles} ({self.nombre})"


class BaseStat(models.Model):
    pokemon = models.OneToOneField(
        Pokemon, on_delete=models.CASCADE, related_name='estadisticas', primary_key=True
    )
    hp = models.IntegerField(default=50)
    ataque = models.IntegerField(default=50)
    defensa = models.IntegerField(default=50)
    ataque_especial = models.IntegerField(default=50)
    defensa_especial = models.IntegerField(default=50)
    velocidad = models.IntegerField(default=50)
    total = models.IntegerField(default=300)

    class Meta:
        db_table = 'base_stats'

    def save(self, *args, **kwargs):
        self.total = (
            self.hp + self.ataque + self.defensa +
            self.ataque_especial + self.defensa_especial + self.velocidad
        )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Stats of {self.pokemon.nombre_ingles} (Total: {self.total})"


class PokemonMove(models.Model):
    pokemon = models.ForeignKey(
        Pokemon, on_delete=models.CASCADE, related_name='movimientos_aprendibles'
    )
    movimiento = models.ForeignKey(
        Move, on_delete=models.CASCADE, related_name='pokemon_que_aprenden'
    )
    metodo_aprendizaje = models.CharField(
        max_length=50
    )  # 'nivel', 'mt', 'tutor', 'huevo', 'especial'
    nivel_aprendizaje = models.IntegerField(default=1)

    class Meta:
        db_table = 'pokemon_moves'
        unique_together = ('pokemon', 'movimiento', 'metodo_aprendizaje', 'nivel_aprendizaje')
        indexes = [
            models.Index(fields=['pokemon', 'metodo_aprendizaje']),
        ]

    @property
    def move(self):
        return self.movimiento

    def __str__(self):
        return f"{self.pokemon.nombre_ingles} - {self.movimiento.nombre_ingles} ({self.metodo_aprendizaje})"


# Backward-compatible model aliases
Tipo = Type
ClaseMovimiento = MoveCategory
EfectividadTipo = TypeEffectiveness
Habilidad = Ability
Movimiento = Move
EstadisticasBase = BaseStat
PokemonMovimiento = PokemonMove
