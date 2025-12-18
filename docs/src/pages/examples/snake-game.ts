import {
  VNode, div, h2, h3, p, ul, li, strong, pre, code, button,
  createState, reactive
} from 'elit';
import { codeBlock } from '../../highlight';

// Snake Game Demo Component
export const SnakeGameDemo = () => {
  type Position = { x: number; y: number };
  type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

  const GRID_SIZE = 15;
  const CELL_SIZE = 20;
  const INITIAL_SPEED = 150;

  const snake = createState<Position[]>([{ x: 7, y: 7 }]);
  const direction = createState<Direction>('RIGHT');
  const food = createState<Position>({ x: 10, y: 10 });
  const score = createState(0);
  const gameOver = createState(false);
  const gameStarted = createState(false);
  let gameInterval: number | null = null;

  const generateFood = () => {
    const snakePositions = snake.value;
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
    } while (snakePositions.some(pos => pos.x === newFood.x && pos.y === newFood.y));
    return newFood;
  };

  const checkCollision = (head: Position): boolean => {
    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    // Self collision
    return snake.value.some((segment, index) =>
      index !== 0 && segment.x === head.x && segment.y === head.y
    );
  };

  const moveSnake = () => {
    if (gameOver.value) return;

    const currentSnake = snake.value;
    const head = { ...currentSnake[0] };

    // Move head
    switch (direction.value) {
      case 'UP': head.y--; break;
      case 'DOWN': head.y++; break;
      case 'LEFT': head.x--; break;
      case 'RIGHT': head.x++; break;
    }

    // Check collision
    if (checkCollision(head)) {
      gameOver.value = true;
      if (gameInterval) clearInterval(gameInterval);
      return;
    }

    const newSnake = [head, ...currentSnake];

    // Check food
    if (head.x === food.value.x && head.y === food.value.y) {
      score.value++;
      food.value = generateFood();
    } else {
      newSnake.pop(); // Remove tail
    }

    snake.value = newSnake;
  };

  const startGame = () => {
    snake.value = [{ x: 7, y: 7 }];
    direction.value = 'RIGHT';
    food.value = generateFood();
    score.value = 0;
    gameOver.value = false;
    gameStarted.value = true;

    if (gameInterval) clearInterval(gameInterval);
    gameInterval = window.setInterval(moveSnake, INITIAL_SPEED);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!gameStarted.value || gameOver.value) return;

    const newDir = (() => {
      switch (e.key) {
        case 'ArrowUp': return 'UP';
        case 'ArrowDown': return 'DOWN';
        case 'ArrowLeft': return 'LEFT';
        case 'ArrowRight': return 'RIGHT';
        default: return null;
      }
    })();

    if (!newDir) return;

    // Prevent 180 degree turns
    const opposites: Record<Direction, Direction> = {
      UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT'
    };

    if (opposites[direction.value] !== newDir) {
      direction.value = newDir;
    }
  };

  // Setup keyboard listener
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown);
  }

  const renderCell = (x: number, y: number, isSnake: boolean, isHead: boolean, isFood: boolean) => {
    let bgColor = 'var(--bg-code)';
    if (isFood) bgColor = '#ef4444';
    if (isSnake) bgColor = isHead ? '#22c55e' : '#4ade80';

    return div({
      style: `
        width: ${CELL_SIZE}px;
        height: ${CELL_SIZE}px;
        background: ${bgColor};
        border: 1px solid var(--border);
        border-radius: ${isFood ? '50%' : '2px'};
        transition: background 0.1s;
      `
    });
  };

  return div(
    // Score & Controls
    div({ style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;' },
      reactive(score, (s: number) =>
        div({ style: 'font-size: 1.5rem; font-weight: bold; color: var(--primary);' }, `Score: ${s}`)
      ),
      div({ style: 'display: flex; gap: 0.5rem;' },
        button({
          onclick: startGame,
          style: 'padding: 0.75rem 1.5rem; border-radius: 8px; border: none; background: var(--primary); color: white; cursor: pointer; font-weight: 600; font-size: 1rem;'
        }, gameStarted.value ? '🔄 Restart Game' : '▶️ Start Game')
      )
    ),

    // Game Over Message
    reactive(gameOver, (over: boolean) =>
      over ? div({
        style: 'background: #ef4444; color: white; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; text-align: center; font-weight: bold; font-size: 1.125rem;'
      }, `💀 Game Over! Final Score: ${score.value}`) : null
    ),

    // Game Grid
    div({ style: 'display: flex; justify-content: center; margin-bottom: 2rem;' },
      reactive(snake, (snakePos: Position[]) =>
        reactive(food, (foodPos: Position) =>
          div({
            style: `
              display: grid;
              grid-template-columns: repeat(${GRID_SIZE}, ${CELL_SIZE}px);
              gap: 0;
              border: 3px solid var(--border);
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            `
          },
            ...Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
              const x = i % GRID_SIZE;
              const y = Math.floor(i / GRID_SIZE);
              const isSnake = snakePos.some(pos => pos.x === x && pos.y === y);
              const isHead = snakePos[0]?.x === x && snakePos[0]?.y === y;
              const isFood = foodPos.x === x && foodPos.y === y;
              return renderCell(x, y, isSnake, isHead, isFood);
            })
          )
        )
      )
    ),

    // Instructions
    div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 12px; padding: 1.5rem;' },
      h3({ style: 'margin: 0 0 1rem 0; color: var(--primary);' }, '🎮 How to Play'),
      ul({ style: 'margin: 0; padding-left: 1.5rem; line-height: 1.8; color: var(--text-muted);' },
        li('Use ', strong('Arrow Keys'), ' (↑ ↓ ← →) to control the snake direction'),
        li('Eat the ', strong({ style: 'color: #ef4444;' }, 'red food'), ' to grow longer and increase your score'),
        li('Avoid hitting the ', strong('walls'), ' or your ', strong('own body')),
        li('The snake gets longer with each food eaten - plan your moves carefully!')
      )
    )
  );
};

