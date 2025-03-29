/**
 * Pac-Man - Portfólio Nayara Vieira
 * Player - Classe que controla o jogador (Pac-Man)
 */

class Player {
    constructor(x, y, map) {
        // Propriedades de posição e movimento
        this.x = x;
        this.y = y;
        this.map = map;
        this.radius = 0.4; // Raio do Pac-Man em unidades do mapa
        this.speed = 0.1; // Velocidade do movimento
        this.baseSpeed = 0.1; // Velocidade base para referência
        
        // Propriedades de direção - Iniciar com RIGHT para que o Pac-Man comece a se mover
        this.direction = 'right'; // Direção atual (up, down, left, right)
        this.nextDirection = null; // Próxima direção solicitada
        
        // Propriedades de animação
        this.animationTimer = 0;
        this.mouthAngle = 0.2; // Ângulo da boca em radianos
        this.mouthOpen = true; // Estado da boca (aberta ou fechada)
        this.mouthSpeed = 0.02; // Velocidade de abertura/fechamento da boca
        
        // Estado do jogador
        this.alive = true;
        this.powerMode = false;
        this.powerModeTimer = 0;
        this.powerModeDuration = 7000; // 7 segundos de poder
        this.powerModeEndWarning = false; // Aviso de fim do modo poder
        this.score = 0;
        this.lives = 3;
        
        // Partículas
        this.particles = new ParticleSystem();
        
        // Sons
        this.lastSound = 0;
        
        // Flag para controlar movimento inicial
        this.hasMovedOnce = false;
    }
    
    // Desenhar o Pac-Man
    draw(ctx) {
        // Animação da boca
        this.animationTimer += 1;
        if (this.animationTimer >= 5) {
            this.animationTimer = 0;
            this.mouthOpen = !this.mouthOpen;
        }
        
        // Definir ângulo da boca
        const mouthAngle = this.mouthOpen ? this.mouthAngle : 0.02;
        
        // Desenhar o Pac-Man com a boca na direção correta
        Drawing.pacman(
            ctx,
            this.x * this.map.cellSize,
            this.y * this.map.cellSize,
            this.radius * this.map.cellSize,
            mouthAngle,
            mouthAngle,
            this.direction || 'right' // Usar 'right' como fallback se direction for null
        );
        
        // Desenhar partículas
        this.particles.draw(ctx);
    }
    
