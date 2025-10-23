// Referências aos elementos do DOM
const gameArea = document.getElementById('game-area');
const currentScoreSpan = document.getElementById('current-score');
const gameTimerSpan = document.getElementById('game-timer');
const startButton = document.getElementById('start-button');
const infiniteButton = document.getElementById('infinite-button');
const instructionsDiv = document.getElementById('instructions');
const titleDiv = document.getElementById('title');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreSpan = document = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');
const backButton = document.getElementById('back-button');
const scoreInfo = document.getElementById('score-info');
const timerInfo = document.getElementById('timer-info');
const livesInfo = document.getElementById('lives-info');
const gameLivesSpan = document.getElementById('game-lives');
const startMenu = document.getElementById('start-menu');
const backDuringGame = document.getElementById('back-during-game');

// Variáveis do jogo
let score = 0;
let gameTime = 60; // Segundos de jogo para modo cronometrado
let gameInterval; // Para o temporizador do jogo
let itemGenerationInterval; // Para a geração de itens de poluição
let itemSpeed = 2000;
let generationDelay = 400;
const MAX_ITEM_SPEED = 500;
const MIN_GENERATION_DELAY = 200;
let activeItems = []; // Guarda os itens de poluição atualmente na tela

const possibleKeys = ['w', 'a', 's', 'd', 
    'q', 'e', 'r', 
    't', 'y', 'f', 
    'g', 'h', 'j', 
    'z', 'x', 'c', 
    'v', 'b']; 

let isGameRunning = false;
let difficultyLevel = 0; // Controla o nível de dificuldade

// --- NOVAS VARIÁVEIS PARA DIFICULDADE E PENALIDADES ---
// REMOVIDA: PASS_PENALTY_TIME não será mais usada, pois perderá vida
// REMOVIDA: WRONG_KEY_PENALTY_TIME não será mais usada, pois perderá vida

// Ajustes de vidas
const START_LIVES_TIMED_MODE = 3; // Vidas iniciais para o modo cronometrado
const START_LIVES_INFINITE_MODE = 3; // Vidas iniciais para o modo infinito
const MAX_LIVES = 6; // Cap de vidas acumuláveis (pode ajustar)
let isInfiniteMode = false;
let lives; // Será definido ao iniciar o jogo

// NOVAS VARIÁVEIS PARA RECUPERAÇÃO DE VIDA (MODO INFINITO)
let lifeCharge = 0;
const LIFE_CHARGE_REQUIRED = 10; // Precisa apertar 3 teclas/acertos para recuperar 1 vida

let MIN_ITEMS_ON_SCREEN = 4;
const MAX_ITEMS_ON_SCREEN = 8;
let DIFFICULTY_STEP = 10;
const ITEM_SPEED_DECREMENT = 100;
const GENERATION_DELAY_DECREMENT = 20;

let generationCount = 0; // Adicione esta variável global

