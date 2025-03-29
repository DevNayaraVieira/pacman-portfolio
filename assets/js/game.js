/**
 * Pac-Man - Portfólio Nayara Vieira
 * Game - Classe principal que controla o jogo
 * Versão: 2.0 - Sistema de níveis com dificuldade progressiva
 */

class Game {
    constructor() {
        // Canvas e contexto
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Dimensões do canvas
        this.canvas.width = 448; // 28 células x 16 pixels
        this.canvas.height = 496; // 31 células x 16 pixels
        
        // Inicializar o mapa
        this.map = new GameMap(this.canvas);
        
        // Estado do jogo
        this.state = 'start'; // start, playing, paused, gameOver, levelComplete
        this.score = 0;
        this.highScore = this.loadHighScore();
        this.level = 1;
        this.lives = 3;
        
        // Temporizadores e contadores
        this.ghostModeTimer = 0;
        this.levelStartTimer = 0;
        this.gameOverTimer = 0;
        this.levelCompleteTimer = 0;
        this.eatenGhostsCount = 0; // Contador para fantasmas comidos durante um único modo de poder
        
        // Elementos do jogo
        this.player = null;
        this.ghosts = [];
        this.fruit = null;
        
        // Sistema de partículas
        this.particles = new ParticleSystem();
        
        // Controles
        this.keys = {};
        this.touchControls = {
            active: false,
            startX: 0,
            startY: 0
        };
        
        // Timer de animação
        this.animationTimer = new AnimationTimer(60);
        this.lastTimestamp = 0;
        
        // Inicializar sons
        SoundManager.init();
        
        // Inicializar controles
        this.initializeControls();
        
        // Inicializar elementos UI
        this.initializeUI();
        
        // Inicializar o jogo
        this.initialize();
        
        // Expor o jogo globalmente (para debugging e referência)
        window.game = this;
        
        // Iniciar o loop do jogo
        this.gameLoop(0);
    }
    
    // Inicializar o jogo
    initialize() {
        // Carregar o mapa
        this.map.reset();
        this.map.loadLevel(this.level);
        
        // Ajustar posição inicial para ser um pouco mais afastada da parede
        const startPosition = {
            x: this.map.playerStartPosition.x,
            y: this.map.playerStartPosition.y + 0.1 // Ajuste pequeno para baixo
        };
        
        // Criar jogador com direção inicial definida
        this.player = new Player(
            startPosition.x,
            startPosition.y,
            this.map
        );
        
        // Garantir que o jogador comece com direção definida
        this.player.direction = 'right';
        this.player.alive = true;
        
        // Ajustar velocidade do jogador baseado no nível
        const speedMultiplier = Math.min(2, 1 + (this.level - 1) * 0.05);
        this.player.speed = this.player.baseSpeed * speedMultiplier * 1.2; // Velocidade inicial aumentada
        
        // Criar fantasmas
        this.createGhosts();
        
        // Ajustar velocidade dos fantasmas baseado no nível
        for (const ghost of this.ghosts) {
            // Aumentar velocidade em 8% por nível (até o limite de 2x)
            const ghostSpeedMultiplier = Math.min(2, 1 + (this.level - 1) * 0.08);
            ghost.baseSpeed = ghost.constructor === Blinky ? 0.09 : 0.08; // Resetar para valor base
            ghost.baseSpeed *= ghostSpeedMultiplier;
            ghost.speed = ghost.baseSpeed;
            
            // Reduzir a duração do modo assustado em 15% por nível (mínimo de 2 segundos)
            if (this.level > 1) {
                const frightenedReduction = 1 - Math.min(0.75, (this.level - 1) * 0.15);
                ghost.frightenedDuration = Math.max(2000, 7000 * frightenedReduction);
            }
            
            if (ghost.waitingInHouse) {
                // Para fantasmas dentro da casa, ajustar ligeiramente suas posições
                ghost.y += 0.1;
            }
        }
        
        // Inicializar frutas (aparece após comer certo número de pellets)
        this.fruit = null;
        this.fruitTimer = 0;
        this.fruitActive = false;
        this.fruitEaten = false;
        
        // Reiniciar contadores
        this.eatenGhostsCount = 0;
        
        // Definir estado inicial
        this.state = 'start';
        this.updateUIState();
    }
    
