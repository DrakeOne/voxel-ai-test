# 📋 Voxel AI Test - Registro de Cambios del Proyecto

## 🔄 Último Cambio - 8 de Agosto 2025, 17:14
**Acción realizada:** Crear archivos `index.html` y `game.js`
**Descripción detallada:** Se creó la estructura base del juego voxel con renderizado 3D optimizado, controles móviles profesionales y sistema de chunks para optimización
**Motivo del cambio:** Establecer la base funcional del juego con tecnologías modernas y optimizadas

## 🎮 Descripción del Proyecto
Voxel AI Test es un juego voxel minimalista inspirado en Minecraft, construido con tecnologías web modernas para máximo rendimiento. Esta primera versión incluye:
- 🌍 Generación de terreno plano con variaciones suaves
- 📱 Controles móviles reactivos y profesionales
- 🎯 Sistema de renderizado optimizado con Three.js
- ⚡ Gestión eficiente de chunks y frustum culling
- 🎨 Interfaz moderna con efectos de blur y transparencias

## 📁 Estructura Completa del Proyecto
```
voxel-ai-test/
├── README.md (Este archivo de documentación)
├── index.html (Interfaz principal y estructura HTML)
└── game.js (Motor del juego y lógica principal)
```

## 🔧 Detalles de Cada Archivo

### `index.html` - Interfaz Principal
- **Propósito:** Estructura HTML5 del juego con UI moderna y controles móviles
- **Elementos principales:**
  - `#gameCanvas` - Canvas de Three.js para renderizado 3D (línea 104)
  - `#loadingScreen` - Pantalla de carga con barra de progreso (línea 91-96)
  - `.hud` - Información en pantalla (FPS, posición) (línea 107-116)
  - `.mobile-controls` - Controles táctiles para móviles (línea 122-135)
  - `.joystick-container` - Joystick virtual para movimiento (línea 125-128)
  - `.action-buttons` - Botones de acción (saltar, romper, colocar) (línea 131-135)
- **Estilos CSS:**
  - Sistema de diseño responsivo con media queries
  - Efectos visuales: backdrop-filter, gradientes, sombras
  - Animaciones suaves con transiciones CSS
- **Dependencias externas:**
  - Three.js r128 (CDN) - Motor de renderizado 3D
- **Características especiales:**
  - Detección automática de dispositivos móviles
  - Prevención de zoom y scroll en móviles
  - Crosshair centrado para apuntar

### `game.js` - Motor del Juego
- **Propósito:** Lógica principal del juego, física, controles y renderizado

#### **Configuración Global (CONFIG)**
- **Ubicación:** Líneas 9-38
- **Variables principales:**
  ```javascript
  WORLD: {
    WIDTH: 50,           // Ancho del mundo (línea 11)
    HEIGHT: 10,          // Altura máxima (línea 12)
    DEPTH: 50,           // Profundidad (línea 13)
    CHUNK_SIZE: 16,      // Tamaño de chunks (línea 14)
    BLOCK_SIZE: 1,       // Tamaño de bloques (línea 15)
    RENDER_DISTANCE: 5   // Distancia de renderizado (línea 16)
  }
  PLAYER: {
    MOVE_SPEED: 0.1,     // Velocidad de movimiento (línea 19)
    JUMP_FORCE: 0.2,     // Fuerza de salto (línea 20)
    GRAVITY: -0.01,      // Gravedad (línea 21)
    HEIGHT: 1.8,         // Altura del jugador (línea 22)
    CAMERA_HEIGHT: 1.6   // Altura de cámara (línea 24)
  }
  GRAPHICS: {
    FOV: 75,             // Campo de visión (línea 27)
    SHADOW_MAP_SIZE: 2048 // Resolución de sombras (línea 31)
  }
  ```

#### **Clases Principales**

##### `GameState` (Líneas 43-63)
- **Constructor:** Inicializa estado del juego
- **Propiedades:**
  - `isLoading`: Estado de carga (línea 45)
  - `isPaused`: Estado de pausa (línea 46)
  - `isMobile`: Detección de móvil (línea 47)
  - `fps`: Contador de FPS (línea 48)
- **Métodos:**
  - `updateFPS()`: Actualiza contador de FPS (líneas 53-62)

##### `VoxelWorld` (Líneas 68-179)
- **Constructor:** `constructor(scene)` - Inicializa mundo de voxels (línea 69)
- **Propiedades:**
  - `chunks`: Map de chunks para optimización (línea 71)
  - `blockTypes`: Tipos de bloques (AIR, GRASS, DIRT, STONE, SAND) (líneas 72-78)
  - `materials`: Materiales de Three.js para cada tipo (línea 79)
  - `geometryCache`: Cache de geometrías para optimización (línea 80)
- **Métodos:**
  - `createMaterials()`: Crea materiales para bloques (líneas 83-100)
  - `generateTerrain()`: Genera el terreno procedural (líneas 102-125)
  - `addBlock(x, y, z, type)`: Añade un bloque al mundo (líneas 127-148)
  - `getOrCreateGeometry()`: Sistema de cache de geometrías (líneas 150-160)
  - `getChunkKey(x, z)`: Genera clave de chunk (líneas 162-166)
  - `optimizeRendering(playerPosition)`: Frustum culling (líneas 168-178)

##### `PlayerController` (Líneas 184-384)
- **Constructor:** `constructor(camera)` - Inicializa controlador (línea 185)
- **Propiedades:**
  - `velocity`: Vector de velocidad (línea 187)
  - `position`: Posición del jugador (línea 188)
  - `rotation`: Rotación de cámara (línea 189)
  - `keys`: Estado del teclado (línea 194)
  - `joystick`: Estado del joystick virtual (línea 195)
  - `touch`: Estado táctil (línea 196)
