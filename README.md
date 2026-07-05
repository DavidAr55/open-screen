<div align="center">

<br/>

<img src="https://img.shields.io/badge/version-0.2.0-e51d1d?style=flat-square" />
<img src="https://img.shields.io/badge/electron-33+-47848F?style=flat-square&logo=electron&logoColor=white" />
<img src="https://img.shields.io/badge/tailwind-3.x-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
<img src="https://img.shields.io/badge/licencia-MIT-22c55e?style=flat-square" />
<img src="https://img.shields.io/badge/plataforma-Windows%20%7C%20macOS%20%7C%20Linux-0f172a?style=flat-square" />

<br/><br/>

<img src="resources/icon.svg" width="48" height="48" align="center" />

# Open Screen

**Software de proyección de presentaciones open source.**  
Diseñado para iglesias, eventos y cualquier espacio que necesite proyectar texto, versículos o presentaciones en una pantalla secundaria — sin depender de software privativo ni licencias costosas.

<br/>

</div>

---

## ¿Qué es Open Screen?

Open Screen es una aplicación de escritorio multiplataforma construida con **Electron** que permite a un operador controlar en tiempo real lo que se proyecta en una pantalla secundaria (proyector, TV, monitor externo).

Inspirado en herramientas como EasyWorship o ProPresenter, pero con un enfoque **libre, moderno y extensible**. El operador trabaja desde una interfaz de control limpia mientras la audiencia solo ve el contenido proyectado en pantalla completa.

---

## ✨ Características

- 🖥️ **Doble ventana automática** — ventana de control en el monitor principal y ventana de proyección en el monitor secundario
- 📝 **Editor de texto libre** — escribe cualquier contenido y proyéctalo con un clic
- 📚 **Biblioteca de contenido** — guarda y reutiliza textos, versículos y anuncios
- ⚡ **Acceso rápido** — grid de acceso directo a los ítems más usados
- 🎵 **Módulo de canciones** — gestión completa de canciones con secciones (verso, coro, puente…), editor drag-to-reorder y modo proyector paso a paso
- 📄 **Presentaciones PDF** — importa PDFs y proyecta cada página como diapositiva
- 🖼️ **Fondos de proyección** — colores sólidos, degradados, imágenes, GIFs y video en bucle
- 📖 **Módulo bíblico OSB** — búsqueda y proyección de versículos con soporte para múltiples traducciones
- 🌗 **Modo claro y oscuro** — claro por defecto, oscuro disponible con un toggle
- 🎬 **Vista de escenario y temporizador** — panel "Escenario" con reloj, texto en vivo y "lo próximo" para el presentador; cronómetro/cuenta regresiva solo para el operador
- 🎞️ **Multimedia directo** — importa imágenes, GIFs y video y proyéctalos con un clic, sin pasar por el editor de texto
- 🔍 **Buscador global** — una sola barra de búsqueda que combina referencias y texto bíblico, canciones, presentaciones, multimedia y biblioteca, con salto directo al resultado
- 🎙️ **Importar letras desde PowerPoint** — extrae el texto de un `.pptx` diapositiva por diapositiva para crear una canción
- 💧 **Marca de agua configurable** — logo propio en la proyección, con posición, opacidad y margen ajustables
- 🖥️ **Selección de monitor** — elige a qué pantalla se envía la proyección (y cámbiala en caliente sin reiniciar)
- 💾 **Respaldo de la base de datos** — exporta e importa toda tu información (biblioteca, canciones, presentaciones, fondos) con un respaldo de seguridad automático antes de restaurar
- 🔒 **Arquitectura segura** — comunicación entre ventanas vía IPC con `contextBridge`, sin acceso directo a Node desde el renderer

---

## 🖼️ Interfaz

| Ventana | Descripción |
|---|---|
| **Control** | Panel del operador: editor libre, canciones, biblia, presentaciones, fondos, biblioteca |
| **Proyección** | Pantalla de salida: texto centrado, fondo dinámico, diapositivas PDF, sin distracciones |

---

## 🚀 Instalación y uso

### Requisitos