    // Criar fantasmas
    createGhosts() {
        this.ghosts = [];
        
        // Posições iniciais dos fantasmas
        const ghostPositions = this.map.ghostStartPositions;
        
        // Blinky (vermelho) - começa fora da casa
        const blinky = new Blinky(
            ghostPositions[0].x,
            ghostPositions[0].y,
            this.map,
            this.player
        );
        
        // Pinky (rosa)
        const pinky = new Pinky(
            ghostPositions[1].x,
            ghostPositions[1].y,
            this.map,
            this.player
        );
        
        // Inky (ciano) - precisa de referência para o Blinky
        const inky = new Inky(
            ghostPositions[2].x,
            ghostPositions[2].y,
            this.map,
            this.player,
            blinky
        );
        
        // Clyde (laranja)
        const clyde = new Clyde(
            ghostPositions[3].x,
            ghostPositions[3].y,
            this.map,
            this.player
        );
        
        // Adicionar todos os fantasmas ao array
        this.ghosts.push(blinky, pinky, inky, clyde);
    }
    
    // Inicializar controles do jogo
    initializeControls() {
        // Controles de teclado
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            // IMPORTANTE: Prevenir comportamento padrão para teclas de seta
            if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
            
            // Processar teclas de seta (apenas se estivermos em modo de jogo)
            if (this.state === 'playing' || this.state === 'start') {
                switch (e.key) {
                    case 'ArrowUp':
                        if (this.player) this.player.setDirection('up');
                        break;
                    case 'ArrowDown':
                        if (this.player) this.player.setDirection('down');
                        break;
                    case 'ArrowLeft':
                        if (this.player) this.player.setDirection('left');
                        break;
                    case 'ArrowRight':
                        if (this.player) this.player.setDirection('right');
                        break;
                    case 'Escape':
                    case 'p':
                    case 'P':
                        this.togglePause();
                        break;
                }
            }
            
            // Iniciar jogo com qualquer tecla
            if (this.state === 'start') {
                this.startGame();
            }
            
            // Reiniciar jogo após game over
            if (this.state === 'gameOver' && this.gameOverTimer <= 0) {
                this.resetGame();
            }
            
            // Próximo nível após completar o nível
            if (this.state === 'levelComplete' && this.levelCompleteTimer <= 0) {
                this.nextLevel();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Botões de controle mobile - com verificação de estado e prevenção de comportamento padrão
        document.getElementById('upBtn').addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevenir comportamento padrão (rolagem, etc)
            if (this.player && (this.state === 'playing' || this.state === 'start')) {
                this.player.setDirection('up');
            }
            
            // Iniciar jogo se estiver na tela inicial
            if (this.state === 'start') {
                this.startGame();
            }
        });
        
        document.getElementById('downBtn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.player && (this.state === 'playing' || this.state === 'start')) {
                this.player.setDirection('down');
            }
            
