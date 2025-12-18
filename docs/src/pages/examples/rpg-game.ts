import { createState, computed, reactive, div, button, span, h2, h3, p, ul, li, strong, pre, code, type VNode } from 'elit';
import { codeBlock } from '../../highlight';

// RPG Game Demo Component
export const RPGGameDemo = () => {
  interface Character {
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    attack: number;
    defense: number;
    exp: number;
    expToNextLevel: number;
    gold: number;
  }

  interface Enemy {
    name: string;
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    expReward: number;
    goldReward: number;
    emoji: string;
  }

  interface Item {
    id: number;
    name: string;
    type: 'potion' | 'weapon' | 'armor';
    effect: number;
    price: number;
    emoji: string;
  }

  interface Quest {
    id: number;
    title: string;
    description: string;
    requirement: number;
    progress: number;
    reward: { exp: number; gold: number };
    completed: boolean;
    claimed: boolean;
  }

  // Game state
  const character = createState<Character>({
    name: 'Hero',
    level: 1,
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    attack: 10,
    defense: 5,
    exp: 0,
    expToNextLevel: 100,
    gold: 100
  });

  const inventory = createState<Item[]>([
    { id: 1, name: 'Health Potion', type: 'potion', effect: 30, price: 20, emoji: '🧪' },
    { id: 2, name: 'Mana Potion', type: 'potion', effect: 20, price: 15, emoji: '💙' }
  ]);

  const quests = createState<Quest[]>([
    {
      id: 1,
      title: 'Defeat 5 Enemies',
      description: 'Defeat 5 enemies to prove your strength',
      requirement: 5,
      progress: 0,
      reward: { exp: 150, gold: 100 },
      completed: false,
      claimed: false
    },
    {
      id: 2,
      title: 'Collect 500 Gold',
      description: 'Gather 500 gold coins',
      requirement: 500,
      progress: 0,
      reward: { exp: 200, gold: 0 },
      completed: false,
      claimed: false
    },
    {
      id: 3,
      title: 'Reach Level 3',
      description: 'Train hard and reach level 3',
      requirement: 3,
      progress: 1,
      reward: { exp: 0, gold: 200 },
      completed: false,
      claimed: false
    }
  ]);

  const currentEnemy = createState<Enemy | null>(null);
  const battleLog = createState<string[]>([]);
  const gameView = createState<'home' | 'battle' | 'shop' | 'quests'>('home');
  const shopItems = createState<Item[]>([
    { id: 101, name: 'Health Potion', type: 'potion', effect: 30, price: 20, emoji: '🧪' },
    { id: 102, name: 'Mana Potion', type: 'potion', effect: 20, price: 15, emoji: '💙' },
    { id: 103, name: 'Iron Sword', type: 'weapon', effect: 5, price: 100, emoji: '⚔️' },
    { id: 104, name: 'Steel Shield', type: 'armor', effect: 3, price: 80, emoji: '🛡️' }
  ]);

  let nextItemId = 200;
  let enemiesDefeated = 0;

  const enemyTypes: Enemy[] = [
    { name: 'Slime', hp: 30, maxHp: 30, attack: 5, defense: 2, expReward: 20, goldReward: 15, emoji: '🟢' },
    { name: 'Goblin', hp: 50, maxHp: 50, attack: 8, defense: 3, expReward: 35, goldReward: 25, emoji: '👺' },
    { name: 'Skeleton', hp: 70, maxHp: 70, attack: 12, defense: 5, expReward: 50, goldReward: 40, emoji: '💀' },
    { name: 'Orc', hp: 100, maxHp: 100, attack: 15, defense: 7, expReward: 80, goldReward: 60, emoji: '👹' },
    { name: 'Dragon', hp: 200, maxHp: 200, attack: 25, defense: 10, expReward: 200, goldReward: 150, emoji: '🐉' }
  ];

  // Start battle
  const startBattle = () => {
    const level = character.value.level;
    const maxEnemyIndex = Math.min(level, enemyTypes.length - 1);
    const enemyIndex = Math.floor(Math.random() * (maxEnemyIndex + 1));
    const enemy = { ...enemyTypes[enemyIndex] };

    currentEnemy.value = enemy;
    battleLog.value = [`You encountered a ${enemy.emoji} ${enemy.name}!`];
    gameView.value = 'battle';
  };

  // Player attack
  const playerAttack = () => {
    if (!currentEnemy.value) return;

    const damage = Math.max(1, character.value.attack - currentEnemy.value.defense + Math.floor(Math.random() * 5));
    currentEnemy.value = {
      ...currentEnemy.value,
      hp: Math.max(0, currentEnemy.value.hp - damage)
    };

    battleLog.value = [...battleLog.value, `⚔️ You dealt ${damage} damage!`];

    if (currentEnemy.value.hp <= 0) {
      enemyDefeated();
      return;
    }

    // Enemy counter-attack
    setTimeout(() => enemyAttack(), 500);
  };

  // Enemy attack
  const enemyAttack = () => {
    if (!currentEnemy.value || currentEnemy.value.hp <= 0) return;

    const damage = Math.max(1, currentEnemy.value.attack - character.value.defense + Math.floor(Math.random() * 3));
    character.value = {
      ...character.value,
      hp: Math.max(0, character.value.hp - damage)
    };

    battleLog.value = [...battleLog.value, `💥 ${currentEnemy.value.name} dealt ${damage} damage to you!`];

    if (character.value.hp <= 0) {
      battleLog.value = [...battleLog.value, '💀 You were defeated! Game Over!'];
      setTimeout(() => resetGame(), 2000);
    }
  };

  // Use potion
  const usePotion = (item: Item) => {
    if (item.type === 'potion') {
      if (item.name.includes('Health')) {
        const newHp = Math.min(character.value.maxHp, character.value.hp + item.effect);
        character.value = { ...character.value, hp: newHp };
        battleLog.value = [...battleLog.value, `🧪 Restored ${item.effect} HP!`];
      } else if (item.name.includes('Mana')) {
        const newMp = Math.min(character.value.maxMp, character.value.mp + item.effect);
        character.value = { ...character.value, mp: newMp };
        battleLog.value = [...battleLog.value, `💙 Restored ${item.effect} MP!`];
      }

      // Remove item from inventory
      inventory.value = inventory.value.filter(i => i.id !== item.id);
    }
  };

  // Enemy defeated
  const enemyDefeated = () => {
    if (!currentEnemy.value) return;

    const enemy = currentEnemy.value;
    battleLog.value = [
      ...battleLog.value,
      `✨ You defeated ${enemy.name}!`,
      `💰 +${enemy.goldReward} gold`,
      `⭐ +${enemy.expReward} EXP`
    ];

    character.value = {
      ...character.value,
      gold: character.value.gold + enemy.goldReward,
      exp: character.value.exp + enemy.expReward
    };

    enemiesDefeated++;

    // Update quest progress
    updateQuestProgress(1, 1); // Defeat enemies quest
    updateQuestProgress(2, enemy.goldReward); // Gold quest

    // Check level up
    checkLevelUp();

    setTimeout(() => {
      currentEnemy.value = null;
      gameView.value = 'home';
    }, 2000);
  };

  // Check level up
  const checkLevelUp = () => {
    let char = character.value;
    while (char.exp >= char.expToNextLevel) {
      char = {
        ...char,
        level: char.level + 1,
        exp: char.exp - char.expToNextLevel,
        expToNextLevel: Math.floor(char.expToNextLevel * 1.5),
        maxHp: char.maxHp + 20,
        hp: char.maxHp + 20,
        maxMp: char.maxMp + 10,
        mp: char.maxMp + 10,
        attack: char.attack + 3,
        defense: char.defense + 2
      };

      battleLog.value = [
        ...battleLog.value,
        `🎉 LEVEL UP! You are now level ${char.level}!`
      ];

      // Update level quest
      updateQuestProgress(3, 1);
    }
    character.value = char;
  };

  // Update quest progress
  const updateQuestProgress = (questId: number, amount: number) => {
    quests.value = quests.value.map(q => {
      if (q.id === questId && !q.completed) {
        const newProgress = q.progress + amount;
        const completed = newProgress >= q.requirement;
        return { ...q, progress: newProgress, completed };
      }
      return q;
    });
  };

  // Claim quest reward
  const claimQuest = (questId: number) => {
    const quest = quests.value.find(q => q.id === questId);
    if (!quest || !quest.completed || quest.claimed) return;

    character.value = {
      ...character.value,
      exp: character.value.exp + quest.reward.exp,
      gold: character.value.gold + quest.reward.gold
    };

    quests.value = quests.value.map(q =>
      q.id === questId ? { ...q, claimed: true } : q
    );

    checkLevelUp();
  };

  // Buy item
  const buyItem = (item: Item) => {
    if (character.value.gold < item.price) return;

    character.value = {
      ...character.value,
      gold: character.value.gold - item.price
    };

    if (item.type === 'weapon') {
      character.value = {
        ...character.value,
        attack: character.value.attack + item.effect
      };
    } else if (item.type === 'armor') {
      character.value = {
        ...character.value,
        defense: character.value.defense + item.effect
      };
    } else {
      inventory.value = [...inventory.value, { ...item, id: nextItemId++ }];
    }
  };

  // Reset game
  const resetGame = () => {
    character.value = {
      name: 'Hero',
      level: 1,
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      attack: 10,
      defense: 5,
      exp: 0,
      expToNextLevel: 100,
      gold: 100
    };
    inventory.value = [
      { id: 1, name: 'Health Potion', type: 'potion', effect: 30, price: 20, emoji: '🧪' },
      { id: 2, name: 'Mana Potion', type: 'potion', effect: 20, price: 15, emoji: '💙' }
    ];
    currentEnemy.value = null;
    battleLog.value = [];
    gameView.value = 'home';
    enemiesDefeated = 0;
  };

  // Computed stats
  const hpPercentage = computed([character], (char) => (char.hp / char.maxHp) * 100);
  const mpPercentage = computed([character], (char) => (char.mp / char.maxMp) * 100);
  const expPercentage = computed([character], (char) => (char.exp / char.expToNextLevel) * 100);
  const activeQuests = computed([quests], (questList) =>
    questList.filter(q => !q.claimed)
  );
  const potions = computed([inventory], (items) =>
    items.filter(i => i.type === 'potion')
  );

  return div(
    // Game View Navigation
    div({ style: 'display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap;' },
      reactive(gameView, (view) =>
        div({ style: 'display: flex; gap: 0.5rem; flex-wrap: wrap;' },
          ...[
            { id: 'home', label: '🏠 Home', value: 'home' },
            { id: 'shop', label: '🛒 Shop', value: 'shop' },
            { id: 'quests', label: '📜 Quests', value: 'quests' }
          ].map(btn =>
            button({
              onclick: () => { gameView.value = btn.value as any; },
              disabled: view === 'battle',
              style: `
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                border: 2px solid ${view === btn.value ? 'var(--primary)' : 'var(--border)'};
                background: ${view === btn.value ? 'var(--primary)' : 'var(--bg)'};
                color: ${view === btn.value ? 'white' : 'var(--text-primary)'};
                cursor: ${view === 'battle' ? 'not-allowed' : 'pointer'};
                opacity: ${view === 'battle' ? '0.5' : '1'};
                font-size: 1rem;
                font-weight: 600;
                transition: all 0.2s;
              `
            }, btn.label)
          )
        )
      )
    ),

    // Character Stats (Always visible)
    reactive(character, (char) =>
      div({
        style: `
          background: linear-gradient(135deg, var(--primary) 0%, #667eea 100%);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          color: white;
        `
      },
        div({ style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;' },
          div(
            div({ style: 'font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem;' }, `⚔️ ${char.name}`),
            div({ style: 'font-size: 1rem; opacity: 0.9;' }, `Level ${char.level} • 💰 ${char.gold}G`)
          ),
          div({ style: 'text-align: right;' },
            div({ style: 'font-size: 0.875rem; opacity: 0.9;' }, 'ATK / DEF'),
            div({ style: 'font-size: 1.25rem; font-weight: 600;' }, `${char.attack} / ${char.defense}`)
          )
        ),

        // HP Bar
        div({ style: 'margin-bottom: 0.75rem;' },
          div({ style: 'display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.25rem;' },
            span('❤️ HP'),
            span(`${char.hp} / ${char.maxHp}`)
          ),
          div({ style: 'height: 10px; background: rgba(255,255,255,0.2); border-radius: 5px; overflow: hidden;' },
            div({
              style: `
                height: 100%;
                background: linear-gradient(90deg, #ef4444, #f87171);
                width: ${hpPercentage.value}%;
                transition: width 0.3s;
              `
            })
          )
        ),

        // MP Bar
        div({ style: 'margin-bottom: 0.75rem;' },
          div({ style: 'display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.25rem;' },
            span('💙 MP'),
            span(`${char.mp} / ${char.maxMp}`)
          ),
          div({ style: 'height: 10px; background: rgba(255,255,255,0.2); border-radius: 5px; overflow: hidden;' },
            div({
              style: `
                height: 100%;
                background: linear-gradient(90deg, #3b82f6, #60a5fa);
                width: ${mpPercentage.value}%;
                transition: width 0.3s;
              `
            })
          )
        ),

        // EXP Bar
        div(
          div({ style: 'display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.25rem;' },
            span('⭐ EXP'),
            span(`${char.exp} / ${char.expToNextLevel}`)
          ),
          div({ style: 'height: 10px; background: rgba(255,255,255,0.2); border-radius: 5px; overflow: hidden;' },
            div({
              style: `
                height: 100%;
                background: linear-gradient(90deg, #fbbf24, #fcd34d);
                width: ${expPercentage.value}%;
                transition: width 0.3s;
              `
            })
          )
        )
      )
    ),

    // Main Content Area
    reactive(gameView, (view) => {
      // HOME VIEW
      if (view === 'home') {
        return div(
          // Start Battle Button
          div({ style: 'margin-bottom: 1.5rem;' },
            button({
              onclick: startBattle,
              style: `
                width: 100%;
                padding: 1.5rem;
                border-radius: 12px;
                border: none;
                background: linear-gradient(135deg, #ef4444, #dc2626);
                color: white;
                font-size: 1.25rem;
                font-weight: 700;
                cursor: pointer;
                transition: transform 0.2s;
              `
            }, '⚔️ Start Battle!')
          ),

          // Inventory
          div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 12px; padding: 1.5rem;' },
            div({ style: 'font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; color: var(--primary);' }, '🎒 Inventory'),
            reactive(potions, (items) =>
              items.length === 0
                ? div({ style: 'text-align: center; padding: 2rem; color: var(--text-muted);' }, 'No items in inventory')
                : div({ style: 'display: grid; gap: 0.75rem;' },
                    ...items.map(item =>
                      div({
                        style: `
                          display: flex;
                          justify-content: space-between;
                          align-items: center;
                          padding: 1rem;
                          background: var(--bg);
                          border: 1px solid var(--border);
                          border-radius: 8px;
                        `
                      },
                        div({ style: 'display: flex; align-items: center; gap: 0.75rem;' },
                          span({ style: 'font-size: 1.5rem;' }, item.emoji),
                          div(
                            div({ style: 'font-weight: 600;' }, item.name),
                            div({ style: 'font-size: 0.875rem; color: var(--text-muted);' }, `+${item.effect} ${item.name.includes('Health') ? 'HP' : 'MP'}`)
                          )
                        ),
                        button({
                          onclick: () => usePotion(item),
                          style: `
                            padding: 0.5rem 1rem;
                            border-radius: 6px;
                            border: none;
                            background: var(--primary);
                            color: white;
                            font-weight: 600;
                            cursor: pointer;
                          `
                        }, 'Use')
                      )
                    )
                  )
            )
          )
        );
      }

      // BATTLE VIEW
      if (view === 'battle') {
        return reactive(currentEnemy, (enemy) =>
          enemy
            ? div(
                // Enemy Display
                div({
                  style: `
                    background: linear-gradient(135deg, #dc2626, #991b1b);
                    border-radius: 12px;
                    padding: 1.5rem;
                    margin-bottom: 1.5rem;
                    color: white;
                    text-align: center;
                  `
                },
                  div({ style: 'font-size: 4rem; margin-bottom: 0.5rem;' }, enemy.emoji),
                  div({ style: 'font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem;' }, enemy.name),

                  // Enemy HP Bar
                  reactive(currentEnemy, (currentEnemyState) =>
                    currentEnemyState
                      ? div({ style: 'margin-bottom: 0.5rem;' },
                          div({ style: 'display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.25rem;' },
                            span('❤️ HP'),
                            span(`${currentEnemyState.hp} / ${currentEnemyState.maxHp}`)
                          ),
                          div({ style: 'height: 12px; background: rgba(255,255,255,0.2); border-radius: 6px; overflow: hidden;' },
                            div({
                              style: `
                                height: 100%;
                                background: linear-gradient(90deg, #ef4444, #f87171);
                                width: ${(currentEnemyState.hp / currentEnemyState.maxHp) * 100}%;
                                transition: width 0.3s;
                              `
                            })
                          )
                        )
                      : null
                  ),

                  div({ style: 'display: flex; justify-content: center; gap: 2rem; font-size: 0.875rem; opacity: 0.9;' },
                    span(`⚔️ ATK: ${enemy.attack}`),
                    span(`🛡️ DEF: ${enemy.defense}`)
                  )
                ),

                // Battle Actions
                div({ style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.5rem;' },
                  button({
                    onclick: playerAttack,
                    disabled: enemy.hp <= 0 || character.value.hp <= 0,
                    style: `
                      padding: 1rem;
                      border-radius: 8px;
                      border: none;
                      background: ${enemy.hp <= 0 || character.value.hp <= 0 ? 'var(--border)' : 'var(--primary)'};
                      color: white;
                      font-size: 1.125rem;
                      font-weight: 600;
                      cursor: ${enemy.hp <= 0 || character.value.hp <= 0 ? 'not-allowed' : 'pointer'};
                    `
                  }, '⚔️ Attack'),

                  reactive(potions, (items) =>
                    button({
                      onclick: () => {
                        if (items.length > 0 && items[0]) {
                          usePotion(items[0]);
                          setTimeout(() => enemyAttack(), 500);
                        }
                      },
                      disabled: items.length === 0 || enemy.hp <= 0 || character.value.hp <= 0,
                      style: `
                        padding: 1rem;
                        border-radius: 8px;
                        border: none;
                        background: ${items.length === 0 || enemy.hp <= 0 || character.value.hp <= 0 ? 'var(--border)' : '#10b981'};
                        color: white;
                        font-size: 1.125rem;
                        font-weight: 600;
                        cursor: ${items.length === 0 || enemy.hp <= 0 || character.value.hp <= 0 ? 'not-allowed' : 'pointer'};
                      `
                    }, `🧪 Potion (${items.length})`)
                  )
                ),

                // Battle Log
                div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 12px; padding: 1.5rem;' },
                  div({ style: 'font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; color: var(--primary);' }, '📜 Battle Log'),
                  reactive(battleLog, (logs) =>
                    div({ style: 'max-height: 200px; overflow-y: auto;' },
                      ...logs.map(log =>
                        div({
                          style: `
                            padding: 0.5rem;
                            margin-bottom: 0.25rem;
                            background: var(--bg);
                            border-radius: 6px;
                            font-size: 0.875rem;
                            color: var(--text-muted);
                          `
                        }, log)
                      )
                    )
                  )
                )
              )
            : div({ style: 'text-align: center; padding: 3rem; color: var(--text-muted);' }, 'No active battle')
        );
      }

      // SHOP VIEW
      if (view === 'shop') {
        return div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 12px; padding: 1.5rem;' },
          div({ style: 'font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; color: var(--primary);' }, '🛒 Shop'),
          reactive(shopItems, (items) =>
            div({ style: 'display: grid; gap: 0.75rem;' },
              ...items.map(item =>
                div({
                  style: `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem;
                    background: var(--bg);
                    border: 1px solid var(--border);
                    border-radius: 8px;
                  `
                },
                  div({ style: 'display: flex; align-items: center; gap: 0.75rem;' },
                    span({ style: 'font-size: 1.5rem;' }, item.emoji),
                    div(
                      div({ style: 'font-weight: 600;' }, item.name),
                      div({ style: 'font-size: 0.875rem; color: var(--text-muted);' },
                        item.type === 'weapon' ? `+${item.effect} ATK` :
                        item.type === 'armor' ? `+${item.effect} DEF` :
                        `+${item.effect} ${item.name.includes('Health') ? 'HP' : 'MP'}`
                      )
                    )
                  ),
                  div({ style: 'display: flex; align-items: center; gap: 1rem;' },
                    div({ style: 'font-weight: 600; color: var(--primary);' }, `${item.price}G`),
                    reactive(character, (char) =>
                      button({
                        onclick: () => buyItem(item),
                        disabled: char.gold < item.price,
                        style: `
                          padding: 0.5rem 1rem;
                          border-radius: 6px;
                          border: none;
                          background: ${char.gold < item.price ? 'var(--border)' : 'var(--primary)'};
                          color: white;
                          font-weight: 600;
                          cursor: ${char.gold < item.price ? 'not-allowed' : 'pointer'};
                        `
                      }, 'Buy')
                    )
                  )
                )
              )
            )
          )
        );
      }

      // QUESTS VIEW
      if (view === 'quests') {
        return div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 12px; padding: 1.5rem;' },
          div({ style: 'font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; color: var(--primary);' }, '📜 Quests'),
          reactive(activeQuests, (questList) =>
            questList.length === 0
              ? div({ style: 'text-align: center; padding: 2rem; color: var(--text-muted);' }, 'All quests completed!')
              : div({ style: 'display: grid; gap: 1rem;' },
                  ...questList.map(quest =>
                    div({
                      style: `
                        padding: 1.25rem;
                        background: var(--bg);
                        border: 2px solid ${quest.completed ? 'var(--primary)' : 'var(--border)'};
                        border-radius: 8px;
                      `
                    },
                      div({ style: 'font-weight: 600; font-size: 1.125rem; margin-bottom: 0.5rem;' }, quest.title),
                      div({ style: 'color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1rem;' }, quest.description),

                      // Progress Bar
                      div({ style: 'margin-bottom: 1rem;' },
                        div({ style: 'display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.25rem;' },
                          span('Progress'),
                          span(`${Math.min(quest.progress, quest.requirement)} / ${quest.requirement}`)
                        ),
                        div({ style: 'height: 8px; background: var(--border); border-radius: 4px; overflow: hidden;' },
                          div({
                            style: `
                              height: 100%;
                              background: var(--primary);
                              width: ${Math.min((quest.progress / quest.requirement) * 100, 100)}%;
                              transition: width 0.3s;
                            `
                          })
                        )
                      ),

                      div({ style: 'display: flex; justify-content: space-between; align-items: center;' },
                        div({ style: 'font-size: 0.875rem; color: var(--text-muted);' },
                          `Reward: ${quest.reward.exp > 0 ? `⭐${quest.reward.exp} EXP ` : ''}${quest.reward.gold > 0 ? `💰${quest.reward.gold}G` : ''}`
                        ),
                        button({
                          onclick: () => claimQuest(quest.id),
                          disabled: !quest.completed,
                          style: `
                            padding: 0.5rem 1.25rem;
                            border-radius: 6px;
                            border: none;
                            background: ${quest.completed ? 'var(--primary)' : 'var(--border)'};
                            color: white;
                            font-weight: 600;
                            cursor: ${quest.completed ? 'pointer' : 'not-allowed'};
                          `
                        }, quest.completed ? '✓ Claim' : 'Incomplete')
                      )
                    )
                  )
                )
          )
        );
      }

      return null;
    })
  );
};

