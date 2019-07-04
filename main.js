var CANVASSIZE = 600;
var GAMESIZE = 20;
var FPS = 10;

var LEFT_ARROW  = 37;
var UP_ARROW    = 38;
var RIGHT_ARROW = 39;
var DOWN_ARROW  = 40;

new p5(); // "On Demand" global mode to use color() function before setup()

/***
 * Handles running the entire game
***/
class Engine {
    constructor(size, ControllerCallable, fps) {
        this.arena = new Arena(size);
        this.snake = new Snake(this.arena, this, Math.floor(size/2), Math.floor(size/2));
        this.controller = new ControllerCallable(this.snake);

        this.gameOver = false;
        this.points = 0;

        frameRate(fps);
    }

    run() {
        if(!this.gameOver) {
            this.controller.updateDirection();
            this.snake.update();
        } else {
            throw Error('Game Over!')
            //this.gameOver = false;
        }
    }

    triggerGameOver() {
        this.gameOver = true;
    }

    addPoints(number) {
        this.points += number;
        console.log(`Your new points is ${this.points}`);
    }
}

/***
 * Stores all the information about the size of the grid, the location of
 * the snake, the location of the food, etc.
***/
class Arena {
    // Class propertie defining what each tile means in the arena
    static EMPTY = 0;
    static SNAKE = 1;
    static FOOD  = 2;

    // The colors that the arena draws each tile
    // Uses ES6 syntax ([]) to use computed keys
    static COLORS = {
        [Arena.EMPTY]: color(0,     0,  0),
        [Arena.SNAKE]: color(0,   255,  0),
        [Arena.FOOD] : color(255,   0,  0),
    }

    constructor(size) {
        this.size = size;
        this.tileWidth = CANVASSIZE/size;

        this.grid = [];

        for (var i = 0; i < size; i++) {
            this.grid.push([]);

            for(var j = 0; j < size; j++) {
                this.setTile(i, j, Arena.EMPTY);
            }
        }

        for(var i = 0; i < 1; i++) {
            this.addFood();
        }
    }

    getTile(x, y) {
        return this.grid[x][y];
    }

    setTile(x, y, value) {
        this.grid[x][y] = value;

        fill(Arena.COLORS[value]);
        rect(x * this.tileWidth, y * this.tileWidth, this.tileWidth, this.tileWidth);
    }

    inBounds(x, y) {
        return x >= 0 && y >= 0 && x < this.size && y < this.size;
    }

    isGameOver(x, y) {
        return !this.inBounds(x, y) || this.getTile(x, y) === Arena.SNAKE;
    }

    addFood() {
        var count = 0;

        while (true) {
            var foodX = Math.floor(this.size * Math.random());
            var foodY = Math.floor(this.size * Math.random());

            if(this.getTile(foodX, foodY) === Arena.EMPTY) {
                this.setTile(foodX, foodY, Arena.FOOD);

                return;
            }

            count ++;
            if (count > 100) {
                throw Error("Could not find empty tile to place food");
            }
        }
    }

}

class Snake {
    // Definitions for the different directions the snake can face
    static UP    = {x:  0, y:-1};
    static DOWN  = {x:  0, y: 1};
    static RIGHT = {x:  1, y: 0};
    static LEFT  = {x: -1, y: 0};

    constructor(arena, engine, x, y) {
        this.arena = arena; // Reference to the arena object which the snake is in
        this.engine = engine // Reference to the game engine
        this.body = [{x, y}]; // A queue of tiles in which the snake exists
        // the 0th tile is the head, and the last tile it the tail
        // that means we need to unshift the new head in, and pop the tail off
        this.direction = Snake.UP; // Which direction the snake is pointing

        this.arena.setTile(x, y, Arena.SNAKE)
    }

    setDirection(direction) {
        // TODO: do error checking to make sure its a valid direction
        this.direction = direction;
    }

    update() {
        var newX = this.body[0].x + this.direction.x;
        var newY = this.body[0].y + this.direction.y;

        if(this.arena.isGameOver(newX, newY)) {
            this.engine.triggerGameOver();

            return;
        }

        var oldTile = this.arena.getTile(newX, newY);

        // Don't remove the tail to allow snake to grow
        if (oldTile === Arena.FOOD) {
            this.engine.addPoints(1);
            this.arena.addFood();
        }

        // Remove tail to keep the snake's length constant
        if (oldTile === Arena.EMPTY) {
            // Remove the tail from the internal data structure
            var tail = this.body.pop();

            // Remove the tail from the arena's internal data structure
            this.arena.setTile(tail.x, tail.y, Arena.EMPTY);
        }

        // Add new head of the snake to the internal snake data structure
        this.body.unshift({x: newX, y: newY});

        // Add new head of the snake to arena's internal data structure
        this.arena.setTile(newX, newY, Arena.SNAKE);
    }
}

/***
 * Allows for human input to control the snake
***/
class KeyController {
    constructor(snake) {
        this.snake = snake; // Reference to the snake that this will control
        document.onkeydown = this.autoUpdateDirection.bind(this);
    }

    updateDirection() {
        // Doesn't do anything, interupts key presses automatically
        return;
    }

    autoUpdateDirection(event) {
        var key = event.key;

        if(key === "ArrowUp" || key == "w") {
            this.snake.setDirection(Snake.UP);

        } else if(key === "ArrowDown" || key == "s") {
            this.snake.setDirection(Snake.DOWN);

        } else if(key === "ArrowRight" || key == "d") {
            this.snake.setDirection(Snake.RIGHT);

        } else if(key === "ArrowLeft" || key == "a") {
            this.snake.setDirection(Snake.LEFT);

        }
    }
}

function setup() {
    createCanvas(CANVASSIZE, CANVASSIZE);
    strokeWeight(0);

    engine = new Engine(GAMESIZE, KeyController, FPS);
}

function draw() {
    engine.run();
}
