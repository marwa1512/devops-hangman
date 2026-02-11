const defaultWords = [
    'DEVOPS', 'AGILE', 'VERSION', 'BRANCH', 'GITHUB', 
    'CHANGES', 'FEATURES', 'HOTFIX', 'CONTINUOUS', 'INTEGRATION',
    'DEPLOYMENT', 'TESTING', 'COMMIT', 'SNAPSHOT', 'CULTURE',
    'PIPELINE', 'DOCKER', 'SCRUM', 'KANBAN', 'MERGE'
];

let gameState = {
    player1: { name: '', score: 0 },
    player2: { name: '', score: 0 },
    currentPlayer: 1,
    currentWord: '',
    guessedLetters: [],
    wrongGuesses: 0,
    maxWrong: 6,
    gameActive: false,
    usedWords: []
};

let wordBank = [];

//edit it for #8 (add applySavedTheme)
document.addEventListener('DOMContentLoaded', function() {
    applySavedTheme();
    loadWordBank();
    generateKeyboard();
});



function toggleTheme() {
    const body = document.body;
    const themeIcon = document.querySelector('.theme-icon');

    const isDark = body.classList.toggle('dark-mode');

    // Persist
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    // Icon rule: 🌙 for light mode, ☀️ for dark mode
    themeIcon.textContent = isDark ? '☀️' : '🌙';
}

//new function to fix issue #8 

function applySavedTheme() {
    const saved = localStorage.getItem('theme') || 'light';
    const body = document.body;
    const themeIcon = document.querySelector('.theme-icon');

    if (saved === 'dark') {
        body.classList.add('dark-mode');
        themeIcon.textContent = '☀️';
    } else {
        body.classList.remove('dark-mode');
        themeIcon.textContent = '🌙';
    }
}


function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    const tabButtons = document.querySelectorAll('.tab');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}
//edit for issue #10
function loadWordBank() {
    let stored = localStorage.getItem('wordBank');

    // Migration (in case older key exists)
    if (!stored) {
        const old = localStorage.getItem('devopsWords');
        if (old) {
            localStorage.setItem('wordBank', old);
            localStorage.removeItem('devopsWords');
            stored = old;
        }
    }

    if (stored) {
        wordBank = JSON.parse(stored);
    } else {
        wordBank = [...defaultWords];
        saveWordBank();
    }

    displayWordBank();
}

// i will add this for issue #10 
function isValidWord(word, ignoreIndex = -1) {
    const w = word.trim().toUpperCase();

    if (!w) return { ok: false, msg: 'Word cannot be empty.' };
    if (!/^[A-Z]+$/.test(w)) return { ok: false, msg: 'Only letters A-Z are allowed.' };

    const duplicateIndex = wordBank.findIndex((x, i) => x === w && i !== ignoreIndex);
    if (duplicateIndex !== -1) return { ok: false, msg: 'Duplicate words are not allowed.' };

    return { ok: true, value: w };
}

function saveWordBank() {
    localStorage.setItem('wordBank', JSON.stringify(wordBank));
}


function displayWordBank() {
    const wordList = document.getElementById('wordList');
    const wordCount = document.getElementById('wordCount');
    
    wordCount.textContent = wordBank.length;
    
    if (wordBank.length === 0) {
        wordList.innerHTML = `
            <div class="empty-state">
                <h3>No words in the bank!</h3>
                <p>Add some DevOps terms to get started.</p>
            </div>
        `;
        return;
    }
    
    wordList.innerHTML = '';
    wordBank.forEach((word, index) => {
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
        wordItem.innerHTML = `
            <span class="word">${word}</span>
            <div class="actions">
                <button class="edit-btn" onclick="editWord(${index})">Edit</button>
                <button class="delete-btn" onclick="deleteWord(${index})">Delete</button>
            </div>
        `;
        wordList.appendChild(wordItem);
    });
}
//update for issue #10
function addWord() {
    const input = document.getElementById('newWord');
    const check = isValidWord(input.value);

    if (!check.ok) {
        alert(check.msg);
        return;
    }

    wordBank.push(check.value);
    input.value = '';
    saveWordBank();
    displayWordBank();
}

// update for issue #10 
function editWord(index) {
    const current = wordBank[index];
    const newWord = prompt('Edit word:', current);

    if (newWord === null) return; // user cancelled

    const check = isValidWord(newWord, index);
    if (!check.ok) {
        alert(check.msg);
        return;
    }

    wordBank[index] = check.value;
    saveWordBank();
    displayWordBank();
}


// update for issue #10
function deleteWord(index) {
    const word = wordBank[index];

    if (!confirm(`Delete "${word}"?`)) return;

    wordBank.splice(index, 1);
    saveWordBank();
    displayWordBank();
}


function generateKeyboard() {
    const keyboard = document.getElementById('keyboard');
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    keyboard.innerHTML = '';
    for (let letter of letters) {
        const button = document.createElement('button');
        button.className = 'key';
        button.textContent = letter;
        button.onclick = () => guessLetter(letter);
        button.id = 'key-' + letter;
        keyboard.appendChild(button);
    }
}