// RPG Game source code examples
const rpgStateExample = `import { createState, computed, reactive, div, button } from 'elit';

interface Character {
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  exp: number;
  expToNextLevel: number;
  gold: number;
}

interface Enemy {
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  expReward: number;
  goldReward: number;
  emoji: string;
}

// Character state
const character = createState<Character>({
  name: 'Hero',
  level: 1,
  hp: 100,
  maxHp: 100,
  mp: 50,
  maxMp: 50,
  attack: 10,
  defense: 5,
  exp: 0,
  expToNextLevel: 100,
  gold: 100
});

const currentEnemy = createState<Enemy | null>(null);
const battleLog = createState<string[]>([]);
const gameView = createState<'home' | 'battle' | 'shop' | 'quests'>('home');

// Computed percentages for progress bars
const hpPercentage = computed([character], (char) =>
  (char.hp / char.maxHp) * 100
);

const expPercentage = computed([character], (char) =>
  (char.exp / char.expToNextLevel) * 100
);`;

const rpgBattleExample = `// Start battle with random enemy
const startBattle = () => {
  const level = character.value.level;
  const maxEnemyIndex = Math.min(level, enemyTypes.length - 1);
  const enemyIndex = Math.floor(Math.random() * (maxEnemyIndex + 1));
  const enemy = { ...enemyTypes[enemyIndex] };

  currentEnemy.value = enemy;
  battleLog.value = [\`You encountered a \${enemy.emoji} \${enemy.name}!\`];
  gameView.value = 'battle';
};

// Player attack
const playerAttack = () => {
  if (!currentEnemy.value) return;

  const damage = Math.max(1,
    character.value.attack - currentEnemy.value.defense +
    Math.floor(Math.random() * 5)
  );

  currentEnemy.value = {
    ...currentEnemy.value,
    hp: Math.max(0, currentEnemy.value.hp - damage)
  };

  battleLog.value = [...battleLog.value, \`⚔️ You dealt \${damage} damage!\`];

  if (currentEnemy.value.hp <= 0) {
    enemyDefeated();
    return;
  }

  // Enemy counter-attack
  setTimeout(() => enemyAttack(), 500);
};

// Enemy defeated - give rewards
const enemyDefeated = () => {
  if (!currentEnemy.value) return;

  const enemy = currentEnemy.value;
  character.value = {
    ...character.value,
    gold: character.value.gold + enemy.goldReward,
    exp: character.value.exp + enemy.expReward
  };

  checkLevelUp();
};`;

