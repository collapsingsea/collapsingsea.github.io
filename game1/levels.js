// levels.js

// Define map characters
const WALL = '#';
const FLOOR = ' '; // Use space for floor for easier parsing
const PLAYER = '@';
const BOX = '$';
const GOAL = '.';
const BOX_ON_GOAL = '*';
const PLAYER_ON_GOAL = '+';

// Array of levels, each level is an array of strings
const levels = [
    // Level 1: Simple introduction
    [
        "#####",
        "#   #",
        "#@$.#",
        "#   #",
        "#####"
    ],
    // Level 2: Slightly more complex
    [
        "#######",
        "#.@ $ #",
        "# $ $ #",
        "# . . #",
        "#######"
    ],
    // Level 3: Requires careful pushing
    [
        "   #####",
        "   #   #",
        "   #$  #",
        "####  $##",
        "#.#@ $  #",
        "# # .# ##",
        "# $  $ .#",
        "#   .  #",
        "########"
    ],
    // Level 4: More open space, potential traps
    [
        " ######",
        "##    #",
        "# $ $ #",
        "#@.*.*#", // Start with one box on goal
        "# $ $ #",
        "##    #",
        " ######"
    ],
    // Add more levels here...
    [
        "    #####",
        "    #   #",
        "    #$  #",
        "  ###  $##",
        "  #  $ $ #",
        "### # ## #   ######",
        "#   # ## #####  ..#",
        "# $  $          ..#",
        "##### ### #@##  ..#",
        "    #     #########",
        "    #######"
    ]

];