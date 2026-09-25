// ==========================================
// TOWER DROP - CÓDIGO COMPLETO CON NUEVAS MEJORAS
// ==========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOverModal = document.getElementById('game-over-modal');
const finalScoreEl = document.getElementById('final-score');
const finalBlocksEl = document.getElementById('final-blocks');
const retryButton = document.getElementById('retry-button');
const currentScoreEl = document.getElementById('current-score');
const currentBlocksEl = document.getElementById('current-blocks');
const highScoreEl = document.querySelector('.high-score');
const bestScoreLabelEl = document.getElementById('best-score-label');
const recordCurrentEl = document.getElementById('record-current');
const recordPlayerEl = document.getElementById('record-player');
const recordBlocksEl = document.getElementById('record-blocks');
const recordStatusEl = document.getElementById('record-status');
const challengeScoreEl = document.getElementById('challenge-score');
const challengeDetailsEl = document.getElementById('challenge-details');
const recordForm = document.getElementById('record-form');
const playerIdInput = document.getElementById('player-id');
const saveRecordButton = document.getElementById('save-record-button');
const BEST_SCORE_STORAGE_KEY = 'tower_drop_best_v2';
const BEST_PLAYER_STORAGE_KEY = 'tower_drop_best_player_v2';
const BEST_BLOCKS_STORAGE_KEY = 'tower_drop_best_blocks_v2';

const CUBE_SIZE = 42; 
const CRANE_Y = 85; 

let currentBlockX = 10;
let currentBlockY = CRANE_Y; 
let dropVy = 0; 

// Dificultad y Velocidad
const INITIAL_SPEED = 2.2;
const MAX_SPEED = 5.5; 
let baseSpeed = INITIAL_SPEED;
let currentSpeed = INITIAL_SPEED;
let direction = 1;
let isDropping = false;

// Puntuación, Bloques y Racha
let score = 0;
let blockCount = 0;
let bestScore = Number(localStorage.getItem(BEST_SCORE_STORAGE_KEY)) || 0;
let bestPlayer = localStorage.getItem(BEST_PLAYER_STORAGE_KEY) || 'SIN JUGADOR';
let bestBlocks = Number(localStorage.getItem(BEST_BLOCKS_STORAGE_KEY)) || 0;
let recordWasBroken = false;
let streak = 0;

// Efecto de Temblor (Screen Shake)
let shakeTimer = 0;
let shakeIntensity = 0;

// Avisos Flotantes de Puntaje
let floatingText = "";
let floatingTextTimer = 0;
let floatingTextY = 0;
let floatingTextColor = '#ffea00';

// Letreros de Hitos de Altura (Milestones)
let milestoneText = "";
let milestoneTimer = 0;

// Partículas
let particles = [];

// Obstáculos Voladores
let flyingEntities = [];
let spawnFlyerTimer = 0;

// Estado de Demolición (Game Over)
let isDemolishing = false;
let isGameOver = false;
let demolishingBlocks = [];

// Power-Up Tiempo Lento
let isSlowMotion = false;
let slowMotionTimer = null;
let isSpecialClockCube = false;

// Skin Seleccionada ('classic', 'stone', 'metal')
let currentSkin = 'classic';

// Fondo: Nubes y Ciudad
let clouds = [
    { x: 20, y: 150, speed: 0.3, size: 40 },
    { x: 200, y: 280, speed: 0.2, size: 55 },
    { x: 100, y: 450, speed: 0.4, size: 35 }
];

// ==========================================
// NUEVO DISEÑO VISUAL DE LA CIUDAD DE FONDO
// ==========================================

// Edificios lejanos (Siluetas profundas)
let bgCityBuildings = [
    { x: -20, width: 90, height: 260 },
    { x: 60, width: 70, height: 210 },
    { x: 120, width: 110, height: 320 },
    { x: 220, width: 85, height: 240 },
    { x: 290, width: 95, height: 350 },
    { x: 370, width: 80, height: 200 }
];

// Edificios principales en primer plano de la ciudad
let cityBuildings = [
    { x: -15, width: 95, height: 310, windows: [], antenna: true },
    { x: 70, width: 80, height: 240, windows: [], antenna: false },
    { x: 140, width: 110, height: 390, windows: [], antenna: true },
    { x: 240, width: 90, height: 290, windows: [], antenna: false },
    { x: 320, width: 105, height: 360, windows: [], antenna: true },
    { x: 410, width: 75, height: 220, windows: [], antenna: false }
];

// Generación de ventanas con más variedad y luces parpadeantes
const windowPalette = ['#ffe082', '#ffd54f', '#81d4fa', '#ff8a65', '#ffffff'];
cityBuildings.forEach(b => {
    b.windows = [];
    let cols = Math.floor((b.width - 20) / 14);
    let rows = Math.floor((b.height - 50) / 20);

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (Math.random() < 0.8) {
                b.windows.push({
                    x: 12 + c * 14,
                    y: 30 + r * 20,
                    w: 7,
                    h: 11,
                    lit: Math.random() < 0.75,
                    color: windowPalette[Math.floor(Math.random() * windowPalette.length)]
                });
            }
        }
    }
});
// Generar Estrellas para cuando subas muy alto
let stars = [];
for (let i = 0; i < 50; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random()
    });
}

// ------------------------------------------
// 🎨 RENDERIZADO MEJORADO DE FONDO (drawBackground)
// ------------------------------------------

