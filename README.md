<div align="center">

<br/>

<img src="https://img.shields.io/badge/version-0.1.0-e51d1d?style=flat-square" />
<img src="https://img.shields.io/badge/electron-33+-47848F?style=flat-square&logo=electron&logoColor=white" />
<img src="https://img.shields.io/badge/tailwind-CDN-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
<img src="https://img.shields.io/badge/licencia-MIT-22c55e?style=flat-square" />
<img src="https://img.shields.io/badge/plataforma-Windows%20%7C%20macOS%20%7C%20Linux-0f172a?style=flat-square" />

<br/><br/>

# 🟥 Open Screen

**Software de proyección de presentaciones open source.**  
Diseñado para iglesias, eventos y cualquier espacio que necesite proyectar texto, versículos o anuncios en una pantalla secundaria — sin depender de software privativo ni licencias costosas.

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
- ⚡ **Acceso rápido** — grid de acceso directo a los items más usados
- 🎨 **Fondos de proyección** — oscuro, rojo o negro puro, seleccionable desde el panel
- 🌗 **Modo claro y oscuro** — claro por defecto, oscuro disponible con un toggle
- 🔒 **Arquitectura segura** — comunicación entre ventanas vía IPC con `contextBridge`, sin acceso directo a Node desde el renderer
- 📊 **Panel de sesión** — estadísticas de proyecciones y estado del monitor en vivo

---

## 🖼️ Interfaz

| Ventana | Descripción |
|---|---|
| **Control** | Panel del operador: editor, biblioteca, acceso rápido, estado en vivo |
| **Proyección** | Pantalla de salida: texto centrado, fondo dinámico, sin distracciones |

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
git clone https://github.com/tu-usuario/open-screen.git
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
├── src/
│   ├── main/
│   │   ├── index.js
│   │   ├── windows/WindowManager.js
│   │   ├── db/
│   │   │   ├── database.js
│   │   │   ├── schema.js
│   │   │   └── repositories/
│   │   │       ├── index.js
│   │   │       ├── SettingsRepository.js
│   │   │       ├── LibraryRepository.js
│   │   │       ├── MediaRepository.js
│   │   │       └── BibleRepository.js     ← gestiona módulos .osb
│   │   └── ipc/
│   │       ├── index.js
│   │       ├── library.ipc.js
│   │       ├── settings.ipc.js
│   │       ├── projection.ipc.js
│   │       ├── displays.ipc.js
│   │       └── bible.ipc.js               ← 8 canales IPC para biblias
│   │
│   ├── preload/
│   │   ├── control.js                     ← window.api.bible.*
│   │   └── projection.js
│   │
│   └── renderer/
│       ├── control/                        ← React 19 — panel del operador
│       ├── projection/                     ← React 19 — pantalla de salida
│       └── shared/                         ← Design system compartido
│
├── scripts/
│   └── create-osb-module.mjs             ← Genera .osb desde JSON fuente
│
├── bibles-src/
│   └── README.md                         ← Documenta el formato OSB y fuentes
│
├── electron.vite.config.mjs
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── .gitignore                            ← *.osb excluido
└── README.md
```

---

## 🔌 Arquitectura técnica

Open Screen separa el proceso principal (Node.js) del renderer (React) siguiendo el modelo de seguridad moderno de Electron — `contextIsolation: true`, sin `nodeIntegration` en el renderer.

```
┌──────────────────────────────────────────────────────────────┐
│  MAIN PROCESS (Node.js)                                      │
│                                                              │
│  ┌─────────────┐   ┌──────────────────────────────────────┐ │
│  │ WindowManager│   │ IPC Handlers                         │ │
│  │             │   │  library:findAll/create/update/delete │ │
│  │ controlWin  │   │  settings:get/set/getAll/setMany      │ │
│  │ projectWin  │   │  projection:send/clear/freeze         │ │
│  └──────┬──────┘   │  displays:getAll                      │ │
│         │          └────────────────┬─────────────────────┘ │
│         │                           │                        │
│         │          ┌────────────────▼──────────┐            │
│         │          │  SQLite (better-sqlite3)   │            │
│         │          │  ~/AppData/open-screen.db  │            │
│         │          │                            │            │
│         │          │  settings                  │            │
│         │          │  library_items             │            │
│         │          │  slides                    │            │
│         │          │  media                     │            │
│         │          │  presentations             │            │
│         │          └───────────────────────────┘            │
└─────────┼─────────────────────────────────────────────────┘
          │  contextBridge (preload scripts)
          │
  ┌───────▼──────────────┐     ┌──────────────────────┐
  │  CONTROL RENDERER    │     │  PROJECTION RENDERER  │
  │  (React 19)          │     │  (React 19)           │
  │                      │     │                       │
  │  AppContext           │     │  Recibe payloads      │
  │  ├─ theme/dark mode  │────►│  Anima texto          │
  │  ├─ library (SQLite) │     │  Gestiona fondos      │
  │  └─ live state       │     │                       │
  └──────────────────────┘     └──────────────────────┘
