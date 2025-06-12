// 定数調整（画面サイズに応じて）
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
let BLOCK_SIZE = 24;
const DIFFICULTY_COLORS = {
    easy: ['red', 'blue', 'yellow'],
    medium: ['red', 'blue', 'yellow', 'white'],
    hard: ['red', 'blue', 'yellow', 'white', 'black']
};
const DIFFICULTY_INFO = {
    easy: '初級：赤、青、黄の3色',
    medium: '中級：初級 + 白の4色',
    hard: '上級：中級 + 黒の5色'
};
const DANGER_LINE_Y = 2; // 危険ラインの位置（上から3行目）

// 画面サイズに応じてブロックサイズを調整
function adjustBlockSize() {
    if (window.innerWidth <= 480) {
        BLOCK_SIZE = 18;
    } else {
        BLOCK_SIZE = 24;
    }
}

let board = [];
let currentBlock = null;
let nextBlock = null;
let score = 0;
let level = 1;
let comboCount = 0;
let gameRunning = false;
let gamePaused = false;
let dropTimer = null;
let selectedDifficulty = 'easy';
let COLORS = DIFFICULTY_COLORS.easy;

// 難易度選択
function selectDifficulty(difficulty) {
    selectedDifficulty = difficulty;
    COLORS = DIFFICULTY_COLORS[difficulty];
    
    // ボタンの選択状態を更新
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    // 説明文を更新
    document.getElementById('difficultyInfo').textContent = DIFFICULTY_INFO[difficulty];
}

// ゲーム初期化
function initGame() {
    board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(null));
    score = 0;
    level = 1;
    comboCount = 0;
    gamePaused = false;
    updateDisplay();
}

// 新しいブロック生成
function createNewBlock() {
    const colors = [];
    for (let i = 0; i < 4; i++) {
        colors.push(COLORS[Math.floor(Math.random() * COLORS.length)]);
    }
    
    return {
        x: 4,
        y: 0,
        colors: colors,
        shape: [
            [0, 1],
            [2, 3]
        ]
    };
}

// 次のブロックを現在のブロックにして、新しい次のブロックを生成
function advanceBlock() {
    if (nextBlock) {
        currentBlock = nextBlock;
        currentBlock.x = 4;
        currentBlock.y = 0;
    } else {
        currentBlock = createNewBlock();
    }
    
    nextBlock = createNewBlock();
    renderNextBlock();
    
    // ゲーム終了チェック（危険ラインでのチェック）
    if (!canMove(currentBlock, 0, 0) || checkDangerLine()) {
        gameOver();
        return false;
    }
    
    return true;
}

// 次のブロック表示
function renderNextBlock() {
    const preview = document.getElementById('nextBlockPreview');
    preview.innerHTML = '';
    
    if (!nextBlock) return;
    
    const miniBlockSize = window.innerWidth <= 480 ? 9 : 12;
    const offsetX = (60 - miniBlockSize * 2) / 2;
    const offsetY = (60 - miniBlockSize * 2) / 2;
    
    if (window.innerWidth <= 480) {
        const previewElement = document.querySelector('.next-block-preview');
        const containerOffsetX = (45 - miniBlockSize * 2) / 2;
        const containerOffsetY = (45 - miniBlockSize * 2) / 2;
        
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 2; col++) {
                const miniBlock = document.createElement('div');
                const colorIndex = nextBlock.shape[row][col];
                miniBlock.className = `mini-block ${nextBlock.colors[colorIndex]}`;
                miniBlock.style.left = `${containerOffsetX + col * miniBlockSize}px`;
                miniBlock.style.top = `${containerOffsetY + row * miniBlockSize}px`;
                preview.appendChild(miniBlock);
            }
        }
    } else {
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 2; col++) {
                const miniBlock = document.createElement('div');
                const colorIndex = nextBlock.shape[row][col];
                miniBlock.className = `mini-block ${nextBlock.colors[colorIndex]}`;
                miniBlock.style.left = `${offsetX + col * miniBlockSize}px`;
                miniBlock.style.top = `${offsetY + row * miniBlockSize}px`;
                preview.appendChild(miniBlock);
            }
        }
    }
}

