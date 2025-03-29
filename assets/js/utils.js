/**
 * Pac-Man - Portfólio Nayara Vieira
 * Utilities - Funções utilitárias para o jogo
 */

// Objeto para controle de sons
const SoundManager = {
    // Propriedades de audio
    audioContext: null,
    sounds: {},
    muted: false,
    initialized: false,
    
    // Inicializa o sistema de áudio
    init() {
        if (this.initialized) return;
        
        try {
            // Criar o contexto de áudio
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // Verificar e resolver estado suspenso do AudioContext
            if (this.audioContext.state === 'suspended') {
                // Adiciona um listener para ativar o áudio na primeira interação
                const resumeAudio = () => {
                    this.audioContext.resume().then(() => {
                        console.log('AudioContext ativado após interação!');
                    });
                    
                    // Remover os listeners após a primeira interação
                    document.removeEventListener('click', resumeAudio);
                    document.removeEventListener('keydown', resumeAudio);
                    document.removeEventListener('touchstart', resumeAudio);
                };
                
                document.addEventListener('click', resumeAudio);
                document.addEventListener('keydown', resumeAudio);
                document.addEventListener('touchstart', resumeAudio);
                
                console.log('Aguardando interação para ativar áudio...');
            }
            
            // Pré-carregar sons com verificação de caminho
            this.loadSound('eat', 'assets/audio/eat.wav');
            this.loadSound('power', 'assets/audio/power.wav');
            this.loadSound('eatGhost', 'assets/audio/eat-ghost.wav');
            this.loadSound('death', 'assets/audio/death.wav');
            
            this.initialized = true;
        } catch (e) {
            console.warn('Erro ao inicializar Web Audio API:', e);
        }
    },
    
    // Carrega um arquivo de som com tratamento de erro melhorado
    loadSound(name, url) {
        // Verificar se o caminho foi fornecido
        if (!url) {
            console.error(`Caminho não fornecido para o som "${name}"`);
            return;
        }
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro HTTP: ${response.status} ao carregar ${url}`);
                }
                return response.arrayBuffer();
            })
            .then(arrayBuffer => {
                return this.audioContext.decodeAudioData(arrayBuffer);
            })
            .then(audioBuffer => {
                this.sounds[name] = audioBuffer;
                console.log(`Som "${name}" carregado com sucesso`);
            })
            .catch(error => {
                console.error(`Erro ao carregar som "${name}":`, error);
            });
    },
    
    // Toca um som específico com verificações adicionais
    playSound(name) {
        // Verificar se o áudio está mudo
        if (this.muted) {
            return;
        }
        
        // Verificar se o áudio está inicializado
        if (!this.audioContext) {
            return;
        }
        
        // Verificar se o contexto está em execução
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // Verificar se o som existe
        if (!this.sounds[name]) {
            console.warn(`Som "${name}" não encontrado ou ainda não carregado`);
            return;
        }
        
        try {
            const source = this.audioContext.createBufferSource();
            source.buffer = this.sounds[name];
            source.connect(this.audioContext.destination);
            source.start(0);
        } catch (e) {
            console.error(`Erro ao reproduzir som "${name}":`, e);
        }
    },
    
    // Alterna o estado de mudo
    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }
};

// [Restante do seu código permanece igual]
// Classe para controlar animações com base no tempo
class AnimationTimer {
    constructor(fps = 60) {
        this.fps = fps;
        this.frameInterval = 1000 / fps;
        this.lastFrameTime = 0;
        this.accumulated = 0;
        this.frames = 0;
        this.lastFpsUpdate = 0;
        this.currentFps = 0;
    }
    
    // Atualiza o timer e retorna verdadeiro se deve renderizar um novo frame
    update(timestamp) {
        if (!this.lastFrameTime) {
            this.lastFrameTime = timestamp;
            return true;
        }
        
        // Calcular delta time
        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;
        
        // Acumular tempo passado desde o último frame
        this.accumulated += deltaTime;
        
        // Calcular FPS real a cada segundo
        this.frames++;
        if (timestamp - this.lastFpsUpdate >= 1000) {
            this.currentFps = Math.round((this.frames * 1000) / (timestamp - this.lastFpsUpdate));
            this.lastFpsUpdate = timestamp;
            this.frames = 0;
        }
        
        // Retornar true se for hora de renderizar novo frame
        if (this.accumulated >= this.frameInterval) {
            this.accumulated -= this.frameInterval;
            return true;
        }
        
        return false;
    }
    
    // Retorna o FPS atual
    getFps() {
        return this.currentFps;
    }
}

// Funções para controle de colisões
const Collision = {
    // Verifica colisão entre dois círculos
    circleCollision(x1, y1, r1, x2, y2, r2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < r1 + r2;
    },
    
    // Verifica colisão entre um círculo e um retângulo
    circleRectCollision(circleX, circleY, radius, rectX, rectY, rectWidth, rectHeight) {
        // Encontrar o ponto mais próximo do retângulo para o círculo
        const closestX = Math.max(rectX, Math.min(circleX, rectX + rectWidth));
        const closestY = Math.max(rectY, Math.min(circleY, rectY + rectHeight));
        
        // Calcular a distância entre o círculo e esse ponto
        const distanceX = circleX - closestX;
        const distanceY = circleY - closestY;
        const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
        
        return distanceSquared < (radius * radius);
    }
};

// Funções para desenhar elementos do jogo
const Drawing = {
    // Desenha um círculo
    circle(ctx, x, y, radius, color) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.closePath();
    },
    
    // Desenha o Pac-Man
    pacman(ctx, x, y, radius, angle, mouthAngle, direction) {
        ctx.save();
        ctx.translate(x, y);
        
        // Rotacionar com base na direção
        let rotation = 0;
        switch (direction) {
            case 'right': rotation = 0; break;
            case 'down': rotation = Math.PI / 2; break;
            case 'left': rotation = Math.PI; break;
            case 'up': rotation = Math.PI * 3 / 2; break;
        }
        
        ctx.rotate(rotation);
        
        // Desenhar o círculo com a "boca"
        ctx.beginPath();
        ctx.arc(0, 0, radius, angle, Math.PI * 2 - angle);
        ctx.lineTo(0, 0);
        ctx.fillStyle = '#FFFF00';
        ctx.fill();
        ctx.closePath();
        
        // Desenhar olho
        ctx.beginPath();
        ctx.arc(radius/2.5, -radius/2, radius/8, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
        ctx.closePath();
        
        ctx.restore();
    },
    
    // Desenha um fantasma
    ghost(ctx, x, y, radius, color, frightenedMode = false, blinking = false) {
        ctx.save();
        ctx.translate(x, y);
        
        // Corpo do fantasma
        ctx.beginPath();
        ctx.arc(0, -radius/5, radius, Math.PI, 0, false);
        ctx.lineTo(radius, radius/1.5);
        
        // Desenha a base dentada do fantasma
        const baseWidth = radius * 2 / 6;
        for (let i = 0; i < 3; i++) {
            ctx.lineTo(radius - (i * baseWidth), radius/1.15 * (i % 2 === 0 ? 1 : 0.65));
        }
        
        ctx.lineTo(-radius, radius/1.5);
        ctx.closePath();
        
        // Preencher com a cor apropriada
        if (frightenedMode) {
            ctx.fillStyle = blinking ? '#FFFFFF' : '#2121FF';
        } else {
            ctx.fillStyle = color;
        }
        ctx.fill();
        
        // Olhos
        const eyeRadius = radius / 3;
        const pupilRadius = radius / 8;
        
        // Olho esquerdo
        ctx.beginPath();
        ctx.arc(-radius/2, -radius/4, eyeRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        
        // Olho direito
        ctx.beginPath();
        ctx.arc(radius/2, -radius/4, eyeRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        
        // Se estiver em modo assustado, desenhar olhos diferentes
        if (frightenedMode) {
            // Modo assustado - pupilas
            ctx.beginPath();
            ctx.arc(-radius/2, -radius/4, pupilRadius * 1.5, 0, Math.PI * 2);
            ctx.arc(radius/2, -radius/4, pupilRadius * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            
            // Boca em modo assustado
            ctx.beginPath();
            ctx.moveTo(-radius/2, radius/4);
            ctx.lineTo(-radius/4, radius/8);
            ctx.lineTo(0, radius/4);
            ctx.lineTo(radius/4, radius/8);
            ctx.lineTo(radius/2, radius/4);
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            // Pupilas normais - seguem o pacman
            ctx.beginPath();
            ctx.arc(-radius/2 + radius/6, -radius/4, pupilRadius, 0, Math.PI * 2);
            ctx.arc(radius/2 + radius/6, -radius/4, pupilRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#000000';
            ctx.fill();
        }
        
        ctx.restore();
    },
    
    // Desenha uma pellet (ponto)
    pellet(ctx, x, y, radius, color) {
        this.circle(ctx, x, y, radius, color);
    },
    
    // Desenha uma power pellet (ponto de poder)
    powerPellet(ctx, x, y, radius, color, pulse = false) {
        if (pulse) {
            const pulseAmount = 1 + 0.2 * Math.sin(Date.now() / 200);
            radius *= pulseAmount;
        }
        this.circle(ctx, x, y, radius, color);
    },
    
    // Desenha uma fruta
    fruit(ctx, x, y, radius, type) {
        ctx.save();
        ctx.translate(x, y);
        
        // Desenhar diferentes frutas com base no tipo
        switch (type) {
            case 'cherry':
                // Cereja
                this.circle(ctx, -radius/3, 0, radius/1.5, '#FF0000');
                this.circle(ctx, radius/3, 0, radius/1.5, '#FF0000');
                
                // Hastes
                ctx.beginPath();
                ctx.moveTo(-radius/3, -radius/1.5);
                ctx.quadraticCurveTo(0, -radius * 1.5, radius/3, -radius/1.5);
                ctx.strokeStyle = '#007700';
                ctx.lineWidth = 2;
                ctx.stroke();
                break;
                
            case 'strawberry':
                // Corpo do morango
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fillStyle = '#FF0000';
                ctx.fill();
                
                // Sementes
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const seedX = Math.cos(angle) * radius * 0.6;
                    const seedY = Math.sin(angle) * radius * 0.6;
                    this.circle(ctx, seedX, seedY, radius / 8, '#FFFF00');
                }
                
                // Folhas
                ctx.beginPath();
                ctx.moveTo(0, -radius);
                ctx.lineTo(-radius/2, -radius * 1.3);
                ctx.lineTo(0, -radius * 1.1);
                ctx.lineTo(radius/2, -radius * 1.3);
                ctx.lineTo(0, -radius);
                ctx.fillStyle = '#00AA00';
                ctx.fill();
                break;
                
            case 'orange':
                // Corpo da laranja
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fillStyle = '#FFA500';
                ctx.fill();
                
                // Textura
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 5) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
                    ctx.strokeStyle = 'rgba(255, 150, 0, 0.5)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
                
                // Folha
                ctx.beginPath();
                ctx.ellipse(0, -radius * 1.1, radius/4, radius/2, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#00AA00';
                ctx.fill();
                break;
                
            default:
                // Fruta genérica como fallback
                this.circle(ctx, 0, 0, radius, '#FF00FF');
        }
        
        ctx.restore();
    },
    
    // Desenha uma parede
    wall(ctx, x, y, width, height, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
    },
    
    // Desenha um texto
    text(ctx, text, x, y, fontSize, color, align = 'center') {
        ctx.font = `${fontSize}px Arial, sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.fillText(text, x, y);
    }
};