function drawBackground() {
    let heightLevel = stack.length;
    let time = Date.now() * 0.002;

    // 1. DIBUJAR CIELO ATMOSFÉRICO CON DEGRADADO MULTICAPA
    let skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);

    if (isSlowMotion) {
        skyGradient.addColorStop(0, '#fbc02d');
        skyGradient.addColorStop(0.5, '#f57c00');
        skyGradient.addColorStop(1, '#e64a19');
    } else if (heightLevel < 60) {
        // Atardecer cálido y suave
        skyGradient.addColorStop(0, '#1a237e');   // Azul noche arriba
        skyGradient.addColorStop(0.4, '#283593'); 
        skyGradient.addColorStop(0.7, '#8e24aa'); // Púrpura medio
        skyGradient.addColorStop(1, '#ff7043');   // Naranja horizonte
    } else if (heightLevel < 200) {
        // Estratósfera / Azul Profundo
        skyGradient.addColorStop(0, '#020208');
        skyGradient.addColorStop(0.5, '#0d1b2a');
        skyGradient.addColorStop(1, '#1b263b');
    } else {
        // Espacio Exterior
        skyGradient.addColorStop(0, '#000000');
        skyGradient.addColorStop(1, '#05050f');
    }
    
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. ESTRELLAS TITILANTES (Aparecen al subir de nivel)
    if (heightLevel > 30) {
        let starAlphaFactor = Math.min(1, (heightLevel - 30) / 70);
        ctx.save();
        stars.forEach(st => {
            let tw = (Math.sin(time * 2 + st.x) + 1) * 0.5 * st.alpha;
            ctx.fillStyle = `rgba(255, 255, 255, ${tw * starAlphaFactor})`;
            ctx.beginPath();
            ctx.arc(st.x, st.y, st.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    // 3. NUBES TRIDIMENSIONALES CON SOMBRA
    if (heightLevel < 250) {
        clouds.forEach(cloud => {
            let drawY = cloud.y + (cameraOffsetY * 0.3);
            
            if (drawY > -100 && drawY < canvas.height + 100) {
                ctx.save();
                // Sombra de la nube
                ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
                ctx.beginPath();
                ctx.arc(cloud.x + 4, drawY + 6, cloud.size, 0, Math.PI * 2);
                ctx.arc(cloud.x + cloud.size * 0.5 + 4, drawY - 6, cloud.size * 0.7, 0, Math.PI * 2);
                ctx.fill();

                // Cuerpo suave de la nube
                let cloudGrad = ctx.createLinearGradient(cloud.x, drawY - cloud.size, cloud.x, drawY + cloud.size);
                cloudGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
                cloudGrad.addColorStop(1, 'rgba(220, 225, 230, 0.6)');

                ctx.fillStyle = cloudGrad;
                ctx.beginPath();
                ctx.arc(cloud.x, drawY, cloud.size, 0, Math.PI * 2);
                ctx.arc(cloud.x + cloud.size * 0.5, drawY - 10, cloud.size * 0.7, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                cloud.x += cloud.speed;
                if (cloud.x - cloud.size > canvas.width) cloud.x = -cloud.size * 2;
            }
        });
    }

    // 4. SILUETA DE LA CIUDAD CON PARALLAX Y DETALLES
    if (heightLevel < 140) {
        ctx.save();
        
        // --- CAPA TRASERA DE EDIFICIOS (Parallax Lento) ---
        let bgCityBaseY = canvas.height - 35 + (cameraOffsetY * 0.25);
        ctx.fillStyle = 'rgba(15, 20, 35, 0.6)';
        bgCityBuildings.forEach(b => {
            let bY = bgCityBaseY - b.height;
            ctx.fillRect(b.x, bY, b.width, b.height);
        });

        // --- CAPA DELANTERA DE EDIFICIOS (Parallax Medio) ---
        let cityBaseY = canvas.height - 35 + (cameraOffsetY * 0.55);

        cityBuildings.forEach(b => {
            let bY = cityBaseY - b.height;

            // Cuerpo del edificio con degradado sutil
            let bGrad = ctx.createLinearGradient(b.x, bY, b.x + b.width, bY);
            bGrad.addColorStop(0, '#101424');
            bGrad.addColorStop(0.5, '#1a2036');
            bGrad.addColorStop(1, '#0d111e');
            
            ctx.fillStyle = bGrad;
            ctx.fillRect(b.x, bY, b.width, b.height);

            // Borde superior (Azotea)
            ctx.fillStyle = '#2c3554';
            ctx.fillRect(b.x - 2, bY, b.width + 4, 4);

            // Antena con luz roja parpadeante de aviación
            if (b.antenna) {
                let antX = b.x + b.width / 2;
                ctx.strokeStyle = '#2c3554';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(antX, bY);
                ctx.lineTo(antX, bY - 20);
                ctx.stroke();

                // Luz roja parpadeante
                let beaconAlpha = (Math.sin(time * 5 + b.x) + 1) * 0.5;
                ctx.fillStyle = `rgba(255, 23, 68, ${beaconAlpha})`;
                ctx.beginPath();
                ctx.arc(antX, bY - 20, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Ventanas iluminadas
            b.windows.forEach(w => {
                if (w.lit) {
                    ctx.fillStyle = w.color;
                    ctx.shadowColor = w.color;
                    ctx.shadowBlur = 4; // Resplandor de luz suave
                    ctx.fillRect(b.x + w.x, bY + w.y, 6, 9);
                    ctx.shadowBlur = 0; // Resetear sombra
                } else {
                    ctx.fillStyle = 'rgba(10, 15, 25, 0.7)';
                    ctx.fillRect(b.x + w.x, bY + w.y, 6, 9);
                }
            });
        });

        ctx.restore();
    }

    drawGround();
}
// Torre, Vigas y Cámara
let stack = [];
let obstacles = [];
let highestObstacleWorldY = 0;
let cameraOffsetY = 0;      
let targetCameraOffsetY = 0; 

const BEAM_CHARACTERS = ['👷', '🐱', '🐶', '🦜', '🐒', '🐧', '🐻'];

// ==========================================
// 🎵 MÚSICA Y AUDIO
// ==========================================

const BG_MUSIC_URL = 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3';

let bgMusic = new Audio(BG_MUSIC_URL);
bgMusic.loop = true;
bgMusic.volume = 0.3;

let isAudioInitialized = false;
let audioCtx = null;

const STACK_PITCHES = [
    261.63, 293.66, 329.63, 392.00, 440.00,
    523.25, 587.33, 659.25, 783.99, 880.00, 1046.50
];

function initAudio() {
    if (!isAudioInitialized) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        playBgMusic();
        isAudioInitialized = true;
    }

    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playBgMusic() {
    bgMusic.volume = isSlowMotion ? 0.15 : 0.3;
    bgMusic.play().catch(err => {
        console.log("Esperando interacción del usuario.");
    });
}

function fadeOutBgMusic() {
    let fadeInterval = setInterval(() => {
        if (bgMusic.volume > 0.03) {
            bgMusic.volume -= 0.03;
        } else {
            bgMusic.pause();
            bgMusic.currentTime = 0;
            clearInterval(fadeInterval);
        }
    }, 50);
}

function playSound(type) {
    if (!audioCtx) return;
    let now = audioCtx.currentTime;

    switch (type) {
        case 'drop': {
            let osc = audioCtx.createOscillator();
            let gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.08);
            break;
        }

        case 'land': {
            // 🧱 SONIDO PARA PIEDRA / LADRILLO (Golpe seco y crujiente)
            if (currentSkin === 'stone' || currentSkin === 'brick') {
                // 1. Golpe de impacto grave (Fondo)
                let osc = audioCtx.createOscillator();
                let oscGain = audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
                oscGain.gain.setValueAtTime(0.35, now);
                oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                
                osc.connect(oscGain);
                oscGain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.1);

                // 2. Ruido crujiente de textura de roca/ladrillo
                let bufferSize = audioCtx.sampleRate * 0.08;
                let buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                let data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

                let noise = audioCtx.createBufferSource();
                noise.buffer = buffer;

                let filter = audioCtx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(800, now); // Frecuencia media para sentir la textura
                filter.Q.setValueAtTime(1.5, now);

                let noiseGain = audioCtx.createGain();
                noiseGain.gain.setValueAtTime(0.3, now);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

                noise.connect(filter);
                filter.connect(noiseGain);
                noiseGain.connect(audioCtx.destination);
                noise.start(now);
            } 
            // ⚙️ SONIDO PARA METAL (Resonancia metálica)
            else if (currentSkin === 'metal') {
                let osc1 = audioCtx.createOscillator();
                let gain1 = audioCtx.createGain();
                osc1.type = 'triangle';
                osc1.frequency.setValueAtTime(1200, now);
                osc1.frequency.exponentialRampToValueAtTime(200, now + 0.18);
                gain1.gain.setValueAtTime(0.25, now);
                gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

                let osc2 = audioCtx.createOscillator();
                let gain2 = audioCtx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(2400, now);
                gain2.gain.setValueAtTime(0.1, now);
                gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

                osc1.connect(gain1);
                gain1.connect(audioCtx.destination);
                osc2.connect(gain2);
                gain2.connect(audioCtx.destination);

                osc1.start(now);
                osc2.start(now);
                osc1.stop(now + 0.18);
                osc2.stop(now + 0.12);
            } 
            // 🎨 SONIDO CLÁSICO (Notas melódicas)
            else {
                let osc = audioCtx.createOscillator();
                let gain = audioCtx.createGain();
                let pitchIndex = Math.min(streak, STACK_PITCHES.length - 1);
                let freq = STACK_PITCHES[pitchIndex];

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);

                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

                osc.connect(gain);
                gain.connect(audioCtx.destination);

                osc.start(now);
                osc.stop(now + 0.35);
            }
            break;
        }

        case 'perfect': {
            const padNotes = [440.00, 659.25, 880.00]; 
            padNotes.forEach((freq, index) => {
                let noteTime = now + (index * 0.03);
                let osc = audioCtx.createOscillator();
                let gain = audioCtx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, noteTime);

                gain.gain.setValueAtTime(0.12, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);

                osc.connect(gain);
                gain.connect(audioCtx.destination);

                osc.start(noteTime);
                osc.stop(noteTime + 0.45);
            });
            break;
        }

        case 'hit_flyer': {
            let osc = audioCtx.createOscillator();
            let gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.2);
            break;
        }

        case 'demolish': {
            let bufferSize = audioCtx.sampleRate * 0.4;
            let buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            let data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            let noise = audioCtx.createBufferSource();
            noise.buffer = buffer;
            let gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            noise.connect(gain);
            gain.connect(audioCtx.destination);
            noise.start(now);
            break;
        }
    }
}
// ------------------------------------------
// 🎨 PALETA DE COLORES
// ------------------------------------------

const BLOCK_COLORS = [
    { fill: '#ff8a65', stroke: '#d84315' },
    { fill: '#4dd0e1', stroke: '#00838f' },
    { fill: '#ff4081', stroke: '#c2185b' },
    { fill: '#b388ff', stroke: '#651fff' },
    { fill: '#5c6bc0', stroke: '#1a237e' }
];

const CLOCK_COLOR = { fill: '#ffd700', stroke: '#ff6f00' };

function triggerShake(intensity = 6, duration = 15) {
    shakeIntensity = intensity;
    shakeTimer = duration;
}

function checkMilestones(count) {
    if (count === 10) showMilestone("¡SOBRE LOS EDIFICIOS! 🏢");
    else if (count === 25) showMilestone("¡CAPA DE NUBES! ☁️");
    else if (count === 50) showMilestone("¡ESTRATÓSFERA! 🚀");
    else if (count === 100) showMilestone("¡ESPACIO EXTERIOR! 🌌");
}

function showMilestone(text) {
    milestoneText = text;
    milestoneTimer = 120; // Se muestra por ~2 segundos
}

function getRandomBeamCharacter() {
    if (Math.random() < 0.7) {
        return BEAM_CHARACTERS[Math.floor(Math.random() * BEAM_CHARACTERS.length)];
    }
    return null;
}

function generateMoreBeamsIfNeeded() {
    let topWorldY = canvas.height - 200 - (targetCameraOffsetY + 300);
    while (highestObstacleWorldY > topWorldY) {
        highestObstacleWorldY -= (180 + Math.random() * 60);
        let side = Math.random() < 0.5 ? 'left' : 'right';
        obstacles.push({
            y: highestObstacleWorldY,
            width: 70 + Math.random() * 30,
            side: side,
            character: getRandomBeamCharacter()
        });
    }
}

function updateUI() {
    const previousBest = Number(bestScore);
    const isNewRecord = score > previousBest && score > 0;

    if (score > bestScore) {
        bestScore = score;
        bestBlocks = blockCount;
        localStorage.setItem(BEST_SCORE_STORAGE_KEY, String(bestScore));
        localStorage.setItem(BEST_BLOCKS_STORAGE_KEY, String(bestBlocks));
        recordWasBroken = true;
    }

    if (currentScoreEl) {
        currentScoreEl.textContent = score;
    }

    if (currentBlocksEl) {
        currentBlocksEl.textContent = blockCount;
    }

    if (highScoreEl) {
        highScoreEl.textContent = 'HIGHSCORE: ' + bestScore;
    }

    if (bestScoreLabelEl) {
        bestScoreLabelEl.textContent = 'BEST: ' + bestScore;
    }

    if (recordCurrentEl) {
        recordCurrentEl.textContent = bestScore + ' PTS';
    }

    if (recordPlayerEl) {
        recordPlayerEl.textContent = 'ID: ' + bestPlayer;
    }

    if (recordBlocksEl) {
        recordBlocksEl.textContent = bestBlocks + ' BLOQUES';
    }

    if (challengeScoreEl) {
        challengeScoreEl.textContent = bestScore + ' PTS';
    }

    if (challengeDetailsEl) {
        challengeDetailsEl.textContent = bestPlayer + ' · ' + bestBlocks + ' BLOQUES';
    }

    if (recordStatusEl) {
        recordStatusEl.textContent = isNewRecord ? '¡RECORD NUEVO!' : (bestScore > 0 ? 'EN VIVO' : 'Aún no hay marca');
        recordStatusEl.classList.toggle('record-live', bestScore > 0 && !isNewRecord);
        recordStatusEl.classList.toggle('record-broken', isNewRecord);
    }
}

function showGameOverModal() {
    if (!gameOverModal || !finalScoreEl || !finalBlocksEl) return;
    finalScoreEl.textContent = score;
    finalBlocksEl.textContent = blockCount;
    if (recordForm) {
        recordForm.classList.toggle('hidden', !recordWasBroken);
    }
    gameOverModal.classList.remove('hidden');

    if (recordWasBroken && playerIdInput) {
        playerIdInput.value = '';
        window.setTimeout(() => playerIdInput.focus(), 0);
    }
}

function hideGameOverModal() {
    if (!gameOverModal) return;
    gameOverModal.classList.add('hidden');
}

function initBase() {
    const GROUND_Y = canvas.height - 35;

    stack = [{
        x: (canvas.width / 2) - (CUBE_SIZE / 2),
        y: GROUND_Y - CUBE_SIZE,
        colorIndex: 1,
        isClock: false
    }];
    
    highestObstacleWorldY = canvas.height - 240;
    obstacles = [
        { y: canvas.height - 240, width: 80, side: 'right', character: getRandomBeamCharacter() },
        { y: canvas.height - 460, width: 80, side: 'left', character: getRandomBeamCharacter() }
    ];
    highestObstacleWorldY = canvas.height - 460;

    score = 0;
    blockCount = 0;
    streak = 0;
    recordWasBroken = false;
    baseSpeed = INITIAL_SPEED;
    currentSpeed = INITIAL_SPEED;
    cameraOffsetY = 0;
    targetCameraOffsetY = 0;
    currentBlockX = 10;
    currentBlockY = CRANE_Y;
    dropVy = 0;
    particles = [];
    flyingEntities = [];
    spawnFlyerTimer = 0;
    isDropping = false;
    isSlowMotion = false;
    isSpecialClockCube = false;
    isDemolishing = false;
    isGameOver = false;
    demolishingBlocks = [];
    hideGameOverModal();

    if (isAudioInitialized) {
        playBgMusic();
    }

    updateUI();
}

// ------------------------------------------
// 🦅 OBSTÁCULOS VOLADORES
// ------------------------------------------

function spawnFlyingEntity() {
    let h = stack.length;
    let icon = '🕊️';
    let penalty = 10;
    let speed = (Math.random() < 0.3) ? (4.2 + Math.random() * 2) : (1.8 + Math.random() * 1.5);

    if (h < 100) {
        let choice = [{ i: '🕊️', p: 10 }, { i: '🐤', p: 10 }, { i: '🪁', p: 15 }][Math.floor(Math.random() * 3)];
        icon = choice.i; penalty = choice.p;
    } else if (h < 300) {
        let choice = [{ i: '🦅', p: 30 }, { i: '🛸', p: 30 }, { i: '🚁', p: 35 }][Math.floor(Math.random() * 3)];
        icon = choice.i; penalty = choice.p;
    } else {
        let choice = [{ i: '🚀', p: 100 }, { i: '👾', p: 100 }][Math.floor(Math.random() * 2)];
        icon = choice.i; penalty = choice.p;
    }

    let side = Math.random() < 0.5 ? 'left' : 'right';
    let startX = side === 'left' ? -50 : canvas.width + 50;

    flyingEntities.push({
        x: startX,
        y: CRANE_Y + 40 + Math.random() * 150,
        vx: side === 'left' ? speed : -speed,
        icon: icon,
        penalty: penalty,
        size: 36,
        hit: false
    });
}

function updateAndDrawFlyingEntities() {
    spawnFlyerTimer++;
    if (spawnFlyerTimer > 400) { 
        if (Math.random() < 0.75) spawnFlyingEntity();
        spawnFlyerTimer = 0;
    }

    for (let i = flyingEntities.length - 1; i >= 0; i--) {
        let f = flyingEntities[i];
        f.x += f.vx;

        ctx.save();
        ctx.font = `${f.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (f.vx < 0) {
            ctx.translate(f.x, f.y);
            ctx.scale(-1, 1);
            ctx.fillText(f.icon, 0, 0);
        } else {
            ctx.fillText(f.icon, f.x, f.y);
        }
        ctx.restore();

        if (isDropping && !f.hit) {
            let dist = Math.hypot((currentBlockX + CUBE_SIZE / 2) - f.x, (currentBlockY + CUBE_SIZE / 2) - f.y);

            if (dist < (CUBE_SIZE / 2 + f.size / 2)) {
                f.hit = true;
                playSound('hit_flyer');
                
                score = Math.max(0, score - f.penalty);
                updateUI();

                floatingText = `💥 -${f.penalty} PTS!`;
                floatingTextColor = '#ff1744';
                floatingTextTimer = 60;
                floatingTextY = f.y - 10;

                createFeatherParticles(f.x, f.y);
                flyingEntities.splice(i, 1);
                continue;
            }
        }

        if (f.x < -70 || f.x > canvas.width + 70) flyingEntities.splice(i, 1);
    }
}

// ------------------------------------------
// ✨ PARTÍCULAS
// ------------------------------------------

function createFeatherParticles(x, y) {
    for (let i = 0; i < 12; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
            color: '#ff1744', size: Math.random() * 3 + 2, life: 20
        });
    }
}

function createPerfectParticles(x, y) {
    for (let i = 0; i < 16; i++) {
        particles.push({
            x: x + CUBE_SIZE / 2, y: y + CUBE_SIZE,
            vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
            color: '#ffea00', size: Math.random() * 4 + 2, life: 25
        });
    }
}

function updateAndDrawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        if (p.life <= 0) particles.splice(i, 1);
    }
}

// ------------------------------------------
// 🖌️ RENDERIZADO VISUAL & HUD
// ------------------------------------------

function drawBackground() {
    let skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    let heightLevel = stack.length;

    if (isSlowMotion) {
        skyGradient.addColorStop(0, '#fff59d');
        skyGradient.addColorStop(1, '#ffb74d');
    } else if (heightLevel < 100) {
        skyGradient.addColorStop(0, '#80d8ff');
        skyGradient.addColorStop(0.6, '#a7ffeb');
        skyGradient.addColorStop(1, '#ffcc80');
    } else if (heightLevel < 300) {
        skyGradient.addColorStop(0, '#3f51b5');
        skyGradient.addColorStop(0.6, '#7986cb');
        skyGradient.addColorStop(1, '#80deea');
    } else {
        skyGradient.addColorStop(0, '#03030a');
        skyGradient.addColorStop(0.7, '#08091a');
        skyGradient.addColorStop(1, '#121433');
    }
    
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (heightLevel < 300) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        clouds.forEach(cloud => {
            let drawY = cloud.y + (cameraOffsetY * 0.3);
            ctx.beginPath();
            ctx.arc(cloud.x, drawY, cloud.size, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.5, drawY - 10, cloud.size * 0.7, 0, Math.PI * 2);
            ctx.fill();

            cloud.x += cloud.speed;
            if (cloud.x - cloud.size > canvas.width) cloud.x = -cloud.size * 2;
        });
    }

    if (heightLevel < 150) {
        ctx.save();
        let cityBaseY = canvas.height - 35 + (cameraOffsetY * 0.5);

        cityBuildings.forEach(b => {
            let bY = cityBaseY - b.height;
            ctx.fillStyle = 'rgba(38, 50, 56, 0.5)';
            ctx.fillRect(b.x, bY, b.width, b.height);

            b.windows.forEach(w => {
                ctx.fillStyle = w.lit ? 'rgba(255, 235, 59, 0.7)' : 'rgba(20, 25, 30, 0.5)';
                ctx.fillRect(b.x + w.x, bY + w.y, 8, 12);
            });
        });
        ctx.restore();
    }

    drawGround();
}

function drawGround() {
    let groundY = canvas.height - 35 + cameraOffsetY;

    if (groundY < canvas.height + 50) {
        ctx.save();
        ctx.fillStyle = '#b0bec5';
        ctx.fillRect(0, groundY - 6, canvas.width, 6);

        ctx.fillStyle = '#37474f';
        ctx.fillRect(0, groundY, canvas.width, 35);

        ctx.fillStyle = '#eceff1';
        for (let x = 10; x < canvas.width; x += 40) {
            ctx.fillRect(x, groundY + 14, 20, 4);
        }
        ctx.restore();
    }
}

// 📊 MARCADOR HUD COMPLETO EN CANVAS
function drawHUD() {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.roundRect(10, 10, 170, 75, 10);
    ctx.fill();

    ctx.font = 'bold 13px Montserrat, Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score} PTS`, 20, 28);
    
    ctx.fillStyle = '#ffea00';
    ctx.fillText(`BLOQUES: ${blockCount} 🏗️`, 20, 46);

    ctx.fillStyle = '#80deea';
    ctx.fillText(`MÁXIMO: ${bestScore} PTS`, 20, 64);
    ctx.restore();

    drawSkinSelectorHUD();
}

// 🎨 SELECTOR DE SKINS DIBUJADO ABAJO A LA IZQUIERDA
function drawSkinSelectorHUD() {
    ctx.save();
    let startY = canvas.height - 50;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.roundRect(10, startY, 180, 40, 8);
    ctx.fill();

    ctx.font = 'bold 11px Montserrat, Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText('SKIN:', 20, startY + 24);

    const skins = [
        { id: 'classic', label: '🎨' },
        { id: 'stone', label: '🧱' },
        { id: 'metal', label: '⚙️' }
    ];

    skins.forEach((s, idx) => {
        let btnX = 65 + (idx * 38);
        let btnY = startY + 8;

        if (currentSkin === s.id) {
            ctx.fillStyle = '#69f0ae';
            ctx.fillRect(btnX - 2, btnY - 2, 28, 28);
        }

        ctx.fillStyle = '#37474f';
        ctx.fillRect(btnX, btnY, 24, 24);

        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.label, btnX + 12, btnY + 12);
    });

    ctx.restore();
}