- [Node.js](https://nodejs.org/) v18 o superior
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- Compilador nativo para `better-sqlite3`:
  - **Windows**: `npm install -g windows-build-tools`
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Linux**: `sudo apt install build-essential`

### Pasos

```bash
# 1. Clona el repositorio
git clone https://github.com/DavidAr55/open-screen.git
cd open-screen

# 2. Instala las dependencias
#    (postinstall recompila better-sqlite3 para Electron automáticamente)
pnpm install

# 3. Ejecuta en modo desarrollo (hot-reload activo)
pnpm dev

# 4. Construir para producción
pnpm build

# 5. Generar un instalador distribuible (.exe, .dmg o .AppImage)
pnpm dist        # detecta la plataforma actual
pnpm dist:win    # fuerza el instalador de Windows (NSIS)
pnpm dist:mac    # fuerza el .dmg de macOS
pnpm dist:linux  # fuerza el AppImage de Linux
```

El instalador queda en `dist/`. Al iniciar, la app detecta automáticamente los monitores conectados:
- **2+ monitores** → proyección en pantalla completa en el monitor secundario
- **1 monitor** → ambas ventanas en el mismo monitor (modo desarrollo)

---

## 📁 Estructura del proyecto

```
open-screen/
│
├── src/                          ← Todo el código fuente
│   │
│   ├── main/                     ← Proceso principal (Node.js / Electron)
│   │   ├── index.js              ← Punto de entrada: inicia ventanas, DB y servidor HTTP local
│   │   ├── windows/
│   │   │   └── WindowManager.js  ← Crea y gestiona las dos BrowserWindows
│   │   ├── db/                   ← Base de datos SQLite
│   │   │   ├── database.js       ← Conexión y migraciones
│   │   │   ├── schema.js         ← Definición de tablas y versiones de migración
│   │   │   └── repositories/     ← Un archivo por dominio de datos
│   │   │       ├── SettingsRepository.js
│   │   │       ├── LibraryRepository.js
│   │   │       ├── MediaRepository.js
│   │   │       ├── BibleRepository.js         ← Abre archivos .osb independientes
│   │   │       ├── SongRepository.js
│   │   │       ├── SlidePresentationRepository.js
│   │   │       ├── BackgroundRepository.js
│   │   │       └── index.js
│   │   ├── utils/
│   │   │   ├── bibleReference.js ← Parser de referencias bíblicas ("Juan 3:16") para el buscador global
│   │   │   ├── pptxParser.js     ← Extrae texto de .pptx (JSZip + fast-xml-parser)
│   │   │   └── sqlHelpers.js     ← Helpers para LIKE/FTS5 seguros con input de usuario
│   │   └── ipc/                  ← Manejadores de mensajes entre ventanas
│   │       ├── index.js          ← Registra todos los handlers
│   │       ├── app.ipc.js        ← Versión de la app
│   │       ├── library.ipc.js
│   │       ├── settings.ipc.js
│   │       ├── projection.ipc.js
│   │       ├── displays.ipc.js
│   │       ├── bible.ipc.js
│   │       ├── songs.ipc.js      ← CRUD + importar letras desde PowerPoint (.pptx)
│   │       ├── presentations.ipc.js
│   │       ├── backgrounds.ipc.js
│   │       ├── multimedia.ipc.js ← Importar y proyectar imágenes/GIFs/video directo
│   │       ├── search.ipc.js     ← Buscador global (agrega Biblia, canciones, PDFs, multimedia, biblioteca)
│   │       ├── fonts.ipc.js      ← Lista las fuentes instaladas en el sistema
│   │       ├── watermark.ipc.js  ← Elegir imagen de marca de agua
│   │       └── backup.ipc.js     ← Exportar/importar la base de datos completa
│   │
│   ├── preload/                  ← Puente seguro entre Node.js y el navegador
│   │   ├── control.js            ← Expone window.api con todos los namespaces
│   │   └── projection.js         ← Solo recibe eventos (sin enviar)
│   │
│   └── renderer/                 ← Interfaces de usuario (React)
│       ├── control/              ← Ventana del operador
│       │   └── src/
│       │       ├── App.jsx
│       │       ├── context/
│       │       │   └── AppContext.jsx       ← Estado global de la app
│       │       ├── pages/
│       │       │   ├── ControlPage.jsx      ← Editor libre + acceso rápido
│       │       │   ├── SongsPage.jsx        ← Gestión y proyección de canciones
│       │       │   ├── ScripturePage.jsx    ← Búsqueda y proyección de versículos
│       │       │   ├── PresentationsPage.jsx ← Importar y proyectar PDFs
│       │       │   ├── MultimediaPage.jsx   ← Importar y proyectar imágenes/GIFs/video directo
│       │       │   ├── StagePage.jsx        ← Vista de escenario para el presentador
│       │       │   └── SettingsPage.jsx     ← Configuración general
│       │       ├── components/
│       │       │   ├── editor/SlideEditor.jsx
│       │       │   ├── quick/QuickGrid.jsx
│       │       │   ├── live/LivePanel.jsx
│       │       │   ├── songs/PptxImportView.jsx ← Importar letras desde PowerPoint
│       │       │   ├── layout/Sidebar.jsx
│       │       │   ├── layout/Topbar.jsx
│       │       │   ├── layout/Timer.jsx     ← Cronómetro/cuenta regresiva del operador
│       │       │   ├── layout/GlobalSearch.jsx ← Buscador global con salto directo al resultado
│       │       │   └── backgound/BackgroundsPanel.jsx
│       │       └── hooks/
│       │           └── useLibrary.js
│       ├── projection/           ← Ventana de proyección (solo recibe datos)
│       │   └── src/
│       │       └── App.jsx       ← Capas: fondo / multimedia / texto / slide / marca de agua
│       └── shared/               ← Componentes reutilizables entre renderers
│           ├── components/
│           │   ├── ui/index.jsx  ← Sistema de diseño: Button, Card, Input, Badge…
│           │   └── ConfirmModal.jsx
│           ├── constants/
│           │   ├── defaultBackground.js ← Fondo de respaldo hasta resolver el predeterminado
│           │   ├── watermark.js         ← Defaults y helpers de posición/opacidad de la marca de agua
│           │   └── searchTypes.js       ← Colores/destino de navegación por tipo de resultado del buscador
│           └── utils/
│               ├── cn.js         ← Utilidad para combinar clases de Tailwind
│               └── font.js       ← Tamaño y familia de fuente de proyección (compartido control/proyección)
│
├── scripts/                      ← Herramientas de línea de comandos
│   ├── create-osb-module.mjs     ← Genera un .osb desde un JSON fuente
│   ├── import-ebible-vpl.mjs     ← Importa formato eBible VPL
│   └── generate-icons.mjs        ← Genera íconos de la app desde SVG
│
├── bibles-src/
│   └── README.md                 ← Documenta el formato JSON fuente para crear módulos
│
├── docs/
│   └── BIBLE_STANDARD.md         ← Especificación técnica del formato .osb
│
├── electron.vite.config.mjs      ← Configuración de build (Vite para Electron)
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── CLAUDE.md                     ← Guía para Claude Code (AI assistant)
```

---

## 🔌 Cómo funciona la arquitectura

> Si no eres programador, esta sección te explica la lógica interna sin entrar en detalles técnicos profundos.

Open Screen tiene **tres piezas que se comunican entre sí**:

```
┌─────────────────────────────────────────────────────────────────────┐
│  PROCESO PRINCIPAL — src/main/  (Node.js)                           │
│                                                                     │
│  • Crea las dos ventanas (control y proyección)                     │
│  • Gestiona la base de datos SQLite                                 │
│  • Levanta un servidor HTTP local para servir videos/imágenes       │
│  • Recibe mensajes del renderer de control y los reenvía al de      │
│    proyección (nunca se comunican directamente entre sí)            │
│                                                                     │
│  ┌────────────────┐    ┌──────────────────────────────────────────┐ │
│  │ WindowManager  │    │ Repositorios SQLite                      │ │
│  │                │    │  settings · library · songs · media      │ │
│  │ controlWindow  │    │  presentations · backgrounds · bible     │ │
│  │ projWindow     │    └──────────────────────────────────────────┘ │
│  └────────────────┘                                                 │
└──────────────┬───────────────────────────────┬──────────────────────┘
               │  preload/control.js           │  preload/projection.js
               │  (window.api — bidireccional) │  (solo recibe eventos)
               ▼                               ▼
┌───────────────────────────┐    ┌──────────────────────────────────┐
│  RENDERER DE CONTROL      │    │  RENDERER DE PROYECCIÓN          │
│  src/renderer/control/    │    │  src/renderer/projection/        │
│                           │    │                                  │
│  React 19 + Tailwind      │    │  React 19                        │
│  AppContext (estado)      │───►│  Capas: fondo / multimedia /     │
│  Páginas navegables       │    │  texto / slide / marca de agua   │
│  (Control, Songs,         │    │  Transición CSS 220ms            │
│   Scripture, PDF,         │    │  Tamaño y familia de fuente      │
│   Multimedia, Escenario,  │    │  dinámicos                       │
│   Config)                 │    │                                  │
└───────────────────────────┘    └──────────────────────────────────┘
```

### ¿Qué es el preload y por qué existe?

Electron separa el código del servidor (Node.js) del código del navegador (React) por seguridad. El archivo **preload** actúa como intermediario: expone solo las funciones necesarias al navegador a través de `window.api`, sin dar acceso completo a Node.js.

- `control.js` expone **toda la API** (leer DB, proyectar, configurar, etc.)
- `projection.js` solo expone **receptores de eventos** — la pantalla de proyección nunca inicia comunicación

### ¿Cómo llega el texto a la pantalla de proyección?

```
Operador escribe texto
        ↓
window.api.projection.send({ text, bg })    ← renderer de control
        ↓
ipcMain.on('projection:send', ...)          ← proceso principal
        ↓
windowManager.sendToProjection(...)         ← reenvío interno
        ↓
Projection renderer recibe el evento        ← renderer de proyección
        ↓
React actualiza estado → CSS fade-in 220ms  ← pantalla actualizada
```

---

## 🗂️ Páginas del panel de control

| Página | Archivo | Descripción |
|---|---|---|
| **Control** | `ControlPage.jsx` | Editor de texto libre (`SlideEditor`) + grid de acceso rápido (`QuickGrid`) |
| **Canciones** | `SongsPage.jsx` | CRUD de canciones con secciones arrastrables, vista detalle y modo proyector paso a paso |
| **Escrituras** | `ScripturePage.jsx` | Navegador bíblico (libro/capítulo/versículo) + búsqueda FTS5 con debounce |
| **Presentaciones** | `PresentationsPage.jsx` | Importa PDFs, renderiza páginas con pdfjs-dist y las proyecta como imágenes |
| **Multimedia** | `MultimediaPage.jsx` | Importa imágenes/GIFs/video y los proyecta directo, sin pasar por el editor de texto |
| **Escenario** | `StagePage.jsx` | Vista de solo lectura para el presentador: reloj, texto en vivo y "lo próximo" |
| **Ajustes** | `SettingsPage.jsx` | Tema, monitor, fondo, fuente, marca de agua, atajos de teclado, versión bíblica predeterminada, exportar/importar DB |

---

## 🌐 API disponible en el renderer (`window.api`)

Estas son todas las funciones que los componentes React pueden llamar:

| Namespace | Método | Tipo | Descripción |
|---|---|---|---|
| `app` | `getVersion()` | invoke | Versión real de la app (`package.json`) |
| `projection` | `send(payload)` | send | Envía `{ text, bg, fontSize, fontFamily, watermark }` a la pantalla |
| `projection` | `clear()` | send | Limpia la pantalla |
| `projection` | `freeze(bool)` | send | Congela/descongela la imagen |
| `projection` | `setFont/setFontSize/setWatermark` | send | Actualiza fuente, tamaño o marca de agua en caliente |
| `library` | `findAll/create/update/delete` | invoke | CRUD de ítems de biblioteca |
| `settings` | `get/set/getAll/setMany` | invoke | Configuraciones clave-valor |
| `displays` | `getAll/setActiveMonitor` | invoke | Lista monitores y mueve la proyección al elegido |
| `backup` | `export/import` | invoke | Exporta/restaura la base de datos completa (con respaldo de seguridad automático) |
| `bible` | `listModules/getBooks/getChapter/search...` | invoke | Lectura de módulos .osb |
| `songs` | `findAll/create/update/delete/toggleFavorite/pickPptx/parsePptx` | invoke | CRUD de canciones + importar letras desde PowerPoint |
| `presentations` | `import/findAll/readFile/projectSlide...` | mixed | Gestión y proyección de PDFs |
| `backgrounds` | `findAll/create/update/delete/setActive...` | mixed | Gestión de fondos de proyección |
| `multimedia` | `findAll/import/update/delete/toggleFavorite/project/clear/mediaControl` | mixed | Gestión y proyección directa de imágenes/GIFs/video |
| `search` | `global(query, opts)` | invoke | Buscador global: Biblia, canciones, presentaciones, multimedia y biblioteca en una sola llamada |
| `fonts` | `getAll()` | invoke | Lista las fuentes instaladas en el sistema |
| `watermark` | `pickImage()` | invoke | Elige la imagen de marca de agua como data URL |

> **invoke** = espera respuesta (async). **send** = dispara y olvida (no espera respuesta).

---

## 🗃️ Base de datos SQLite

La DB principal se almacena en el `userData` de Electron:
- **Windows**: `%APPDATA%\open-screen\open-screen.db`
- **macOS**: `~/Library/Application Support/open-screen/open-screen.db`
- **Linux**: `~/.config/open-screen/open-screen.db`

El esquema usa **migraciones versionadas** (`user_version` pragma). Para agregar una nueva migración, se añade una entrada en `schema.js` con la siguiente versión:

| Versión | Tablas añadidas |
|---|---|
| v1 | `settings`, `library_items`, `slides`, `media`, `presentations` |
| v2 | `bible_versions`, `bible_books`, `bible_verses` + búsqueda FTS5 |
| v3 | `songs`, `song_sections` |
| v4 | `slide_presentations` (presentaciones PDF) |
| v5 | columna `is_favorite` en `slide_presentations` |
| v6 | `backgrounds` (con 5 fondos preset sembrados al crear) |
| v7 | `media` extendida con `thumbnail`, `is_favorite`, `updated_at` (multimedia directo) |
| v8 | `songs_fts` (búsqueda FTS5 de título/artista/letra) para el buscador global |

---

## 📖 Módulos Bíblicos — Formato OSB

Open Screen usa su propio formato de módulo bíblico: **Open Screen Bible (`.osb`)**.

Cada `.osb` es un archivo SQLite independiente que el usuario instala en su directorio de datos. Esto permite:
- Respetar el copyright de traducciones como la **RV1960** (que no puede distribuirse sin licencia)
- Que la comunidad cree y comparta módulos libremente
- Soporte de cualquier idioma o traducción

### Directorio de instalación

```
%APPDATA%\open-screen\bibles\     ← Windows
~/Library/.../open-screen/bibles/ ← macOS
~/.config/open-screen/bibles/     ← Linux
```

### Schema de un módulo `.osb`

```sql
-- Metadatos de la traducción (nombre, idioma, versión...)
CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);

-- Libros (1 = Génesis … 66 = Apocalipsis)
CREATE TABLE books (
  id INTEGER PRIMARY KEY, name TEXT, abbrev TEXT, testament TEXT
);

-- Versículos con ID BBCCCVVV (ej: Juan 3:16 = 43003016)
CREATE TABLE verses (
  id INTEGER PRIMARY KEY, book INTEGER, chapter INTEGER, verse INTEGER, text TEXT
);
```

### Traducciones de dominio público disponibles

| Versión | Idioma | Licencia |
|---|---|---|
| Reina Valera 1909 (RV1909) | Español | ✅ Dominio público |
| King James Version (KJV) | Inglés | ✅ Dominio público |
| World English Bible (WEB) | Inglés | ✅ Dominio público |
| Reina Valera 1960 (RV1960) | Español | ⚠️ Copyright — instalar manualmente |

### Crear un módulo `.osb`

```bash
# 1. Prepara tu JSON fuente (ver bibles-src/README.md para el formato)
# 2. Ejecuta el script generador
node scripts/create-osb-module.mjs \
  --source bibles-src/rv1909.json \
  --out bibles/rv1909.osb

# 3. Copia el .osb al directorio de usuario
#    O usa el botón "Abrir directorio de Biblias" desde la app
```

---

## 🛠️ Stack tecnológico

| Tecnología | Uso |
|---|---|
| [Electron 33](https://www.electronjs.org/) | Framework de escritorio multiplataforma |
| [React 19](https://react.dev/) | UI del renderer (control + proyección) |
| [electron-vite 2](https://electron-vite.org/) | Build tool con dos entradas de renderer independientes |
| [electron-builder](https://www.electron.build/) | Empaquetado e instaladores (`.exe`/NSIS, `.dmg`, `.AppImage`) |
| [Tailwind CSS 3](https://tailwindcss.com/) | Sistema de estilos utilitario |
| [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | SQLite embebido y sincrónico (requiere compilación nativa) |
| [pdfjs-dist](https://github.com/mozilla/pdf.js) | Renderizado de PDFs en el renderer de control |
| [JSZip](https://stuk.github.io/jszip/) + [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) | Extracción de texto de archivos `.pptx` |
| [font-list](https://github.com/oldj/node-font-list) | Listado de fuentes instaladas en el sistema |
| [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) | Tipografía principal |
| [JetBrains Mono](https://www.jetbrains.com/legalforms/fonts/) | Tipografía monoespaciada para referencias |

---

## 🗺️ Roadmap

### ✅ v0.2 — Gestión de contenido
- [x] SQLite embebido con sistema de migraciones versionadas
- [x] Módulo bíblico OSB con búsqueda FTS5
- [x] Módulo de canciones con secciones, favoritos y modo proyector
- [x] Presentaciones PDF importables y proyectables por diapositiva
- [x] Gestión de fondos (colores, degradados, imágenes, GIFs, video)
- [x] Biblioteca de contenido con acceso rápido

### v0.3 — Multimedia avanzado
- [x] Transiciones personalizables entre slides
- [x] Soporte de temas visuales (colores, fuentes, tamaños personalizados)
- [x] Vista previa del fondo activo en la ventana de control
- [x] Proyección directa de imágenes, GIFs y video (sin pasar por el editor de texto)
- [x] Buscador global (Biblia, canciones, presentaciones, multimedia, biblioteca)
- [x] Marca de agua configurable en la proyección
- [x] Importar letras de canciones desde PowerPoint (.pptx)

### v0.4 — Control avanzado
- [x] Atajos de teclado configurables
- [ ] Soporte MIDI para control con pedalera física
- [x] Vista de "stage monitor" para el presentador
- [x] Temporizador visible solo para el operador
- [x] Selección de monitor de proyección, con cambio en caliente

### v1.0 — Producción
- [x] Empaquetado con electron-builder (`.exe`, `.dmg`, `.AppImage`)
- [ ] Auto-updater
- [ ] Modo multi-operador (red local)

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Si quieres proponer algo:

1. Haz un fork del repositorio
2. Crea una rama: `git checkout -b feature/nombre-de-la-feature`
3. Haz tus cambios y commitea: `git commit -m "feat: descripción"`
4. Abre un Pull Request

Por favor sigue la convención de commits [Conventional Commits](https://www.conventionalcommits.org/).

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**. Puedes usarlo, modificarlo y distribuirlo libremente.  
Ver archivo [`LICENSE`](./LICENSE) para más detalles.

---

<div align="center">
  <sub>Open Screen es software libre para la comunidad.</sub>
</div>