function startGame() {
    // this will colse issue #1 
    const p1Name = document.getElementById('player1Name').value.trim();
    const p2Name = document.getElementById('player2Name').value.trim();

    // Validate: not empty
    if (!p1Name || !p2Name) {
        alert('Please enter names for both players.');
        return;
    }

    // Validate: different names (case-insensitive)
    if (p1Name.toLowerCase() === p2Name.toLowerCase()) {
        alert('Player names must be different.');
        return;
    }

    gameState.player1.name = p1Name;
    gameState.player2.name = p2Name;

    document.getElementById('player1Display').textContent = gameState.player1.name;
    document.getElementById('player2Display').textContent = gameState.player2.name;

    document.getElementById('gameArea').style.display = 'block';

    gameState.currentPlayer = 2; // so nextRound switches to player 1

    nextRound();
}


function nextRound() {

    // 1) Switch player at the start of every new round
    gameState.currentPlayer = (gameState.currentPlayer === 1) ? 2 : 1;

    // 2) Validate word bank
    if (wordBank.length === 0) {
        alert('No words in the word bank! Add some words first.');
        return;
    }

    // 3) Reset round state
    gameState.guessedLetters = [];
    gameState.wrongGuesses = 0;
    gameState.gameActive = true;

    // 4) Pick a new word
    const randomIndex = Math.floor(Math.random() * wordBank.length);
    gameState.currentWord = wordBank[randomIndex];

    // 5) Reset UI
    document.getElementById('gameStatus').classList.remove('show');
    document.getElementById('gameStatus').className = 'game-status';

    resetHangman();
    resetKeyboard();

    // 6) Refresh UI values
    updateWordDisplay();
    updateWrongLetters();
    updateLives();
    updateCurrentPlayer(); // this updates the UI highlight/name
}


function guessLetter(letter) {
    if (!gameState.gameActive) return;
    
    if (gameState.guessedLetters.includes(letter)) {
        return;
    }
    
    gameState.guessedLetters.push(letter);
    
    if (!gameState.currentWord.includes(letter)) {
        gameState.wrongGuesses++;
        updateHangman();
    }
    
    updateWordDisplay();
    updateWrongLetters();
    updateLives();
    checkGameStatus();
}

function updateWordDisplay() {
    const display = document.getElementById('wordDisplay');
    let displayText = '';
    
    for (let letter of gameState.currentWord) {
        if (gameState.guessedLetters.includes(letter)) {
            displayText += letter + ' ';
        } else {
            displayText += '_ ';
        }
    }
    
    display.textContent = displayText.trim();
}

function updateWrongLetters() {
    //after the fix 
    const wrongLettersDiv = document.getElementById('wrongLetters');
    const wrong = gameState.guessedLetters.filter(letter =>
        !gameState.currentWord.includes(letter)
    );

    if (wrong.length === 0) {
        wrongLettersDiv.textContent = 'None yet';
    } else {
        wrongLettersDiv.textContent = wrong.join(', ');
    }
}


function updateLives() {
    //after edit 
    const livesLeft = gameState.maxWrong - gameState.wrongGuesses;
    document.getElementById('livesLeft').textContent = Math.max(0, livesLeft);
}


function updateHangman() {
    const parts = ['head', 'body', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
    
    const wrongOrder = ['head', 'leftArm', 'rightArm', 'body', 'leftLeg', 'rightLeg'];
    const partIndex = gameState.wrongGuesses - 1;
    
    if (partIndex >= 0 && partIndex < wrongOrder.length) {
        const partToShow = wrongOrder[partIndex];
        document.getElementById(partToShow).style.display = 'block';
    }
}

function resetHangman() {
    const parts = ['head', 'body', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
    parts.forEach(part => {
        document.getElementById(part).style.display = 'none';
    });
}

function resetKeyboard() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let letter of letters) {
        const button = document.getElementById('key-' + letter);
        if (button) {
            button.disabled = false;
        }
    }
}

function updateCurrentPlayer() {
    const player1Div = document.getElementById('player1Score');
    const player2Div = document.getElementById('player2Score');
    
    if (gameState.currentPlayer === 1) {
        player1Div.classList.add('active');
        player2Div.classList.remove('active');
    } else {
        player1Div.classList.remove('active');
        player2Div.classList.add('active');
    }
}

function checkGameStatus() {
    const allLettersGuessed = [...gameState.currentWord].every(letter =>
        gameState.guessedLetters.includes(letter)
    );
    
    if (allLettersGuessed) {
        gameWon();
        return;
    }
    
    if (gameState.wrongGuesses >= gameState.maxWrong) {
        gameLost();
        return;
    }
}

function gameWon() {
    gameState.gameActive = false;

    // Award points to the CURRENT player (the one who guessed the word)
    if (gameState.currentPlayer === 1) {
        gameState.player1.score += 10;
        document.getElementById('score1').textContent = gameState.player1.score;
    } else {
        gameState.player2.score += 10;
        document.getElementById('score2').textContent = gameState.player2.score;
    }

    const statusDiv = document.getElementById('gameStatus');
    const statusMsg = document.getElementById('statusMessage');

    const winnerName = (gameState.currentPlayer === 1)
        ? gameState.player1.name
        : gameState.player2.name;

    statusMsg.textContent = `🎉 ${winnerName} won! The word was: ${gameState.currentWord}`;
    statusDiv.classList.add('show', 'winner');
}


function gameLost() {
    gameState.gameActive = false;
    
    const statusDiv = document.getElementById('gameStatus');
    const statusMsg = document.getElementById('statusMessage');
    
    const currentPlayerName = gameState.currentPlayer === 1 ? 
        gameState.player1.name : gameState.player2.name;
    
    statusMsg.textContent = `😢 ${currentPlayerName} lost! The word was: ${gameState.currentWord}`;
    statusDiv.classList.add('show', 'loser');
    
    //gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
}
