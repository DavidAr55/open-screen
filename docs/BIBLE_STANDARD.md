# OSBF — Open Screen Bible Format

**Versión del estándar:** 1.0.0  
**Estado:** Estable  
**Mantenido por:** Proyecto Open Screen

---

## ¿Qué es OSBF?

**OSBF (Open Screen Bible Format)** es el estándar abierto de datos bíblicos del proyecto Open Screen. Define cómo se estructuran, distribuyen e importan versiones de la Biblia dentro del ecosistema Open Screen.

Fue diseñado con tres principios:

1. **Simplicidad** — Cualquier contribuidor puede entender y generar archivos OSBF sin herramientas especiales.
2. **Portabilidad** — El formato base es JSON puro. Sin XML, sin binarios, sin dependencias.
3. **Extensibilidad** — El esquema tiene campos opcionales para Strong's, notas, variantes textuales, etc., sin romper compatibilidad hacia atrás.

---

## Formatos soportados

| Formato | Extensión | Descripción |
|---|---|---|
| **OSBF JSON** | `.osbf.json` | Formato nativo. Una versión completa en un solo archivo. |
| **OSBF Split** | `*.osbf/` | Carpeta con un `.json` por libro. Para versiones grandes. |
| **OSBF DB** | (interno) | Representación SQLite interna de Open Screen. No para distribución. |

---

## Especificación OSBF JSON

### Estructura raíz

```json
{
  "osbf": "1.0",
  "meta": { ... },
  "books": [ ... ]
}
```

| Campo | Tipo | Req. | Descripción |
|---|---|---|---|
| `osbf` | `string` | ✅ | Versión del estándar OSBF. Actualmente `"1.0"`. |
| `meta` | `object` | ✅ | Metadatos de la versión bíblica. |
| `books` | `array` | ✅ | Array de libros en orden canónico. |

---

### Objeto `meta`

```json
{
  "meta": {
    "id":           "rv1960",
    "name":         "Reina Valera 1960",
    "abbreviation": "RV60",
    "language":     "es",
    "direction":    "ltr",
    "license":      "public-domain",
    "copyright":    "Sociedades Bíblicas Unidas, 1960",
    "description":  "Revisión de 1960 de la traducción de Cipriano de Valera (1602).",
    "url":          "https://www.biblegateway.com/versions/Reina-Valera-1960-RVR1960-Bible/",
    "publisher":    "Sociedades Bíblicas Unidas",
    "year":         1960,
    "testament":    "both",
    "canonical":    true,
    "deuterocanon": false,
    "updated_at":   "2024-01-01"
  }
}
```

| Campo | Tipo | Req. | Descripción |
|---|---|---|---|
| `id` | `string` | ✅ | Identificador único. Minúsculas, sin espacios. Ej: `"rv1960"`, `"kjv"`, `"nvi"`. |
| `name` | `string` | ✅ | Nombre completo de la versión. |
| `abbreviation` | `string` | ✅ | Abreviatura oficial. Ej: `"RV60"`, `"KJV"`. |
| `language` | `string` | ✅ | Código ISO 639-1. Ej: `"es"`, `"en"`, `"pt"`. |
| `direction` | `string` | ✅ | `"ltr"` o `"rtl"` (para hebreo, árabe, etc.). |
| `license` | `string` | ✅ | `"public-domain"`, `"cc-by"`, `"cc-by-sa"`, `"proprietary"`, etc. |
| `copyright` | `string` | — | Nota de copyright si aplica. |
| `description` | `string` | — | Descripción corta de la traducción. |
| `url` | `string` | — | URL de referencia oficial. |
| `publisher` | `string` | — | Entidad publicadora. |
| `year` | `integer` | — | Año de la traducción o revisión. |
| `testament` | `string` | ✅ | `"both"`, `"ot"`, o `"nt"`. |
| `canonical` | `boolean` | ✅ | `true` si incluye los 66 libros protestantes canónicos. |
| `deuterocanon` | `boolean` | ✅ | `true` si incluye deuterocanónicos/apócrifos. |
| `updated_at` | `string` | — | Fecha ISO de última actualización del archivo. |

