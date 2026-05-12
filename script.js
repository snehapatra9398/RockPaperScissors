/* ===================================================
   ROCK PAPER SCISSORS — script.js
   Modes: vs CPU | 2 Player (PvP)
   =================================================== */

// ─────────────────────────────────────────
// STATE
// ─────────────────────────────────────────
const state = {
  mode: null,           // 'cpu' | 'pvp'
  p1Name: 'Player 1',
  p2Name: 'Computer',
  score: { p1: 0, p2: 0, draws: 0 },
  round: 1,
  pvpPhase: 1,          // 1 = waiting for P1, 2 = waiting for P2
  p1Choice: null,
  p2Choice: null,
  busy: false,          // locks input during animations
};

const CHOICES = ['rock', 'paper', 'scissors'];
const EMOJI   = { rock: '✊', paper: '📄', scissors: '✂️' };
const BEATS   = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
const WIN_MSG = {
  rock_scissors:     'Rock crushes Scissors',
  paper_rock:        'Paper covers Rock',
  scissors_paper:    'Scissors cuts Paper',
};

// ─────────────────────────────────────────
// SCREEN NAVIGATION
// ─────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  target.classList.add('active');
  // Re-trigger animation
  target.style.animation = 'none';
  void target.offsetWidth;
  target.style.animation = '';
}

function goBack(screenId) {
  if (screenId === 'screen-mode') {
    resetAll();
    showScreen('screen-mode');
  }
}

// ─────────────────────────────────────────
// MODE SELECT
// ─────────────────────────────────────────
function selectMode(mode) {
  state.mode = mode;
  // Adjust name screen
  const title = document.getElementById('names-title');
  const p2Group = document.getElementById('input-group-p2');
  const labelP1 = document.getElementById('label-p1');
  const labelP2 = document.getElementById('label-p2');
  const inputP1 = document.getElementById('input-p1');
  const inputP2 = document.getElementById('input-p2');

  if (mode === 'cpu') {
    title.textContent = 'Your Name';
    p2Group.style.display = 'none';
    labelP1.textContent = 'Your Name';
    inputP1.placeholder = 'e.g. Rohan';
    inputP2.value = 'Computer';
  } else {
    title.textContent = 'Player Names';
    p2Group.style.display = 'flex';
    labelP1.textContent = 'Player 1 Name';
    labelP2.textContent = 'Player 2 Name';
    inputP1.placeholder = 'e.g. Arjun';
    inputP2.placeholder = 'e.g. Priya';
    inputP2.value = '';
  }

  inputP1.value = '';
  showScreen('screen-names');
}

// ─────────────────────────────────────────
// START GAME
// ─────────────────────────────────────────
function startGame() {
  const p1 = document.getElementById('input-p1').value.trim() || 'Player 1';
  const p2Raw = document.getElementById('input-p2').value.trim();
  const p2 = state.mode === 'cpu'
    ? 'Computer'
    : (p2Raw || 'Player 2');

  state.p1Name = p1;
  state.p2Name = p2;
  state.score  = { p1: 0, p2: 0, draws: 0 };
  state.round  = 1;
  state.busy   = false;

  // Update UI names
  document.getElementById('name-p1-display').textContent = p1;
  document.getElementById('name-p2-display').textContent = p2;
  document.getElementById('arena-name-p1').textContent   = p1;
  document.getElementById('arena-name-p2').textContent   = p2;

  updateScoreboard();
  resetArena();
  updateRoundLabel();
  setupPvpBanner();

  showScreen('screen-game');
}

// ─────────────────────────────────────────
// MOVE LOGIC
// ─────────────────────────────────────────
function makeMove(choice) {
  if (state.busy) return;

  if (state.mode === 'cpu') {
    playCpuRound(choice);
  } else {
    playPvpRound(choice);
  }
}

/* — VS CPU — */
function playCpuRound(p1Choice) {
  state.busy = true;
  const cpuChoice = CHOICES[Math.floor(Math.random() * 3)];
  state.p1Choice = p1Choice;
  state.p2Choice = cpuChoice;

  // Animate choices
  setChoiceDisplay('choice-p1', '⏳');
  setChoiceDisplay('choice-p2', '⏳');
  disableMoveButtons(true);

  setTimeout(() => {
    setChoiceDisplay('choice-p1', EMOJI[p1Choice], true);
    setChoiceDisplay('choice-p2', EMOJI[cpuChoice], true);
    resolveRound(p1Choice, cpuChoice);
  }, 600);
}

