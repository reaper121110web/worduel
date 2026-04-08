/* =============================================
   LEXGRID — script.js
   Full game logic, AI engine (4 levels)
   ============================================= */

'use strict';

// =============================================
// STATE
// =============================================
const State = {
  word:       '',        // 3-letter target word (uppercase)
  size:       5,         // grid dimension
  mode:       'pvp',     // 'pvp' | 'ai'
  difficulty: 'easy',    // 'easy'|'medium'|'hard'|'unbeatable'
  board:      [],        // flat array, length = size*size; null | {letter, player}
  turn:       0,         // total moves made (letter = word[turn % 3])
  gameOver:   false,
  scores:     [0, 0],    // p1, p2
  winCells:   []
};

// =============================================
// DOM REFS
// =============================================
const DOM = {
  setupScreen:     document.getElementById('setup-screen'),
  gameScreen:      document.getElementById('game-screen'),
  wordInput:       document.getElementById('word-input'),
  wordHint:        document.getElementById('word-hint'),
  wordPreview:     [0,1,2].map(i => document.getElementById(`prev-${i}`)),
  gridSizeSelect:  document.getElementById('grid-size'),
  gameModeSelect:  document.getElementById('game-mode'),
  diffGroup:       document.getElementById('difficulty-group'),
  diffBtns:        document.querySelectorAll('.diff-btn'),
  errorMsg:        document.getElementById('error-msg'),
  startBtn:        document.getElementById('start-btn'),
  resetBtn:        document.getElementById('reset-btn'),
  playAgainBtn:    document.getElementById('play-again-btn'),
  gridContainer:   document.getElementById('grid-container'),
  turnLetter:      document.getElementById('turn-letter'),
  turnLetterWrap:  document.querySelector('.turn-letter-wrap'),
  turnPlayer:      document.getElementById('turn-player'),
  p1Card:          document.getElementById('p1-card'),
  p2Card:          document.getElementById('p2-card'),
  p1Name:          document.getElementById('p1-name'),
  p2Name:          document.getElementById('p2-name'),
  p1Score:         document.getElementById('p1-score'),
  p2Score:         document.getElementById('p2-score'),
  wdLetters:       [0,1,2].map(i => document.getElementById(`wd-${i}`)),
  winnerOverlay:   document.getElementById('winner-overlay'),
  winnerTitle:     document.getElementById('winner-title'),
  winnerName:      document.getElementById('winner-name'),
  winnerWord:      document.getElementById('winner-word'),
  winnerPlayAgain: document.getElementById('winner-play-again'),
  winnerNewGame:   document.getElementById('winner-new-game'),
  thinkingOverlay: document.getElementById('thinking-overlay'),
  stars:           document.getElementById('stars'),
  stars2:          document.getElementById('stars2')
};

// =============================================
// STARS BACKGROUND
// =============================================
function buildStars(container, count = 80) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const size = Math.random() * 2.5 + 0.5;
    s.style.cssText = `
      left:${Math.random()*100}%;
      top:${Math.random()*100}%;
      width:${size}px;
      height:${size}px;
      --dur:${(Math.random()*3+2).toFixed(1)}s;
      --delay:${(Math.random()*4).toFixed(1)}s;
      --min-op:${(Math.random()*0.1+0.05).toFixed(2)};
      --max-op:${(Math.random()*0.4+0.2).toFixed(2)};
    `;
    container.appendChild(s);
  }
}

// =============================================
// SETUP SCREEN LOGIC
// =============================================
DOM.wordInput.addEventListener('input', () => {
  const val = DOM.wordInput.value.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
  DOM.wordInput.value = val;

  DOM.wordPreview.forEach((el, i) => {
    if (val[i]) {
      el.textContent = val[i];
      el.classList.add('filled');
    } else {
      el.textContent = '_';
      el.classList.remove('filled');
    }
  });

  const hint = DOM.wordHint;
  if (val.length === 0) {
    hint.textContent = 'Exactly 3 alphabetic characters';
    hint.className = 'input-hint';
  } else if (val.length < 3) {
    hint.textContent = `${3 - val.length} more letter${3 - val.length > 1 ? 's' : ''} needed`;
    hint.className = 'input-hint';
  } else {
    hint.textContent = `"${val}" — ready!`;
    hint.className = 'input-hint success';
  }
  DOM.errorMsg.textContent = '';
});