// Funções de utilidade aleatória
const Random = {
    // Retorna um número aleatório entre min e max
    between(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    // Retorna um inteiro aleatório entre min e max (inclusive)
    intBetween(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // Escolhe um item aleatório de um array
    choose(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
};

// Sistema de partículas simples
class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    // Cria partículas em um local específico
    createParticles(x, y, count, color, speed, size, lifetime) {
        for (let i = 0; i < count; i++) {
            const angle = Random.between(0, Math.PI * 2);
            const particle = {
                x,
                y,
                vx: Math.cos(angle) * Random.between(0.5, 1) * speed,
                vy: Math.sin(angle) * Random.between(0.5, 1) * speed,
                size: Random.between(size * 0.5, size * 1.5),
                color,
                life: Random.between(lifetime * 0.7, lifetime * 1.3),
                maxLife: lifetime
            };
            this.particles.push(particle);
        }
    }
    
    // Atualiza todas as partículas
    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            
            // Remover partículas mortas
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    // Desenha as partículas
    draw(ctx) {
        for (const p of this.particles) {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            Drawing.circle(ctx, p.x, p.y, p.size * alpha, p.color);
        }
        ctx.globalAlpha = 1;
    }
}

// Exportar as utilidades
window.SoundManager = SoundManager;
window.AnimationTimer = AnimationTimer;
window.Collision = Collision;
window.Drawing = Drawing;
window.Random = Random;
window.ParticleSystem = ParticleSystem;