    // Atualizar a posição e estado do Pac-Man
    update(deltaTime) {
        // Atualizar partículas
        this.particles.update();
        
        // Se estiver morto, não atualizar posição
        if (!this.alive) return;
        
        // Atualizar temporizador do modo poder
        if (this.powerMode) {
            this.powerModeTimer -= deltaTime;
            
            // Verificar se o modo poder está prestes a terminar (2 segundos)
            this.powerModeEndWarning = this.powerModeTimer <= 2000;
            
            // Verificar se o modo poder acabou
            if (this.powerModeTimer <= 0) {
                this.powerMode = false;
                this.powerModeEndWarning = false;
                this.speed = this.baseSpeed;
            }
        }
        
        // Verificar se a próxima direção é válida
        if (this.nextDirection !== null) {
            if (this.canMove(this.nextDirection)) {
                this.direction = this.nextDirection;
                this.nextDirection = null;
                this.hasMovedOnce = true; // Marcando que já se moveu pelo menos uma vez
            }
        }
        
        // Mover na direção atual se possível
        if (this.direction !== null && this.canMove(this.direction)) {
            // Calcular as novas coordenadas com base na direção
            let newX = this.x;
            let newY = this.y;
            
            switch (this.direction) {
                case 'up':
                    newY -= this.speed;
                    break;
                case 'down':
                    newY += this.speed;
                    break;
                case 'left':
                    newX -= this.speed;
                    break;
                case 'right':
                    newX += this.speed;
                    break;
            }
            
            // Verificar portais (túneis) nas bordas do mapa
            if (newX < 0) {
                newX = this.map.width - 1;
            } else if (newX >= this.map.width) {
                newX = 0;
            }
            
            // Usar um raio constante para verificação de colisão
            // Usar um valor fixo é mais consistente do que depender do hasMovedOnce
            const collisionRadius = this.radius * 0.75;
            
            // Atualizar posição se for válida
            if (this.map.isValidPosition(newX, newY, collisionRadius)) {
                this.x = newX;
                this.y = newY;
                this.hasMovedOnce = true; // Marcando que já se moveu pelo menos uma vez
            } else {
                // Se não puder mover na direção exata, tentar ajustar a posição para evitar ficar preso
                // Ajuste para alinhamento com o centro da célula
                const currentCellX = Math.floor(this.x);
                const currentCellY = Math.floor(this.y);
                
                // Verificar se deve alinhar horizontalmente ou verticalmente com base na direção
                if (this.direction === 'up' || this.direction === 'down') {
                    // Tentativa de centralizar horizontalmente
                    const targetX = currentCellX + 0.5;
                    const adjustment = (targetX - this.x) * 0.5; // Ajuste gradual para o centro
                    
                    // Aplicar ajuste suave se estiver próximo do centro
                    if (Math.abs(adjustment) < this.speed * 0.5) {
                        newX = this.x + adjustment;
                        if (this.map.isValidPosition(newX, this.y, collisionRadius)) {
                            this.x = newX;
                        }
                    }
                } else {
                    // Tentativa de centralizar verticalmente
                    const targetY = currentCellY + 0.5;
                    const adjustment = (targetY - this.y) * 0.5; // Ajuste gradual para o centro
                    
                    // Aplicar ajuste suave se estiver próximo do centro
                    if (Math.abs(adjustment) < this.speed * 0.5) {
                        newY = this.y + adjustment;
                        if (this.map.isValidPosition(this.x, newY, collisionRadius)) {
                            this.y = newY;
                        }
                    }
                }
            }
        }
    }
    
    // Verificar se é possível mover em uma direção
    canMove(direction) {
        // Usar um raio de verificação consistente
        const checkRadius = this.radius * 0.7; // Raio de verificação consistente
        
        // Calcular as novas coordenadas com base na direção
        let newX = this.x;
        let newY = this.y;
        let checkDistance = this.radius * 0.9; // Distância consistente para verificação
        
        switch (direction) {
            case 'up':
                newY -= checkDistance;
                break;
            case 'down':
                newY += checkDistance;
                break;
            case 'left':
                newX -= checkDistance;
                break;
            case 'right':
                newX += checkDistance;
                break;
            default:
                return false; // Direção inválida
        }
        
        // Verificar portais (túneis) nas bordas do mapa
        if (newX < 0) {
            newX = this.map.width - 1;
            return true; // Permitir movimento pelo portal
        } else if (newX >= this.map.width) {
            newX = 0;
            return true; // Permitir movimento pelo portal
        }
        
        // Verificar colisão com paredes
        return this.map.isValidPosition(newX, newY, checkRadius);
    }
    
    // Definir direção do Pac-Man
    setDirection(direction) {
        // Validar a direção
        if (direction !== 'up' && direction !== 'down' && 
            direction !== 'left' && direction !== 'right') {
            return;
        }
        
        // Se puder mover imediatamente nesta direção, atualizar
        if (this.canMove(direction)) {
            this.direction = direction;
            this.nextDirection = null; // Limpar a próxima direção
        } else {
            // Caso contrário, guardar como próxima direção
            this.nextDirection = direction;
        }
    }
    