const rpgLevelUpExample = `// Check and handle level up
const checkLevelUp = () => {
  let char = character.value;

  while (char.exp >= char.expToNextLevel) {
    char = {
      ...char,
      level: char.level + 1,
      exp: char.exp - char.expToNextLevel,
      expToNextLevel: Math.floor(char.expToNextLevel * 1.5),
      maxHp: char.maxHp + 20,
      hp: char.maxHp + 20,
      maxMp: char.maxMp + 10,
      mp: char.maxMp + 10,
      attack: char.attack + 3,
      defense: char.defense + 2
    };

    battleLog.value = [
      ...battleLog.value,
      \`🎉 LEVEL UP! You are now level \${char.level}!\`
    ];
  }

  character.value = char;
};

// Update quest progress
const updateQuestProgress = (questId: number, amount: number) => {
  quests.value = quests.value.map(q => {
    if (q.id === questId && !q.completed) {
      const newProgress = q.progress + amount;
      const completed = newProgress >= q.requirement;
      return { ...q, progress: newProgress, completed };
    }
    return q;
  });
};`;

const rpgRenderExample = `// Character stats display with reactive progress bars
reactive(character, (char) =>
  div({ style: 'background: linear-gradient(135deg, var(--primary) 0%, #667eea 100%); padding: 1.5rem;' },
    div({ style: 'font-size: 1.5rem; font-weight: 700;' },
      \`⚔️ \${char.name}\`
    ),
    div({ style: 'font-size: 1rem;' },
      \`Level \${char.level} • 💰 \${char.gold}G\`
    ),

    // HP Bar
    div({ style: 'margin-top: 1rem;' },
      div(\`❤️ HP: \${char.hp} / \${char.maxHp}\`),
      div({ style: 'height: 10px; background: rgba(255,255,255,0.2); border-radius: 5px;' },
        div({
          style: \`
            height: 100%;
            background: #ef4444;
            width: \${hpPercentage.value}%;
            transition: width 0.3s;
          \`
        })
      )
    ),

    // EXP Bar
    div({ style: 'margin-top: 0.75rem;' },
      div(\`⭐ EXP: \${char.exp} / \${char.expToNextLevel}\`),
      div({ style: 'height: 10px; background: rgba(255,255,255,0.2); border-radius: 5px;' },
        div({
          style: \`
            height: 100%;
            background: #fbbf24;
            width: \${expPercentage.value}%;
            transition: width 0.3s;
          \`
        })
      )
    )
  )
);

// Battle view with enemy display
// IMPORTANT: Enemy HP bar needs nested reactive to update when enemy.hp changes
reactive(currentEnemy, (enemy) =>
  enemy
    ? div(
        div({ style: 'text-align: center;' },
          div({ style: 'font-size: 4rem;' }, enemy.emoji),
          div({ style: 'font-size: 1.5rem; font-weight: 700;' }, enemy.name),

          // Enemy HP Bar - wrapped in reactive to track HP changes
          reactive(currentEnemy, (currentEnemyState) =>
            currentEnemyState
              ? div(
                  div(\`❤️ HP: \${currentEnemyState.hp} / \${currentEnemyState.maxHp}\`),
                  div({ style: 'height: 10px; background: rgba(255,255,255,0.2); border-radius: 5px;' },
                    div({
                      style: \`
                        height: 100%;
                        background: #ef4444;
                        width: \${(currentEnemyState.hp / currentEnemyState.maxHp) * 100}%;
                        transition: width 0.3s;
                      \`
                    })
                  )
                )
              : null
          )
        ),

        button({
          onclick: playerAttack,
          disabled: enemy.hp <= 0
        }, '⚔️ Attack')
      )
    : div('No active battle')
);`;

