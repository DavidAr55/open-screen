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

### Pasos

```bash
# 1. Clona el repositorio
git clone https://github.com/tu-usuario/open-screen.git
cd open-screen

# 2. Instala las dependencias
npm install

# 3. Ejecuta en modo desarrollo
npm run dev

# 4. O ejecuta en modo normal
npm start
```

Al iniciar, la app detecta automáticamente los monitores conectados:
- Si hay **2 o más monitores** → la ventana de proyección se abre en pantalla completa en el monitor secundario
- Si hay **1 solo monitor** → ambas ventanas se abren en el mismo monitor (modo desarrollo/prueba)

---

## 📁 Estructura del proyecto

```
open-screen/
│
├── src/
│   ├── main.js              ← Proceso principal de Electron
│   │                          Crea las ventanas, maneja IPC y detecta monitores
│   │
│   ├── preload.js           ← Bridge seguro (contextBridge)
│   │                          Expone la API de openScreen al renderer
│   │
│   └── renderer/
│       ├── control.html     ← Ventana del operador
│       │                      UI completa: editor, biblioteca, panel de sesión
│       │
│       └── projection.html  ← Ventana de proyección
│                              Pantalla de salida para la audiencia
│
├── package.json
├── .gitignore
└── README.md
```

---

## 🔌 Arquitectura técnica

Open Screen usa el modelo de procesos de Electron con comunicación IPC segura:

```
┌─────────────────────┐         ┌─────────────────────┐
│   Control Window    │         │  Projection Window  │
│   (renderer)        │         │  (renderer)         │
│                     │         │                     │
│  openScreen.project()─────────►  onReceive(payload) │
│  openScreen.clear() ─────────►  onClear()           │
│  openScreen.getDisplays()     │                     │
└────────┬────────────┘         └─────────────────────┘
         │  contextBridge (preload.js)
         ▼
┌─────────────────────┐
│    Main Process     │
│    (main.js)        │
│                     │
│  ipcMain.on(...)    │
│  BrowserWindow      │
│  screen API         │
└─────────────────────┘
```

### API expuesta al renderer (`window.openScreen`)

| Método | Descripción |
|---|---|
| `project(payload)` | Envía `{ text, bg }` a la ventana de proyección |
| `clear()` | Limpia la pantalla de proyección |
| `getDisplays()` | Retorna la lista de monitores detectados |
| `onReceive(cb)` | Escucha contenido entrante (usado en projection.html) |
| `onClear(cb)` | Escucha el evento de limpieza (usado en projection.html) |

---

## 🛠️ Stack tecnológico

| Tecnología | Uso |
|---|---|
| [Electron](https://www.electronjs.org/) | Framework de escritorio multiplataforma |
| [Tailwind CSS (CDN)](https://tailwindcss.com/) | Sistema de estilos utilitario |
| [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) | Tipografía principal |
| [JetBrains Mono](https://www.jetbrains.com/legalforms/fonts/) | Tipografía monoespaciada (badges, código) |
| HTML/CSS/JS vanilla | Renderer sin frameworks adicionales |

---

## 🗺️ Roadmap

### v0.2 — Gestión de contenido
- [ ] Módulo de canciones con estrofas y coros navegables
- [ ] Integración con Biblia (base de datos local SQLite)
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