// 一時停止トグル
function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    
    if (gamePaused) {
        clearInterval(dropTimer);
        document.getElementById('pauseScreen').style.display = 'block';
        document.getElementById('pauseIcon').textContent = '▶';
    } else {
        document.getElementById('pauseScreen').style.display = 'none';
        document.getElementById('pauseIcon').textContent = '⏸';
        startDropTimer();
    }
}

// 危険ラインチェック
function checkDangerLine() {
    for (let x = 0; x < BOARD_WIDTH; x++) {
        if (board[DANGER_LINE_Y][x] !== null) {
            return true;
        }
    }
    return false;
}

// ブロック移動可能チェック
function canMove(block, dx, dy) {
    const newX = block.x + dx;
    const newY = block.y + dy;
    
    for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 2; col++) {
            const x = newX + col;
            const y = newY + row;
            
            if (x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) {
                return false;
            }
            
            if (y >= 0 && board[y][x] !== null) {
                return false;
            }
        }
    }
    
    return true;
}

// ブロック移動
function moveBlock(dx, dy) {
    if (currentBlock && canMove(currentBlock, dx, dy)) {
        currentBlock.x += dx;
        currentBlock.y += dy;
        render();
        return true;
    }
    return false;
}

// ブロック回転
function rotateCurrentBlock() {
    if (!currentBlock) return;
    
    const rotated = [
        currentBlock.colors[2], currentBlock.colors[0],
        currentBlock.colors[3], currentBlock.colors[1]
    ];
    
    const oldColors = currentBlock.colors;
    currentBlock.colors = rotated;
    
    if (!canMove(currentBlock, 0, 0)) {
        currentBlock.colors = oldColors;
    }
    
    render();
}

// ブロック固定
function placeBlock() {
    if (!currentBlock) return;
    
    for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 2; col++) {
            const x = currentBlock.x + col;
            const y = currentBlock.y + row;
            const colorIndex = currentBlock.shape[row][col];
            
            if (y >= 0) {
                board[y][x] = currentBlock.colors[colorIndex];
            }
        }
    }
    
    currentBlock = null;
    checkMatches(() => {
        // マッチ処理完了後に次のブロックを生成
        if (!advanceBlock()) {
            return;
        }
        render();
    });
}

// マッチチェック（4つ以上の同色ブロック）
function checkMatches(callback) {
    const allMatches = [];
    
    // 横方向チェック
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x <= BOARD_WIDTH - 4; x++) {
            const color = board[y][x];
            if (color && board[y][x+1] === color && board[y][x+2] === color && board[y][x+3] === color) {
                const match = [];
                for (let i = 0; i < 4; i++) {
                    match.push(`${y},${x+i}`);
                }
                allMatches.push(match);
            }
        }
    }
    
    // 縦方向チェック
    for (let x = 0; x < BOARD_WIDTH; x++) {
        for (let y = 0; y <= BOARD_HEIGHT - 4; y++) {
            const color = board[y][x];
            if (color && board[y+1][x] === color && board[y+2][x] === color && board[y+3][x] === color) {
                const match = [];
                for (let i = 0; i < 4; i++) {
                    match.push(`${y+i},${x}`);
                }
                allMatches.push(match);
            }
        }
    }
    
    // 斜め方向チェック
    for (let y = 0; y <= BOARD_HEIGHT - 4; y++) {
        for (let x = 0; x <= BOARD_WIDTH - 4; x++) {
            const color = board[y][x];
            if (color && board[y+1][x+1] === color && board[y+2][x+2] === color && board[y+3][x+3] === color) {
                const match = [];
                for (let i = 0; i < 4; i++) {
                    match.push(`${y+i},${x+i}`);
                }
                allMatches.push(match);
            }
        }
        
        for (let x = 3; x < BOARD_WIDTH; x++) {
            const color = board[y][x];
            if (color && board[y+1][x-1] === color && board[y+2][x-2] === color && board[y+3][x-3] === color) {
                const match = [];
                for (let i = 0; i < 4; i++) {
                    match.push(`${y+i},${x-i}`);
                }
                allMatches.push(match);
            }
        }
    }
    
    if (allMatches.length > 0) {
        // すべてのマッチを統合
        const allMatchedPositions = new Set();
        allMatches.forEach(match => {
            match.forEach(pos => allMatchedPositions.add(pos));
        });
        
        animateMatches(allMatchedPositions);
        
        // スコア計算
        let totalScore = 0;
        for (let i = 0; i < allMatches.length; i++) {
            const multiplier = 1 + 0.5 * (comboCount + i);
            const matchScore = allMatches[i].length * 10 * multiplier;
            totalScore += matchScore;
        }
        
        setTimeout(() => {
            removeMatches(allMatchedPositions);
            dropBlocks();
            score += Math.round(totalScore);
            comboCount += allMatches.length; // 連鎖カウンターを増加
            // コンボ表示（2以上の場合のみ）
            if (comboCount >= 2) {
                showComboDisplay();
            }
            
            const newLevel = Math.min(20, Math.floor(score / 500) + 1);
            if (newLevel > level) {
                showLevelUp();
                level = newLevel;
                // レベルアップ時に落下速度を更新
                startDropTimer();
            }
            level = newLevel;
            updateDisplay();
            render();
            
            // 連続マッチをチェック
            checkMatches(callback);
        }, 600);
    } else {
        comboCount = 0;
        // マッチがない場合はコールバックを実行
        if (callback) callback();
    }
}