function drawFloatingNotice() {
    if (floatingTextTimer > 0) {
        ctx.save();
        ctx.font = '900 20px Montserrat, Arial';
        ctx.fillStyle = floatingTextColor;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.textAlign = 'center';
        
        ctx.strokeText(floatingText, canvas.width / 2, floatingTextY);
        ctx.fillText(floatingText, canvas.width / 2, floatingTextY);
        ctx.restore();
        
        floatingTextY -= 0.5;
        floatingTextTimer--;
    }

    if (milestoneTimer > 0) {
        ctx.save();
        ctx.font = '900 18px Montserrat, Arial';
        ctx.fillStyle = '#69f0ae';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.textAlign = 'center';
        
        ctx.strokeText(milestoneText, canvas.width / 2, 140);
        ctx.fillText(milestoneText, canvas.width / 2, 140);
        ctx.restore();
        
        milestoneTimer--;
    }
}

function drawObstacles() {
    ctx.save();
    let time = Date.now() * 0.005;

    obstacles.forEach(obs => {
        let drawY = obs.y + cameraOffsetY;
        
        if (drawY > -50 && drawY < canvas.height + 50) {
            let drawX = obs.side === 'left' ? 0 : canvas.width - obs.width;
            
            ctx.fillStyle = '#37474f';
            ctx.fillRect(drawX, drawY, obs.width, 24);
            ctx.strokeStyle = '#263238';
            ctx.lineWidth = 3;
            ctx.strokeRect(drawX, drawY, obs.width, 24);

            if (obs.character) {
                let charX = obs.side === 'left' ? obs.width / 2 : canvas.width - (obs.width / 2);
                let charY = drawY - 4;

                let bounceY = Math.sin(time * 2) * 2;
                let waveAngle = Math.cos(time * 3) * 0.15;

                ctx.save();
                ctx.translate(charX, charY + bounceY);
                ctx.rotate(waveAngle);
                ctx.font = '24px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                if (obs.side === 'right') ctx.scale(-1, 1);
                ctx.fillText(obs.character, 0, 0);
                ctx.restore();
            }
        }
    });
    ctx.restore();
}

