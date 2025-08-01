const e = React.createElement;
const ACHIEVEMENTS = [
  { id: 'ore100', text: 'Sammle 100 Erz', check: g => g.resources.ore >= 100 },
  { id: 'ore1000', text: 'Sammle 1.000 Erz', check: g => g.resources.ore >= 1000 },
  { id: 'miner10', text: 'Besitze 10 Miner', check: g => g.workers.miner >= 10 },
  { id: 'crystal1', text: 'Erhalte einen Kristall', check: g => g.resources.crystal >= 1 },
  { id: 'energy1', text: 'Erhalte Energie', check: g => g.resources.energy >= 1 },
  { id: 'prestige1', text: 'Führe Prestige aus', check: g => g.prestige.stars >= 1 }
];

function loadGame() {
  try {
    const data = JSON.parse(localStorage.getItem('idleReactSave'));
    if (data) return { ...data, lastTick: Date.now() };
  } catch (e) {}
  return {
    resources: { ore: 0, crystal: 0, energy: 0 },
    perClick: { ore: 1 },
    workers: { miner: 0, extractor: 0, generator: 0 },
    costs: { miner: 10, extractor: 100, generator: 1000, clickUpgrade: 50, workerUpgrade: 250 },
    multiplier: { click: 1, worker: 1 },
    prestige: { stars: 0 },
    achievements: {},
    lastTick: Date.now()
  };
}

function saveGame(game) {
  try {
    localStorage.setItem('idleReactSave', JSON.stringify(game));
  } catch (e) {}
}