// Source code examples
const sourceCodeExample = `import { createState, reactive, div, button } from 'elit';

type Position = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 15;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;

// Game state
const snake = createState<Position[]>([{ x: 7, y: 7 }]);
const direction = createState<Direction>('RIGHT');
const food = createState<Position>({ x: 10, y: 10 });
const score = createState(0);
const gameOver = createState(false);

// Food generation
const generateFood = () => {
  const snakePositions = snake.value;
  let newFood: Position;
  do {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
  } while (snakePositions.some(pos =>
    pos.x === newFood.x && pos.y === newFood.y
  ));
  return newFood;
};

// Collision detection
const checkCollision = (head: Position): boolean => {
  // Wall collision
  if (head.x < 0 || head.x >= GRID_SIZE ||
      head.y < 0 || head.y >= GRID_SIZE) {
    return true;
  }
  // Self collision
  return snake.value.some((segment, index) =>
    index !== 0 && segment.x === head.x && segment.y === head.y
  );
};`;

const gameLoopExample = `// Game loop - runs every 150ms
const moveSnake = () => {
  if (gameOver.value) return;

  const currentSnake = snake.value;
  const head = { ...currentSnake[0] };

  // Move head based on direction
  switch (direction.value) {
    case 'UP': head.y--; break;
    case 'DOWN': head.y++; break;
    case 'LEFT': head.x--; break;
    case 'RIGHT': head.x++; break;
  }

  // Check collision
  if (checkCollision(head)) {
    gameOver.value = true;
    clearInterval(gameInterval);
    return;
  }

  const newSnake = [head, ...currentSnake];

  // Check if ate food
  if (head.x === food.value.x && head.y === food.value.y) {
    score.value++;
    food.value = generateFood();
  } else {
    newSnake.pop(); // Remove tail
  }

  snake.value = newSnake;
};

// Start game
const startGame = () => {
  snake.value = [{ x: 7, y: 7 }];
  direction.value = 'RIGHT';
  food.value = generateFood();
  score.value = 0;
  gameOver.value = false;

  gameInterval = setInterval(moveSnake, INITIAL_SPEED);
};`;

