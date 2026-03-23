# Fuentes de Módulos Bíblicos

Esta carpeta contiene los archivos JSON fuente que se usan para generar módulos `.osb`.

Los archivos `.osb` generados **NO se commitean al repositorio** (ver `.gitignore`).
El usuario los instala manualmente en su directorio de usuario.

---

## Formato JSON fuente

```json
{
  "meta": {
    "id":           "rv1909",
    "name":         "Reina Valera 1909",
    "abbreviation": "RV1909",
    "language":     "es",
    "year":         "1909",
    "license":      "public-domain",
    "description":  "Traducción histórica basada en el trabajo de Casiodoro de Reina (1569)"
  },
  "books": [
    {
      "id":        1,
      "name":      "Génesis",
      "abbrev":    "Gén",
      "testament": "OT",
      "chapters": [
        {
          "chapter": 1,
          "verses": [
            { "verse": 1, "text": "En el principio creó Dios los cielos y la tierra." },
            { "verse": 2, "text": "Y la tierra estaba desordenada y vacía..." }
          ]
        }
      ]
    }
  ]
}
```

---

## Generar un módulo .osb

```bash
node scripts/create-osb-module.mjs \
  --source bibles-src/rv1909.json \
  --out bibles/rv1909.osb
```

El archivo `.osb` generado va en la carpeta `bibles/` local (para desarrollo).
En producción, el usuario lo copia a su directorio de usuario:

- **Windows**: `%APPDATA%\open-screen\bibles\`
- **macOS**:   `~/Library/Application Support/open-screen/bibles/`
- **Linux**:   `~/.config/open-screen/bibles/`

---

## Dónde conseguir textos bíblicos legalmente

### ✅ Dominio público (puedes incluirlas en el repo)

| Versión | Idioma | Fuente |
|---|---|---|
| Reina Valera 1909 (RV1909) | Español | [eBible.org](https://ebible.org/find/show.php?id=spa1909) |
| Reina Valera 1865 (RV1865) | Español | [eBible.org](https://ebible.org) |
| King James Version (KJV) | Inglés | [scrollmapper/bible_databases](https://github.com/scrollmapper/bible_databases) |
| American Standard Version (ASV) | Inglés | [scrollmapper/bible_databases](https://github.com/scrollmapper/bible_databases) |
| World English Bible (WEB) | Inglés | [ebible.org/web](https://ebible.org/web/) |

### ⚠️ Requieren licencia o permiso del usuario

| Versión | Situación |
|---|---|
| Reina Valera 1960 (RV1960) | Copyright © Sociedades Bíblicas Unidas |
| Reina Valera Contemporánea | Copyright © Sociedades Bíblicas Unidas |
| Nueva Versión Internacional (NVI) | Copyright © Bíblica |
| Nueva Biblia de las Américas (NBLA) | Copyright © The Lockman Foundation |

Para estas versiones, Open Screen permite al usuario instalar su propio módulo `.osb`
sin que la app distribuya el texto. Ver sección "Cómo crear tu propio módulo".

---

## Cómo crear tu propio módulo .osb

Si tienes el texto de una Biblia que te pertenece o tienes licencia para usar,
puedes convertirla al formato `.osb`:

1. Crea un archivo JSON siguiendo el formato descrito arriba
2. Corre el script: `node scripts/create-osb-module.mjs --source tu-biblia.json --out tu-biblia.osb`
3. Copia el `.osb` al directorio de bibles de tu usuario
4. La app lo detectará automáticamente al reiniciar

---

## IDs de libros estándar

Los IDs de libros siguen el orden canónico protestante:

| ID | Libro | Testament |
|---|---|---|
| 1 | Génesis | OT |
| 2 | Éxodo | OT |
| ... | ... | ... |
| 39 | Malaquías | OT |
| 40 | Mateo | NT |
| ... | ... | ... |
| 66 | Apocalipsis | NT |