DOM.gameModeSelect.addEventListener('change', () => {
  DOM.diffGroup.style.display = DOM.gameModeSelect.value === 'ai' ? 'flex' : 'none';
});
// ensure initial state
DOM.diffGroup.style.display = 'none';

DOM.diffBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    DOM.diffBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    State.difficulty = btn.dataset.diff;
  });
});

DOM.startBtn.addEventListener('click', startGame);

function startGame() {
  const word = DOM.wordInput.value.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(word)) {
    DOM.errorMsg.textContent = 'Please enter exactly 3 alphabetic letters.';
    DOM.wordInput.focus();
    return;
  }
  DOM.errorMsg.textContent = '';

  State.word       = word;
  State.size       = parseInt(DOM.gridSizeSelect.value, 10);
  State.mode       = DOM.gameModeSelect.value;
  State.difficulty = document.querySelector('.diff-btn.active').dataset.diff;

  initGame();
  showScreen('game');
}

// =============================================
// GAME INITIALIZATION
// =============================================
function initGame() {
  State.board    = new Array(State.size * State.size).fill(null);
  State.turn     = 0;
  State.gameOver = false;
  State.winCells = [];

  DOM.winnerOverlay.style.display   = 'none';
  DOM.thinkingOverlay.style.display = 'none';

  // Names
  const p2Label = State.mode === 'ai' ? 'AI' : 'Player 2';
  DOM.p1Name.textContent = 'Player 1';
  DOM.p2Name.textContent = p2Label;

  // Player cards identity
  DOM.p1Card.className = 'player-card p1';
  DOM.p2Card.className = 'player-card right p2';

  // Word display
  DOM.wdLetters.forEach((el, i) => {
    el.textContent = State.word[i];
    el.classList.remove('placed');
  });

  buildGrid();
  updateStatus();
}

// =============================================
// SCREEN MANAGEMENT
// =============================================
function showScreen(name) {
  DOM.setupScreen.classList.remove('active');
  DOM.gameScreen.classList.remove('active');
  if (name === 'setup') DOM.setupScreen.classList.add('active');
  else                  DOM.gameScreen.classList.add('active');
}

// =============================================
// GRID BUILDING
// =============================================
function buildGrid() {
  const g = DOM.gridContainer;
  g.innerHTML = '';
  g.style.gridTemplateColumns = `repeat(${State.size}, var(--cell-size))`;
  g.setAttribute('data-size', State.size);

  for (let i = 0; i < State.size * State.size; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.idx = i;
    cell.addEventListener('click', () => handleCellClick(i));
    g.appendChild(cell);
  }
}

function getCellEl(idx) {
  return DOM.gridContainer.querySelector(`.cell[data-idx="${idx}"]`);
}

// =============================================
// RENDER HELPERS
// =============================================
function renderCell(idx) {
  const el   = getCellEl(idx);
  const data = State.board[idx];
  el.innerHTML = '';
  el.className = 'cell';

  if (data) {
    el.classList.add('occupied');
    el.classList.add(data.player === 1 ? 'p1-cell' : 'p2-cell');
    const span = document.createElement('span');
    span.className = 'cell-letter';
    span.textContent = data.letter;
    el.appendChild(span);
  }
}

