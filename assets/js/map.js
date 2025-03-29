/**
 * Pac-Man - Portfólio Nayara Vieira
 * Map - Classe para gerenciar o mapa do jogo
 */

class GameMap {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Definir tamanho da célula e do mapa
        this.cellSize = 16; // Cada célula tem 16x16 pixels
        this.width = Math.floor(canvas.width / this.cellSize);
        this.height = Math.floor(canvas.height / this.cellSize);
        
        // Cores do tema
        this.updateColors();
        
        // Mapa inicial: 0 = vazio, 1 = parede, 2 = pellet, 3 = power pellet
        // 5 = porta do spawn de fantasmas, 4 = área de spawn de fantasmas
        this.reset();
    }
    
    // Atualiza as cores com base no tema atual
    updateColors() {
        const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
        
        if (isDarkTheme) {
            this.wallColor = '#501A2B';
            this.wallBorderColor = '#942B47';
            this.backgroundColor = '#121212';
            this.pelletColor = '#FFB8FF';
            this.powerPelletColor = '#FFB8FF';
            this.gateColor = '#3A232C';
        } else {
            this.wallColor = '#FFD1DC';
            this.wallBorderColor = '#FF9EB5';
            this.backgroundColor = '#000000';
            this.pelletColor = '#FFB8FF';
            this.powerPelletColor = '#FFB8FF';
            this.gateColor = '#FFAAFF';
        }
    }
    
    // Reseta o mapa para o nível 1
    reset() {
        // Inicializar contadores
        this.pelletsTotal = 0;
        this.pelletsEaten = 0;
        this.powerPelletsTotal = 0;
        this.powerPelletsEaten = 0;
        
        // Definir o layout do mapa
        // 0 = vazio, 1 = parede, 2 = pellet, 3 = power pellet
        // 4 = área de spawn de fantasmas, 5 = porta do spawn
        this.layout = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
            [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
            [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
            [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
            [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
            [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
            [0,0,0,0,0,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,0,0,0,0,0],
            [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
            [0,0,0,0,0,1,2,1,1,0,1,1,1,5,5,1,1,1,0,1,1,2,1,0,0,0,0,0],
            [1,1,1,1,1,1,2,1,1,0,1,4,4,4,4,4,4,1,0,1,1,2,1,1,1,1,1,1],
            [0,0,0,0,0,0,2,0,0,0,1,4,4,4,4,4,4,1,0,0,0,2,0,0,0,0,0,0],
            [1,1,1,1,1,1,2,1,1,0,1,4,4,4,4,4,4,1,0,1,1,2,1,1,1,1,1,1],
            [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
            [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
            [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
            [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
            [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
            [1,3,2,2,1,1,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,1,2,2,3,1],
            [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
            [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
            [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
            [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];
        
        // Contar pellets e power pellets no mapa
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (y < this.layout.length && x < this.layout[y].length) {
                    if (this.layout[y][x] === 2) {
                        this.pelletsTotal++;
                    } else if (this.layout[y][x] === 3) {
                        this.powerPelletsTotal++;
                    }
                }
            }
        }
        
        // Definir posições iniciais
        this.playerStartPosition = { x: 13.5, y: 23 };
        this.ghostStartPositions = [
            { x: 13.5, y: 11, name: 'blinky', color: '#FF0000' },  // Vermelho (Blinky)
            { x: 13.5, y: 14, name: 'pinky', color: '#FFB8FF' },   // Rosa (Pinky)
            { x: 11.5, y: 14, name: 'inky', color: '#00FFFF' },    // Ciano (Inky)
            { x: 15.5, y: 14, name: 'clyde', color: '#FFB852' }    // Laranja (Clyde)
        ];
    }
    
    // Carrega um novo nível, tornando-o mais difícil
    loadLevel(level) {
        this.reset();
        
        // Modificar mapa para níveis mais altos (mais complexo ou com menos power pellets)
        if (level >= 3) {
            // Adicionar blocos extras para aumentar a dificuldade
            const additionalWalls = [
                {x: 13, y: 8}, {x: 14, y: 8},
                {x: 6, y: 15}, {x: 21, y: 15},
                {x: 9, y: 21}, {x: 18, y: 21}
            ];
            
            for (const wall of additionalWalls) {
                if (this.layout[wall.y][wall.x] === 2) {
                    this.layout[wall.y][wall.x] = 1;
                    this.pelletsTotal--;
                }
            }
        }
        
        // Adicionar obstáculos adicionais ou mudar layout para níveis mais altos
        if (level >= 5) {
            const extraWalls = [
                {x: 8, y: 10}, {x: 19, y: 10},
                {x: 11, y: 16}, {x: 16, y: 16},
                {x: 13, y: 20}, {x: 14, y: 20}
            ];
            
            for (const wall of extraWalls) {
                if (this.layout[wall.y][wall.x] === 2) {
                    this.layout[wall.y][wall.x] = 1;
                    this.pelletsTotal--;
                }
            }
        }
    }
    
    // Desenha o mapa no canvas
    draw() {
        // Limpar o canvas
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenhar os elementos do mapa
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cellType = this.getCellType(x, y);
                const cellX = x * this.cellSize;
                const cellY = y * this.cellSize;
                
                // Desenhar com base no tipo de célula
                switch (cellType) {
                    case 1: // Parede
                        // Desenhar ponto de junção no tamanho de uma célula
                        this.ctx.fillStyle = this.wallColor;
                        this.ctx.fillRect(cellX, cellY, this.cellSize, this.cellSize);
                        
                        // Adicionar borda
                        this.ctx.strokeStyle = this.wallBorderColor;
                        this.ctx.lineWidth = 1;
                        this.ctx.strokeRect(cellX, cellY, this.cellSize, this.cellSize);
                        break;
                        
                    case 2: // Pellet
                        Drawing.pellet(
                            this.ctx, 
                            cellX + this.cellSize / 2, 
                            cellY + this.cellSize / 2, 
                            2, 
                            this.pelletColor
                        );
                        break;
                        
                    case 3: // Power Pellet
                        Drawing.powerPellet(
                            this.ctx, 
                            cellX + this.cellSize / 2, 
                            cellY + this.cellSize / 2, 
                            6, 
                            this.powerPelletColor, 
                            true
                        );
                        break;
                        
                    case 5: // Porta do spawn
                        this.ctx.fillStyle = this.gateColor;
                        this.ctx.fillRect(cellX, cellY + this.cellSize / 3, this.cellSize, this.cellSize / 3);
                        break;
                        
                    case 4: // Área de spawn
                        // Opcional: desenhar uma área levemente destacada
                        this.ctx.fillStyle = 'rgba(100, 100, 100, 0.1)';
                        this.ctx.fillRect(cellX, cellY, this.cellSize, this.cellSize);
                        break;
                }
            }
        }
    }
    
    // Retorna o tipo de célula na posição (x, y)
    getCellType(x, y) {
        // Garantir que as coordenadas estão dentro dos limites
        if (y >= 0 && y < this.layout.length && x >= 0 && x < this.layout[y].length) {
            return this.layout[y][x];
        }
        return 1; // Tratar como parede se estiver fora dos limites
    }
    
    // Verifica se uma posição (x, y) do mundo é uma parede
    isWall(x, y) {
        // Converter coordenadas do mundo para coordenadas do mapa
        const mapX = Math.floor(x);
        const mapY = Math.floor(y);
        return this.getCellType(mapX, mapY) === 1;
    }
    
    // Verifica se uma posição é uma porta de fantasmas
    isGhostDoor(x, y) {
        const mapX = Math.floor(x);
        const mapY = Math.floor(y);
        return this.getCellType(mapX, mapY) === 5;
    }
    
    // Verifica se uma posição contém um pellet e o remove se existir
    checkAndRemovePellet(x, y) {
        const mapX = Math.floor(x);
        const mapY = Math.floor(y);
        
        if (mapY >= 0 && mapY < this.layout.length && mapX >= 0 && mapX < this.layout[mapY].length) {
            if (this.layout[mapY][mapX] === 2) {
                this.layout[mapY][mapX] = 0; // Remover o pellet
                this.pelletsEaten++;
                return { type: 'pellet', points: 10 };
            } else if (this.layout[mapY][mapX] === 3) {
                this.layout[mapY][mapX] = 0; // Remover o power pellet
                this.powerPelletsEaten++;
                return { type: 'powerPellet', points: 50 };
            }
        }
        
        return null;
    }
    
    // Verifica se todos os pellets foram comidos
    areAllPelletsEaten() {
        return this.pelletsEaten === this.pelletsTotal && 
               this.powerPelletsEaten === this.powerPelletsTotal;
    }
    
    // Verifica se uma posição específica está dentro de uma área válida
    isValidPosition(x, y, radius) {
        // Ajuste para verificar colisão apenas se a posição estiver dentro dos limites do mapa
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            // Se estiver nos limites horizontais dos túneis, permitir o movimento
            if ((y >= 13 && y <= 15) && (x < 0 || x >= this.width)) {
                return true;
            }
            return false;
        }
        
        // Reduzir ainda mais o raio para facilitar o movimento
        const checkRadius = radius * 0.6;
        
        // Verificar apenas as células no caminho da direção de movimento
        // Isso torna a verificação menos restritiva, facilitando o movimento
        for (let checkY = Math.floor(y - checkRadius); checkY <= Math.floor(y + checkRadius); checkY++) {
            for (let checkX = Math.floor(x - checkRadius); checkX <= Math.floor(x + checkRadius); checkX++) {
                // Pular verificações para posições fora dos limites do mapa
                if (checkX < 0 || checkX >= this.width || checkY < 0 || checkY >= this.height) {
                    continue;
                }
                
                if (this.isWall(checkX, checkY)) {
                    // Verificar se o círculo realmente colide com esta célula
                    // Usando uma verificação de colisão mais permissiva
                    if (Collision.circleRectCollision(
                        x, y, checkRadius,
                        checkX, checkY, 0.8, 0.8 // Reduzir o tamanho efetivo da parede
                    )) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }
    
    // Verifica se uma posição está dentro da área de spawn dos fantasmas
    isInGhostHouse(x, y) {
        const mapX = Math.floor(x);
        const mapY = Math.floor(y);
        return this.getCellType(mapX, mapY) === 4;
    }
    
    // Encontra um caminho entre dois pontos usando o algoritmo A*
    findPath(startX, startY, targetX, targetY, canPassGhostDoor = false) {
        // Implementação básica do algoritmo A*
        const openSet = [];
        const closedSet = new Set();
        const start = { x: Math.floor(startX), y: Math.floor(startY), g: 0, h: 0, f: 0, parent: null };
        const target = { x: Math.floor(targetX), y: Math.floor(targetY) };
        
        start.h = this.heuristic(start, target);
        start.f = start.g + start.h;
        openSet.push(start);
        
        while (openSet.length > 0) {
            // Encontrar o nó com menor f no openSet
            let lowestIndex = 0;
            for (let i = 0; i < openSet.length; i++) {
                if (openSet[i].f < openSet[lowestIndex].f) {
                    lowestIndex = i;
                }
            }
            
            const current = openSet[lowestIndex];
            
            // Se chegamos ao destino
            if (current.x === target.x && current.y === target.y) {
                // Reconstruir o caminho
                const path = [];
                let temp = current;
                while (temp.parent) {
                    path.push({ x: temp.x + 0.5, y: temp.y + 0.5 });
                    temp = temp.parent;
                }
                return path.reverse();
            }
            
            // Remover o nó atual do openSet e adicionar ao closedSet
            openSet.splice(lowestIndex, 1);
            closedSet.add(`${current.x},${current.y}`);
            
            // Verificar os vizinhos
            const directions = [
                { dx: 0, dy: -1 }, // cima
                { dx: 1, dy: 0 },  // direita
                { dx: 0, dy: 1 },  // baixo
                { dx: -1, dy: 0 }  // esquerda
            ];
            
            for (const dir of directions) {
                const neighborX = current.x + dir.dx;
                const neighborY = current.y + dir.dy;
                const neighborKey = `${neighborX},${neighborY}`;
                
                // Pular se já foi visitado
                if (closedSet.has(neighborKey)) continue;
                
                // Verificar se é uma posição válida
                if (this.isWall(neighborX, neighborY)) continue;
                
                // Verificar porta de fantasmas se não puder passar
                if (!canPassGhostDoor && this.isGhostDoor(neighborX, neighborY)) continue;
                
                // Criar nó vizinho
                const neighbor = {
                    x: neighborX,
                    y: neighborY,
                    g: current.g + 1,
                    parent: current
                };
                
                // Calcular h e f
                neighbor.h = this.heuristic(neighbor, target);
                neighbor.f = neighbor.g + neighbor.h;
                
                // Verificar se já está no openSet
                let isInOpenSet = false;
                for (let i = 0; i < openSet.length; i++) {
                    if (openSet[i].x === neighbor.x && openSet[i].y === neighbor.y) {
                        isInOpenSet = true;
                        
                        // Se o caminho até aqui é melhor, atualizar
                        if (neighbor.g < openSet[i].g) {
                            openSet[i].g = neighbor.g;
                            openSet[i].f = openSet[i].g + openSet[i].h;
                            openSet[i].parent = current;
                        }
                        break;
                    }
                }
                
                if (!isInOpenSet) {
                    openSet.push(neighbor);
                }
            }
        }
        
        // Nenhum caminho encontrado
        return [];
    }
    
    // Função de heurística para o algoritmo A* (distância Manhattan)
    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }
}

// Exportar a classe
window.GameMap = GameMap;