function App() {
  const [game, setGame] = React.useState(loadGame());
  const [tab, setTab] = React.useState('mine');
  const [message, setMessage] = React.useState('');

  // offline progress
  React.useEffect(() => {
    setGame(g => {
      const now = Date.now();
      const diff = Math.floor((now - g.lastTick) / 1000);
      if (diff <= 0) return g;
      const pm = 1 + g.prestige.stars * 0.2;
      return {
        ...g,
        resources: {
          ore: g.resources.ore + g.workers.miner * g.multiplier.worker * pm * diff,
          crystal: g.resources.crystal + g.workers.extractor * g.multiplier.worker * pm * diff,
          energy: g.resources.energy + g.workers.generator * g.multiplier.worker * pm * diff
        },
        lastTick: now
      };
    });
  }, []);

  // tick + autosave
  React.useEffect(() => {
    const id = setInterval(() => {
      setGame(g => {
        const pm = 1 + g.prestige.stars * 0.2;
        const oreGain = g.workers.miner * g.multiplier.worker * pm;
        const crystalGain = g.workers.extractor * g.multiplier.worker * pm;
        const energyGain = g.workers.generator * g.multiplier.worker * pm;
        const newGame = {
          ...g,
          resources: {
            ore: g.resources.ore + oreGain,
            crystal: g.resources.crystal + crystalGain,
            energy: g.resources.energy + energyGain
          },
          lastTick: Date.now()
        };
        saveGame(newGame);
        return newGame;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // random events
  React.useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() < 0.1) {
        const reward = Math.floor(50 + Math.random() * 50);
        setGame(g => ({ ...g, resources: { ...g.resources, ore: g.resources.ore + reward } }));
        setMessage(`Meteor gefunden! +${reward} Erz`);
        setTimeout(() => setMessage(''), 4000);
      }
    }, 30000);
    return () => clearInterval(id);
  }, []);

  // achievements
  React.useEffect(() => {
    ACHIEVEMENTS.forEach(a => {
      if (!game.achievements[a.id] && a.check(game)) {
        setGame(g => ({ ...g, achievements: { ...g.achievements, [a.id]: true } }));
      }
    });
  }, [game]);

  const prestigeMult = 1 + game.prestige.stars * 0.2;

  const mine = () => {
    setGame(g => ({
      ...g,
      resources: { ...g.resources, ore: g.resources.ore + g.perClick.ore * g.multiplier.click * prestigeMult }
    }));
  };

  const buyWorker = type => {
    setGame(g => {
      const cost = g.costs[type];
      if (g.resources.ore < cost) return g;
      return {
        ...g,
        resources: { ...g.resources, ore: g.resources.ore - cost },
        workers: { ...g.workers, [type]: g.workers[type] + 1 },
        costs: { ...g.costs, [type]: Math.floor(cost * 1.15) }
      };
    });
  };

  const buyClickUpgrade = () => {
    setGame(g => {
      const cost = g.costs.clickUpgrade;
      if (g.resources.crystal < cost) return g;
      return {
        ...g,
        resources: { ...g.resources, crystal: g.resources.crystal - cost },
        multiplier: { ...g.multiplier, click: g.multiplier.click + 1 },
        costs: { ...g.costs, clickUpgrade: Math.floor(cost * 2) }
      };
    });
  };

  const buyWorkerUpgrade = () => {
    setGame(g => {
      const cost = g.costs.workerUpgrade;
      if (g.resources.energy < cost) return g;
      return {
        ...g,
        resources: { ...g.resources, energy: g.resources.energy - cost },
        multiplier: { ...g.multiplier, worker: parseFloat((g.multiplier.worker + 0.5).toFixed(1)) },
        costs: { ...g.costs, workerUpgrade: Math.floor(cost * 2) }
      };
    });
  };

  const doPrestige = () => {
    setGame(g => {
      const total = g.resources.ore + g.resources.crystal + g.resources.energy;
      const gain = Math.floor(total / 10000);
      if (gain <= 0) return g;
      const newGame = {
        resources: { ore: 0, crystal: 0, energy: 0 },
        perClick: { ore: 1 },
        workers: { miner: 0, extractor: 0, generator: 0 },
        costs: { miner: 10, extractor: 100, generator: 1000, clickUpgrade: 50, workerUpgrade: 250 },
        multiplier: { click: 1, worker: 1 },
        prestige: { stars: g.prestige.stars + gain },
        achievements: g.achievements,
        lastTick: Date.now()
      };
      saveGame(newGame);
      return newGame;
    });
  };

  const renderTab = () => {
    switch (tab) {
      case 'mine':
        return e('div', null,
          e('div', { className: 'resource' }, `Erz: ${Math.floor(game.resources.ore)}`),
          e('div', { className: 'resource' }, `Kristall: ${Math.floor(game.resources.crystal)}`),
          e('div', { className: 'resource' }, `Energie: ${Math.floor(game.resources.energy)}`),
          e('button', { onClick: mine }, `Erz abbauen (+${game.perClick.ore * game.multiplier.click * prestigeMult})`),
          message ? e('div', { className: 'message' }, message) : null
        );
      case 'upgrades':
        return e('div', null,
          e('h3', null, 'Arbeiter'),
          e('button', { onClick: () => buyWorker('miner') }, `Miner (${game.workers.miner}) - Kosten: ${game.costs.miner} Erz`),
          e('button', { onClick: () => buyWorker('extractor') }, `Extractor (${game.workers.extractor}) - Kosten: ${game.costs.extractor} Erz`),
          e('button', { onClick: () => buyWorker('generator') }, `Generator (${game.workers.generator}) - Kosten: ${game.costs.generator} Erz`),
          e('h3', null, 'Upgrades'),
          e('button', { onClick: buyClickUpgrade }, `Click-Stufe (${game.multiplier.click}x) - Kosten: ${game.costs.clickUpgrade} Kristall`),
          e('button', { onClick: buyWorkerUpgrade }, `Arbeiter-Stufe (${game.multiplier.worker.toFixed(1)}x) - Kosten: ${game.costs.workerUpgrade} Energie`)
        );
      case 'achievements':
        return e('ul', { id: 'achievements' },
          ACHIEVEMENTS.filter(a => game.achievements[a.id]).map(a =>
            e('li', { key: a.id }, a.text)
          )
        );
      case 'prestige':
        const total = game.resources.ore + game.resources.crystal + game.resources.energy;
        const gain = Math.floor(total / 10000);
        return e('div', null,
          e('p', null, `Sterne: ${game.prestige.stars} (x${(1 + game.prestige.stars * 0.2).toFixed(1)} Produktion)`),
          e('p', null, `Prestige-Bonus verfügbar: +${gain} Sterne`),
          e('button', { onClick: doPrestige }, 'Prestige')
        );
      default:
        return null;
    }
  };

  return e('div', null,
    e('h1', null, 'Idle Space Miner Deluxe'),
    e('div', { id: 'tabs' },
      e('button', { onClick: () => setTab('mine') }, 'Mine'),
      e('button', { onClick: () => setTab('upgrades') }, 'Upgrades'),
      e('button', { onClick: () => setTab('achievements') }, 'Achievements'),
      e('button', { onClick: () => setTab('prestige') }, 'Prestige')
    ),
    renderTab()
  );
}

ReactDOM.render(e(App), document.getElementById('root'));