function drawCrane(x) {
    ctx.save();
    ctx.strokeStyle = '#69f0ae';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 20); ctx.lineTo(canvas.width, 20);
    ctx.moveTo(0, 30); ctx.lineTo(canvas.width, 30);
    ctx.stroke();

    ctx.fillStyle = '#1b5e20';
    ctx.fillRect(x + CUBE_SIZE / 2 - 15, 25, 30, 15);
    ctx.beginPath();
    ctx.moveTo(x + CUBE_SIZE / 2, 40);
    ctx.lineTo(x + CUBE_SIZE / 2, CRANE_Y);
    ctx.stroke();
    ctx.restore();
}

function drawStyledBlock(x, y, colorObj, isClock = false, isGlowing = false) {
    ctx.save();

    if (isClock) {
        ctx.fillStyle = CLOCK_COLOR.fill;
        ctx.beginPath(); ctx.roundRect(x, y, CUBE_SIZE, CUBE_SIZE, 8); ctx.fill();
        ctx.fillStyle = '#111'; ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('⏳', x + CUBE_SIZE / 2, y + CUBE_SIZE / 2 + 2);
        ctx.restore();
        return;
    }

    if (currentSkin === 'stone') {
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(x, y, CUBE_SIZE, CUBE_SIZE);
        ctx.strokeStyle = '#4e342e';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, CUBE_SIZE, CUBE_SIZE);

        ctx.beginPath();
        ctx.moveTo(x, y + CUBE_SIZE / 2); ctx.lineTo(x + CUBE_SIZE, y + CUBE_SIZE / 2);
        ctx.moveTo(x + CUBE_SIZE / 2, y); ctx.lineTo(x + CUBE_SIZE / 2, y + CUBE_SIZE / 2);
        ctx.moveTo(x + CUBE_SIZE / 4, y + CUBE_SIZE / 2); ctx.lineTo(x + CUBE_SIZE / 4, y + CUBE_SIZE);
        ctx.stroke();

    } else if (currentSkin === 'metal') {
        let metalGrad = ctx.createLinearGradient(x, y, x + CUBE_SIZE, y + CUBE_SIZE);
        metalGrad.addColorStop(0, '#cfd8dc');
        metalGrad.addColorStop(0.5, '#78909c');
        metalGrad.addColorStop(1, '#37474f');
        
        ctx.fillStyle = metalGrad;
        ctx.fillRect(x, y, CUBE_SIZE, CUBE_SIZE);
        ctx.strokeStyle = '#eceff1';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, CUBE_SIZE - 4, CUBE_SIZE - 4);

        ctx.fillStyle = '#263238';
        ctx.fillRect(x + 4, y + 4, 3, 3);
        ctx.fillRect(x + CUBE_SIZE - 7, y + 4, 3, 3);
        ctx.fillRect(x + 4, y + CUBE_SIZE - 7, 3, 3);
        ctx.fillRect(x + CUBE_SIZE - 7, y + CUBE_SIZE - 7, 3, 3);

    } else {
        if (isGlowing) {
            ctx.shadowColor = colorObj.fill;
            ctx.shadowBlur = 10;
        }

        ctx.fillStyle = colorObj.fill;
        ctx.beginPath();
        ctx.roundRect(x, y, CUBE_SIZE, CUBE_SIZE, 8);
        ctx.fill();

        ctx.lineWidth = 3;
        ctx.strokeStyle = colorObj.stroke;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 4, CUBE_SIZE - 8, 8, 4);
        ctx.fill();
    }

    ctx.restore();
}

