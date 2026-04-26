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
- npm (incluido con Node.js)
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
npm install

# 3. Ejecuta en modo desarrollo (hot-reload activo)
npm run dev

# 4. Construir para producción
npm run build
```

Al iniciar, la app detecta automáticamente los monitores conectados:
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
│   │   └── ipc/                  ← Manejadores de mensajes entre ventanas
│   │       ├── index.js          ← Registra todos los handlers
│   │       ├── library.ipc.js
│   │       ├── settings.ipc.js
│   │       ├── projection.ipc.js
│   │       ├── displays.ipc.js
│   │       ├── bible.ipc.js
│   │       ├── songs.ipc.js
│   │       ├── presentations.ipc.js
│   │       └── backgrounds.ipc.js
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
│       │       │   └── SettingsPage.jsx     ← Configuración general
│       │       ├── components/
│       │       │   ├── editor/SlideEditor.jsx
│       │       │   ├── quick/QuickGrid.jsx
│       │       │   ├── live/LivePanel.jsx
│       │       │   ├── layout/Sidebar.jsx
│       │       │   ├── layout/Topbar.jsx
│       │       │   └── backgound/BackgroundsPanel.jsx
│       │       └── hooks/
│       │           └── useLibrary.js
│       ├── projection/           ← Ventana de proyección (solo recibe datos)
│       │   └── src/
│       │       └── App.jsx       ← Capa de fondo + capa de texto + capa de slides
│       └── shared/               ← Componentes reutilizables entre renderers
│           ├── components/
│           │   ├── ui/index.jsx  ← Sistema de diseño: Button, Card, Input, Badge…
│           │   └── ConfirmModal.jsx
│           └── utils/
│               └── cn.js         ← Utilidad para combinar clases de Tailwind
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
│  │                │    │  settings · library · songs              │ │
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
│  AppContext (estado)      │───►│  Capas: fondo / texto / slide    │
│  Páginas navegables       │    │  Transición CSS 220ms            │
│  (Control, Songs,         │    │  Tamaño de fuente dinámico       │
│   Scripture, PDF, Config) │    │                                  │
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
| **Ajustes** | `SettingsPage.jsx` | Tema, monitor, fondo, fuente, velocidad de transición, backup de DB |

---

## 🌐 API disponible en el renderer (`window.api`)

Estas son todas las funciones que los componentes React pueden llamar:

| Namespace | Método | Tipo | Descripción |
|---|---|---|---|
| `projection` | `send(payload)` | send | Envía `{ text, bg }` a la pantalla |
| `projection` | `clear()` | send | Limpia la pantalla |
| `projection` | `freeze(bool)` | send | Congela/descongela la imagen |
| `library` | `findAll/create/update/delete` | invoke | CRUD de ítems de biblioteca |
| `settings` | `get/set/getAll/setMany` | invoke | Configuraciones clave-valor |
| `displays` | `getAll()` | invoke | Lista los monitores conectados |
| `bible` | `listModules/getBooks/getChapter/search...` | invoke | Lectura de módulos .osb |
| `songs` | `findAll/create/update/delete/toggleFavorite` | invoke | CRUD de canciones |
| `presentations` | `import/findAll/readFile/projectSlide...` | mixed | Gestión y proyección de PDFs |
| `backgrounds` | `findAll/create/update/delete/setActive...` | mixed | Gestión de fondos de proyección |

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
| [Tailwind CSS 3](https://tailwindcss.com/) | Sistema de estilos utilitario |
| [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | SQLite embebido y sincrónico (requiere compilación nativa) |
| [pdfjs-dist](https://github.com/mozilla/pdf.js) | Renderizado de PDFs en el renderer de control |
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
- [ ] Transiciones personalizables entre slides
- [ ] Soporte de temas visuales (colores, fuentes, tamaños personalizados)
- [ ] Vista previa del fondo activo en la ventana de control

### v0.4 — Control avanzado
- [ ] Soporte MIDI para control con pedalera física
- [ ] Vista de "stage monitor" para el presentador
- [ ] Temporizador visible solo para el operador
- [ ] Atajos de teclado configurables

### v1.0 — Producción
- [ ] Empaquetado con electron-builder (`.exe`, `.dmg`, `.AppImage`)
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
