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
let itemSpeed = 2000;           // Reduzido MUITO mais (era 9000)
let generationDelay = 400;      // Reduzido para gerar itens mais rápido
const MAX_ITEM_SPEED = 500;     // Velocidade máxima mais rápida (era 1000)
const MIN_GENERATION_DELAY = 200; // Geração mínima mais rápida (era 300)
let activeItems = []; // Guarda os itens de poluição atualmente na tela

// --- CHAVES MAIS AMPLAS AGORA, MAS SÓ UMA ATIVA POR VEZ ---
const possibleKeys = ['w', 'a', 's', 'd', 
    'q', 'e', 'r', 
    't', 'y', 'f', 
    'g', 'h', 'j', 
    'z', 'x', 'c', 
    'v', 'b']; 

let isGameRunning = false;
let difficultyLevel = 0; // Controla o nível de dificuldade

// --- NOVAS VARIÁVEIS PARA DIFICULDADE E PENALIDADES ---
const PASS_PENALTY_TIME = 3; // Segundos a perder se um item passar (modo cronometrado)
const WRONG_KEY_PENALTY_TIME = 2; // Segundos a perder se apertar tecla errada (modo cronometrado)

// Ajustes de vidas: agora acumuláveis (começa com START_LIVES e pode crescer até MAX_LIVES)
const START_LIVES = 3;        // vidas iniciais no modo infinito
const MAX_LIVES = 6;          // cap de vidas acumuláveis (pode ajustar)
let isInfiniteMode = false;
let lives = START_LIVES;

// NOVAS VARIÁVEIS PARA RECUPERAÇÃO DE VIDA (MODO INFINITO)
let lifeCharge = 0;
const LIFE_CHARGE_REQUIRED = 10; // Precisa apertar 3 teclas/acertos para recuperar 1 vida

// Adicione estas constantes importantes que estavam faltando
const MIN_ITEMS_ON_SCREEN = 4;  // Mínimo de itens na tela
const MAX_ITEMS_ON_SCREEN = 8;  // Máximo de itens na tela
const DIFFICULTY_STEP = 10;     // A cada quantas gerações aumenta a dificuldade
const ITEM_SPEED_DECREMENT = 100;
const GENERATION_DELAY_DECREMENT = 20;

let generationCount = 0; // Adicione esta variável global

// Função para iniciar o jogo
function startGame(mode = 'timed') {
    // modo: 'tempo' ou 'infinito'
    isInfiniteMode = (mode === 'infinite');

    score = 0;
    gameTime = 60;
    itemSpeed = 2000;        // Mesmo valor inicial rápido
    generationDelay = 400;   // Mesmo valor inicial rápido
    difficultyLevel = 0;
    activeItems = [];
    isGameRunning = true;
    lives = START_LIVES;

    // reset da recarga de vida
    lifeCharge = 0;
    generationCount = 0;

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

    // Garante um mínimo de itens na tela
    if (activeItems.length < MIN_ITEMS_ON_SCREEN) {
        createNewItem();
    }

    // Permite mais itens até o limite máximo
    if (activeItems.length >= MAX_ITEMS_ON_SCREEN) return;

    createNewItem();
}

// Função auxiliar para criar novo item (separada para melhor organização)
function createNewItem() {
    const activeKeys = activeItems.map(item => item.dataset.key);
    const availableKeys = possibleKeys.filter(key => !activeKeys.includes(key));

    if (availableKeys.length === 0) return;

    const key = availableKeys[Math.floor(Math.random() * availableKeys.length)];

    const item = document.createElement('div');
    item.classList.add('pollution-item', `key-${key}`);
    item.textContent = key.toUpperCase();
    item.dataset.key = key;

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

    item.addEventListener('transitionend', (e) => {
        // Só reagir à transição de transform (movimento)
        if (e.propertyName !== 'transform') return;
        // Se o item já foi acertado (classe 'hit'), não penaliza — ele será removido no animationend
        if (item.classList.contains('hit')) return;
        // Garante que o jogo ainda esteja rodando e o item esteja na área
        if (!isGameRunning || item.parentNode !== gameArea) return;

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

        // Remove o item que escapou
        removePollutionItem(item);
    });

    // Contador de gerações e aumento de dificuldade controlado
    generationCount++;
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

        // NOVA LÓGICA: carregar vida apenas no modo infinito
        if (isInfiniteMode) {
            lifeCharge++;
            // Quando atingir o necessário, recupera 1 vida (até MAX_LIVES).
            // Se houver carga extra, pode gerar múltiplas vidas (até o limite).
            while (lifeCharge >= LIFE_CHARGE_REQUIRED && lives < MAX_LIVES) {
                lives = Math.min(MAX_LIVES, lives + 1);
                lifeCharge -= LIFE_CHARGE_REQUIRED;
            }
            gameLivesSpan.textContent = lives;

            // feedback visual rápido quando recupera ao menos 1 vida
            if (gameArea.style.borderColor !== '') {
                // já existe algum estilo, apenas flashar quando houve recuperação
            }
            // flash verde se recuperou alguma vida
            // (apenas visual: detecta se lifeCharge foi reduzido recentemente)
            // Para simplicidade, flash se a vida aumentou
            // (não mantém prevBorder detalhado)
            if (lives > 0) {
                const prevBorder = gameArea.style.borderColor;
                gameArea.style.borderColor = '#4ade80'; // verde claro
                setTimeout(() => {
                    gameArea.style.borderColor = prevBorder || '#3a506b';
                }, 300);
            }
        }
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
    // Só aumenta a dificuldade a cada DIFFICULTY_STEP gerações
    if (generationCount % DIFFICULTY_STEP !== 0) return;

    difficultyLevel++;
    
    // Aumenta o número mínimo de itens conforme a dificuldade aumenta
    MIN_ITEMS_ON_SCREEN = Math.min(8, 4 + Math.floor(difficultyLevel / 2));
    
    // decrementos menores para dar mais tempo antes de ficar muito rápido
    itemSpeed = Math.max(MAX_ITEM_SPEED, itemSpeed - ITEM_SPEED_DECREMENT);
    generationDelay = Math.max(MIN_GENERATION_DELAY, generationDelay - GENERATION_DELAY_DECREMENT);
    
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

    // reset da recarga de vida ao terminar
    lifeCharge = 0;

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

    // reset da recarga de vida ao voltar ao menu
    lifeCharge = 0;

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