// ------------------------------------------
// 💥 DEMOLICIÓN & GAME OVER
// ------------------------------------------

function startDemolition() {
    isDemolishing = true;
    playSound('demolish');
    fadeOutBgMusic();

    demolishingBlocks = stack.map(b => ({
        x: b.x, y: b.y + cameraOffsetY,
        vx: (Math.random() - 0.5) * 8, vy: -Math.random() * 5 - 2,
        angle: 0, vRot: (Math.random() - 0.5) * 0.2,
        colorIndex: b.colorIndex || 0,
        isClock: b.isClock
    }));
}

function updateDemolition() {
    let allOffScreen = true;

    demolishingBlocks.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;
        b.vy += 0.35;
        b.angle += b.vRot;

        if (b.y < canvas.height + 100) allOffScreen = false;

        ctx.save();
        ctx.translate(b.x + CUBE_SIZE / 2, b.y + CUBE_SIZE / 2);
        ctx.rotate(b.angle);
        drawStyledBlock(-CUBE_SIZE / 2, -CUBE_SIZE / 2, BLOCK_COLORS[b.colorIndex % BLOCK_COLORS.length], b.isClock);
        ctx.restore();
    });

    if (allOffScreen && demolishingBlocks.length > 0) {
        isDemolishing = false;
        isGameOver = true;
        demolishingBlocks = [];
        showGameOverModal();
    }
}