/* — 2 PLAYER — */
function playPvpRound(choice) {
  if (state.pvpPhase === 1) {
    state.p1Choice = choice;
    state.pvpPhase = 2;
    setChoiceDisplay('choice-p1', '🔒');
    updatePvpBanner(2);
    // Flash move buttons so P2 knows it's their turn
    highlightMoveButtons('p2');
  } else {
    state.p2Choice = choice;
    state.pvpPhase = 1;
    state.busy = true;
    disableMoveButtons(true);

    // Reveal both
    setTimeout(() => {
      setChoiceDisplay('choice-p1', EMOJI[state.p1Choice], true);
      setChoiceDisplay('choice-p2', EMOJI[state.p2Choice], true);
      resolveRound(state.p1Choice, state.p2Choice);
    }, 400);
  }
}

/* — RESOLVE OUTCOME — */
function resolveRound(c1, c2) {
  let winner = null;
  let isDraw = false;

  if (c1 === c2) {
    isDraw = true;
    state.score.draws++;
  } else if (BEATS[c1] === c2) {
    winner = 'p1';
    state.score.p1++;
  } else {
    winner = 'p2';
    state.score.p2++;
  }

  updateScoreboard(winner);

  const detail = isDraw
    ? "It's a tie!"
    : WIN_MSG[`${isDraw ? '' : (winner === 'p1' ? c1 : c2)}_${isDraw ? '' : BEATS[winner === 'p1' ? c1 : c2]}`]
      || `${capitalise(winner === 'p1' ? c1 : c2)} beats ${capitalise(BEATS[winner === 'p1' ? c1 : c2])}`;

  // Clash text
  const clashEl = document.getElementById('clash-text');
  if (isDraw) {
    clashEl.textContent = 'DRAW!'; clashEl.className = 'clash-text draw';
  } else if (winner === 'p1') {
    clashEl.textContent = 'WIN!'; clashEl.className = 'clash-text win';
  } else {
    clashEl.textContent = 'LOSE'; clashEl.className = 'clash-text lose';
  }

  // Show result overlay
  setTimeout(() => showResultOverlay(winner, isDraw, c1, c2, detail), 500);
}

function showResultOverlay(winner, isDraw, c1, c2, detail) {
  const overlay = document.getElementById('result-overlay');
  const emojiEl = document.getElementById('result-emoji');
  const textEl  = document.getElementById('result-text');
  const detailEl = document.getElementById('result-detail');

  if (isDraw) {
    emojiEl.textContent = '🤝';
    textEl.textContent  = "It's a Draw!";
    textEl.style.color  = 'var(--accent3)';
  } else if (winner === 'p1') {
    emojiEl.textContent = '🏆';
    textEl.textContent  = `${state.p1Name} Wins!`;
    textEl.style.color  = 'var(--p1-color)';
  } else {
    emojiEl.textContent = '💀';
    textEl.textContent  = `${state.p2Name} Wins!`;
    textEl.style.color  = 'var(--p2-color)';
  }

  detailEl.textContent = detail;
  overlay.classList.remove('hidden');
}

// ─────────────────────────────────────────
// NEXT ROUND / PLAY AGAIN
// ─────────────────────────────────────────
function nextRound() {
  document.getElementById('result-overlay').classList.add('hidden');
  state.round++;
  state.busy = false;
  state.pvpPhase = 1;
  state.p1Choice = null;
  state.p2Choice = null;

  resetArena();
  updateRoundLabel();
  updateScoreboard();
  disableMoveButtons(false);
  setupPvpBanner();

  document.getElementById('clash-text').textContent = 'Choose!';
  document.getElementById('clash-text').className   = 'clash-text';
}

function playAgain() {
  startGame();
  showScreen('screen-game');
}

