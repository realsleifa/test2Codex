let dust = 0;
let dustPerClick = 1;
let autoCount = 0;
let autoCost = 10;
let multiplier = 1;
let multiplierCost = 50;
let prestigePoints = 0;
let achievements = new Set();

function updateDisplay() {
  document.getElementById('dust').textContent = Math.floor(dust);
  document.getElementById('auto-count').textContent = autoCount;
  document.getElementById('auto-cost').textContent = autoCost;
  document.getElementById('multiplier-level').textContent = multiplier;
  document.getElementById('multiplier-cost').textContent = multiplierCost;
  document.getElementById('prestige-points').textContent = prestigePoints;
}

document.getElementById('collect').addEventListener('click', () => {
  dust += dustPerClick * multiplier * (1 + prestigePoints / 100);
  updateDisplay();
  checkAchievements();
});

document.getElementById('buy-auto').addEventListener('click', () => {
  if (dust >= autoCost) {
    dust -= autoCost;
    autoCount++;
    autoCost = Math.floor(autoCost * 1.5);
    updateDisplay();
    checkAchievements();
  }
});

document.getElementById('buy-multiplier').addEventListener('click', () => {
  if (dust >= multiplierCost) {
    dust -= multiplierCost;
    multiplier++;
    multiplierCost = Math.floor(multiplierCost * 2);
    updateDisplay();
    checkAchievements();
  }
});

setInterval(() => {
  dust += autoCount * multiplier * (1 + prestigePoints / 100);
  updateDisplay();
  checkAchievements();
}, 1000);

function checkAchievements() {
  if (dust >= 100 && !achievements.has('hundert')) {
    achievements.add('hundert');
    addAchievement('Erstes Hundert!');
  }
  if (dust >= 1000 && !achievements.has('tausend')) {
    achievements.add('tausend');
    addAchievement('Staub-Experte!');
  }
  if (autoCount >= 10 && !achievements.has('auto10')) {
    achievements.add('auto10');
    addAchievement('Automatischer Kapitalist!');
  }
  if (multiplier >= 5 && !achievements.has('multi5')) {
    achievements.add('multi5');
    addAchievement('Laser-Show!');
  }
}

function addAchievement(text) {
  const li = document.createElement('li');
  li.textContent = text;
  document.getElementById('ach-list').appendChild(li);
}

document.getElementById('prestige-btn').addEventListener('click', () => {
  const gained = Math.floor(dust / 1000);
  if (gained > 0) {
    prestigePoints += gained;
    dust = 0;
    autoCount = 0;
    autoCost = 10;
    multiplier = 1;
    multiplierCost = 50;
    achievements.clear();
    document.getElementById('ach-list').innerHTML = '';
    updateDisplay();
    addAchievement(`Prestige +${gained}% Produktion!`);
  }
});

function saveGame() {
  const save = {
    dust,
    autoCount,
    autoCost,
    multiplier,
    multiplierCost,
    prestigePoints,
    achievements: Array.from(achievements),
  };
  localStorage.setItem('idleSave', JSON.stringify(save));
}

function loadGame() {
  const saveStr = localStorage.getItem('idleSave');
  if (!saveStr) return;
  const save = JSON.parse(saveStr);
  dust = save.dust || 0;
  autoCount = save.autoCount || 0;
  autoCost = save.autoCost || 10;
  multiplier = save.multiplier || 1;
  multiplierCost = save.multiplierCost || 50;
  prestigePoints = save.prestigePoints || 0;
  achievements = new Set(save.achievements || []);
  achievements.forEach(addAchievement);
  updateDisplay();
}

loadGame();
updateDisplay();
setInterval(saveGame, 3000);