---

### Objeto `book`

```json
{
  "id":         1,
  "usfm":       "GEN",
  "name":       "Génesis",
  "short":      "Gén",
  "alt_names":  ["Genesis"],
  "testament":  "OT",
  "chapters":   [ ... ]
}
```

| Campo | Tipo | Req. | Descripción |
|---|---|---|---|
| `id` | `integer` | ✅ | Número canónico del libro (1–66). OT: 1–39, NT: 40–66. |
| `usfm` | `string` | ✅ | Código USFM estándar. Ej: `"GEN"`, `"MAT"`, `"REV"`. Ver tabla abajo. |
| `name` | `string` | ✅ | Nombre del libro en el idioma de la versión. |
| `short` | `string` | ✅ | Abreviatura del nombre. Ej: `"Gén"`, `"Sal"`. |
| `alt_names` | `array` | — | Nombres alternativos para búsqueda. |
| `testament` | `string` | ✅ | `"OT"` (Antiguo Testamento) o `"NT"` (Nuevo Testamento). |
| `chapters` | `array` | ✅ | Array de capítulos. |

---

### Objeto `chapter`

```json
{
  "number": 1,
  "verses": [
    { "number": 1, "text": "En el principio creó Dios los cielos y la tierra." },
    { "number": 2, "text": "Y la tierra estaba desordenada y vacía..." }
  ]
}
```

| Campo | Tipo | Req. | Descripción |
|---|---|---|---|
| `number` | `integer` | ✅ | Número del capítulo. |
| `verses` | `array` | ✅ | Array de versículos. |

---

### Objeto `verse`

```json
{
  "number":   1,
  "text":     "En el principio creó Dios los cielos y la tierra.",
  "heading":  "La creación",
  "note":     null,
  "strongs":  null
}
```

| Campo | Tipo | Req. | Descripción |
|---|---|---|---|
| `number` | `integer` | ✅ | Número del versículo. |
| `text` | `string` | ✅ | Texto del versículo. Sin marcadores de formato. |
| `heading` | `string` | — | Encabezado de sección (aparece antes de este verso). |
| `note` | `string` | — | Nota al pie o referencia cruzada. |
| `strongs` | `array` | — | Array de Strong's numbers. Extensión futura. |

---

## Tabla de códigos USFM (libros canónicos)

| ID | USFM | Libro | Testament |
|---|---|---|---|
| 1 | GEN | Génesis | OT |
| 2 | EXO | Éxodo | OT |
| 3 | LEV | Levítico | OT |
| 4 | NUM | Números | OT |
| 5 | DEU | Deuteronomio | OT |
| 6 | JOS | Josué | OT |
| 7 | JDG | Jueces | OT |
| 8 | RUT | Rut | OT |
| 9 | 1SA | 1 Samuel | OT |
| 10 | 2SA | 2 Samuel | OT |
| 11 | 1KI | 1 Reyes | OT |
| 12 | 2KI | 2 Reyes | OT |
| 13 | 1CH | 1 Crónicas | OT |
| 14 | 2CH | 2 Crónicas | OT |
| 15 | EZR | Esdras | OT |
| 16 | NEH | Nehemías | OT |
| 17 | EST | Ester | OT |
| 18 | JOB | Job | OT |
| 19 | PSA | Salmos | OT |
| 20 | PRO | Proverbios | OT |
| 21 | ECC | Eclesiastés | OT |
| 22 | SNG | Cantares | OT |
| 23 | ISA | Isaías | OT |
| 24 | JER | Jeremías | OT |
| 25 | LAM | Lamentaciones | OT |
| 26 | EZK | Ezequiel | OT |
| 27 | DAN | Daniel | OT |
| 28 | HOS | Oseas | OT |
| 29 | JOL | Joel | OT |
| 30 | AMO | Amós | OT |
| 31 | OBA | Abdías | OT |
| 32 | JON | Jonás | OT |
| 33 | MIC | Miqueas | OT |
| 34 | NAM | Nahúm | OT |
| 35 | HAB | Habacuc | OT |
| 36 | ZEP | Sofonías | OT |
| 37 | HAG | Hageo | OT |
| 38 | ZEC | Zacarías | OT |
| 39 | MAL | Malaquías | OT |
| 40 | MAT | Mateo | NT |
| 41 | MRK | Marcos | NT |
| 42 | LUK | Lucas | NT |
| 43 | JHN | Juan | NT |
| 44 | ACT | Hechos | NT |
| 45 | ROM | Romanos | NT |
| 46 | 1CO | 1 Corintios | NT |
| 47 | 2CO | 2 Corintios | NT |
| 48 | GAL | Gálatas | NT |
| 49 | EPH | Efesios | NT |
| 50 | PHP | Filipenses | NT |
| 51 | COL | Colosenses | NT |
| 52 | 1TH | 1 Tesalonicenses | NT |
| 53 | 2TH | 2 Tesalonicenses | NT |
| 54 | 1TI | 1 Timoteo | NT |
| 55 | 2TI | 2 Timoteo | NT |
| 56 | TIT | Tito | NT |
| 57 | PHM | Filemón | NT |
| 58 | HEB | Hebreos | NT |
| 59 | JAS | Santiago | NT |
| 60 | 1PE | 1 Pedro | NT |
| 61 | 2PE | 2 Pedro | NT |
| 62 | 1JN | 1 Juan | NT |
| 63 | 2JN | 2 Juan | NT |
| 64 | 3JN | 3 Juan | NT |
| 65 | JUD | Judas | NT |
| 66 | REV | Apocalipsis | NT |

