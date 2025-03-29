/**
 * Pac-Man - Sistema de Movimento de Fantasmas
 * Versão: 2.0.0
 * 
 * Esta implementação resolve definitivamente os problemas de colisão dos
 * fantasmas com as paredes através de uma abordagem multi-camada que inclui:
 * 
 * 1. Sistema de detecção de colisão aprimorado
 * 2. Algoritmo de centralização automática nas células
 * 3. Prevenção inteligente de travamento em esquinas
 * 4. Recuperação automática de estados problemáticos
 * 5. Gerenciamento de direções otimizado
 */

// Classe base para todos os fantasmas
class Ghost {
    constructor(x, y, map, name, color, player) {
        // Propriedades de posição e movimento
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.map = map;
        this.name = name;
        this.player = player;
        
        // Propriedades visuais
        this.color = color;
        this.radius = 0.4; // Raio em unidades do mapa
        
        // Propriedades de movimento
        this.direction = 'up';
        this.possibleDirections = ['up', 'right', 'down', 'left'];
        this.speed = 0.08; // Velocidade base
        this.baseSpeed = 0.08;
        
        // Estado do fantasma
        this.mode = 'scatter'; // scatter, chase, frightened
        this.previousMode = 'scatter';
        this.frightened = false;
        this.eaten = false;
        this.recovering = false;
        this.waitingInHouse = false;
        this.leavingHouse = false;
        
        // Temporizadores
        this.modeTimer = 0;
        this.frightenedTimer = 0;
        this.frightenedDuration = 7000; // 7 segundos
        this.blinkStart = 5000; // Começar a piscar após 5 segundos
        this.blinking = false;
        this.blinkTimer = 0;
        this.recoverTimer = 0;
        this.waitTimer = 0;
        
        // Animação
        this.animationFrame = 0;
        this.animationTimer = 0;
        
        // Objetivos e caminhos
        this.targetX = 0;
        this.targetY = 0;
        this.path = [];
        this.pathUpdateTimer = 0;
        this.pathUpdateInterval = 500; // Atualizar caminho a cada 500ms
        this.scatterTarget = this.getScatterTarget();
        
        // Sistema anti-travamento
        this.stuckCheckCounter = 0;
        this.lastPosition = { x: 0, y: 0 };
        this.stuckThreshold = 10; // Número de atualizações sem movimento significativo
        this.stuckDetectionDistance = 0.05; // Distância mínima para considerar movimento
        
        // Comportamentos específicos
        this.personality = this.getPersonality();
    }
    
