// Referências aos elementos do DOM
const gameArea = document.getElementById('game-area');
const currentScoreSpan = document.getElementById('current-score');
const gameTimerSpan = document.getElementById('game-timer');
const startButton = document.getElementById('start-button'); // ID corrigido para "start-button"
const infiniteButton = document.getElementById('infinite-button');
const instructionsDiv = document.getElementById('instructions');
const titleDiv = document.getElementById('title');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreSpan = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');
const backButton = document.getElementById('back-button');
const scoreInfo = document.getElementById('score-info');
const timerInfo = document.getElementById('timer-info');
const livesInfo = document.getElementById('lives-info');
const gameLivesSpan = document.getElementById('game-lives');
const startMenu = document.getElementById('start-menu');

// Variáveis do jogo
let score = 0;
let gameTime = 60; // Segundos de jogo para modo cronometrado
let gameInterval; // Para o temporizador do jogo
let itemGenerationInterval; // Para a geração de itens de poluição
let itemSpeed = 4000; // Tempo em ms para o item subir (velocidade inicial MAIS RÁPIDA)
let generationDelay = 1000; // A cada quantos ms um novo item aparece (MAIS FREQUENTE)
let activeItems = []; // Guarda os itens de poluição atualmente na tela

// --- CHAVES MAIS AMPLAS AGORA, MAS SÓ UMA ATIVA POR VEZ ---
const possibleKeys = ['w', 'a', 's', 'd', 'q', 'e', 'r', 't', 'y', 'f', 'g', 'h', 'j', 'z', 'x', 'c', 'v', 'b']; 

let isGameRunning = false;
let difficultyLevel = 0; // Controla o nível de dificuldade

// --- NOVAS VARIÁVEIS PARA DIFICULDADE E PENALIDADES ---
const MAX_ITEM_SPEED = 1000; // Velocidade máxima (item sobe em 1s)
const MIN_GENERATION_DELAY = 300; // Geração mínima (item a cada 0.3s)
const PASS_PENALTY_TIME = 3; // Segundos a perder se um item passar (modo cronometrado)
const WRONG_KEY_PENALTY_TIME = 2; // Segundos a perder se apertar tecla errada (modo cronometrado)

let isInfiniteMode = false;
let lives = 3;
const MAX_LIVES = 3;

// Função para iniciar o jogo
function startGame(mode = 'timed') {
    // mode: 'timed' ou 'infinite'
    isInfiniteMode = (mode === 'infinite');

    score = 0;
    gameTime = 60;
    itemSpeed = 4000;
    generationDelay = 1000;
    difficultyLevel = 0;
    activeItems = [];
    isGameRunning = true;
    lives = MAX_LIVES;

    // Resetar display e limpar a área de jogo
    currentScoreSpan.textContent = score;
    gameTimerSpan.textContent = gameTime;
    gameLivesSpan.textContent = lives;
    gameArea.innerHTML = ''; 
    
    // Esconder/Mostrar elementos conforme o estado do jogo
    gameOverScreen.classList.add('hidden');
    startMenu.classList.add('hidden');
    instructionsDiv.classList.add('hidden');
    titleDiv.classList.add('hidden');
    scoreInfo.classList.remove('hidden');
    if (isInfiniteMode) {
        timerInfo.classList.add('hidden');
        livesInfo.classList.remove('hidden');
    } else {
        timerInfo.classList.remove('hidden');
        livesInfo.classList.add('hidden');
    }

    // Inicia o temporizador do jogo (só em modo cronometrado)
    clearInterval(gameInterval);
    if (!isInfiniteMode) {
        gameInterval = setInterval(() => {
            gameTime--;
            gameTimerSpan.textContent = gameTime;
            if (gameTime <= 0) {
                endGame();
            }
        }, 1000);
    }

    // Ajusta o intervalo de geração para a primeira vez
    clearInterval(itemGenerationInterval); // Garante que nenhum intervalo antigo esteja rodando
    itemGenerationInterval = setInterval(generatePollutionItem, generationDelay);

    // Adiciona o listener para as teclas
    document.addEventListener('keydown', handleKeyPress);
}

// Função para gerar um item de poluição
function generatePollutionItem() {
    if (!isGameRunning) return;

    // Pega as teclas que já estão ativas na tela
    const activeKeys = activeItems.map(item => item.dataset.key);
    // Filtra as possibleKeys para encontrar as que não estão ativas
    const availableKeys = possibleKeys.filter(key => !activeKeys.includes(key));

    let key;
    if (availableKeys.length > 0) {
        // Se houver teclas disponíveis, escolhe uma aleatoriamente
        key = availableKeys[Math.floor(Math.random() * availableKeys.length)];
    } else {
        // Se todas as teclas já estiverem ativas, não gera um novo item com tecla repetida.
        // Isso impede que itens se acumulem com a mesma tecla esperando para serem apertados.
        return; 
    }

    const item = document.createElement('div');
    // usar classe prefixada para evitar colisões com seletores genéricos
    item.classList.add('pollution-item', `key-${key}`);
    item.textContent = key.toUpperCase();
    item.dataset.key = key;
    item.dataset.spawnTime = Date.now();

    const gameAreaWidth = gameArea.offsetWidth;
    const itemWidth = 70;
    const randomLeft = Math.random() * (gameAreaWidth - itemWidth);
    item.style.left = `${randomLeft}px`;

    gameArea.appendChild(item);
    activeItems.push(item);

    item.style.transitionDuration = `${itemSpeed / 1000}s`;
    setTimeout(() => {
        item.style.transform = `translateY(-${gameArea.offsetHeight + item.offsetHeight + 10}px)`; 
    }, 50);

    item.addEventListener('transitionend', () => {
        if (isGameRunning && item.parentNode === gameArea) {
            if (isInfiniteMode) {
                // Perde vida no modo infinito
                lives = Math.max(0, lives - 1);
                gameLivesSpan.textContent = lives;
                if (lives <= 0) {
                    endGame();
                }
            } else {
                // Perde tempo no modo cronometrado
                gameTime = Math.max(0, gameTime - PASS_PENALTY_TIME);
                gameTimerSpan.textContent = gameTime;
                if (gameTime <= 0) {
                    endGame();
                }
            }
            removePollutionItem(item);
        }
    });

    // Aumenta a dificuldade gradualmente
    increaseDifficulty();
}