// RPG Game Content
export const RPGGameContent: VNode = div(
  // Demo
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 2rem 0; font-size: 1.75rem;' }, '🐉 Try the RPG Game'),
    RPGGameDemo()
  ),

  // Overview
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 1rem 0; font-size: 1.75rem;' }, '📖 Overview'),
    p({ style: 'color: var(--text-muted); margin-bottom: 2rem; line-height: 1.8;' },
      'This RPG Game demonstrates advanced state management, turn-based combat system, character progression, ',
      'inventory management, quest system, and shop mechanics using Elit\'s reactive state.'
    ),

    // Key Features
    div({ style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;' },
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '⚔️ Turn-based Combat'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Battle system with attack/defense calculations, damage variance, and enemy AI'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '📈 Character Progression'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Level up system with stat increases, experience tracking, and progressive difficulty'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '🎒 Inventory System'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Item management with potions, weapons, and armor affecting character stats'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '📜 Quest System'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Multiple quests with progress tracking, completion detection, and reward claiming'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '🛒 Shop System'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Purchase items with gold currency, instant stat upgrades, and inventory additions'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '🎮 Multiple Views'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Navigate between home, battle, shop, and quest screens with state persistence'
        )
      )
    )
  ),

  // Source Code
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 1.5rem 0; font-size: 1.75rem;' }, '💻 Source Code'),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '1. State Management'),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(rpgStateExample))),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '2. Battle System'),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(rpgBattleExample))),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '3. Level Up & Quests'),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(rpgLevelUpExample))),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '4. Reactive Rendering'),
    pre({ style: 'margin: 0;' }, code(...codeBlock(rpgRenderExample)))
  ),

  // Key Learnings
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem;' },
    h2({ style: 'margin: 0 0 1.5rem 0; font-size: 1.75rem;' }, '🎓 Key Learnings'),
    ul({ style: 'margin: 0; padding-left: 1.5rem; line-height: 2; color: var(--text-muted);' },
      li(strong('Game state management:'), ' Managing complex character, enemy, inventory, and quest states'),
      li(strong('Turn-based combat:'), ' Implementing attack/defense mechanics with damage calculations'),
      li(strong('Progression system:'), ' Level up mechanics with exponential experience requirements'),
      li(strong('Computed progress bars:'), ' Using computed() for HP, MP, and EXP percentage calculations'),
      li(strong('Nested reactive for updates:'), ' Wrapping enemy HP bar with reactive(currentEnemy) to track state changes and update UI'),
      li(strong('Async game flow:'), ' Using setTimeout for turn delays and battle animations'),
      li(strong('Quest tracking:'), ' Monitoring multiple quest objectives with automatic completion detection'),
      li(strong('Economy system:'), ' Gold currency for purchases with inventory and stat upgrades'),
      li(strong('Multi-view navigation:'), ' Managing different game screens with state-based routing'),
      li(strong('Random encounters:'), ' Scaling enemy difficulty based on player level'),
      li(strong('Battle log:'), ' Maintaining combat history with array state updates'),
      li(strong('Item effects:'), ' Applying immediate stat changes from consumables and equipment'),
      li(strong('Progress visualization:'), ' Animated progress bars with smooth transitions'),
      li(strong('Conditional actions:'), ' Disabling buttons based on game state (dead enemy, no items)'),
      li(strong('Reward claiming:'), ' Quest completion with EXP and gold rewards'),
      li(strong('Game over handling:'), ' Resetting game state on character defeat')
    )
  )
);