// ─────────────────────────────────────────
// SHOW STATS
// ─────────────────────────────────────────
function showStats() {
  const { p1, p2, draws } = state.score;
  const total = p1 + p2 + draws;

  // Winner
  let winnerText, trophyEmoji, subText;
  if (p1 > p2) {
    winnerText  = `${state.p1Name} Wins the Match!`;
    trophyEmoji = '🏆'; subText = 'Legendary performance';
  } else if (p2 > p1) {
    winnerText  = `${state.p2Name} Wins the Match!`;
    trophyEmoji = '🏆'; subText = 'Legendary performance';
  } else {
    winnerText  = "It's a Perfect Draw!";
    trophyEmoji = '🤝'; subText = 'Equally matched rivals';
  }

  document.getElementById('stats-trophy').textContent     = trophyEmoji;
  document.getElementById('stats-winner-text').textContent = winnerText;
  document.getElementById('stats-sub').textContent        = subText;

  document.getElementById('stat-name-p1').textContent = state.p1Name;
  document.getElementById('stat-name-p2').textContent = state.p2Name;
  document.getElementById('stat-total').textContent   = total;
  document.getElementById('stat-draws').textContent   = draws;
  document.getElementById('stat-mode').textContent    = state.mode === 'cpu' ? 'vs CPU' : '2 Players';

  document.getElementById('stat-p1-wins').textContent   = p1;
  document.getElementById('stat-p1-losses').textContent = p2;
  document.getElementById('stat-p1-rate').textContent   = total > 0 ? Math.round((p1 / total) * 100) + '%' : '—';

  document.getElementById('stat-p2-wins').textContent   = p2;
  document.getElementById('stat-p2-losses').textContent = p1;
  document.getElementById('stat-p2-rate').textContent   = total > 0 ? Math.round((p2 / total) * 100) + '%' : '—';

  showScreen('screen-stats');
}

// ─────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────
function setChoiceDisplay(id, emoji, animate = false) {
  const el = document.getElementById(id);
  el.textContent = emoji;
  el.classList.remove('revealed');
  if (animate) {
    void el.offsetWidth;
    el.classList.add('revealed');
  }
}

function updateScoreboard(winner = null) {
  document.getElementById('score-p1').textContent = state.score.p1;
  document.getElementById('score-p2').textContent = state.score.p2;
  document.getElementById('draws-count').textContent = state.score.draws;

  if (winner === 'p1') bumpScore('score-p1');
  if (winner === 'p2') bumpScore('score-p2');
}

function bumpScore(id) {
  const el = document.getElementById(id);
  el.classList.remove('score-bump');
  void el.offsetWidth;
  el.classList.add('score-bump');
}

function updateRoundLabel() {
  document.getElementById('round-num').textContent = state.round;
}

function resetArena() {
  setChoiceDisplay('choice-p1', '❓');
  setChoiceDisplay('choice-p2', '❓');
  disableMoveButtons(false);
  highlightMoveButtons(null);
}

function disableMoveButtons(disabled) {
  ['btn-rock', 'btn-paper', 'btn-scissors'].forEach(id => {
    const btn = document.getElementById(id);
    if (disabled) btn.classList.add('disabled');
    else btn.classList.remove('disabled');
  });
}

function highlightMoveButtons(player) {
  // Reset
  ['btn-rock', 'btn-paper', 'btn-scissors'].forEach(id => {
    document.getElementById(id).style.borderColor = '';
    document.getElementById(id).style.boxShadow  = '';
  });
  if (player === 'p2') {
    ['btn-rock', 'btn-paper', 'btn-scissors'].forEach(id => {
      document.getElementById(id).style.borderColor = 'rgba(255,79,203,0.5)';
    });
  }
}

function setupPvpBanner() {
  const banner = document.getElementById('pvp-turn-banner');
  if (state.mode === 'pvp') {
    banner.classList.remove('hidden');
    updatePvpBanner(1);
  } else {
    banner.classList.add('hidden');
  }
}

function updatePvpBanner(phase) {
  const name = phase === 1 ? state.p1Name : state.p2Name;
  const other = phase === 1 ? state.p2Name : state.p1Name;
  document.getElementById('pvp-turn-text').textContent =
    `${name}'s Turn — look away, ${other}!`;
}

function resetAll() {
  state.mode     = null;
  state.score    = { p1: 0, p2: 0, draws: 0 };
  state.round    = 1;
  state.pvpPhase = 1;
  state.p1Choice = null;
  state.p2Choice = null;
  state.busy     = false;
  document.getElementById('result-overlay').classList.add('hidden');
}

function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─────────────────────────────────────────
// STATS BUTTON — inject into game screen
// ─────────────────────────────────────────
(function injectStatsBtn() {
  const movesSection = document.querySelector('.moves-section');
  const btn = document.createElement('button');
  btn.className = 'cta-btn outline';
  btn.style.cssText = 'margin-top:20px;font-size:0.9rem;padding:10px 24px;letter-spacing:2px;';
  btn.textContent = '📊 View Match Stats';
  btn.onclick = showStats;
  movesSection.after(btn);
})();