// Função para iniciar o jogo
function startGame(mode = 'timed') {
    isInfiniteMode = (mode === 'infinite');

    score = 0;
    gameTime = 60;
    itemSpeed = 2000;
    generationDelay = 400;
    difficultyLevel = 0;
    activeItems = [];
    isGameRunning = true;
    lives = isInfiniteMode ? START_LIVES_INFINITE_MODE : START_LIVES_TIMED_MODE; // Define vidas iniciais com base no modo
    lifeCharge = 0;
    generationCount = 0;

    // Resetar display
    currentScoreSpan.textContent = score;
    gameTimerSpan.textContent = gameTime;
    gameLivesSpan.textContent = lives;
    gameArea.innerHTML = '';
    
    // Esconder/Mostrar elementos
    gameOverScreen.classList.add('hidden');
    startMenu.classList.add('hidden');
    instructionsDiv.classList.add('hidden');
    titleDiv.classList.add('hidden');
    document.getElementById('story').classList.add('hidden');
    scoreInfo.classList.remove('hidden');
    livesInfo.classList.remove('hidden');
    backDuringGame.classList.remove('hidden');

    // Lógica para mostrar/esconder o timer com base no modo
    if (isInfiniteMode) {
        timerInfo.classList.add('hidden');
        clearInterval(gameInterval);
    } else {
        timerInfo.classList.remove('hidden');
        // Timer
        clearInterval(gameInterval);
        gameInterval = setInterval(() => {
            gameTime--;
            gameTimerSpan.textContent = gameTime;
            if (gameTime <= 0 && lives > 0) { // O jogo termina por tempo no modo cronometrado
                endGame(true); // true indica vitória se o tempo acabar e não tiver perdido vidas antes
            } else if (gameTime <= 0 && lives <= 0) {
                endGame(false); // Perdeu por tempo e sem vidas
            }
        }, 1000);
    }

    clearInterval(itemGenerationInterval);
    itemGenerationInterval = setInterval(generatePollutionItem, generationDelay);

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

        // MUDANÇA: Agora, perder vidas em AMBOS os modos se um item passar
        lives = Math.max(0, lives - 1);
        gameLivesSpan.textContent = lives;
        if (lives <= 0) {
            endGame(false); // Fim de jogo por perder todas as vidas
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

    // Se a tecla pressionada NÃO é uma das possíveisKeys, é um erro de digitação
    if (!possibleKeys.includes(pressedKey)) {
        // MUDANÇA: Perde vida em AMBOS os modos se apertar tecla errada
        lives = Math.max(0, lives - 1);
        gameLivesSpan.textContent = lives;
        
        if (lives <= 0) {
            endGame(false); // Fim de jogo por perder todas as vidas
        }

        // Feedback visual de erro
        gameArea.style.borderColor = '#ff4d4d';
        setTimeout(() => {
            gameArea.style.borderColor = '#3a506b';
        }, 150);
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

        // Recuperação de vida funciona em ambos os modos
        lifeCharge++;
        while (lifeCharge >= LIFE_CHARGE_REQUIRED && lives < MAX_LIVES) {
            lives = Math.min(MAX_LIVES, lives + 1);
            lifeCharge -= LIFE_CHARGE_REQUIRED;
        }
        gameLivesSpan.textContent = lives;
    } else {
        // Perda de vida ao apertar tecla de item que não existe (ou já passou/foi acertado por outro evento)
        lives = Math.max(0, lives - 1);
        gameLivesSpan.textContent = lives;
        
        if (lives <= 0) {
            endGame(false);
        }

        // Feedback visual de erro
        gameArea.style.borderColor = '#ff4d4d';
        setTimeout(() => {
            gameArea.style.borderColor = '#3a506b';
        }, 150);
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
function endGame(victory = false) {
    isGameRunning = false;
    clearInterval(gameInterval);
    clearInterval(itemGenerationInterval);
    document.removeEventListener('keydown', handleKeyPress);

    finalScoreSpan.textContent = score;
    gameOverScreen.classList.remove('hidden');
    
    // Modificar o texto baseado em vitória ou derrota
    const gameOverTitle = gameOverScreen.querySelector('h2');
    if (victory) {
        gameOverTitle.textContent = 'VITÓRIA!';
        gameOverTitle.style.color = '#4ade80'; // Verde para vitória
    } else {
        gameOverTitle.textContent = 'FIM DE JOGO!';
        gameOverTitle.style.color = '#ff6b6b'; // Vermelho para derrota
    }

    // Limpar e esconder elementos
    activeItems.forEach(item => {
        if (item.parentNode === gameArea) {
            gameArea.removeChild(item);
        }
    });
    activeItems = [];
    lifeCharge = 0;

    scoreInfo.classList.add('hidden');
    timerInfo.classList.add('hidden'); // Ocultar o timer ao fim do jogo, independente do modo
    livesInfo.classList.add('hidden');
    backDuringGame.classList.add('hidden');
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
    gameTimerSpan.textContent = 60; // Resetar o timer para o valor padrão
    // MUDANÇA: Resetar vidas para o valor inicial do modo cronometrado
    gameLivesSpan.textContent = START_LIVES_TIMED_MODE; 

    // reset da recarga de vida ao voltar ao menu
    lifeCharge = 0;

    // Mostrar menu / esconder game over
    gameOverScreen.classList.add('hidden');
    startMenu.classList.remove('hidden');
    instructionsDiv.classList.remove('hidden');
    titleDiv.classList.remove('hidden');
    document.getElementById('story').classList.remove('hidden');
    scoreInfo.classList.add('hidden');
    timerInfo.classList.add('hidden');
    livesInfo.classList.add('hidden');
}

// Event Listeners para botões
startButton.addEventListener('click', () => startGame('timed'));
infiniteButton.addEventListener('click', () => startGame('infinite'));
restartButton.addEventListener('click', () => startGame(isInfiniteMode ? 'infinite' : 'timed'));
backButton.addEventListener('click', backToMenu);
backDuringGame.addEventListener('click', () => {
    if (confirm('Deseja realmente voltar ao menu? O progresso será perdido.')) {
        backToMenu();
    }
});

// Inicialização: Esconder tela de game over e score/timer no início
gameOverScreen.classList.add('hidden');
scoreInfo.classList.add('hidden');
timerInfo.classList.add('hidden');
livesInfo.classList.add('hidden');