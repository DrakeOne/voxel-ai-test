/**
 * Voxel AI Test - Game Engine v1.0
 * A minimalist voxel game with optimized performance
 * Built with Three.js and modern JavaScript
 */

// ========================
// GAME CONFIGURATION
// ========================
const CONFIG = {
    WORLD: {
        WIDTH: 50,        // World width in chunks
        HEIGHT: 10,       // World height in blocks
        DEPTH: 50,        // World depth in chunks
        CHUNK_SIZE: 16,   // Blocks per chunk
        BLOCK_SIZE: 1,    // Size of each block
        RENDER_DISTANCE: 5 // Chunks to render around player
    },
    PLAYER: {
        MOVE_SPEED: 0.1,
        JUMP_FORCE: 0.2,
        GRAVITY: -0.01,
        HEIGHT: 1.8,
        WIDTH: 0.6,
        CAMERA_HEIGHT: 1.6
    },
    GRAPHICS: {
        FOV: 75,
        NEAR_PLANE: 0.1,
        FAR_PLANE: 1000,
        FOG_NEAR: 20,
        FOG_FAR: 100,
        SHADOW_MAP_SIZE: 2048
    },
    CONTROLS: {
        MOUSE_SENSITIVITY: 0.002,
        TOUCH_SENSITIVITY: 0.003,
        JOYSTICK_DEAD_ZONE: 0.15
    }
};

// ========================
// GAME STATE
// ========================
class GameState {
    constructor() {
        this.isLoading = true;
        this.isPaused = false;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.fps = 60;
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.fpsUpdateTime = 0;
    }
    
    updateFPS() {
        const now = performance.now();
        const delta = now - this.lastFrameTime;
        this.lastFrameTime = now;
        this.frameCount++;
        
        if (now - this.fpsUpdateTime > 1000) {
            this.fps = Math.round(this.frameCount * 1000 / (now - this.fpsUpdateTime));
            this.frameCount = 0;
            this.fpsUpdateTime = now;
            document.getElementById('fpsCounter').textContent = `FPS: ${this.fps}`;
        }
    }
}

// ========================
// VOXEL WORLD
// ========================
class VoxelWorld {
    constructor(scene) {
        this.scene = scene;
        this.chunks = new Map();
        this.blockTypes = {
            AIR: 0,
            GRASS: 1,
            DIRT: 2,
            STONE: 3,
            SAND: 4
        };
        this.materials = this.createMaterials();
        this.geometryCache = new Map();
    }
    
    createMaterials() {
        return {
            [this.blockTypes.GRASS]: new THREE.MeshLambertMaterial({ 
                color: 0x7CFC00,
                side: THREE.FrontSide
            }),
            [this.blockTypes.DIRT]: new THREE.MeshLambertMaterial({ 
                color: 0x8B4513,
                side: THREE.FrontSide
            }),
            [this.blockTypes.STONE]: new THREE.MeshLambertMaterial({ 
                color: 0x808080,
                side: THREE.FrontSide
            }),
            [this.blockTypes.SAND]: new THREE.MeshLambertMaterial({ 
                color: 0xF4E4C1,
                side: THREE.FrontSide
            })
        };
    }
    
    generateTerrain() {
        const { WIDTH, DEPTH, HEIGHT } = CONFIG.WORLD;
        
        // Generate flat terrain with some variation
        for (let x = -WIDTH/2; x < WIDTH/2; x++) {
            for (let z = -DEPTH/2; z < DEPTH/2; z++) {
                // Simple height variation using sine waves
                const height = Math.floor(
                    5 + 
                    Math.sin(x * 0.1) * 2 + 
                    Math.cos(z * 0.1) * 2
                );
                
                for (let y = 0; y < height; y++) {
                    const blockType = y === height - 1 ? this.blockTypes.GRASS : 
                                    y > height - 4 ? this.blockTypes.DIRT : 
                                    this.blockTypes.STONE;
                    
                    this.addBlock(x, y, z, blockType);
                }
            }
        }
    }
    
    addBlock(x, y, z, type) {
        if (type === this.blockTypes.AIR) return;
        
        const geometry = this.getOrCreateGeometry();
        const material = this.materials[type];
        const block = new THREE.Mesh(geometry, material);
        
        block.position.set(x, y, z);
        block.castShadow = true;
        block.receiveShadow = true;
        block.userData = { x, y, z, type };
        
        this.scene.add(block);
        
        // Store in chunk system for optimization
        const chunkKey = this.getChunkKey(x, z);
        if (!this.chunks.has(chunkKey)) {
            this.chunks.set(chunkKey, []);
        }
        this.chunks.get(chunkKey).push(block);
    }
    
    getOrCreateGeometry() {
        const key = 'box_1';
        if (!this.geometryCache.has(key)) {
            this.geometryCache.set(key, new THREE.BoxGeometry(
                CONFIG.WORLD.BLOCK_SIZE,
                CONFIG.WORLD.BLOCK_SIZE,
                CONFIG.WORLD.BLOCK_SIZE
            ));
        }
        return this.geometryCache.get(key);
    }
    