// Função para remover um item de poluição (acertado ou falhou)
function removePollutionItem(item) {
    activeItems = activeItems.filter(activeItem => activeItem !== item);
    if (item.parentNode === gameArea) {
        gameArea.removeChild(item);
    }
}

// Função para lidar com o pressionar de teclas
function handleKeyPress(event) {
    if (!isGameRunning) return;

    const pressedKey = event.key.toLowerCase();

    if (!possibleKeys.includes(pressedKey)) {
        return;
    }

    const targetItem = activeItems.find(item => item.dataset.key === pressedKey);

    if (targetItem) {
        score++;
        currentScoreSpan.textContent = score;
        targetItem.classList.add('hit');
        targetItem.addEventListener('animationend', () => {
            removePollutionItem(targetItem);
        });
    } else {
        if (isInfiniteMode) {
            // Perde uma vida no modo infinito
            lives = Math.max(0, lives - 1);
            gameLivesSpan.textContent = lives;
            if (lives <= 0) {
                endGame();
            }
            // Feedback visual de erro
            gameArea.style.borderColor = '#ff4d4d';
            setTimeout(() => {
                gameArea.style.borderColor = '#3a506b';
            }, 150);
        } else {
            // Penalidade por tecla errada no modo cronometrado
            gameTime = Math.max(0, gameTime - WRONG_KEY_PENALTY_TIME);
            gameTimerSpan.textContent = gameTime;
            if (gameTime <= 0) {
                endGame();
            }
            gameArea.style.borderColor = '#ff4d4d';
            setTimeout(() => {
                gameArea.style.borderColor = '#3a506b';
            }, 150);
        }
    }
}

// Função para aumentar a dificuldade
function increaseDifficulty() {
    difficultyLevel++;

    itemSpeed = Math.max(MAX_ITEM_SPEED, itemSpeed - 50);
    generationDelay = Math.max(MIN_GENERATION_DELAY, generationDelay - 10);
    
    if (itemGenerationInterval) {
        clearInterval(itemGenerationInterval);
        itemGenerationInterval = setInterval(generatePollutionItem, generationDelay);
    }
}

// Função para finalizar o jogo
function endGame() {
    isGameRunning = false;
    clearInterval(gameInterval);
    clearInterval(itemGenerationInterval);
    document.removeEventListener('keydown', handleKeyPress);

    finalScoreSpan.textContent = score;
    gameOverScreen.classList.remove('hidden');

    // Remove todos os itens que sobraram na tela
    activeItems.forEach(item => {
        if (item.parentNode === gameArea) {
            gameArea.removeChild(item);
        }
    });
    activeItems = [];

    scoreInfo.classList.add('hidden');
    timerInfo.classList.add('hidden');
    livesInfo.classList.add('hidden');
}

// Voltar para o menu inicial
function backToMenu() {
    isGameRunning = false;
    clearInterval(gameInterval);
    clearInterval(itemGenerationInterval);
    document.removeEventListener('keydown', handleKeyPress);

    // Limpa itens e reset UI
    activeItems.forEach(item => {
        if (item.parentNode === gameArea) gameArea.removeChild(item);
    });
    activeItems = [];
    gameArea.innerHTML = '';
    score = 0;
    currentScoreSpan.textContent = score;
    gameTimerSpan.textContent = 60;
    gameLivesSpan.textContent = MAX_LIVES;

    // Mostrar menu / esconder game over
    gameOverScreen.classList.add('hidden');
    startMenu.classList.remove('hidden');
    instructionsDiv.classList.remove('hidden');
    titleDiv.classList.remove('hidden');
    scoreInfo.classList.add('hidden');
    timerInfo.classList.add('hidden');
    livesInfo.classList.add('hidden');
}

// Event Listeners para botões
startButton.addEventListener('click', () => startGame('timed'));
infiniteButton.addEventListener('click', () => startGame('infinite'));
restartButton.addEventListener('click', () => startGame(isInfiniteMode ? 'infinite' : 'timed'));
backButton.addEventListener('click', backToMenu);

// Inicialização: Esconder tela de game over e score/timer no início
gameOverScreen.classList.add('hidden');
scoreInfo.classList.add('hidden');
timerInfo.classList.add('hidden');
livesInfo.classList.add('hidden');