function updateStatus() {
  if (State.gameOver) return;

  const currentPlayer = (State.turn % 2 === 0) ? 1 : 2;
  const letter        = State.word[State.turn % 3];

  DOM.turnLetter.textContent = letter;
  DOM.turnPlayer.textContent = currentPlayer === 1
    ? 'Player 1'
    : (State.mode === 'ai' ? 'AI' : 'Player 2');

  // Highlight letter in word display
  const letterPos = State.turn % 3;
  DOM.wdLetters.forEach((el, i) => {
    el.classList.toggle('placed', i < letterPos || (State.turn > 0 && i === (letterPos - 1 + 3) % 3 && State.turn % 3 !== (i + 1) % 3));
  });
  // Simpler: just highlight the current one
  DOM.wdLetters.forEach((el, i) => {
    el.style.opacity = i === letterPos ? '1' : '0.5';
    el.style.transform = i === letterPos ? 'scale(1.15)' : 'scale(1)';
  });

  // Active player card
  DOM.p1Card.classList.toggle('active', currentPlayer === 1);
  DOM.p2Card.classList.toggle('active', currentPlayer === 2);

  // Turn letter wrap color
  if (currentPlayer === 1) {
    DOM.turnLetterWrap.classList.remove('p2-turn');
    DOM.turnLetter.style.color = 'var(--gold)';
  } else {
    DOM.turnLetterWrap.classList.add('p2-turn');
    DOM.turnLetter.style.color = 'var(--purple-bright)';
  }

  // Scores
  DOM.p1Score.textContent = State.scores[0];
  DOM.p2Score.textContent = State.scores[1];
}

// =============================================
// CELL CLICK HANDLER
// =============================================
function handleCellClick(idx) {
  if (State.gameOver)         return;
  if (State.board[idx])       return;
  // Block clicks on AI turn
  if (State.mode === 'ai' && State.turn % 2 === 1) return;

  placeMove(idx);
}

// =============================================
// PLACE A MOVE
// =============================================
function placeMove(idx) {
  if (State.board[idx] || State.gameOver) return;

  const player = (State.turn % 2 === 0) ? 1 : 2;
  const letter  = State.word[State.turn % 3];

  State.board[idx] = { letter, player };
  State.turn++;

  renderCell(idx);

  const winResult = checkWin(State.board, State.size, State.word);
  if (winResult) {
    finishGame(player, winResult);
    return;
  }

  // Check draw
  if (State.board.every(c => c !== null)) {
    finishGame(null, null);
    return;
  }

  updateStatus();

  // AI turn
  if (State.mode === 'ai' && !State.gameOver && State.turn % 2 === 1) {
    scheduleAI();
  }
}

// =============================================
// WIN DETECTION
// =============================================
// Returns array of winning cell indices, or null
function checkWin(board, size, word) {
  const wLen = word.length; // always 3
  const dirs = [
    [0, 1],   // right
    [0, -1],  // left
    [1, 0],   // down
    [-1, 0],  // up
    [1, 1],   // down-right
    [1, -1],  // down-left
    [-1, 1],  // up-right
    [-1, -1]  // up-left
  ];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      for (const [dr, dc] of dirs) {
        const cells = [];
        let valid = true;
        for (let k = 0; k < wLen; k++) {
          const nr = r + dr * k;
          const nc = c + dc * k;
          if (nr < 0 || nr >= size || nc < 0 || nc >= size) { valid = false; break; }
          const idx  = nr * size + nc;
          const cell = board[idx];
          if (!cell || cell.letter !== word[k]) { valid = false; break; }
          cells.push(idx);
        }
        if (valid && cells.length === wLen) return cells;
      }
    }
  }
  return null;
}