// レベルアップ表示
function showLevelUp() {
    const levelUpElement = document.getElementById('levelUp');
    levelUpElement.style.display = 'block';
    setTimeout(() => {
        levelUpElement.style.display = 'none';
    }, 2000);
}

// コンボ表示
function showComboDisplay() {
    const comboDisplay = document.getElementById('comboDisplay');
    document.getElementById('comboCount').textContent = comboCount;
    comboDisplay.style.display = 'block';
    setTimeout(() => {
        comboDisplay.style.display = 'none';
    }, 1500);
}

// マッチアニメーション
function animateMatches(matches) {
    matches.forEach(pos => {
        const [y, x] = pos.split(',').map(Number);
        const element = document.querySelector(`[data-pos="${y},${x}"]`);
        if (element) {
            element.classList.add('matched');
        }
    });
}

// マッチしたブロック削除
function removeMatches(matches) {
    matches.forEach(pos => {
        const [y, x] = pos.split(',').map(Number);
        board[y][x] = null;
    });
}

// ブロック落下処理
function dropBlocks() {
    for (let x = 0; x < BOARD_WIDTH; x++) {
        let writePos = BOARD_HEIGHT - 1;
        for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
            if (board[y][x] !== null) {
                board[writePos][x] = board[y][x];
                if (writePos !== y) {
                    board[y][x] = null;
                }
                writePos--;
            }
        }
    }
}

// 描画
function render() {
    const gameBoard = document.getElementById('gameBoard');
    const gameOver = document.getElementById('gameOver');
    const dangerLine = document.getElementById('dangerLine');
    gameBoard.innerHTML = '';
    gameBoard.appendChild(dangerLine);
    gameBoard.appendChild(gameOver);

    // 現在のブロックの投影位置を計算
    let projectedY = currentBlock ? currentBlock.y : -1;
    if (currentBlock) {
        // currentBlockのコピーを作り、y座標だけprojectedYで動かす
        let tempBlock = Object.assign({}, currentBlock);
        while (true) {
            tempBlock.y = projectedY + 1;
            if (canMove(tempBlock, 0, 0)) {
                projectedY++;
            } else {
                break;
            }
        }
    }
    
    // グリッドハイライトを追加（投影位置）
    if (currentBlock && projectedY >= 0) {
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 2; col++) {
                const highlight = document.createElement('div');
                highlight.className = 'grid-highlight';
                highlight.style.left = `${(currentBlock.x + col) * BLOCK_SIZE}px`;
                highlight.style.top = `${(projectedY + row) * BLOCK_SIZE}px`;
                gameBoard.appendChild(highlight);
            }
        }
    }
    
    // 固定されたブロック描画
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (board[y][x]) {
                const block = document.createElement('div');
                block.className = `block ${board[y][x]}`;
                block.style.left = `${x * BLOCK_SIZE}px`;
                block.style.top = `${y * BLOCK_SIZE}px`;
                block.setAttribute('data-pos', `${y},${x}`);
                gameBoard.appendChild(block);
            }
        }
    }
    
    // 現在のブロック描画
    if (currentBlock) {
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 2; col++) {
                const x = currentBlock.x + col;
                const y = currentBlock.y + row;
                
                if (y >= 0) {
                    const block = document.createElement('div');
                    const colorIndex = currentBlock.shape[row][col];
                    block.className = `block ${currentBlock.colors[colorIndex]}`;
                    block.style.left = `${x * BLOCK_SIZE}px`;
                    block.style.top = `${y * BLOCK_SIZE}px`;
                    block.style.opacity = '0.9';
                    gameBoard.appendChild(block);
                }
            }
        }
    }
}