- **Métodos:**
  - `setupControls()`: Configura controles de entrada (líneas 201-227)
  - `setupMobileControls()`: Controles móviles específicos (líneas 229-329)
    - Manejo de joystick virtual (líneas 236-276)
    - Botón de salto (líneas 278-282)
    - Rotación de cámara táctil (líneas 285-310)
  - `update(deltaTime)`: Actualiza física y movimiento (líneas 331-375)
  - `jump()`: Ejecuta salto (líneas 377-383)

##### `GameEngine` (Líneas 389-520)
- **Constructor:** Inicializa motor del juego (línea 390)
- **Propiedades:**
  - `scene`: Escena de Three.js (línea 391)
  - `camera`: Cámara perspectiva (línea 392)
  - `renderer`: Renderizador WebGL (línea 393)
  - `world`: Instancia de VoxelWorld (línea 394)
  - `player`: Instancia de PlayerController (línea 395)
  - `clock`: Reloj para delta time (línea 396)
- **Métodos:**
  - `init()`: Inicialización principal (líneas 401-410)
  - `setupRenderer()`: Configura WebGL renderer (líneas 412-432)
  - `setupScene()`: Crea escena y cámara (líneas 434-445)
  - `setupLighting()`: Sistema de iluminación (líneas 447-475)
    - Luz ambiental (línea 449)
    - Luz direccional con sombras (líneas 452-467)
    - Luz hemisférica (líneas 470-471)
  - `setupWorld()`: Inicializa mundo voxel (líneas 477-487)
  - `setupPlayer()`: Crea jugador (líneas 489-491)
  - `hideLoadingScreen()`: Oculta pantalla de carga (líneas 493-501)
  - `animate()`: Loop principal de renderizado (líneas 503-519)

#### **Inicialización Global** (Líneas 525-565)
- **Variables globales:**
  - `gameState`: Instancia de GameState (línea 525)
  - `gameEngine`: Instancia de GameEngine (línea 526)
- **Event Listeners:**
  - DOMContentLoaded: Inicia el juego (línea 529)
  - Configuración de botones de acción (líneas 534-549)
  - Prevención de menú contextual (línea 552)
  - Prevención de scroll móvil (líneas 555-559)
- **Debug exports:** Objetos expuestos para debugging (líneas 563-567)

## 💡 Cómo Funciona el Proyecto

### Flujo de Inicialización:
1. **Carga del DOM** → Se ejecuta DOMContentLoaded
2. **GameEngine.init()** → Inicializa todos los sistemas
3. **setupRenderer()** → Configura WebGL con optimizaciones
4. **setupScene()** → Crea escena 3D y cámara
5. **setupLighting()** → Añade sistema de iluminación
6. **setupWorld()** → Genera terreno procedural
7. **setupPlayer()** → Inicializa controles y física
8. **animate()** → Inicia loop de renderizado a 60 FPS

### Sistema de Renderizado:
- **Frustum Culling:** Solo renderiza chunks visibles
- **Geometry Caching:** Reutiliza geometrías idénticas
- **LOD System:** Preparado para niveles de detalle
- **Shadow Mapping:** Sombras dinámicas optimizadas

### Sistema de Controles:
- **Desktop:** WASD + Mouse para cámara
- **Mobile:** Joystick virtual + Touch para cámara
- **Acciones:** Botones para saltar, romper y colocar bloques

## 🔗 Dependencias y Librerías
- **Three.js r128**: Motor de renderizado 3D
  - WebGLRenderer para renderizado optimizado
  - PerspectiveCamera para vista 3D
  - Geometrías y materiales optimizados
  - Sistema de luces y sombras

## 🚀 Características Técnicas
- **Optimización de Rendimiento:**
  - Frustum culling automático
  - Cache de geometrías
  - Chunks para gestión eficiente del mundo
  - RequestAnimationFrame para 60 FPS estables
  
- **Compatibilidad:**
  - Funciona en navegadores modernos (Chrome, Firefox, Safari, Edge)
  - Soporte completo para dispositivos móviles
  - Detección automática de capacidades del dispositivo
  
- **Escalabilidad:**
  - Arquitectura modular con clases ES6
  - Sistema de configuración centralizado
  - Preparado para futuras expansiones (inventario, crafting, multijugador)

## 📱 Controles

### Desktop:
- **W/A/S/D**: Movimiento
- **Mouse**: Rotar cámara
- **Click**: Capturar cursor
- **Space**: Saltar (próximamente)

### Mobile:
- **Joystick izquierdo**: Movimiento
- **Deslizar pantalla**: Rotar cámara
- **Botón ⬆**: Saltar
- **Botón 🔨**: Colocar bloque (próximamente)
- **Botón ⛏**: Romper bloque (próximamente)

## 🎯 Próximas Características (v2.0)
- [ ] Sistema de colocación y destrucción de bloques
- [ ] Más tipos de bloques y texturas
- [ ] Generación de terreno más compleja
- [ ] Sistema de inventario
- [ ] Sonidos y música ambiental
- [ ] Guardado y carga de mundos
- [ ] Modo multijugador básico

## 🌐 Demo en Vivo
Puedes jugar el juego directamente desde GitHub Pages:
[https://drakeone.github.io/voxel-ai-test/](https://drakeone.github.io/voxel-ai-test/)

---
**Desarrollado con ❤️ usando tecnologías web modernas**