            // Iniciar jogo se estiver na tela inicial
            if (this.state === 'start') {
                this.startGame();
            }
        });
        
        document.getElementById('leftBtn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.player && (this.state === 'playing' || this.state === 'start')) {
                this.player.setDirection('left');
            }
            
            // Iniciar jogo se estiver na tela inicial
            if (this.state === 'start') {
                this.startGame();
            }
        });
        
        document.getElementById('rightBtn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.player && (this.state === 'playing' || this.state === 'start')) {
                this.player.setDirection('right');
            }
            
            // Iniciar jogo se estiver na tela inicial
            if (this.state === 'start') {
                this.startGame();
            }
        });
        
        // Botões da interface
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('resumeBtn').addEventListener('click', () => {
            this.resumeGame();
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.resetGame();
        });
        
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.resetGame();
        });
        
        document.getElementById('nextLevelBtn').addEventListener('click', () => {
            this.nextLevel();
        });
        
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('muteBtn').addEventListener('click', () => {
            this.toggleMute();
        });
        
        // Adicionar tecla de emergência R para reiniciar o jogo
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'r') {
                this.resetGame();
            }
        });
        
        // Detectar dispositivo mobile para mostrar controles
        this.checkMobileDevice();
        
        // Redimensionar quando a janela mudar de tamanho
        window.addEventListener('resize', () => {
            this.checkMobileDevice();
        });
    }
    
    // Verificar se é dispositivo mobile e mostrar controles
    checkMobileDevice() {
        const isMobile = window.innerWidth <= 768;
        const mobileControls = document.querySelector('.mobile-controls');
        
        if (mobileControls) {
            if (isMobile) {
                mobileControls.style.display = 'flex';
            } else {
                mobileControls.style.display = 'none';
            }
        }
    }
    
    // Inicializar elementos da interface
    initializeUI() {
        this.scoreElement = document.getElementById('score');
        this.livesElement = document.getElementById('lives');
        this.levelElement = document.getElementById('level');
        this.finalScoreElement = document.getElementById('finalScore');
        this.levelScoreElement = document.getElementById('levelScore');
        
        this.startScreen = document.getElementById('startScreen');
        this.pauseScreen = document.getElementById('pauseScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.levelCompleteScreen = document.getElementById('levelCompleteScreen');
        
        this.muteBtn = document.getElementById('muteBtn');
        
        // Adicionar estilo para animação de pulse
        if (!document.getElementById('game-animations')) {
            const style = document.createElement('style');
            style.id = 'game-animations';
            style.innerHTML = `
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.3); color: #FFFF00; }
                    100% { transform: scale(1); }
                }
                
                .level-message {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: #FFFF00;
                    font-size: 40px;
                    font-weight: bold;
                    text-shadow: 2px 2px 4px #000000;
                    z-index: 1000;
                    text-align: center;
                    animation: pulse 0.5s ease-in-out infinite alternate;
                    pointer-events: none;
                }
                
                .level-info {
                    font-size: 24px;
                    margin-top: 10px;
                    color: #FFFFFF;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Atualizar a interface inicialmente
        this.updateUIState();
        this.updateScore(0);
        this.updateLives(3);
        this.updateLevel(1);
    }
    
    // Atualizar estado visual da interface
    updateUIState() {
        // Esconder todas as telas primeiro
        this.startScreen.classList.add('d-none');
        this.pauseScreen.classList.add('d-none');
        this.gameOverScreen.classList.add('d-none');
        this.levelCompleteScreen.classList.add('d-none');
        
        // Mostrar a tela apropriada com base no estado do jogo
        switch (this.state) {
            case 'start':
                this.startScreen.classList.remove('d-none');
                break;
            case 'paused':
                this.pauseScreen.classList.remove('d-none');
                break;
            case 'gameOver':
                this.finalScoreElement.textContent = this.score;
                this.gameOverScreen.classList.remove('d-none');
                break;
            case 'levelComplete':
                this.levelScoreElement.textContent = this.score;
                this.levelCompleteScreen.classList.remove('d-none');
                break;
        }
    }
    
    // Atualizar exibição da pontuação
    updateScore(newScore) {
        this.score = newScore;
        this.scoreElement.textContent = this.score;
        
        // Atualizar high score se necessário
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }
    }
    
    // Atualizar exibição das vidas
    updateLives(lives) {
        this.lives = lives;
        
        // Atualizar ícones de vidas
        this.livesElement.innerHTML = '';
        for (let i = 0; i < this.lives; i++) {
            const heart = document.createElement('i');
            heart.className = 'fas fa-heart';
            this.livesElement.appendChild(heart);
        }
    }
    
    // Atualizar exibição do nível
    updateLevel(level) {
        this.level = level;
        this.levelElement.textContent = this.level;
        
        // Destacar visualmente a mudança de nível
        if (level > 1) {
            this.levelElement.style.animation = 'pulse 0.5s ease-in-out 3';
            setTimeout(() => {
                this.levelElement.style.animation = '';
            }, 1500);
        }
    }
    
    // Carregar high score do armazenamento local
    loadHighScore() {
        const savedScore = localStorage.getItem('pacman-highscore');
        return savedScore ? parseInt(savedScore) : 0;
    }
    
    // Salvar high score no armazenamento local
    saveHighScore() {
        localStorage.setItem('pacman-highscore', this.highScore.toString());
    }
    
    // Iniciar o jogo
    startGame() {
        if (this.state !== 'start') return;
        
        this.state = 'playing';
        this.updateUIState();
        
        // Pequeno atraso antes de começar a jogar
        this.levelStartTimer = 500; // Reduzido para 500ms para começar mais rápido
    }
    
    // Pausar/despausar o jogo
    togglePause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            document.getElementById('pauseBtn').classList.add('active');
            document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-play"></i> Continuar';
        } else if (this.state === 'paused') {
            this.state = 'playing';
            document.getElementById('pauseBtn').classList.remove('active');
            document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-pause"></i> Pausar';
        }
        
        this.updateUIState();
    }
    toggleMute() {
        const muted = SoundManager.toggleMute();
        
        // Atualizar ícone e classe do botão
        if (muted) {
            this.muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i> Som';
            this.muteBtn.classList.add('muted');
        } else {
            this.muteBtn.innerHTML = '<i class="fas fa-volume-up"></i> Som';
            this.muteBtn.classList.remove('muted');
        }
    }
    
    // Continuar jogo após pausa
    resumeGame() {
        if (this.state !== 'paused') return;
        
        this.state = 'playing';
        this.updateUIState();
    }
    
    // Reiniciar jogo após game over
    resetGame() {
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        
        this.updateScore(0);
        this.updateLives(3);
        this.updateLevel(1);
        
        this.initialize();
        this.state = 'start';
        this.updateUIState();
    }
    
    // Avançar para o próximo nível
    nextLevel() {
        this.level++;
        this.updateLevel(this.level);
        
        // Manter a pontuação atual
        this.updateScore(this.score);
        
        // Reiniciar o mapa, jogador e fantasmas para o novo nível
        this.map.loadLevel(this.level);
        
        // Mostrar mensagem de nível com informações de dificuldade
        const levelMessage = document.createElement('div');
        levelMessage.className = 'level-message';
        levelMessage.innerHTML = `Nível ${this.level}`;
        
        // Adicionar informações de dificuldade com base no nível
        if (this.level >= 3) {
            const levelInfo = document.createElement('div');
            levelInfo.className = 'level-info';
            levelInfo.textContent = this.level >= 5 ? 'Dificuldade: Difícil' : 'Dificuldade: Média';
            levelMessage.appendChild(levelInfo);
        }
        
        document.body.appendChild(levelMessage);
        
        // Redefinir posições
        this.player.reset(this.map.playerStartPosition.x, this.map.playerStartPosition.y);
        
        // Aumentar velocidade do jogador em 5% por nível (até o limite de 2x)
        const playerSpeedMultiplier = Math.min(2, 1 + (this.level - 1) * 0.05);
        this.player.speed = this.player.baseSpeed * playerSpeedMultiplier * 1.2;
        
        // Resetar e ajustar fantasmas para o novo nível
        for (const ghost of this.ghosts) {
            ghost.reset();
            
            // Aumentar velocidade em 8% por nível (até o limite de 2x)
            const ghostSpeedMultiplier = Math.min(2, 1 + (this.level - 1) * 0.08);
            ghost.baseSpeed = ghost.constructor === Blinky ? 0.09 : 0.08; // Resetar para valor base
            ghost.baseSpeed *= ghostSpeedMultiplier;
            ghost.speed = ghost.baseSpeed;
            
            // Reduzir a duração do modo assustado em 15% por nível (mínimo de 2 segundos)
            if (this.level > 1) {
                const frightenedReduction = 1 - Math.min(0.75, (this.level - 1) * 0.15);
                ghost.frightenedDuration = Math.max(2000, 7000 * frightenedReduction);
            }
        }
        
        // Reiniciar frutas
        this.fruit = null;
        this.fruitTimer = 0;
        this.fruitActive = false;
        this.fruitEaten = false;
        
        // Criar efeito de celebração para o próximo nível
        const celebrationInterval = setInterval(() => {
            // Criar partículas coloridas por todo o labirinto
            for (let i = 0; i < 3; i++) {
                const x = Math.random() * this.canvas.width;
                const y = Math.random() * this.canvas.height;
                const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                this.particles.createParticles(x, y, 5, color, 2, 3, 60);
            }
        }, 100);
        
        // Remover a mensagem e parar o efeito após 2 segundos
        setTimeout(() => {
            document.body.removeChild(levelMessage);
            clearInterval(celebrationInterval);
            
            // Voltar para o estado de jogo com um pequeno atraso
            this.state = 'playing';
            this.levelStartTimer = 1500; // 1.5 segundos para começar
            this.updateUIState();
        }, 2000);
    }
    
    // Alternar som ligado/desligado
    toggleMute() {
        const muted = SoundManager.toggleMute();
        
        // Atualizar ícone do botão
        if (muted) {
            this.muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i> Som';
        } else {
            this.muteBtn.innerHTML = '<i class="fas fa-volume-up"></i> Som';
        }
    }
    
    // Game loop principal
    gameLoop(timestamp) {
        // Calcular delta time com limite para evitar saltos grandes
        let deltaTime = timestamp - this.lastTimestamp;
        
        // Limitar deltaTime para evitar saltos grandes após uma perda de foco
        if (deltaTime > 60) deltaTime = 60;
        
        this.lastTimestamp = timestamp;
        
        // Verificar se deve renderizar um novo frame
        if (this.animationTimer.update(timestamp)) {
            // Limpar o canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Atualizar e renderizar com base no estado atual do jogo
            switch (this.state) {
                case 'playing':
                    this.updatePlaying(deltaTime);
                    break;
                    
                case 'paused':
                    this.renderGame(); // Apenas renderizar, sem atualizar
                    break;
                    
                case 'start':
                    this.updateStart(deltaTime);
                    break;
                    
                case 'gameOver':
                    this.updateGameOver(deltaTime);
                    break;
                    
                case 'levelComplete':
                    this.updateLevelComplete(deltaTime);
                    break;
            }
        }
        
        // Continuar o loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    // Atualizar estado inicial
    updateStart(deltaTime) {
        // Desenhar o mapa e os personagens em suas posições iniciais
        this.map.draw();
        
        // Verificar e processar teclas pressionadas mesmo na tela inicial
        if (this.player && this.keys) {
            if (this.keys['ArrowUp']) this.player.setDirection('up');
            if (this.keys['ArrowDown']) this.player.setDirection('down');
            if (this.keys['ArrowLeft']) this.player.setDirection('left');
            if (this.keys['ArrowRight']) this.player.setDirection('right');
            
            // Atualizar o jogador para que ele responda aos controles
            this.player.update(deltaTime);
        }
        
        // Garantir que o jogador existe antes de desenhar
        if (this.player) {
            this.player.draw(this.ctx);
        }
        
        // Desenhar fantasmas
        for (const ghost of this.ghosts) {
            if (ghost) {
                ghost.draw(this.ctx);
            }
        }
        
        // Animação de título ou introdução
        this.renderStartScreen(deltaTime);
    }
    
    // Atualizar jogo durante o jogo ativo
    updatePlaying(deltaTime) {
        // Se o timer de início de nível estiver ativo, aguardar
        if (this.levelStartTimer > 0) {
            this.levelStartTimer -= deltaTime;
            
            // Mesmo durante o timer, processar comandos de direção para prepará-los
            if (this.player && this.keys) {
                if (this.keys['ArrowUp']) this.player.setDirection('up');
                if (this.keys['ArrowDown']) this.player.setDirection('down');
                if (this.keys['ArrowLeft']) this.player.setDirection('left');
                if (this.keys['ArrowRight']) this.player.setDirection('right');
                
                // Atualizar o jogador mesmo durante o timer
                this.player.update(deltaTime);
            }
            
            // Renderizar tudo sem atualizar o resto da lógica
            this.renderGame();
            
            // Desenhar mensagem "Ready!"
            this.ctx.font = '20px Arial';
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Ready!', this.canvas.width / 2, this.canvas.height / 2);
            
            return;
        }
        
        // Garantir que o jogador existe e está vivo antes de atualizar
        if (this.player && this.player.alive) {
            // Atualizar jogador
            this.player.update(deltaTime);
            
            // Verificar se coletou pellets
            const pellet = this.player.checkPellets();
            if (pellet) {
                // Atualizar pontuação
                this.updateScore(this.score + pellet.points);
                
                // Se for um power pellet, assustar os fantasmas
                if (pellet.type === 'powerPellet') {
                    this.activateGhostFrightenedMode();
                }
                
                // Verificar se todos os pellets foram coletados
                if (this.map.areAllPelletsEaten()) {
                    this.levelComplete();
                    return;
                }
                
                // Verificar se deve mostrar a fruta
                this.checkFruitSpawn();
            }
        }
        
        // Atualizar fantasmas
        for (const ghost of this.ghosts) {
            if (ghost) {
                ghost.update(deltaTime);
                
                // Verificar colisão com o jogador
                if (this.player && this.player.alive && this.player.checkGhostCollision(ghost)) {
                    const points = this.player.collideWithGhost(ghost);
                    
                    if (points > 0) {
                        // Jogador comeu um fantasma
                        this.eatenGhostsCount++;
                        this.updateScore(this.score + points);
                        
                        // Exibir pontuação flutuante
                        this.showFloatingScore(ghost.x, ghost.y, points);
                    }
                }
            }
        }
        
        // Verificar se o jogador morreu
        if (this.player && !this.player.alive) {
            this.handlePlayerDeath();
            return;
        }
        
        // Atualizar fruta
        this.updateFruit(deltaTime);
        
        // Renderizar tudo
        this.renderGame();
    }
    
    // Ativar modo assustado nos fantasmas
    activateGhostFrightenedMode() {
        this.eatenGhostsCount = 0; // Resetar contador de fantasmas comidos
        
        for (const ghost of this.ghosts) {
            if (ghost) {
                ghost.startFrightened();
                
                // Reduzir a duração do modo assustado em níveis mais altos
                if (this.level > 1) {
                    const frightenedReduction = 1 - Math.min(0.75, (this.level - 1) * 0.15);
                    ghost.frightenedTimer = Math.max(2000, ghost.frightenedDuration * frightenedReduction);
                }
            }
        }
    }
    
    // Tratar morte do jogador
    handlePlayerDeath() {
        // Diminuir vidas
        this.updateLives(this.player.lives);
        
        // Verificar game over
        if (this.player.lives <= 0) {
            this.gameOver();
            return;
        }
        
        // Aguardar um tempo antes de reiniciar a rodada
        setTimeout(() => {
            // Reiniciar posições
            this.player.reset(this.map.playerStartPosition.x, this.map.playerStartPosition.y);
            
            for (const ghost of this.ghosts) {
                if (ghost) {
                    ghost.reset();
                }
            }
            
            // Reiniciar frutas
            this.fruit = null;
            this.fruitTimer = 0;
            this.fruitActive = false;
            
            // Pequeno atraso antes de começar
            this.levelStartTimer = 500; // Reduzido para 500ms
        }, 1000);
    }
    
    // Avançar para o próximo nível (todos os pellets coletados)
    levelComplete() {
        this.state = 'levelComplete';
        this.levelCompleteTimer = 2000;
        this.updateUIState();
        
        // Bônus por completar o nível (crescente com o nível)
        const levelBonus = 1000 * this.level;
        this.updateScore(this.score + levelBonus);
        
        // Mostrar pontuação de bônus
        this.showFloatingScore(
            this.player.x,
            this.player.y,
            levelBonus,
            '#FFFFFF',
            `Bônus Nível ${this.level}!`
        );
        
        // Criar efeito visual celebrativo para o próximo nível
        const celebrationInterval = setInterval(() => {
            // Criar partículas coloridas por todo o labirinto
            for (let i = 0; i < 3; i++) {
                const x = Math.random() * this.canvas.width;
                const y = Math.random() * this.canvas.height;
                const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                this.particles.createParticles(x, y, 5, color, 2, 3, 60);
            }
        }, 100);
        
        // Parar o efeito após 2 segundos
        setTimeout(() => {
            clearInterval(celebrationInterval);
        }, 2000);
    }
    
    // Game over (sem mais vidas)
    gameOver() {
        this.state = 'gameOver';
        this.gameOverTimer = 2000;
        this.updateUIState();
    }
    
    // Atualizar tela de game over
    updateGameOver(deltaTime) {
        // Desenhar o estado atual do jogo
        this.renderGame();
        
        // Atualizar timer
        if (this.gameOverTimer > 0) {
            this.gameOverTimer -= deltaTime;
        }
    }
    
    // Atualizar tela de nível completo
    updateLevelComplete(deltaTime) {
        // Desenhar o estado atual do jogo
        this.renderGame();
        
        // Criar algumas partículas de celebração
        if (Math.random() < 0.1) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const color = '#' + Math.floor(Math.random() * 16777215).toString(16);
            
            this.particles.createParticles(x, y, 5, color, 2, 3, 60);
        }
        
        // Desenhar partículas
        this.particles.update();
        this.particles.draw(this.ctx);
        
        // Atualizar timer
        if (this.levelCompleteTimer > 0) {
            this.levelCompleteTimer -= deltaTime;
        }
    }
    
    // Verificar se deve gerar uma fruta
    checkFruitSpawn() {
        // Frutas aparecem após comer certo número de pellets
        const pelletsEaten = this.map.pelletsEaten;
        const totalPellets = this.map.pelletsTotal;
        
        // Primeira fruta a 1/3 do nível, segunda a 2/3
        if (!this.fruitEaten && !this.fruitActive && 
            (pelletsEaten === Math.floor(totalPellets / 3) || 
             pelletsEaten === Math.floor(totalPellets * 2 / 3))) {
            this.spawnFruit();
        }
    }
    
    // Gerar uma fruta no mapa
    spawnFruit() {
        // Definir tipo de fruta com base no nível
        let fruitType;
        if (this.level <= 2) {
            fruitType = 'cherry';
        } else if (this.level <= 4) {
            fruitType = 'strawberry';
        } else {
            fruitType = 'orange';
        }
        
        // Posição central do mapa
        const x = 13.5;
        const y = 17;
        
        // Pontuação aumenta com o nível
        const basePoints = this.getFruitPoints(fruitType);
        const levelBonus = Math.floor(basePoints * (1 + (this.level - 1) * 0.2));
        
        // Criar fruta
        this.fruit = {
            x,
            y,
            type: fruitType,
            points: levelBonus,
            radius: 0.6,
            active: true
        };
        
        // Ativar timers (diminui com o nível para aumentar dificuldade)
        this.fruitActive = true;
        this.fruitTimer = Math.max(5000, 10000 - (this.level - 1) * 1000); // Reduz 1 segundo por nível até o mínimo de 5s
    }
    
    // Obter pontuação da fruta com base no tipo
    getFruitPoints(type) {
        switch (type) {
            case 'cherry': return 100;
            case 'strawberry': return 300;
            case 'orange': return 500;
            default: return 100;
        }
    }
    
    // Atualizar estado da fruta
    updateFruit(deltaTime) {
        if (!this.fruitActive || !this.fruit || !this.player) return;
        
        // Verificar colisão com o jogador
        const distance = Math.sqrt(
            Math.pow(this.player.x - this.fruit.x, 2) + 
            Math.pow(this.player.y - this.fruit.y, 2)
        );
        
        if (distance < this.player.radius + this.fruit.radius) {
            // Jogador pegou a fruta
            this.fruitEaten = true;
            this.fruitActive = false;
            
            // Adicionar pontuação
            this.updateScore(this.score + this.fruit.points);
            
            // Mostrar pontuação
            this.showFloatingScore(
                this.fruit.x,
                this.fruit.y,
                this.fruit.points
            );
            
            // Efeito sonoro
            SoundManager.playSound('eat');
            
            // Partículas
            this.particles.createParticles(
                this.fruit.x * this.map.cellSize,
                this.fruit.y * this.map.cellSize,
                20,
                this.getFruitColor(this.fruit.type),
                2,
                4,
                40
            );
            
            this.fruit = null;
            return;
        }
        
        // Atualizar timer
        this.fruitTimer -= deltaTime;
        
        // Remover a fruta se o timer expirar
        if (this.fruitTimer <= 0) {
            this.fruitActive = false;
            this.fruit = null;
        }
    }
    
    // Obter cor da fruta para partículas
    getFruitColor(type) {
        switch (type) {
            case 'cherry': return '#FF0000';
            case 'strawberry': return '#FF0055';
            case 'orange': return '#FFA500';
            default: return '#FF00FF';
        }
    }
    
    // Mostrar pontuação flutuante
    showFloatingScore(x, y, points, color = '#FFFFFF', prefix = '') {
        // Criar elemento de texto
        const scoreText = document.createElement('div');
        scoreText.className = 'floating-score';
        scoreText.textContent = prefix + points;
        scoreText.style.position = 'absolute';
        scoreText.style.left = (x * this.map.cellSize) + 'px';
        scoreText.style.top = (y * this.map.cellSize - 20) + 'px';
        scoreText.style.color = color;
        scoreText.style.fontWeight = 'bold';
        scoreText.style.textShadow = '1px 1px 2px black';
        scoreText.style.zIndex = '1000';
        
        // Adicionar à página
        document.body.appendChild(scoreText);
        
        // Animar e remover
        setTimeout(() => {
            scoreText.style.transition = 'all 0.5s ease-out';
            scoreText.style.opacity = '0';
            scoreText.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                document.body.removeChild(scoreText);
            }, 500);
        }, 10);
    }
    
    // Renderizar o jogo (mapa, jogador, fantasmas)
    renderGame() {
        // Desenhar o mapa
        this.map.draw();
        
        // Desenhar fruta se estiver ativa
        if (this.fruitActive && this.fruit) {
            Drawing.fruit(
                this.ctx,
                this.fruit.x * this.map.cellSize,
                this.fruit.y * this.map.cellSize,
                this.fruit.radius * this.map.cellSize,
                this.fruit.type
            );
        }
        
        // Desenhar jogador
        if (this.player) {
            this.player.draw(this.ctx);
        }
        
        // Desenhar fantasmas
        for (const ghost of this.ghosts) {
            if (ghost) {
                ghost.draw(this.ctx);
            }
        }
        
        // Mostrar nível atual no canto superior direito
        if (this.level > 1) {
            this.ctx.font = '16px Arial';
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`Nível: ${this.level}`, this.canvas.width - 10, 20);
        }
    }
    
    // Renderizar tela inicial
    renderStartScreen(deltaTime) {
        // Animação para a tela inicial (opcional)
        const pulseAmount = 1 + 0.1 * Math.sin(Date.now() / 200);
        
        // Desenhar "PAC-MAN" no centro
        this.ctx.font = '30px Arial';
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAC-MAN', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        // Desenhar um Pac-Man animado
        const pacmanX = this.canvas.width / 2;
        const pacmanY = this.canvas.height / 2;
        const pacmanRadius = 20 * pulseAmount;
        const mouthAngle = 0.2 + 0.1 * Math.sin(Date.now() / 100);
        
        Drawing.pacman(
            this.ctx,
            pacmanX,
            pacmanY,
            pacmanRadius,
            mouthAngle,
            mouthAngle,
            'right'
        );
        
        // Desenhar mensagem de instrução
        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('Pressione qualquer tecla para iniciar', this.canvas.width / 2, this.canvas.height / 2 + 50);
        
        // Desenhar controles
        this.ctx.font = '14px Arial';
        this.ctx.fillText('Use as setas para mover', this.canvas.width / 2, this.canvas.height / 2 + 80);
    }
}

// Inicializar o jogo quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    // Preloader
    const preloader = document.querySelector('.preloader');
    
    // Ocultar preloader após o carregamento
    window.addEventListener('load', () => {
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
                
                // Iniciar o jogo após ocultar o preloader
                const game = new Game();
            }, 500);
        }, 1000);
    });
});