// 表示更新
function updateDisplay() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('combo').textContent = comboCount;
}

// ゲーム終了
function gameOver() {
    gameRunning = false;
    clearInterval(dropTimer);
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').style.display = 'block';
}

// 開始画面表示
function showStartScreen() {
    document.getElementById('startScreen').style.display = 'flex';
    document.getElementById('gameOver').style.display = 'none';
    gameRunning = false;
    initGame();
}

// ドロップタイマー開始
function startDropTimer() {
    clearInterval(dropTimer);
        dropTimer = setInterval(() => {
            if (!gamePaused && gameRunning) {
                if (!moveBlock(0, 1)) {
                    placeBlock();
                }
            }
        }, Math.max(50, 1000 - (level - 1) * 50));
}

// ゲーム開始
function startGame() {
    adjustBlockSize();
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('pauseScreen').style.display = 'none';
    document.getElementById('pauseBtn').style.display = 'flex';
    
    initGame();
    gameRunning = true;
    
    if (advanceBlock()) {
        render();
        startDropTimer();
    }
}

// 操作関数
function moveLeft() {
    if (gameRunning && !gamePaused) moveBlock(-1, 0);
}

function moveRight() {
    if (gameRunning && !gamePaused) moveBlock(1, 0);
}

function rotateBlock() {
    if (gameRunning && !gamePaused) rotateCurrentBlock();
}

function dropBlock() {
    if (gameRunning && !gamePaused) {
        while (moveBlock(0, 1)) {}
        placeBlock();
    }
}

// キーボード操作
document.addEventListener('keydown', (e) => {
    if (!gameRunning || gamePaused) return;
    
    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            moveLeft();
            break;
        case 'ArrowRight':
            e.preventDefault();
            moveRight();
            break;
        case 'ArrowDown':
            e.preventDefault();
            moveBlock(0, 1);
            break;
        case 'ArrowUp':
            e.preventDefault();
            dropBlock();
            break;
        case ' ':
            e.preventDefault();
            rotateBlock();
            break;
        case 'Escape':
            e.preventDefault();
            togglePause();
            break;
    }
});

// タッチ操作対応
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
    if (!gameRunning || gamePaused) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchend', (e) => {
    if (!gameRunning || gamePaused) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    const minSwipeDistance = 30;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
                moveRight();
            } else {
                moveLeft();
            }
        }
    } else {
        if (Math.abs(deltaY) > minSwipeDistance) {
            if (deltaY > 0) {
                dropBlock();
            } else {
                rotateBlock();
            }
        }
    }
});

// ゲームボードタップで回転
document.getElementById('gameBoard').addEventListener('click', (e) => {
    if (gameRunning && !gamePaused) {
        rotateBlock();
    }
});

// 初期表示は開始画面
document.addEventListener('DOMContentLoaded', () => {
    adjustBlockSize();
    showStartScreen();
    
    // 次のブロックを初期化
    nextBlock = createNewBlock();
    renderNextBlock();
});

// 画面サイズ変更時の対応
window.addEventListener('resize', () => {
    adjustBlockSize();
    if (gameRunning) {
        render();
    }
    if (nextBlock) {
        renderNextBlock();
    }
});

// ページ離脱時の自動一時停止
document.addEventListener('visibilitychange', () => {
    if (document.hidden && gameRunning && !gamePaused) {
        togglePause();
    }
});