// =============================================
// FINISH GAME
// =============================================
function finishGame(winner, winCells) {
  State.gameOver = true;
  State.winCells = winCells || [];

  if (winCells) {
    // Stagger win cell animation
    winCells.forEach((idx, i) => {
      setTimeout(() => {
        const el = getCellEl(idx);
        if (el) el.classList.add('win-cell');
      }, i * 80);
    });
  }

  setTimeout(() => {
    if (winner === null) {
      // Draw
      DOM.winnerTitle.textContent = 'Draw!';
      DOM.winnerName.textContent  = 'No Victor';
      DOM.winnerWord.textContent  = State.word;
      DOM.winnerOverlay.style.display = 'flex';
    } else {
      State.scores[winner - 1]++;
      updateStatus();
      const name = winner === 1 ? 'Player 1' : (State.mode === 'ai' ? 'AI' : 'Player 2');
      DOM.winnerTitle.textContent = 'Victory!';
      DOM.winnerName.textContent  = name;
      DOM.winnerWord.textContent  = State.word;
      DOM.winnerOverlay.style.display = 'flex';
    }
  }, winCells ? winCells.length * 80 + 200 : 100);
}

// =============================================
// AI SCHEDULING
// =============================================
function scheduleAI() {
  DOM.thinkingOverlay.style.display = 'flex';
  const delay = State.difficulty === 'unbeatable' ? 100 : 80;
  setTimeout(() => {
    const move = computeAIMove();
    DOM.thinkingOverlay.style.display = 'none';
    if (move !== -1) placeMove(move);
  }, delay);
}

function computeAIMove() {
  const empties = getEmpties(State.board);
  if (empties.length === 0) return -1;

  switch (State.difficulty) {
    case 'easy':       return aiEasy(empties);
    case 'medium':     return aiMedium(empties);
    case 'hard':       return aiHard(empties);
    case 'unbeatable': return aiUnbeatable(empties);
    default:           return aiEasy(empties);
  }
}

function getEmpties(board) {
  const e = [];
  for (let i = 0; i < board.length; i++) if (!board[i]) e.push(i);
  return e;
}

// =============================================
// AI: EASY — pure random
// =============================================
function aiEasy(empties) {
  return empties[Math.floor(Math.random() * empties.length)];
}

// =============================================
// AI: MEDIUM — random + immediate win/block
// =============================================
function aiMedium(empties) {
  // Check immediate win for AI (player 2)
  for (const idx of empties) {
    const board = State.board.slice();
    const letter = State.word[State.turn % 3];
    board[idx] = { letter, player: 2 };
    if (checkWin(board, State.size, State.word)) return idx;
  }
  // Check immediate block (player 1 about to win on next turn)
  const nextTurn = State.turn + 1;
  for (const idx of empties) {
    const board = State.board.slice();
    const letter = State.word[nextTurn % 3];
    board[idx] = { letter, player: 1 };
    if (checkWin(board, State.size, State.word)) return idx;
  }
  return aiEasy(empties);
}

// =============================================
// AI: HARD — minimax depth 3-4, alpha-beta
// =============================================
function aiHard(empties) {
  // Try immediate win first for speed
  for (const idx of empties) {
    const board = State.board.slice();
    board[idx] = { letter: State.word[State.turn % 3], player: 2 };
    if (checkWin(board, State.size, State.word)) return idx;
  }
  // Block immediate loss
  const nextTurn = State.turn + 1;
  for (const idx of empties) {
    const board = State.board.slice();
    board[idx] = { letter: State.word[nextTurn % 3], player: 1 };
    if (checkWin(board, State.size, State.word)) return idx;
  }

  // Limit search space for performance
  const candidates = limitCandidates(empties, State.board, State.size, 12);
  let best = -Infinity, bestMove = candidates[0];

  for (const idx of candidates) {
    const board = State.board.slice();
    const letter = State.word[State.turn % 3];
    board[idx] = { letter, player: 2 };
    const score = minimax(board, State.turn + 1, 3, false, -Infinity, Infinity, State.size, State.word);
    board[idx] = null;
    if (score > best) { best = score; bestMove = idx; }
  }
  return bestMove;
}

