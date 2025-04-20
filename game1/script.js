// script.js

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const levelNumberDisplay = document.getElementById('levelNumber');
    const totalLevelsDisplay = document.getElementById('totalLevels');
    const moveCountDisplay = document.getElementById('moveCount');
    const restartButton = document.getElementById('restartButton');
    const levelCompleteScreen = document.getElementById('levelCompleteScreen');
    const gameCompleteScreen = document.getElementById('gameCompleteScreen');
    const finalMovesDisplay = document.getElementById('finalMoves');
    const nextLevelButton = document.getElementById('nextLevelButton');
    const playAgainButton = document.getElementById('playAgainButton');


    // --- Game Constants & Variables ---
    let BLOCK_SIZE = 50; // Initial block size, might be adjusted
    const COLORS = {
        [WALL]: '#8B4513',   // Brown
        [FLOOR]: '#F5F5DC', // Beige
        [PLAYER]: '#0000FF', // Blue
        [BOX]: '#FFA500',   // Orange
        [GOAL]: '#FF0000',   // Red (target circle)
        [BOX_ON_GOAL]: '#008000', // Green
        [PLAYER_ON_GOAL]: '#4682B4' // Steel Blue
    };

    let currentLevelIndex = 0;
    let board = []; // The current state of the game board
    let playerX, playerY;
    let moveCount;
    let goalLocations = []; // Store {x, y} of goals for win checking
    let undoStack = []; // For potential undo feature (optional)

    // --- Game Initialization ---

    function initGame() {
        totalLevelsDisplay.textContent = levels.length;
        loadLevel(currentLevelIndex);
    }

    function loadLevel(levelIndex) {
        if (levelIndex >= levels.length) {
            showGameComplete();
            return;
        }

        const levelData = levels[levelIndex];

        // --- Adjust Canvas Size & Block Size based on level dimensions ---
        const levelHeight = levelData.length;
        const levelWidth = Math.max(...levelData.map(row => row.length));
        canvas.height = levelHeight * BLOCK_SIZE;
        canvas.width = levelWidth * BLOCK_SIZE;
        // Optional: Adjust block size if level is too big for default canvas
        // BLOCK_SIZE = Math.min(canvas.parentElement.clientWidth / levelWidth, canvas.parentElement.clientHeight / levelHeight);
        // canvas.height = levelHeight * BLOCK_SIZE;
        // canvas.width = levelWidth * BLOCK_SIZE;
        //--------------------------------------------------------------


        board = []; // Clear previous board data
        goalLocations = []; // Clear previous goal locations
        moveCount = 0;
        levelCompleteScreen.style.display = 'none';
        gameCompleteScreen.style.display = 'none';


        for (let y = 0; y < levelHeight; y++) {
            board[y] = [];
            for (let x = 0; x < levelWidth; x++) {
                const char = levelData[y][x] || FLOOR; // Handle uneven rows
                board[y][x] = char;

                if (char === PLAYER || char === PLAYER_ON_GOAL) {
                    playerX = x;
                    playerY = y;
                }
                if (char === GOAL || char === PLAYER_ON_GOAL || char === BOX_ON_GOAL) {
                    goalLocations.push({ x, y });
                }
                 // Store original goal location even if player/box starts on it
                 if (char === PLAYER_ON_GOAL || char === BOX_ON_GOAL) {
                    board[y][x] = (char === PLAYER_ON_GOAL ? PLAYER : BOX); // Store the entity
                    // Mark the underlying cell as a goal for logic/drawing if needed
                    // Or rely on goalLocations array
                 }

            }
        }

        levelNumberDisplay.textContent = levelIndex + 1;
        moveCountDisplay.textContent = moveCount;
        undoStack = []; // Reset undo stack for new level
        // saveUndoState(); // Save initial state if implementing undo

        drawGame();
    }

    // --- Drawing Functions ---

    function drawGame() {
        ctx.fillStyle = '#fff'; // Clear canvas with white (or other background)
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let y = 0; y < board.length; y++) {
            for (let x = 0; x < board[y].length; x++) {
                const char = board[y][x];
                const color = COLORS[char] || COLORS[FLOOR]; // Default to floor color

                // Base floor or wall drawing
                if (char === WALL) {
                    ctx.fillStyle = color;
                    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                } else {
                     // Draw floor first
                     ctx.fillStyle = COLORS[FLOOR];
                     ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                     // Draw goal on top of floor if it's a goal location
                     if (isGoalLocation(x,y)) {
                          ctx.fillStyle = COLORS[GOAL];
                          ctx.beginPath();
                          // Draw a circle or different shape for goal
                          ctx.arc(x * BLOCK_SIZE + BLOCK_SIZE / 2, y * BLOCK_SIZE + BLOCK_SIZE / 2, BLOCK_SIZE / 4, 0, Math.PI * 2);
                          ctx.fill();
                     }
                }

                // Draw entities (Player, Box) on top
                if (char === PLAYER || char === PLAYER_ON_GOAL) {
                    drawEntity(x, y, COLORS[PLAYER]);
                } else if (char === BOX || char === BOX_ON_GOAL) {
                     // Use different color if box is on goal
                     const boxColor = isGoalLocation(x, y) ? COLORS[BOX_ON_GOAL] : COLORS[BOX];
                    drawEntity(x, y, boxColor);
                }
            }
        }
         // Optional: Draw grid lines
        /*
         ctx.strokeStyle = '#eee';
         ctx.lineWidth = 0.5;
         for (let y = 0; y <= board.length; y++) {
             ctx.beginPath();
             ctx.moveTo(0, y * BLOCK_SIZE);
             ctx.lineTo(canvas.width, y * BLOCK_SIZE);
             ctx.stroke();
         }
         for (let x = 0; x <= board[0].length; x++) {
             ctx.beginPath();
             ctx.moveTo(x * BLOCK_SIZE, 0);
             ctx.lineTo(x * BLOCK_SIZE, canvas.height);
             ctx.stroke();
         }
         */
    }

    function drawEntity(x, y, color) {
        ctx.fillStyle = color;
        // Draw slightly smaller than block size for visual separation
        ctx.fillRect(
            x * BLOCK_SIZE + BLOCK_SIZE * 0.1,
            y * BLOCK_SIZE + BLOCK_SIZE * 0.1,
            BLOCK_SIZE * 0.8,
            BLOCK_SIZE * 0.8
        );
         // Optional: Add a border or detail
         ctx.strokeStyle = 'rgba(0,0,0,0.2)';
         ctx.strokeRect(
            x * BLOCK_SIZE + BLOCK_SIZE * 0.1,
            y * BLOCK_SIZE + BLOCK_SIZE * 0.1,
            BLOCK_SIZE * 0.8,
            BLOCK_SIZE * 0.8
         );
    }


    // --- Game Logic Functions ---

    function isGoalLocation(x, y) {
        return goalLocations.some(goal => goal.x === x && goal.y === y);
    }

    function movePlayer(dx, dy) {
        const targetX = playerX + dx;
        const targetY = playerY + dy;

        // Check bounds (redundant if level has walls, but good practice)
        if (targetX < 0 || targetX >= board[0].length || targetY < 0 || targetY >= board.length) {
            return;
        }

        const targetCell = board[targetY][targetX];

        // 1. Check if moving into a wall
        if (targetCell === WALL) {
            return; // Cannot move into wall
        }

        // 2. Check if moving into a box
        if (targetCell === BOX || targetCell === BOX_ON_GOAL) {
            const pushTargetX = targetX + dx;
            const pushTargetY = targetY + dy;

            // Check push target bounds
            if (pushTargetX < 0 || pushTargetX >= board[0].length || pushTargetY < 0 || pushTargetY >= board.length) {
                return; // Cannot push out of bounds
            }

            const pushTargetCell = board[pushTargetY][pushTargetX];

            // Check if pushing into a wall or another box
            if (pushTargetCell === WALL || pushTargetCell === BOX || pushTargetCell === BOX_ON_GOAL) {
                return; // Cannot push into obstacle
            }

            // --- Valid Push ---
            // saveUndoState(); // Save state before move if implementing undo

            // Move the box
            board[pushTargetY][pushTargetX] = BOX; // Box lands here (logic below adjusts if it's a goal)
            // If box landed on goal, it will be drawn green/handled by win check

            // Update the cell the box moved FROM
            board[targetY][targetX] = PLAYER; // Player moves here

            // Update the cell the player moved FROM
            board[playerY][playerX] = FLOOR; // Player leaves floor behind (goal check handles if player was on goal)


        } else {
            // --- Valid Move (no box push) ---
            // saveUndoState(); // Save state before move if implementing undo

            // Update the cell the player moved INTO
            board[targetY][targetX] = PLAYER; // Player moves here

             // Update the cell the player moved FROM
             board[playerY][playerX] = FLOOR; // Player leaves floor behind
        }

         // --- Update Player Position and State ---
        playerX = targetX;
        playerY = targetY;
        moveCount++;
        moveCountDisplay.textContent = moveCount;


        // --- Check Win Condition ---
        if (checkWin()) {
            showLevelComplete();
            return; // Stop further processing like drawing until next level starts
        }

        // --- Redraw the game state ---
        drawGame();
    }


    function checkWin() {
        // Check if ALL goal locations have boxes on them
        for (const goal of goalLocations) {
            if (board[goal.y][goal.x] !== BOX) {
                // Found a goal without a box, not won yet
                 return false;
            }
        }
        // If loop completes, all goals have boxes
        return true;
    }

    function showLevelComplete() {
        finalMovesDisplay.textContent = moveCount;
        levelCompleteScreen.style.display = 'flex';
        // Remove listener temporarily to prevent movement behind overlay
        document.removeEventListener('keydown', handleKeyDown);
    }

    function showGameComplete() {
         gameCompleteScreen.style.display = 'flex';
         document.removeEventListener('keydown', handleKeyDown);
    }


    // --- Event Handlers ---
    function handleKeyDown(event) {
        // Prevent default arrow key scroll behavior
        if ([37, 38, 39, 40].includes(event.keyCode)) {
            event.preventDefault();
        }

        switch (event.keyCode) {
            case 37: // Left Arrow
                movePlayer(-1, 0);
                break;
            case 38: // Up Arrow
                movePlayer(0, -1);
                break;
            case 39: // Right Arrow
                movePlayer(1, 0);
                break;
            case 40: // Down Arrow
                movePlayer(0, 1);
                break;
             // case 90: // 'Z' key for Undo (if implementing)
             //     undoMove();
             //     break;
        }
    }

    restartButton.addEventListener('click', () => {
        loadLevel(currentLevelIndex); // Reload current level
         // Re-attach listener if it was removed on level complete
         document.removeEventListener('keydown', handleKeyDown); // Remove just in case
         document.addEventListener('keydown', handleKeyDown);
    });

    nextLevelButton.addEventListener('click', () => {
        currentLevelIndex++;
        loadLevel(currentLevelIndex); // Load next level
        // Re-attach listener
        document.removeEventListener('keydown', handleKeyDown); // Remove just in case
        document.addEventListener('keydown', handleKeyDown);
    });

     playAgainButton.addEventListener('click', () => {
        currentLevelIndex = 0; // Go back to first level
        loadLevel(currentLevelIndex); // Load first level
        // Re-attach listener
        document.removeEventListener('keydown', handleKeyDown); // Remove just in case
        document.addEventListener('keydown', handleKeyDown);
    });

    // Add keydown listener initially
    document.addEventListener('keydown', handleKeyDown);

    // --- Start ---
    initGame();

     // --- Optional: Undo Feature ---
     /*
     function saveUndoState() {
         // Create a deep copy of the current board state and player position
         const state = {
             board: JSON.parse(JSON.stringify(board)),
             playerX: playerX,
             playerY: playerY,
             moveCount: moveCount
         };
         undoStack.push(state);
         // Optional: Limit undo stack size
         // if (undoStack.length > 20) undoStack.shift();
     }

     function undoMove() {
         if (undoStack.length <= 1) return; // Cannot undo initial state

         undoStack.pop(); // Remove current state
         const previousState = undoStack[undoStack.length - 1]; // Get the last saved state

         // Restore board, player position, and move count
         board = JSON.parse(JSON.stringify(previousState.board));
         playerX = previousState.playerX;
         playerY = previousState.playerY;
         moveCount = previousState.moveCount;

         // Update display
         moveCountDisplay.textContent = moveCount;
         drawGame();
     }
     */

}); // End DOMContentLoaded