// ------------------------------------------
// ⚙️ LÓGICA DE JUEGO & INTERACCIÓN
// ------------------------------------------

function triggerDrop() {
    initAudio();
    if (isGameOver || isDropping || isDemolishing) return;
    
    isDropping = true;
    dropVy = 0;
    playSound('drop');
}

function activateSlowMotion() {
    isSlowMotion = true;
    currentSpeed = baseSpeed * 0.4;
    bgMusic.volume = 0.15;
    
    if (slowMotionTimer) clearTimeout(slowMotionTimer);
    slowMotionTimer = setTimeout(() => {
        isSlowMotion = false;
        currentSpeed = baseSpeed;
        bgMusic.volume = 0.3;
    }, 6000);
}

function updateLogic() {
    if (isGameOver || isDemolishing) return;

    cameraOffsetY += (targetCameraOffsetY - cameraOffsetY) * 0.1;

    if (!isDropping) {
        currentBlockX += currentSpeed * direction;
        if (currentBlockX <= 10) {
            currentBlockX = 10;
            direction = 1;
        } else if (currentBlockX >= canvas.width - CUBE_SIZE - 10) {
            currentBlockX = canvas.width - CUBE_SIZE - 10;
            direction = -1;
        }
    } else {
        dropVy += 0.65;
        currentBlockY += dropVy;

        let topBlock = stack[stack.length - 1];
        let targetScreenY = topBlock.y + cameraOffsetY - CUBE_SIZE;

        if (currentBlockY >= targetScreenY) {
            let diffX = Math.abs(currentBlockX - topBlock.x);

            if (diffX < CUBE_SIZE * 0.8) {
                let finalX = currentBlockX;
                let targetWorldY = topBlock.y - CUBE_SIZE;

                blockCount++;
                checkMilestones(blockCount);

                if (diffX < 5) {
                    finalX = topBlock.x;
                    streak++;
                    score += 15 + (streak * 5);
                    playSound('perfect');
                    createPerfectParticles(finalX, targetScreenY);

                    floatingText = `¡PERFECTO! x${streak}`;
                    floatingTextColor = '#ffea00';
                    floatingTextTimer = 50;
                    floatingTextY = targetScreenY - 15;
                } else {
                    streak = 0;
                    score += 10;
                    playSound('land');

                    // 💥 Temblor de torre si cae bastante desviado
                    if (diffX > CUBE_SIZE * 0.4) {
                        triggerShake(7, 18);
                    }

                    floatingText = '+10';
                    floatingTextColor = '#ffffff';
                    floatingTextTimer = 35;
                    floatingTextY = targetScreenY - 15;
                }

                if (isSpecialClockCube) {
                    activateSlowMotion();
                    isSpecialClockCube = false;
                }

                let nextColorIndex = Math.floor(Math.random() * BLOCK_COLORS.length);
                stack.push({
                    x: finalX,
                    y: targetWorldY,
                    colorIndex: nextColorIndex,
                    isClock: false
                });

                baseSpeed = Math.min(baseSpeed + 0.02, MAX_SPEED);
                currentSpeed = isSlowMotion ? baseSpeed * 0.4 : baseSpeed;

                if (Math.random() < 0.15 && !isSlowMotion) {
                    isSpecialClockCube = true;
                }

                if (stack.length > 5) {
                    targetCameraOffsetY = (stack.length - 5) * CUBE_SIZE;
                    generateMoreBeamsIfNeeded();
                }

                updateUI();

            } else {
                startDemolition();
            }

            isDropping = false;
            currentBlockY = CRANE_Y;
            dropVy = 0;
        }
    }
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    // 📳 Aplicar efecto de Temblor de Pantalla (Screen Shake)
    if (shakeTimer > 0) {
        let offsetX = (Math.random() - 0.5) * shakeIntensity;
        let offsetY = (Math.random() - 0.5) * shakeIntensity;
        ctx.translate(offsetX, offsetY);
        shakeTimer--;
    }

    drawBackground();
    drawObstacles();

    if (!isDemolishing) {
        stack.forEach((b, idx) => {
            let drawY = b.y + cameraOffsetY;
            let isTop = (idx === stack.length - 1);
            drawStyledBlock(b.x, drawY, BLOCK_COLORS[b.colorIndex % BLOCK_COLORS.length], b.isClock, isTop);
        });

        drawCrane(currentBlockX);
        let activeColor = BLOCK_COLORS[(stack.length) % BLOCK_COLORS.length];
        drawStyledBlock(currentBlockX, currentBlockY, activeColor, isSpecialClockCube, true);
    } else {
        updateDemolition();
    }

    updateAndDrawFlyingEntities();
    updateAndDrawParticles();
    drawFloatingNotice();
    
    ctx.restore(); // Restaura la transformación del temblor

    drawHUD(); // HUD estático en primer plano
}