---

## Cómo contribuir una nueva versión

### Opción A — Archivo OSBF JSON (recomendada)

1. Crea un archivo `<id>.osbf.json` siguiendo la especificación.
2. Valídalo con: `npm run bible:validate <id>.osbf.json`
3. Impórtalo con: `npm run bible:import <id>.osbf.json`
4. Abre un Pull Request en el repositorio con el archivo en `bibles/`.

### Opción B — Conversión desde otro formato

Si tienes los datos en OSIS XML, Zefania XML, o texto plano con marcadores, puedes usar el conversor incluido:

```bash
# Desde Zefania XML
npm run bible:convert --from=zefania --input=rv1960.xml --output=rv1960.osbf.json

# Desde OSIS XML
npm run bible:convert --from=osis --input=rv1960.osis.xml --output=rv1960.osbf.json
```

---

## Licencias permitidas para contribuciones

Para ser incluida en la distribución oficial de Open Screen, una versión bíblica debe tener una de las siguientes licencias:

| Licencia | Permitida | Notas |
|---|---|---|
| `public-domain` | ✅ Sí | Sin restricciones |
| `cc0` | ✅ Sí | Creative Commons Zero |
| `cc-by` | ✅ Sí | Con atribución |
| `cc-by-sa` | ✅ Sí | Con atribución y compartir igual |
| `cc-by-nc` | ⚠️ Solo distribución no comercial | Requiere revisión |
| `proprietary` | ❌ No | No puede incluirse en la distribución |

> **Reina Valera 1960 (RV1960):** Es de dominio público en la mayoría de países. La traducción original fue publicada en 1960 por las Sociedades Bíblicas Unidas.

---

## Esquema SQLite interno (OSBF DB)

Open Screen almacena las versiones importadas en SQLite para consultas eficientes. Este esquema es interno — no es el formato de distribución.

```sql
bible_versions  (id, name, abbreviation, language, license, ...)
bible_books     (id, version_id, book_number, usfm, name, short, testament)
bible_verses    (version_id, book_number, chapter, verse, text, heading, note)
```

Las consultas soportadas internamente son:

- Versículo por referencia: `GEN 1:1`
- Rango: `JHN 3:16-17`
- Capítulo completo: `PSA 23`
- Búsqueda full-text en el texto del versículo

---

## Versiones incluidas por defecto

| ID | Nombre | Idioma | Licencia |
|---|---|---|---|
| `rv1960` | Reina Valera 1960 | Español | Public Domain |

---

## Historial de versiones del estándar

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0.0 | 2024 | Versión inicial |

---

*OSBF es un estándar abierto. Cualquier software puede implementarlo libremente.*