    getChunkKey(x, z) {
        const chunkX = Math.floor(x / CONFIG.WORLD.CHUNK_SIZE);
        const chunkZ = Math.floor(z / CONFIG.WORLD.CHUNK_SIZE);
        return `${chunkX},${chunkZ}`;
    }
    
    optimizeRendering(playerPosition) {
        // Simple frustum culling and LOD system
        const renderDistance = CONFIG.WORLD.RENDER_DISTANCE * CONFIG.WORLD.CHUNK_SIZE;
        
        this.chunks.forEach((blocks, chunkKey) => {
            const [chunkX, chunkZ] = chunkKey.split(',').map(Number);
            const chunkWorldX = chunkX * CONFIG.WORLD.CHUNK_SIZE;
            const chunkWorldZ = chunkZ * CONFIG.WORLD.CHUNK_SIZE;
            
            const distance = Math.sqrt(
                Math.pow(chunkWorldX - playerPosition.x, 2) +
                Math.pow(chunkWorldZ - playerPosition.z, 2)
            );
            
            blocks.forEach(block => {
                block.visible = distance < renderDistance;
            });
        });
    }
}

// ========================
// PLAYER CONTROLLER
// ========================
class PlayerController {
    constructor(camera) {
        this.camera = camera;
        this.velocity = new THREE.Vector3();
        this.position = new THREE.Vector3(0, 10, 0);
        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
        this.isJumping = false;
        this.canJump = true;
        
        // Input state
        this.keys = {};
        this.joystick = { x: 0, y: 0 };
        this.touch = { x: 0, y: 0, active: false };
        
        this.setupControls();
    }
    
    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse controls for camera
        if (!gameState.isMobile) {
            document.addEventListener('click', () => {
                document.body.requestPointerLock();
            });
            
            document.addEventListener('mousemove', (e) => {
                if (document.pointerLockElement === document.body) {
                    this.rotation.y -= e.movementX * CONFIG.CONTROLS.MOUSE_SENSITIVITY;
                    this.rotation.x -= e.movementY * CONFIG.CONTROLS.MOUSE_SENSITIVITY;
                    this.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.rotation.x));
                }
            });
        }
        
        // Mobile joystick controls
        if (gameState.isMobile) {
            this.setupMobileControls();
        }
    }
    
    setupMobileControls() {
        const joystick = document.getElementById('joystick');
        const stick = document.getElementById('joystickStick');
        const jumpBtn = document.getElementById('jumpBtn');
        
        let joystickActive = false;
        let joystickStart = { x: 0, y: 0 };
        
        // Joystick movement
        const handleJoystickMove = (clientX, clientY) => {
            if (!joystickActive) return;
            
            const rect = joystick.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            let deltaX = clientX - centerX;
            let deltaY = clientY - centerY;
            
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const maxDistance = rect.width / 2 - 25;
            
            if (distance > maxDistance) {
                deltaX = (deltaX / distance) * maxDistance;
                deltaY = (deltaY / distance) * maxDistance;
            }
            
            stick.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
            
            // Normalize joystick input
            this.joystick.x = deltaX / maxDistance;
            this.joystick.y = -deltaY / maxDistance;
            
            // Apply dead zone
            if (Math.abs(this.joystick.x) < CONFIG.CONTROLS.JOYSTICK_DEAD_ZONE) this.joystick.x = 0;
            if (Math.abs(this.joystick.y) < CONFIG.CONTROLS.JOYSTICK_DEAD_ZONE) this.joystick.y = 0;
        };
        
        // Touch events for joystick
        joystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            joystickActive = true;
            const touch = e.touches[0];
            handleJoystickMove(touch.clientX, touch.clientY);
        });
        
        joystick.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            handleJoystickMove(touch.clientX, touch.clientY);
        });
        
        joystick.addEventListener('touchend', () => {
            joystickActive = false;
            this.joystick.x = 0;
            this.joystick.y = 0;
            stick.style.transform = 'translate(-50%, -50%)';
        });
        
        // Jump button
        jumpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.jump();
        });
        
        // Camera rotation with touch
        let touchStartX = 0;
        let touchStartY = 0;
        
        document.addEventListener('touchstart', (e) => {
            if (e.target.closest('.mobile-controls')) return;
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            this.touch.active = true;
        });
        
        document.addEventListener('touchmove', (e) => {
            if (!this.touch.active || e.target.closest('.mobile-controls')) return;
            e.preventDefault();
            
            const touch = e.touches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;
            
            this.rotation.y -= deltaX * CONFIG.CONTROLS.TOUCH_SENSITIVITY;
            this.rotation.x -= deltaY * CONFIG.CONTROLS.TOUCH_SENSITIVITY;
            this.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.rotation.x));
            
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        });
        
        document.addEventListener('touchend', () => {
            this.touch.active = false;
        });
    }
    
    update(deltaTime) {
        // Apply movement from keyboard or joystick
        const moveVector = new THREE.Vector3();
        
        if (this.keys['KeyW'] || this.joystick.y > 0) {
            moveVector.z -= this.joystick.y || 1;
        }
        if (this.keys['KeyS'] || this.joystick.y < 0) {
            moveVector.z -= this.joystick.y || -1;
        }
        if (this.keys['KeyA'] || this.joystick.x < 0) {
            moveVector.x += this.joystick.x || -1;
        }
        if (this.keys['KeyD'] || this.joystick.x > 0) {
            moveVector.x += this.joystick.x || 1;
        }
        
        // Normalize and apply movement
        if (moveVector.length() > 0) {
            moveVector.normalize();
            moveVector.multiplyScalar(CONFIG.PLAYER.MOVE_SPEED);
            
            // Rotate movement vector based on camera rotation
            moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
            
            this.velocity.x = moveVector.x;
            this.velocity.z = moveVector.z;
        } else {
            this.velocity.x *= 0.9; // Friction
            this.velocity.z *= 0.9;
        }
        
        // Apply gravity
        this.velocity.y += CONFIG.PLAYER.GRAVITY;
        
        // Update position
        this.position.add(this.velocity);
        
        // Simple ground collision
        if (this.position.y < 8) {
            this.position.y = 8;
            this.velocity.y = 0;
            this.canJump = true;
            this.isJumping = false;
        }
        
        // Update camera
        this.camera.position.copy(this.position);
        this.camera.position.y += CONFIG.PLAYER.CAMERA_HEIGHT;
        this.camera.rotation.x = this.rotation.x;
        this.camera.rotation.y = this.rotation.y;
        
        // Update HUD
        document.getElementById('position').textContent = 
            `Posición: X:${Math.round(this.position.x)} Y:${Math.round(this.position.y)} Z:${Math.round(this.position.z)}`;
    }
    
    jump() {
        if (this.canJump && !this.isJumping) {
            this.velocity.y = CONFIG.PLAYER.JUMP_FORCE;
            this.isJumping = true;
            this.canJump = false;
        }
    }
}