function gameLoop() {
    updateLogic();
    drawGame();
    requestAnimationFrame(gameLoop);
}

// ------------------------------------------
// 🎮 EVENTOS
// ------------------------------------------

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (!isGameOver) triggerDrop();
    }
});

canvas.addEventListener('pointerdown', (e) => {
    if (isGameOver) return;

    let rect = canvas.getBoundingClientRect();
    let clickX = e.clientX - rect.left;
    let clickY = e.clientY - rect.top;

    let selectorY = canvas.height - 50;

    // Detectar clic en el Selector de Skins
    if (clickY >= selectorY && clickY <= selectorY + 40 && clickX <= 190) {
        if (clickX >= 65 && clickX <= 95) currentSkin = 'classic';
        else if (clickX >= 103 && clickX <= 133) currentSkin = 'stone';
        else if (clickX >= 141 && clickX <= 171) currentSkin = 'metal';
        return;
    }

    e.preventDefault();
    triggerDrop();
});

if (retryButton) {
    retryButton.addEventListener('click', () => {
        hideGameOverModal();
        initBase();
    });
}

if (saveRecordButton) {
    saveRecordButton.addEventListener('click', () => {
        const playerId = playerIdInput ? playerIdInput.value.trim().slice(0, 18) : '';
        bestPlayer = playerId || 'SIN JUGADOR';
        localStorage.setItem(BEST_PLAYER_STORAGE_KEY, bestPlayer);
        updateUI();
        if (recordForm) recordForm.classList.add('hidden');
    });
}

// Inicializar Juego
initBase();
gameLoop();