// =============================================
// AI: UNBEATABLE — deep minimax + alpha-beta
// =============================================
function aiUnbeatable(empties) {
  // Immediate win
  for (const idx of empties) {
    const board = State.board.slice();
    board[idx] = { letter: State.word[State.turn % 3], player: 2 };
    if (checkWin(board, State.size, State.word)) return idx;
  }
  // Block immediate loss
  const nextTurn = State.turn + 1;
  for (const idx of empties) {
    const board = State.board.slice();
    board[idx] = { letter: State.word[nextTurn % 3], player: 1 };
    if (checkWin(board, State.size, State.word)) return idx;
  }

  const candidates = limitCandidates(empties, State.board, State.size, 16);
  const depth = Math.min(6, Math.max(4, candidates.length > 10 ? 5 : 6));

  let best = -Infinity, bestMove = candidates[0];
  const table = new Map();

  for (const idx of candidates) {
    const board = State.board.slice();
    const letter = State.word[State.turn % 3];
    board[idx] = { letter, player: 2 };
    const score = minimaxAlphaBeta(board, State.turn + 1, depth, false, -Infinity, Infinity, State.size, State.word, table);
    board[idx] = null;
    if (score > best) { best = score; bestMove = idx; }
  }
  return bestMove;
}

// =============================================
// MINIMAX (Hard — no transposition table)
// =============================================
function minimax(board, turnParam, depth, isMaximizing, alpha, beta, size, word) {
  // Terminal checks
  const win = checkWin(board, size, word);
  if (win) {
    // Who just moved? The last placer had turnParam-1 turns
    // isMaximizing: if true, it's AI (p2) to move, so previous move was p1 → p1 won
    return isMaximizing ? -1000 - depth : 1000 + depth;
  }
  if (board.every(c => c !== null)) return 0;
  if (depth === 0) return evaluateBoard(board, size, word);

  const empties = getEmpties(board);
  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const idx of empties) {
      const letter = word[turnParam % 3];
      board[idx] = { letter, player: 2 };
      const score = minimax(board, turnParam + 1, depth - 1, false, alpha, beta, size, word);
      board[idx] = null;
      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (const idx of empties) {
      const letter = word[turnParam % 3];
      board[idx] = { letter, player: 1 };
      const score = minimax(board, turnParam + 1, depth - 1, true, alpha, beta, size, word);
      board[idx] = null;
      minScore = Math.min(minScore, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return minScore;
  }
}

// =============================================
// MINIMAX with transposition table (Unbeatable)
// =============================================
function minimaxAlphaBeta(board, turnParam, depth, isMaximizing, alpha, beta, size, word, table) {
  const key = boardKey(board, turnParam);
  if (table.has(key)) return table.get(key);

  const win = checkWin(board, size, word);
  if (win) {
    const score = isMaximizing ? -1000 - depth : 1000 + depth;
    table.set(key, score);
    return score;
  }
  if (board.every(c => c !== null)) { table.set(key, 0); return 0; }
  if (depth === 0) {
    const s = evaluateBoard(board, size, word);
    table.set(key, s);
    return s;
  }

  const empties = getEmpties(board);
  // Move ordering: center-biased
  const ordered = orderMoves(empties, size);

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const idx of ordered) {
      const letter = word[turnParam % 3];
      board[idx] = { letter, player: 2 };
      const score = minimaxAlphaBeta(board, turnParam + 1, depth - 1, false, alpha, beta, size, word, table);
      board[idx] = null;
      maxScore = Math.max(maxScore, score);
      alpha    = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    table.set(key, maxScore);
    return maxScore;
  } else {
    let minScore = Infinity;
    for (const idx of ordered) {
      const letter = word[turnParam % 3];
      board[idx] = { letter, player: 1 };
      const score = minimaxAlphaBeta(board, turnParam + 1, depth - 1, true, alpha, beta, size, word, table);
      board[idx] = null;
      minScore = Math.min(minScore, score);
      beta     = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    table.set(key, minScore);
    return minScore;
  }
}

function boardKey(board, turn) {
  return board.map(c => c ? c.letter + c.player : '.').join('') + turn;
}

// =============================================
// MOVE ORDERING: center-biased
// =============================================
function orderMoves(empties, size) {
  const center = (size - 1) / 2;
  return empties.slice().sort((a, b) => {
    const ra = Math.floor(a / size), ca = a % size;
    const rb = Math.floor(b / size), cb = b % size;
    const da = Math.abs(ra - center) + Math.abs(ca - center);
    const db = Math.abs(rb - center) + Math.abs(cb - center);
    return da - db;
  });
}

// =============================================
// LIMIT CANDIDATES (proximity-based pruning)
// =============================================
function limitCandidates(empties, board, size, maxCount) {
  if (empties.length <= maxCount) return empties;

  // Prefer cells adjacent to placed cells
  const occupied = new Set();
  board.forEach((c, i) => { if (c) occupied.add(i); });

  if (occupied.size === 0) {
    // First move: pick center region
    return orderMoves(empties, size).slice(0, maxCount);
  }

  const scored = empties.map(idx => {
    const r = Math.floor(idx / size), c = idx % size;
    let adj = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (occupied.has(nr * size + nc)) adj++;
        }
      }
    }
    // Center bonus
    const center = (size - 1) / 2;
    const dist = Math.abs(r - center) + Math.abs(c - center);
    return { idx, score: adj * 10 - dist };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxCount).map(s => s.idx);
}