    // Verificar e comer pellets
    checkPellets() {
        // Verificar se há um pellet na posição atual
        const pellet = this.map.checkAndRemovePellet(this.x, this.y);
        
        if (pellet) {
            // Adicionar pontos
            this.score += pellet.points;
            
            // Se for um power pellet, ativar o modo poder
            if (pellet.type === 'powerPellet') {
                this.activatePowerMode();
                SoundManager.playSound('power');
                
                // Criar partículas para efeito visual
                this.particles.createParticles(
                    this.x * this.map.cellSize,
                    this.y * this.map.cellSize,
                    20,
                    '#FFFFFF',
                    2,
                    4,
                    30
                );
            } else {
                // Som de comer pellet normal
                // Alternar entre dois sons para evitar monotonia
                if (Date.now() - this.lastSound > 150) {
                    SoundManager.playSound('eat');
                    this.lastSound = Date.now();
                }
                
                // Partículas menores para pellets normais
                this.particles.createParticles(
                    this.x * this.map.cellSize,
                    this.y * this.map.cellSize,
                    3,
                    '#FFFF00',
                    1,
                    2,
                    15
                );
            }
            
            return pellet;
        }
        
        return null;
    }
    
    // Ativar o modo de poder (após comer uma power pellet)
    activatePowerMode() {
        this.powerMode = true;
        this.powerModeTimer = this.powerModeDuration;
        this.powerModeEndWarning = false;
        
        // Aumentar velocidade durante o modo poder
        this.speed = this.baseSpeed * 1.2;
    }
    
    // Verificar colisão com fantasmas
    checkGhostCollision(ghost) {
        const distance = Math.sqrt(
            Math.pow((this.x - ghost.x), 2) + 
            Math.pow((this.y - ghost.y), 2)
        );
        
        // Soma dos raios com margem de colisão
        const collisionDistance = this.radius + ghost.radius - 0.1;
        
        return distance < collisionDistance;
    }
    
    // Processar colisão com um fantasma
    collideWithGhost(ghost) {
        // Se estiver no modo poder e o fantasma não estiver no modo de recuperação
        if (this.powerMode && !ghost.recovering) {
            // Comer o fantasma
            ghost.getEaten();
            
            // Adicionar pontos (valor crescente para cada fantasma comido durante um único modo poder)
            const ghostPoints = 200 * Math.pow(2, this.getEatenGhostCount());
            this.score += ghostPoints;
            
            // Tocar som de comer fantasma
            SoundManager.playSound('eatGhost');
            
            // Criar partículas
            this.particles.createParticles(
                ghost.x * this.map.cellSize,
                ghost.y * this.map.cellSize,
                30,
                ghost.color,
                3,
                5,
                40
            );
            
            // Retornar os pontos ganhos
            return ghostPoints;
        } 
        // Se não estiver no modo poder, o jogador perde uma vida
        else if (!ghost.frightened && !ghost.eaten) {
            this.die();
            return 0;
        }
        
        return 0;
    }
    
    // Contagem de fantasmas comidos durante este modo poder
    getEatenGhostCount() {
        // Esta função seria implementada no Game.js para rastrear fantasmas comidos
        // durante um único modo de poder
        return window.game ? window.game.eatenGhostsCount : 0;
    }
    
    // Processar a morte do Pac-Man
    die() {
        if (!this.alive) return;
        
        this.alive = false;
        this.lives--;
        
        // Tocar som de morte
        SoundManager.playSound('death');
        
        // Criar muitas partículas para efeito dramático
        this.particles.createParticles(
            this.x * this.map.cellSize,
            this.y * this.map.cellSize,
            50,
            '#FFFF00',
            3,
            5,
            60
        );
    }
    
    // Reiniciar o Pac-Man para uma nova vida
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.direction = 'right'; // Sempre começar com uma direção (right)
        this.nextDirection = null;
        this.alive = true;
        this.powerMode = false;
        this.powerModeTimer = 0;
        this.speed = this.baseSpeed * 1.2; // Aumentar a velocidade inicial para facilitar o movimento
        this.hasMovedOnce = false; // Resetar flag de primeiro movimento
    }
}

// Exportar a classe
window.Player = Player;