```

### API expuesta al renderer (`window.api`)

| Namespace | Método | Descripción |
|---|---|---|
| `projection` | `send(payload)` | Envía `{ text, bg }` a la proyección |
| `projection` | `clear()` | Limpia la pantalla |
| `projection` | `freeze(bool)` | Congela la imagen actual |
| `library` | `findAll(filters)` | Lista con filtros opcionales |
| `library` | `create(data)` | Crea un nuevo ítem |
| `library` | `update(id, data)` | Actualiza un ítem |
| `library` | `delete(id)` | Elimina un ítem |
| `settings` | `get(key, default)` | Lee una configuración |
| `settings` | `set(key, value)` | Guarda una configuración |
| `settings` | `setMany(entries)` | Actualiza múltiples en transacción |
| `displays` | `getAll()` | Lista los monitores detectados |

### Base de datos SQLite

La DB principal se almacena en el `userData` de Electron:
- **Windows**: `%APPDATA%\open-screen\open-screen.db`
- **macOS**: `~/Library/Application Support/open-screen/open-screen.db`
- **Linux**: `~/.config/open-screen/open-screen.db`

El schema usa un sistema de migraciones versionadas (`user_version` pragma). Para agregar una migración futura basta con añadir una entrada `v2` en `schema.js`.

---

## 📖 Módulos Bíblicos — Formato OSB

Open Screen usa su propio formato de módulo bíblico: **Open Screen Bible (`.osb`)**.

Cada `.osb` es un archivo SQLite independiente que el usuario instala en su directorio de usuario. Esto permite:
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
-- Metadatos de la traducción
CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);

-- Libros (1=Génesis … 66=Apocalipsis)
CREATE TABLE books (
  id INTEGER PRIMARY KEY, name TEXT, abbrev TEXT, testament TEXT
);

-- Versículos con sistema de ID scrollmapper-compatible (BBCCCVVV)
-- Ej: Juan 3:16 = 43003016  (libro 43, cap 3, vers 16)
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

### API disponible en el renderer (`window.api.bible`)

| Método | Descripción |
|---|---|
| `listModules()` | Lista los módulos `.osb` instalados |
| `openBiblesDir()` | Abre el directorio en el explorador del SO |
| `getBooks(moduleId)` | Libros del módulo |
| `getChapter(moduleId, book, chapter)` | Versículos de un capítulo |
| `getVerse(moduleId, book, chapter, verse)` | Versículo individual |
| `search(moduleId, query, options)` | Búsqueda de texto libre |
| `validateModule(filePath)` | Valida un `.osb` antes de instalarlo |

---

## 🛠️ Stack tecnológico

| Tecnología | Uso |
|---|---|
| [Electron 33](https://www.electronjs.org/) | Framework de escritorio multiplataforma |
| [React 19](https://react.dev/) | UI del renderer (control + proyección) |
| [electron-vite](https://electron-vite.org/) | Build tool (Vite adaptado para Electron) |
| [Tailwind CSS 3](https://tailwindcss.com/) | Sistema de estilos utilitario |
| [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | Base de datos SQLite embebida y sincrónica |
| [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) | Tipografía principal |
| [JetBrains Mono](https://www.jetbrains.com/legalforms/fonts/) | Tipografía monoespaciada |

---

## 🗺️ Roadmap

### v0.2 — Gestión de contenido
- [x] SQLite embebido con sistema de migraciones versionadas
- [x] Repositorios: Settings, Library, Media, Bible
- [x] Formato de módulo bíblico OSB (`.osb`) propio y abierto
- [x] Script generador de módulos desde JSON fuente
- [ ] Módulo RV1909 (dominio público) como default
- [ ] UI de búsqueda de versículos con selector de módulo
- [ ] Guardar y cargar sets de presentación (`.json`)
- [ ] Búsqueda avanzada en biblioteca

### v0.3 — Multimedia
- [ ] Imágenes de fondo por slide
- [ ] Reproducción de video en pantalla de proyección
- [ ] Transiciones personalizables entre slides
- [ ] Soporte de temas visuales (colores, fuentes, tamaños)

### v0.4 — Control avanzado
- [ ] Soporte MIDI para control con pedalera física
- [ ] Vista de "stage monitor" para el presentador
- [ ] Temporizador visible solo para el operador
- [ ] Atajos de teclado configurables

### v1.0 — Producción
- [ ] Empaquetado con electron-builder (`.exe`, `.dmg`, `.AppImage`)
- [ ] Auto-updater
- [ ] Persistencia de biblioteca con SQLite o JSON local
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
  <sub>Hecho con ❤️ — Open Screen es software libre para la comunidad.</sub>
</div>