    // Desenhar o fantasma
    draw(ctx) {
        // Atualizar animação
        this.animationTimer++;
        if (this.animationTimer >= 8) {
            this.animationTimer = 0;
            this.animationFrame = (this.animationFrame + 1) % 2;
        }
        
        // Determinar cor e efeito de piscar
        let frightened = this.frightened && !this.eaten;
        let blinking = this.blinking && frightened;
        
        // Desenhar fantasma
        Drawing.ghost(
            ctx,
            this.x * this.map.cellSize,
            this.y * this.map.cellSize,
            this.radius * this.map.cellSize,
            this.color,
            frightened,
            blinking
        );
        
        // Desenhar olhos após ser comido
        if (this.eaten) {
            // Desenhar apenas os olhos quando comido
            ctx.save();
            ctx.translate(this.x * this.map.cellSize, this.y * this.map.cellSize);
            
            // Olhos
            const eyeRadius = this.radius * this.map.cellSize / 3;
            const pupilRadius = this.radius * this.map.cellSize / 8;
            
            // Determinar direção do olhar com base na direção
            let pupilOffsetX = 0;
            let pupilOffsetY = 0;
            
            switch (this.direction) {
                case 'up':
                    pupilOffsetY = -pupilRadius;
                    break;
                case 'down':
                    pupilOffsetY = pupilRadius;
                    break;
                case 'left':
                    pupilOffsetX = -pupilRadius;
                    break;
                case 'right':
                    pupilOffsetX = pupilRadius;
                    break;
            }
            
            // Olho esquerdo
            ctx.beginPath();
            ctx.arc(-this.radius * this.map.cellSize / 2, -this.radius * this.map.cellSize / 4, eyeRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            
            // Olho direito
            ctx.beginPath();
            ctx.arc(this.radius * this.map.cellSize / 2, -this.radius * this.map.cellSize / 4, eyeRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            
            // Pupilas
            ctx.beginPath();
            ctx.arc(-this.radius * this.map.cellSize / 2 + pupilOffsetX, -this.radius * this.map.cellSize / 4 + pupilOffsetY, pupilRadius, 0, Math.PI * 2);
            ctx.arc(this.radius * this.map.cellSize / 2 + pupilOffsetX, -this.radius * this.map.cellSize / 4 + pupilOffsetY, pupilRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#000000';
            ctx.fill();
            
            ctx.restore();
        }
    }
    
    // Atualizar o estado e posição do fantasma
    update(deltaTime) {
        // Gerenciar temporizadores
        this.manageTimers(deltaTime);
        
        // Verificar e corrigir travamento
        this.checkForStuckState();
        
        // Comportamento baseado no estado atual
        if (this.waitingInHouse) {
            this.handleWaitingInHouse(deltaTime);
            return;
        }
        
        if (this.leavingHouse) {
            this.handleLeavingHouse();
            return;
        }
        
        if (this.eaten) {
            this.handleEatenState();
            return;
        }
        
        // Lógica padrão de movimento
        this.determineTarget();
        this.move();
    }
    
    // Verificar se o fantasma está travado
    checkForStuckState() {
        // Calcular distância desde a última posição
        const distMoved = Math.sqrt(
            Math.pow(this.x - this.lastPosition.x, 2) +
            Math.pow(this.y - this.lastPosition.y, 2)
        );
        
        // Se a distância movida for muito pequena, incrementar contador
        if (distMoved < this.stuckDetectionDistance) {
            this.stuckCheckCounter++;
        } else {
            // Caso contrário, resetar contador
            this.stuckCheckCounter = 0;
            // Atualizar última posição
            this.lastPosition.x = this.x;
            this.lastPosition.y = this.y;
        }
        
        // Se estiver travado por muitos frames, fazer correção
        if (this.stuckCheckCounter >= this.stuckThreshold) {
            this.recoverFromStuckState();
        }
    }
    
    // Recuperar de estado travado
    recoverFromStuckState() {
        // Forçar centralização na célula
        this.x = Math.floor(this.x) + 0.5;
        this.y = Math.floor(this.y) + 0.5;
        
        // Limpar caminho atual
        this.path = [];
        
        // Escolher uma direção aleatória disponível
        const possibleDirs = this.getAllPossibleDirections();
        if (possibleDirs.length > 0) {
            this.direction = Random.choose(possibleDirs);
        }
        
        // Resetar contador de travamento
        this.stuckCheckCounter = 0;
    }
    
    // Obter todas as direções possíveis, incluindo voltar
    getAllPossibleDirections() {
        const directions = [];
        
        // Verificar cada direção sem restrições
        for (const direction of this.possibleDirections) {
            let testX = Math.floor(this.x);
            let testY = Math.floor(this.y);
            
            switch (direction) {
                case 'up': testY -= 1; break;
                case 'down': testY += 1; break;
                case 'left': testX -= 1; break;
                case 'right': testX += 1; break;
            }
            
            // Adicionar direção se não for parede
            if (!this.map.isWall(testX, testY)) {
                directions.push(direction);
            }
        }
        
        return directions;
    }
    
    // Gerenciar todos os temporizadores
    manageTimers(deltaTime) {
        // Temporizador de atualização de caminho
        this.pathUpdateTimer += deltaTime;
        
        // Temporizador de modo
        if (this.mode !== 'frightened' && !this.eaten) {
            this.modeTimer -= deltaTime;
            if (this.modeTimer <= 0) {
                this.switchMode();
            }
        }
        
        // Temporizador de modo assustado
        if (this.frightened) {
            this.frightenedTimer -= deltaTime;
            
            // Verificar se deve começar a piscar
            if (this.frightenedTimer <= this.blinkStart && !this.blinking) {
                this.blinking = true;
            }
            
            // Gerenciar o efeito de piscar
            if (this.blinking) {
                this.blinkTimer += deltaTime;
                if (this.blinkTimer >= 200) { // Alternar a cada 200ms
                    this.blinkTimer = 0;
                }
            }
            
            // Fim do modo assustado
            if (this.frightenedTimer <= 0) {
                this.endFrightened();
            }
        }
        
        // Temporizador de recuperação após ser comido
        if (this.recovering) {
            this.recoverTimer -= deltaTime;
            if (this.recoverTimer <= 0) {
                this.recovering = false;
            }
        }
    }
    
    // Alternar entre modos scatter e chase
    switchMode() {
        if (this.mode === 'scatter') {
            this.mode = 'chase';
            this.modeTimer = 20000; // 20 segundos em chase
        } else {
            this.mode = 'scatter';
            this.modeTimer = 7000; // 7 segundos em scatter
        }
        
        // Inverter direção ao mudar de modo
        this.reverseDirection();
    }
    
    // Iniciar modo assustado após Pac-Man comer uma power pellet
    startFrightened() {
        if (this.eaten) return; // Não assustar se já foi comido
        
        // Guardar modo anterior
        this.previousMode = this.mode;
        this.mode = 'frightened';
        
        // Configurar estado assustado
        this.frightened = true;
        this.frightenedTimer = this.frightenedDuration;
        this.blinking = false;
        
        // Diminuir velocidade durante o modo assustado
        this.speed = this.baseSpeed * 0.5;
        
        // Inverter direção
        this.reverseDirection();
    }
    
    // Terminar modo assustado
    endFrightened() {
        this.frightened = false;
        this.blinking = false;
        this.mode = this.previousMode;
        this.speed = this.baseSpeed;
    }
    
    // Reverter direção atual
    reverseDirection() {
        switch (this.direction) {
            case 'up': this.direction = 'down'; break;
            case 'down': this.direction = 'up'; break;
            case 'left': this.direction = 'right'; break;
            case 'right': this.direction = 'left'; break;
        }
    }
    
    // Ser comido pelo Pac-Man no modo de poder
    getEaten() {
        this.eaten = true;
        this.frightened = false;
        this.speed = this.baseSpeed * 2; // Mover-se rapidamente de volta para casa
    }
    
    // Manipular o estado de "comido"
    handleEatenState() {
        // Verificar se chegou à casa dos fantasmas
        if (this.map.isInGhostHouse(this.x, this.y)) {
            // Reiniciar estado
            this.eaten = false;
            this.frightened = false;
            this.recovering = true;
            this.recoverTimer = 3000; // 3 segundos de recuperação
            this.speed = this.baseSpeed;
            
            // Iniciar saída da casa após recuperado
            this.waitingInHouse = true;
            this.waitTimer = 1000; // Esperar 1 segundo antes de sair
        } else {
            // Ir para a casa dos fantasmas
            this.targetX = 13.5; // Centro da casa dos fantasmas
            this.targetY = 14;
            
            // Atualizar caminho frequentemente
            if (this.pathUpdateTimer >= 100) { // Atualizar a cada 100ms quando comido
                this.updatePath(true); // true = pode passar pela porta
                this.pathUpdateTimer = 0;
            }
            
            this.followPath();
        }
    }
    
    // Manipular o estado de espera na casa
    handleWaitingInHouse(deltaTime) {
        // Movimento vertical suave enquanto espera
        this.y += Math.sin(Date.now() / 200) * 0.005;
        
        // Contar tempo de espera
        this.waitTimer -= deltaTime;
        if (this.waitTimer <= 0) {
            this.waitingInHouse = false;
            this.leavingHouse = true;
        }
    }
    
    // Manipular o estado de saída da casa
    handleLeavingHouse() {
        // Ponto de saída da casa dos fantasmas
        const exitX = 13.5;
        const exitY = 11;
        
        // Mover para a saída
        const dx = exitX - this.x;
        const dy = exitY - this.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        if (distance < 0.1) {
            // Saiu da casa
            this.leavingHouse = false;
            this.direction = 'left'; // Direção inicial após sair
        } else {
            // Mover em direção à saída
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
    }
    
    // Determinar o alvo com base no modo e personalidade
    determineTarget() {
        if (this.frightened) {
            // No modo assustado, o alvo é aleatório
            this.chooseRandomTarget();
            return;
        }
        
        switch (this.mode) {
            case 'scatter':
                // No modo scatter, cada fantasma vai para seu canto designado
                this.targetX = this.scatterTarget.x;
                this.targetY = this.scatterTarget.y;
                break;
                
            case 'chase':
                // No modo chase, cada fantasma tem seu comportamento específico
                const target = this.calculateChaseTarget();
                this.targetX = target.x;
                this.targetY = target.y;
                break;
        }
        
        // Atualizar caminho se necessário
        if (this.pathUpdateTimer >= this.pathUpdateInterval) {
            this.updatePath();
            this.pathUpdateTimer = 0;
        }
    }
    
    // Escolher um alvo aleatório (usado no modo assustado)
    chooseRandomTarget() {
        // Atualizar alvo aleatório com menos frequência
        if (this.pathUpdateTimer >= 1000) { // A cada 1 segundo
            // Escolher uma posição aleatória no mapa que não seja parede
            let valid = false;
            let attempts = 0;
            
            while (!valid && attempts < 20) {
                const randomX = Random.intBetween(1, this.map.width - 2);
                const randomY = Random.intBetween(1, this.map.height - 2);
                
                if (!this.map.isWall(randomX, randomY)) {
                    this.targetX = randomX;
                    this.targetY = randomY;
                    valid = true;
                }
                
                attempts++;
            }
            
            this.updatePath();
            this.pathUpdateTimer = 0;
        }
    }
    
    // Calcular o alvo no modo chase (implementado nas subclasses)
    calculateChaseTarget() {
        // Implementação padrão - seguir o jogador
        return {
            x: this.player.x,
            y: this.player.y
        };
    }
    
    // Atualizar o caminho para o alvo
    updatePath(canPassGhostDoor = false) {
        // Calcular caminho usando A* com pequenos ajustes
        // Arredondar posições para centros de células para melhorar o pathfinding
        const startX = Math.floor(this.x) + 0.5;
        const startY = Math.floor(this.y) + 0.5;
        const targetX = Math.floor(this.targetX) + 0.5;
        const targetY = Math.floor(this.targetY) + 0.5;
        
        // Se o alvo for muito próximo, não precisa de caminho
        const directDistance = Math.sqrt(
            Math.pow(this.x - this.targetX, 2) + 
            Math.pow(this.y - this.targetY, 2)
        );
        
        if (directDistance < 4) {
            // Para alvos próximos, movimento direto é mais eficiente
            this.path = [];
            return;
        }
        
        // Calcular caminho usando A*
        this.path = this.map.findPath(
            startX, startY,
            targetX, targetY,
            canPassGhostDoor
        );
        
        // Limitar o tamanho do caminho para melhor performance
        if (this.path.length > 10) {
            this.path = this.path.slice(0, 10);
        }
    }
    
    // Seguir o caminho calculado
    followPath() {
        if (this.path.length === 0) return;
        
        // Obter o próximo ponto no caminho
        const nextPoint = this.path[0];
        const dx = nextPoint.x - this.x;
        const dy = nextPoint.y - this.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        // Se estiver próximo o suficiente, avançar para o próximo ponto
        if (distance < this.speed) {
            this.path.shift();
            return this.followPath();
        }
        
        // Determinar a direção baseada no próximo ponto
        if (Math.abs(dx) > Math.abs(dy)) {
            this.direction = dx > 0 ? 'right' : 'left';
        } else {
            this.direction = dy > 0 ? 'down' : 'up';
        }
        
        // Mover em direção ao próximo ponto com sistema anti-colisão
        let newX = this.x + (dx / distance) * this.speed;
        let newY = this.y + (dy / distance) * this.speed;
        
        // Verificar colisão com paredes
        if (this.canMoveTo(newX, newY)) {
            this.x = newX;
            this.y = newY;
        } else {
            // Se encontrou parede, tentar ajustar posição para evitar colisão
            if (this.direction === 'up' || this.direction === 'down') {
                // Se movendo verticalmente, ajustar X para o centro da célula
                newX = Math.floor(this.x) + 0.5;
                if (this.canMoveTo(newX, this.y)) {
                    this.x = newX;
                }
            } else {
                // Se movendo horizontalmente, ajustar Y para o centro da célula
                newY = Math.floor(this.y) + 0.5;
                if (this.canMoveTo(this.x, newY)) {
                    this.y = newY;
                }
            }
            
            // Recalcular caminho após ajuste
            this.updatePath(this.eaten);
        }
    }
    
    // Verificar se pode mover para uma nova posição
    canMoveTo(x, y) {
        // Verificar se a nova posição está dentro dos limites do mapa
        if (x < 0 || x >= this.map.width || y < 0 || y >= this.map.height) {
            // Permitir movimento através de portais
            return (y >= 13 && y <= 15) && (x < 0 || x >= this.map.width);
        }
        
        // Verificar colisão com paredes
        const cellX = Math.floor(x);
        const cellY = Math.floor(y);
        
        // Verificar a célula atual e células adjacentes
        if (this.map.isWall(cellX, cellY)) {
            return false;
        }
        
        // Verificar túneis especiais
        if (this.map.isGhostDoor(cellX, cellY) && !this.eaten) {
            return false;
        }
        
        return true;
    }
    
    // Mover o fantasma
    move() {
        // Se houver um caminho e não estiver no modo assustado, seguir o caminho
        if (this.path.length > 0 && !this.frightened) {
            this.followPath();
            return;
        }
        
        // Caso contrário, usar a lógica de movimento baseada em direções
        let possibleDirections = this.getPossibleDirections();
        
        // Se estiver em modo assustado, movimento mais aleatório
        if (this.frightened) {
            if (possibleDirections.length > 0) {
                // 80% de chance de manter direção se possível
                if (possibleDirections.includes(this.direction) && Math.random() > 0.2) {
                    // Manter a direção atual
                } else {
                    this.direction = Random.choose(possibleDirections);
                }
            }
        } 
        // Caso contrário, escolher direção que leva para mais perto do alvo
        else {
            this.direction = this.getBestDirection(possibleDirections);
        }
        
        // Mover na direção escolhida
        this.moveInDirection();
    }
    
    // Mover na direção atual
    moveInDirection() {
        let newX = this.x;
        let newY = this.y;
        
        // Calcular nova posição com base na direção
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
        
        // Verificar portais (túneis)
        if (newX < 0) {
            newX = this.map.width - 1;
        } else if (newX >= this.map.width) {
            newX = 0;
        }
        
        // Verificar se a nova posição não é uma parede
        if (this.canMoveTo(newX, newY)) {
            // Ajuste adicional para centralização suave
            if (this.direction === 'up' || this.direction === 'down') {
                // Em corredores verticais, alinhar horizontalmente
                const cellCenterX = Math.floor(this.x) + 0.5;
                const distanceToCenter = Math.abs(this.x - cellCenterX);
                
                // Se estiver perto do centro horizontal, ajustar gradualmente
                if (distanceToCenter < 0.1) {
                    newX = cellCenterX; // Centralizar exatamente
                } else if (distanceToCenter < 0.3) {
                    // Movimento gradual para o centro com intensidade proporcional à distância
                    newX = this.x + (cellCenterX - this.x) * 0.3;
                }
            } else if (this.direction === 'left' || this.direction === 'right') {
                // Em corredores horizontais, alinhar verticalmente
                const cellCenterY = Math.floor(this.y) + 0.5;
                const distanceToCenter = Math.abs(this.y - cellCenterY);
                
                // Se estiver perto do centro vertical, ajustar gradualmente
                if (distanceToCenter < 0.1) {
                    newY = cellCenterY; // Centralizar exatamente
                } else if (distanceToCenter < 0.3) {
                    // Movimento gradual para o centro com intensidade proporcional à distância
                    newY = this.y + (cellCenterY - this.y) * 0.3;
                }
            }
            
            // Atualizar a posição final
            this.x = newX;
            this.y = newY;
        } else {
            // Se encontrou uma parede, centralizar posição para evitar travamento
            this.x = Math.floor(this.x) + 0.5;
            this.y = Math.floor(this.y) + 0.5;
            
            // Forçar escolha de nova direção
            const possibleDirections = this.getPossibleDirections();
            if (possibleDirections.length > 0) {
                // Escolher nova direção com base no modo
                if (this.frightened) {
                    this.direction = Random.choose(possibleDirections);
                } else {
                    this.direction = this.getBestDirection(possibleDirections);
                }
            }
        }
    }
    
    // Obter direções possíveis (exceto voltar)
    getPossibleDirections() {
        let possibleDirections = [];
        
        // Direção oposta à atual
        let oppositeDirection;
        switch (this.direction) {
            case 'up': oppositeDirection = 'down'; break;
            case 'down': oppositeDirection = 'up'; break;
            case 'left': oppositeDirection = 'right'; break;
            case 'right': oppositeDirection = 'left'; break;
        }
        
        // Verificar cada direção com margem de segurança
        for (const direction of this.possibleDirections) {
            // Evitar voltar, exceto se não houver outra opção
            if (direction === oppositeDirection) continue;
            
            // Posição atual centralizada
            const currentX = Math.floor(this.x) + 0.5;
            const currentY = Math.floor(this.y) + 0.5;
            
            // Calcular próxima célula com base na direção
            let nextCellX = Math.floor(currentX);
            let nextCellY = Math.floor(currentY);
            
            switch (direction) {
                case 'up': nextCellY -= 1; break;
                case 'down': nextCellY += 1; break;
                case 'left': nextCellX -= 1; break;
                case 'right': nextCellX += 1; break;
            }
            
            // Verificar se a próxima célula não é parede
            if (!this.map.isWall(nextCellX, nextCellY)) {
                // Verificar porta dos fantasmas
                if (!this.map.isGhostDoor(nextCellX, nextCellY) || this.eaten) {
                    possibleDirections.push(direction);
                }
            }
        }
        
        // Se não houver direções possíveis, permitir voltar
        if (possibleDirections.length === 0) {
            possibleDirections.push(oppositeDirection);
        }
        
        return possibleDirections;
    }
    
    // Escolher a melhor direção com base na distância ao alvo
    getBestDirection(directions) {
        if (directions.length === 0) return this.direction;
        
        let bestDirection = directions[0];
        let shortestDistance = Infinity;
        
        for (const direction of directions) {
            // Calcular posição depois de mover nesta direção
            let testX = Math.floor(this.x) + 0.5; // Centralizado
            let testY = Math.floor(this.y) + 0.5; // Centralizado
            
            // Olhar duas células à frente para melhor decisão
            switch (direction) {
                case 'up': testY -= 2; break;
                case 'down': testY += 2; break;
                case 'left': testX -= 2; break;
                case 'right': testX += 2; break;
            }
            
            // Calcular distância euclidiana ao alvo
            const distance = Math.sqrt(
                Math.pow(testX - this.targetX, 2) + 
                Math.pow(testY - this.targetY, 2)
            );
            
            // Adicionar pequena preferência por manter a direção atual
            const sameDirectionBonus = (direction === this.direction) ? 0.7 : 0;
            const adjustedDistance = distance - sameDirectionBonus;
            
            if (adjustedDistance < shortestDistance) {
                shortestDistance = adjustedDistance;
                bestDirection = direction;
            }
        }
        
        return bestDirection;
    }
    
    // Definir posição inicial
    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.direction = 'up';
        this.mode = 'scatter';
        this.modeTimer = 7000; // 7 segundos iniciais em scatter
        this.frightened = false;
        this.eaten = false;
        this.recovering = false;
        this.path = [];
        this.speed = this.baseSpeed;
        this.stuckCheckCounter = 0;
        this.lastPosition = { x: this.x, y: this.y };
        
        // Definir comportamentos de espera específicos para cada fantasma
        if (this.name !== 'blinky') { // Blinky começa fora da casa
            this.waitingInHouse = true;
            this.waitTimer = this.getInitialWaitTime();
        }
    }
    
    // Métodos a serem implementados pelas subclasses
    
    // Obter o alvo do modo scatter
    getScatterTarget() {
        // Implementado nas subclasses
        return { x: 0, y: 0 };
    }
    
    // Obter a personalidade do fantasma
    getPersonality() {
        // Implementado nas subclasses
        return 'chaser';
    }
    
    // Obter tempo inicial de espera na casa
    getInitialWaitTime() {
        // Implementado nas subclasses
        return 0;
    }
}

// Subclasse para o fantasma vermelho (Blinky)
class Blinky extends Ghost {
    constructor(x, y, map, player) {
        super(x, y, map, 'blinky', '#FF0000', player);
        this.baseSpeed = 0.09; // Blinky é o mais rápido
        this.speed = this.baseSpeed;
    }
    
    getScatterTarget() {
        // Blinky tem como alvo o canto superior direito
        return { x: this.map.width - 2, y: 2 };
    }
    
    getPersonality() {
        return 'chaser';
    }
    
    calculateChaseTarget() {
        // Blinky simplesmente persegue o Pac-Man diretamente
        return {
            x: this.player.x,
            y: this.player.y
        };
    }
    
    getInitialWaitTime() {
        return 0; // Blinky começa imediatamente
    }
}

// Subclasse para o fantasma rosa (Pinky)
class Pinky extends Ghost {
    constructor(x, y, map, player) {
        super(x, y, map, 'pinky', '#FFB8FF', player);
    }
    
    getScatterTarget() {
        // Pinky tem como alvo o canto superior esquerdo
        return { x: 2, y: 2 };
    }
    
    getPersonality() {
        return 'ambusher';
    }
    
    calculateChaseTarget() {
        // Pinky tenta emboscar o Pac-Man se posicionando à sua frente
        const targetOffset = 4; // 4 células à frente
        let targetX = this.player.x;
        let targetY = this.player.y;
        
        // Calcular posição à frente do jogador com base na direção
        switch (this.player.direction) {
            case 'up':
                targetY -= targetOffset;
                targetX -= targetOffset; // Bug original do Pac-Man para cima
                break;
            case 'down':
                targetY += targetOffset;
                break;
            case 'left':
                targetX -= targetOffset;
                break;
            case 'right':
                targetX += targetOffset;
                break;
            default:
                // Se o jogador não estiver se movendo, mirar nele diretamente
                break;
        }
        
        return { x: targetX, y: targetY };
    }
    
    getInitialWaitTime() {
        return 3000; // Pinky espera 3 segundos antes de sair
    }
}

// Subclasse para o fantasma ciano (Inky)
class Inky extends Ghost {
    constructor(x, y, map, player, blinky) {
        super(x, y, map, 'inky', '#00FFFF', player);
        this.blinky = blinky; // Referência ao Blinky
    }
    
    getScatterTarget() {
        // Inky tem como alvo o canto inferior direito
        return { x: this.map.width - 2, y: this.map.height - 2 };
    }
    
    getPersonality() {
        return 'fickle';
    }
    
    calculateChaseTarget() {
        // Inky usa uma estratégia mais complexa que envolve Blinky
        // 1. Encontrar um ponto 2 células à frente do Pac-Man
        let intermediateX = this.player.x;
        let intermediateY = this.player.y;
        
        switch (this.player.direction) {
            case 'up':
                intermediateY -= 2;
                break;
            case 'down':
                intermediateY += 2;
                break;
            case 'left':
                intermediateX -= 2;
                break;
            case 'right':
                intermediateX += 2;
                break;
        }
        
        // 2. Calcular vetor de Blinky para esse ponto e dobrar
        const vectorX = intermediateX - this.blinky.x;
        const vectorY = intermediateY - this.blinky.y;
        
        // 3. O alvo é o ponto resultante
        return {
            x: intermediateX + vectorX,
            y: intermediateY + vectorY
        };
    }
    
    getInitialWaitTime() {
        return 7000; // Inky espera 7 segundos antes de sair
    }
}

// Subclasse para o fantasma laranja (Clyde)
class Clyde extends Ghost {
    constructor(x, y, map, player) {
        super(x, y, map, 'clyde', '#FFB852', player);
    }
    
    getScatterTarget() {
        // Clyde tem como alvo o canto inferior esquerdo
        return { x: 2, y: this.map.height - 2 };
    }
    
    getPersonality() {
        return 'shy';
    }
    
    calculateChaseTarget() {
        // Clyde alterna entre perseguir e fugir
        // Se estiver a mais de 8 unidades do Pac-Man, persegue como Blinky
        // Caso contrário, vai para o canto inferior esquerdo (seu ponto de scatter)
        
        const distance = Math.sqrt(
            Math.pow(this.x - this.player.x, 2) + 
            Math.pow(this.y - this.player.y, 2)
        );
        
        if (distance > 8) {
            // Perseguir como Blinky
            return {
                x: this.player.x,
                y: this.player.y
            };
        } else {
            // Ir para o ponto de scatter
            return this.scatterTarget;
        }
    }
    
    getInitialWaitTime() {
        return 5000; // Clyde espera 5 segundos antes de sair
    }
}

// Exportar as classes
window.Ghost = Ghost;
window.Blinky = Blinky;
window.Pinky = Pinky;
window.Inky = Inky;
window.Clyde = Clyde;