const keyboardHandlingExample = `// Keyboard event handling
const handleKeyDown = (e: KeyboardEvent) => {
  if (gameOver.value) return;

  const newDir = (() => {
    switch (e.key) {
      case 'ArrowUp': return 'UP';
      case 'ArrowDown': return 'DOWN';
      case 'ArrowLeft': return 'LEFT';
      case 'ArrowRight': return 'RIGHT';
      default: return null;
    }
  })();

  if (!newDir) return;

  // Prevent 180 degree turns
  const opposites: Record<Direction, Direction> = {
    UP: 'DOWN', DOWN: 'UP',
    LEFT: 'RIGHT', RIGHT: 'LEFT'
  };

  if (opposites[direction.value] !== newDir) {
    direction.value = newDir;
  }
};

window.addEventListener('keydown', handleKeyDown);`;

const renderingExample = `// Reactive rendering with nested reactive()
reactive(snake, (snakePos: Position[]) =>
  reactive(food, (foodPos: Position) =>
    div({ style: 'display: grid; ...' },
      ...Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
        const x = i % GRID_SIZE;
        const y = Math.floor(i / GRID_SIZE);

        const isSnake = snakePos.some(pos =>
          pos.x === x && pos.y === y
        );
        const isHead = snakePos[0]?.x === x &&
                       snakePos[0]?.y === y;
        const isFood = foodPos.x === x &&
                       foodPos.y === y;

        // Render cell with appropriate color
        return renderCell(x, y, isSnake, isHead, isFood);
      })
    )
  )
);`;

// Snake game content
export const SnakeGameContent: VNode = div(
  // Game Demo
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 2rem 0; font-size: 1.75rem;' }, '🎮 Play the Game'),
    SnakeGameDemo()
  ),

  // Technical Overview
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 1.5rem 0; font-size: 1.75rem;' }, '🔧 Technical Implementation'),
    p({ style: 'color: var(--text-muted); margin-bottom: 2rem; line-height: 1.8;' },
      'This Snake game demonstrates several key concepts in Elit 2.0, including reactive state management, ',
      'event handling, game loops, and efficient rendering. Below is a breakdown of the implementation.'
    ),

    // Key Features
    div({ style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 2rem;' },
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '⚡ Reactive State'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Uses createState for snake position, food location, score, and game status with automatic UI updates'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '🎯 Game Loop'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Implements a game loop using setInterval for smooth snake movement at 150ms intervals'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '⌨️ Keyboard Input'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Handles arrow key events with prevention of 180-degree turns for realistic gameplay'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '💥 Collision Detection'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Detects wall collisions and self-collisions to trigger game over state'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '🎨 Dynamic Rendering'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Renders 15x15 grid reactively with color-coded cells for snake, food, and empty spaces'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '📊 Score Tracking'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Tracks score with reactive updates, incrementing each time the snake eats food'
        )
      )
    )
  ),

  // Source Code
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 1.5rem 0; font-size: 1.75rem;' }, '💻 Source Code'),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '1. State Setup & Food Generation'),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(sourceCodeExample))),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '2. Game Loop Implementation'),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(gameLoopExample))),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '3. Keyboard Event Handling'),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(keyboardHandlingExample))),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '4. Reactive Grid Rendering'),
    pre({ style: 'margin: 0;' }, code(...codeBlock(renderingExample)))
  ),

  // Key Learnings
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem;' },
    h2({ style: 'margin: 0 0 1.5rem 0; font-size: 1.75rem;' }, '🎓 Key Learnings'),
    ul({ style: 'margin: 0; padding-left: 1.5rem; line-height: 2; color: var(--text-muted);' },
      li(strong('Fine-grained reactivity:'), ' Only the grid cells update when snake/food positions change'),
      li(strong('State management:'), ' All game state is managed through Elit\'s createState() with automatic UI sync'),
      li(strong('Event-driven architecture:'), ' Keyboard events trigger state changes which cascade to UI updates'),
      li(strong('Efficient rendering:'), ' Nested reactive() calls ensure minimal re-renders of only changed elements'),
      li(strong('Game loop pattern:'), ' setInterval manages game timing while state handles logic'),
      li(strong('Separation of concerns:'), ' Game logic (collision, food generation) separated from rendering'),
      li(strong('Type safety:'), ' TypeScript types ensure correctness of Position and Direction values'),
      li(strong('Clean code:'), ' Functional programming style with pure functions and immutable state updates')
    )
  )
);