// ========================
// GAME ENGINE
// ========================
class GameEngine {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.world = null;
        this.player = null;
        this.clock = new THREE.Clock();
        
        this.init();
    }
    
    init() {
        this.setupRenderer();
        this.setupScene();
        this.setupLighting();
        this.setupWorld();
        this.setupPlayer();
        this.hideLoadingScreen();
        this.animate();
    }
    
    setupRenderer() {
        const canvas = document.getElementById('gameCanvas');
        
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            powerPreference: "high-performance"
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, CONFIG.GRAPHICS.FOG_NEAR, CONFIG.GRAPHICS.FOG_FAR);
        
        // Setup camera
        this.camera = new THREE.PerspectiveCamera(
            CONFIG.GRAPHICS.FOV,
            window.innerWidth / window.innerHeight,
            CONFIG.GRAPHICS.NEAR_PLANE,
            CONFIG.GRAPHICS.FAR_PLANE
        );
    }
    
    setupLighting() {
        // Ambient light for base illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        
        // Shadow configuration
        directionalLight.shadow.mapSize.width = CONFIG.GRAPHICS.SHADOW_MAP_SIZE;
        directionalLight.shadow.mapSize.height = CONFIG.GRAPHICS.SHADOW_MAP_SIZE;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        
        this.scene.add(directionalLight);
        
        // Hemisphere light for sky/ground color variation
        const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x545454, 0.4);
        this.scene.add(hemisphereLight);
    }
    
    setupWorld() {
        this.world = new VoxelWorld(this.scene);
        
        // Update loading progress
        const progressBar = document.getElementById('loadingProgress');
        progressBar.style.width = '50%';
        
        // Generate terrain
        this.world.generateTerrain();
        
        progressBar.style.width = '100%';
    }
    
    setupPlayer() {
        this.player = new PlayerController(this.camera);
    }
    
    hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                gameState.isLoading = false;
            }, 500);
        }, 500);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (gameState.isLoading || gameState.isPaused) return;
        
        const deltaTime = this.clock.getDelta();
        
        // Update game state
        gameState.updateFPS();
        
        // Update player
        this.player.update(deltaTime);
        
        // Optimize rendering based on player position
        this.world.optimizeRendering(this.player.position);
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}

// ========================
// INITIALIZATION
// ========================
const gameState = new GameState();
let gameEngine = null;

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize game engine
    gameEngine = new GameEngine();
    
    // Setup action buttons
    const placeBtn = document.getElementById('placeBtn');
    const breakBtn = document.getElementById('breakBtn');
    
    if (placeBtn) {
        placeBtn.addEventListener('click', () => {
            console.log('Place block action');
            // TODO: Implement block placement
        });
    }
    
    if (breakBtn) {
        breakBtn.addEventListener('click', () => {
            console.log('Break block action');
            // TODO: Implement block breaking
        });
    }
    
    // Prevent context menu on mobile
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Prevent scrolling on mobile
    document.addEventListener('touchmove', (e) => {
        if (!e.target.closest('.mobile-controls')) {
            e.preventDefault();
        }
    }, { passive: false });
});

// Export for debugging
window.gameDebug = {
    gameState,
    gameEngine,
    CONFIG
};