// =============================================
// BOARD EVALUATION (heuristic)
// =============================================
function evaluateBoard(board, size, word) {
  let score = 0;
  const dirs = [[0,1],[1,0],[1,1],[1,-1],[0,-1],[-1,0],[-1,-1],[-1,1]];
  const wLen = word.length;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      for (const [dr, dc] of dirs) {
        let match = 0, matchP1 = 0, matchP2 = 0;
        let canFit = true;
        for (let k = 0; k < wLen; k++) {
          const nr = r + dr*k, nc = c + dc*k;
          if (nr < 0 || nr >= size || nc < 0 || nc >= size) { canFit = false; break; }
          const cell = board[nr * size + nc];
          if (cell) {
            if (cell.letter === word[k]) {
              if (cell.player === 2) matchP2++;
              else matchP1++;
            } else { canFit = false; break; }
          }
        }
        if (!canFit) continue;
        // Reward p2 partial matches, penalize p1 partial matches
        score += matchP2 * matchP2 * 3;
        score -= matchP1 * matchP1 * 3;
        if (matchP2 === wLen - 1) score += 50;
        if (matchP1 === wLen - 1) score -= 50;
      }
    }
  }
  return score;
}

// =============================================
// CONTROLS
// =============================================
DOM.resetBtn.addEventListener('click', () => {
  initGame();
});

DOM.playAgainBtn.addEventListener('click', () => {
  // Reset board, keep scores, same settings
  State.board    = new Array(State.size * State.size).fill(null);
  State.turn     = 0;
  State.gameOver = false;
  State.winCells = [];
  DOM.winnerOverlay.style.display   = 'none';
  DOM.thinkingOverlay.style.display = 'none';
  DOM.wdLetters.forEach(el => { el.style.opacity = '1'; el.style.transform = 'scale(1)'; });
  buildGrid();
  updateStatus();
});

DOM.winnerPlayAgain.addEventListener('click', () => {
  DOM.playAgainBtn.click();
});

DOM.winnerNewGame.addEventListener('click', () => {
  State.scores = [0, 0];
  DOM.winnerOverlay.style.display = 'none';
  showScreen('setup');
  DOM.setupScreen.classList.add('active');
  DOM.gameScreen.classList.remove('active');
});

// =============================================
// KEYBOARD: Enter to start
// =============================================
DOM.wordInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') DOM.startBtn.click();
});

// =============================================
// INIT
// =============================================
buildStars(DOM.stars,  90);
buildStars(DOM.stars2, 70);
showScreen('setup');
