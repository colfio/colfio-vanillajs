
class ConfigManager {
    constructor(data) {
        let thiz = this;
        // copy config as a part of this object
        Object.keys(data).forEach(function (key, index) {
            thiz[key] = data[key];
        });

        this.bubbleMap = new Map();
        this.bubbleArray = [];

        let counter = 0;
        for (let bubble of this.bubbles) {
            let bubbleInfo = new BubbleInfo(counter, bubble.name, bubble.function, bubble.appearance, bubble.rate);
            this.bubbleMap.set(bubble.name, bubbleInfo);
            this.bubbleArray[counter++] = bubbleInfo;
        }

        this.bubblesCount = this.bubbles.length;
    }

    getBubbleByName(name) {
        return this.bubbleMap.get(name);
    }

    getBubbleByIndex(index) {
        return this.bubbleArray[index];
    }
}


/**
 * Sprite sheet wrapper
 */
class SpriteManager {
    constructor(metadata, atlas, config) {
        /**
         * Metadata
         * @type {any}
         */
        this.metadata = metadata;
        /**
         * Loaded sprite atlas
         * @type {image}
         */
        this.atlas = atlas;

        // save bubbles separately since their indices depend
        // on their ordering in the "config" structure (should be the same, this is just for sure)
        this.allBubbles = [];
        let index = 0;
        for (let bubble of config.bubbles) {
            let name = bubble.name;
            for (let spriteBubble of this.metadata["bubbles"]) {
                if (spriteBubble.name == name) {
                    this.allBubbles[index++] = spriteBubble;
                    break;
                }
            }
        }
    }

    getAtlas() {
        return this.atlas;
    }

    // tile size in pixels
    getTileSize() {
        return this.metadata["tile_size"];
    }

    // bubble size in pixels (a bit smaller than tile size)
    getBubbleSize() {
        return this.metadata["bubble_size"];
    }

    getBubble(tileId) {
        return this.allBubbles[tileId];
    }

    getSprites(sheet) {
        return this.metadata[sheet];
    }

    getSpriteByName(sheet, name) {
        let sheets = this.metadata[sheet];

        for (let sprite of sheets) {
            if (sprite.name == name) {
                return sprite;
            }
        }
        return null;
    }

    createSpriteBubbleEntity(tileid) {
        let spr = this.getBubble(tileid);
        let width = spr.width || this.getTileSize();
        let height = spr.height || this.getTileSize();
        return new SpriteMesh(spr.offsetX, spr.offsetY, width / UNIT_SIZE, height / UNIT_SIZE, this.atlas);
    }

    createSpriteEntity(sheet, name) {
        let spr = this.getSpriteByName(sheet, name);
        let width = spr.width || this.getTileSize();
        let height = spr.height || this.getTileSize();
        return new SpriteMesh(spr.offsetX, spr.offsetY, width / UNIT_SIZE, height / UNIT_SIZE, this.atlas);
    }
}


class TextMessageManager {

    constructor(scene) {
        this.scene = scene;
        this.queue = [];
        this.current = null;
    }

    pushMessage(msg) {
        let gameObj = Factory.createMessage(msg);

        if (this.current != null) {
            this.queue.push(gameObj);
        } else {
            this._processNext(gameObj);
        }
    }

    _processNext(gameObj) {
        this.current = gameObj;
        this.scene.addGlobalGameObject(this.current);
        this.current.findComponent("TextMessageAnimator").onFinish = () => {
            this.current = null;
            if (this.queue.length != 0) {
                let first = this.queue.shift();
                this._processNext(first);
            }
        };
    }
}

class BubbleSnapMessage {
    constructor(coordinates, bubbleEntity) {
        this.coordinates = coordinates;
        this.bubbleEntity = bubbleEntity;
    }
}

/** 
 * View state of a bubble 
 */
class BubbleViewState {
    constructor() {
        this.isAnimating = false;
        this.animFrame = 0;
        this.animationType = null;
    }

    reset() {
        this.isAnimating = false;
        this.animFrame = 0;
    }

    toString() {
        return `"isAnimating: ${this.isAnimating}|animFrame: ${this.animFrame.toFixed(2)}`;
    }
}

/** 
 * Tile representation (even a removed bubble is represented as a tile)
 */
class Tile {
    constructor(x, y, tileid) {
        /**
         * column index in an array
         * @type {number}
         */
        this.x = x;
        /**
         * row index in an array
         * @type {number}
         */
        this.y = y;
        /**
         * tile id
         * @type {number}
         */
        this.tileid = tileid;

        // helper attributes for cluster manager
        this.removed = false;
        this.processed = false;

        /**
         * Object that represents this tile
         * @type {GameObject}
         */
        this.gameObject = null;
    }

    reset() {
        this.tileid = TILE_ID_NONE;
    }

    toString() {
        return `"type: ${this.tileid}|x: ${this.x}|y: ${this.y}`;
    }
}

class Bubble {
    constructor(angle, speed, bubbleInfo) {
        /**
         * Angle in degrees
         * @type {number}
         */
        this.angle = angle;
        /**
         * Moving speed
         * @type {number}
         */
        this.speed = speed;
        /**
         * Bubble information entity
         * @type {BubbleInfo}
         */
        this.bubbleInfo = bubbleInfo;
    }

    clone() {
        return new Bubble(this.angle, this.speed, this.bubbleInfo);
    }

    toString() {
        return `"type: ${this.bubbleInfo.name}|angle: ${this.angle.toFixed(2)}|speed: ${this.speed.toFixed(2)}`;
    }
}

class BubbleGame {
    constructor(initSightLength) {
        this.score = 0;
        this.sightLength = initSightLength;
        this._gamestate = GAME_STATE_INIT;

        this.currentBonus = 1;
        this.comboCounter = 0;
        this.lastClusterLength = 0;
    }

    handleBonus(clusterLength, specialFunc, config) {
        let currentBonus = this.currentBonus;
        let scoreMult = Math.floor(this.currentBonus);
        if (specialFunc == SPECIAL_FUNCTION_2X && clusterLength != 0) {
            scoreMult *= 2;
            Factory.pushNewMessage(config.messages["msg_bonus_2x"]);
            playSound(ASSETS_SND_BONUS);
        }
        let returnVal = 0;


        if (clusterLength == 0) {
            // reset bonus
            this.currentBonus = 1;
            this.comboCounter = 0;
            this.lastClusterLength = 0;
            returnVal = 0;
        } else {
            this.comboCounter++;
            this.currentBonus += config.bonusMultIncrease;

            if (clusterLength >= config.bonusMinClusterLength) {
                returnVal = clusterLength * scoreMult * 2;
                Factory.pushNewMessage(config.messages["msg_superhit"]);
                playSound(ASSETS_SND_BONUS);
            } else {
                returnVal = clusterLength * scoreMult;
            }
            if (config.bonusShowComboCounter) {
                if (Math.floor(this.currentBonus) > Math.floor(currentBonus)) {
                    Factory.pushNewMessage(config.messages["msg_combo_bonus"] + " " + Math.floor(this.currentBonus));
                    playSound(ASSETS_SND_BONUS);
                } else if (this.comboCounter > 1) {
                    Factory.pushNewMessage(config.messages["msg_combo"] + " " + this.comboCounter);
                    playSound(ASSETS_SND_BONUS);
                }
            }
        }

        return returnVal;
    }

    getGameState() {
        return this._gamestate;
    }

    setGameState(newgamestate) {
        this._gamestate = newgamestate;
    }

    toString() {
        return `"gameState: ${this._gamestate}`;
    }
}

const GENERATOR_MODE_PLAYER = 1;
const GENERATOR_MODE_LEVEL = 2;

class BubbleInfo {
    constructor(index = 0, name = "noname", specialFunc = SPECIAL_FUNCTION_NONE, appearance = 0, rate = 0) {
        this.index = index;
        this.name = name;
        this.specialFunc = specialFunc;
        this.appearance = appearance;
        this.rate = rate;
    }
}

class BubbleGenerator {
    constructor(mode, config) {
        this.mode = mode;
        this.config = config;
        this.bufferSize = 10; // keep last 10 generated tiles
        this.buffer = [];
        this.counter = 0;
        this.bubbles = new Array();
        this.highestRow = 0; // highest row for which a new bubble was generated
        this.emptyBubble = new BubbleInfo(TILE_ID_NONE); // dummy bubble for empty space
        this.cumulative = 0; // cumulative sum of all rates
        this._init();
    }

    previous() {
        return this.buffer[this._getCounter(-2)];
    }

    current() {
        return this.buffer[this._getCounter(-1)];
    }

    next(row = 0, column = 0, level = null) { // row:= -1 is for a new row
        let randomBubble = null;

        if (this.mode == GENERATOR_MODE_LEVEL) {
            // level mode
            randomBubble = this._getRandomBubblePerlin(row, column);
        } else {
            // player mode
            randomBubble = this._getRandomBubble(level);
        }

        this.buffer[this._getCounter(0)] = randomBubble;
        this.counter++;

        return randomBubble.index;
    }

    _init() {
        let count = this.config.bubblesCount;
        noise.seed(Math.random());

        // sort bubbles by their probability rating
        for (let i = 0; i < count; i++) {
            let bubbleInfo = this.config.getBubbleByIndex(i);

            // get either LEVEL appearances or PLAYER appearances
            if (((this.mode == GENERATOR_MODE_LEVEL) && (bubbleInfo.appearance.indexOf(APPEARANCE_LEVEL) !== -1)) ||
                ((this.mode == GENERATOR_MODE_PLAYER) && (bubbleInfo.appearance.indexOf(APPEARANCE_PLAYER) !== -1))
            ) {
                this.bubbles.push(bubbleInfo);
            }
        }

        // calculate total cumulative rate. We will divide all probabilities by this sum
        this.cumulative = this.bubbles.filter((item) => item.appearance
            .indexOf(this.mode == GENERATOR_MODE_LEVEL ? APPEARANCE_LEVEL : APPEARANCE_PLAYER) !== -1).reduce((a, b) => { return a + b.rate; }, 0);
    }

    _getRandomBubblePerlin(row, column) {
        // each X rows, choose different variation
        if ((row - this.highestRow) > this.config.rowVariantGroup) {
            this.highestRow = row;
            // sort randomly the array
            this.bubbles = this.bubbles.sort(() => { return 0.5 - Math.random() });
        }

        let probability = 0;
        // calculate perlin noise frequency
        let frequency = 0.01 * (this.config.initialDifficulty + this.config.difficultyIncreaseSpeed * row / ((row % 20) + 1));

        let rand = (noise.simplex2(row * frequency, column * frequency) + 1) / 2;
        let randArrayIndex = Math.floor(rand * (this.bubbles.length + 1));

        // a bit messy
        if (randArrayIndex >= (this.bubbles.length) && (row % 2 == 0 || column % 2 == 0) && Math.random() > 0.5) {
            return this.emptyBubble;
        } else if (randArrayIndex >= (this.bubbles.length)) {
            randArrayIndex = this.bubbles.length - 1;
        }
        let bubble = this.bubbles[randArrayIndex];
        return bubble;
    }

    _getRandomBubble(level) {
        let probability = 0;
        let rand = Math.random() * this.cumulative;

        while (true) {
            let randArrayIndex = Math.floor(Math.random() * this.bubbles.length);
            let bubble = this.bubbles[randArrayIndex];
            probability += bubble.rate;
            if (probability >= rand) {
                // a bit hacky -> don't return bubble that is not a part of the level
                if (bubble.specialFunc != "none") {
                    return bubble;
                }

                // return this bubble if and only if it is in the level
                for (var i = 0; i < level.columns; i++) {
                    for (var j = 0; j < level.rows; j++) {
                        if (level.tiles[i][j].tileid == bubble.index) {
                            return bubble;
                        }
                    }
                }
                // repeat
            }
        }
    }

    _getCounter(diff) {
        if (diff > 0) {
            return (this.counter + diff) % this.bufferSize;
        } else {
            let temp = this.counter - diff;
            if (temp < 0) {
                return temp + this.bufferSize;
            } else {
                return temp;
            }
        }
    }
}

class Level {
    constructor(columns, rows, generator) {
        /**
         * Number of columns
         * @type {number}
         */
        this.columns = columns;
        /**
         * Number of rows
         * @type {number}
         */
        this.rows = rows;
        /**
         * Array of tiles
         * @type {Array<Tile>}
         */
        this.tiles = [];
        /**
         * Row offset of the first row
         * @type {number}
         */
        this.rowoffset = 0;

        // total rows that appeared in the game
        this.totalRows = 0;

        this.generator = generator;
    }

    init() {
        for (var i = 0; i < this.columns; i++) {
            this.tiles[i] = [];
            for (var j = 0; j < this.rows; j++) {
                // Define a tile type and a shift parameter for animation
                this.tiles[i][j] = new Tile(i, j, TILE_ID_NONE);
            }
        }
    }

    createTiles(rowsNum) {
        this.totalRows += rowsNum;
        // Create a level with random tiles
        for (var j = 0; j < this.rows; j++) {

            if (j >= rowsNum) {
                break;
            }

            for (var i = 0; i < this.columns; i++) {
                this.tiles[i][j].tileid = this.generator.next(this.totalRows - j, i, this);
            }
        }
    }

    // adds a new row of bubbles
    addNewRow() {
        this.rowoffset = (this.rowoffset + 1) % 2;
        this.totalRows++;

        // Move the rows downwards
        for (var i = 0; i < this.columns; i++) {
            for (var j = 0; j < this.rows - 1; j++) {
                this.tiles[i][this.rows - 1 - j].tileid = this.tiles[i][this.rows - 1 - j - 1].tileid;
            }
        }

        // Add a new row of bubbles at the top
        for (var i = 0; i < this.columns; i++) {
            // Add random, existing, colors
            this.tiles[i][0].tileid = this.generator.next(this.totalRows, i, this); // -1 is for new row from the top
        }
    }

    // gets tile 1D index
    get1DIndex(x, y) {
        return y * this.columns + x;
    }

    // gets tile 2D index
    get2DIndex(index) {
        return {
            x: index % this.columns,
            y: index / this.columns
        }
    }

    // Reset the processed flags
    resetProcessed() {
        for (var i = 0; i < this.columns; i++) {
            for (var j = 0; j < this.rows; j++) {
                this.tiles[i][j].processed = false;
            }
        }
    }

    // Reset the removed flags
    resetRemoved() {
        for (var i = 0; i < this.columns; i++) {
            for (var j = 0; j < this.rows; j++) {
                this.tiles[i][j].removed = false;
            }
        }
    }

    // Get the neighbors of the specified tile
    getNeighbors(tile) {
        var tilerow = (tile.y + this.rowoffset) % 2; // Even or odd row

        // Get the neighbor offsets for the specified tile
        let neighbors = [];
        let n = null;

        if (tilerow == 0) {
            // even row
            n = [[1, 0], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1]];
        } else {
            // odd row
            n = [[1, 0], [1, 1], [0, 1], [-1, 0], [0, -1], [1, -1]];
        }

        // Get the neighbors
        for (var i = 0; i < n.length; i++) {
            // Neighbor coordinate
            var nx = tile.x + n[i][0];
            var ny = tile.y + n[i][1];

            // Make sure the tile is valid
            if (nx >= 0 && nx < this.columns && ny >= 0 && ny < this.rows) {
                neighbors.push(this.tiles[nx][ny]);
            }
        }

        return neighbors;
    }

    // Find cluster at the specified tile location
    // tx = tile index X
    // ty = tile index Y
    // matchtype tile to found
    // reset = if true, processed tiles will be reseted
    // skipremoved = if true, removed tiles will be skipped
    findCluster(tx, ty, matchtype, reset, skipremoved, bubbleInfo) {
        // Reset the processed flags
        if (reset) {
            this.resetProcessed();
        }

        // Get the target tile. Tile coord must be valid.
        var targettile = this.tiles[tx][ty];
        var foundcluster = [];

        if (bubbleInfo && bubbleInfo.specialFunc == SPECIAL_FUNCTION_2X) {
            let neighbors = this.getNeighbors(targettile).filter(it => it.tileid != TILE_ID_NONE);
            if (neighbors.length == 0) {
                return foundcluster; // no neighbors, usually occurs when map is empty
            }
            targettile = neighbors[0];
        } else if (bubbleInfo && bubbleInfo.specialFunc == SPECIAL_FUNCTION_BOMB) {
            let clusters = new Set();
            // for bomb, add all bubbles in radius
            let neighbors = this.getNeighbors(targettile).filter(it => it.tileid != TILE_ID_NONE);
            for (let neighbor of neighbors) {
                let superNeighbors = this.getNeighbors(neighbor).filter(it => it.tileid != TILE_ID_NONE);
                clusters.add(neighbor);
                for (let superNeigh of superNeighbors) {
                    clusters.add(superNeigh);
                }
            }
            for (let clitem of clusters) {
                foundcluster.push(clitem);
            }
            return foundcluster;
        }

        // Initialize the toprocess array with the specified tile
        var toprocess = [targettile];
        targettile.processed = true;

        while (toprocess.length > 0) {
            // Pop the last element from the array
            var currenttile = toprocess.pop();

            // Skip processed and empty tiles
            if (currenttile.tileid == TILE_ID_NONE) {
                continue;
            }

            // Skip tiles with the removed flag
            if (skipremoved && currenttile.removed) {
                continue;
            }
            // Check if current tile has the right type, if matchtype is true
            if (!matchtype || (currenttile.tileid == targettile.tileid)) {
                // Add current tile to the cluster
                foundcluster.push(currenttile);

                // Get the neighbors of the current tile
                var neighbors = this.getNeighbors(currenttile);

                // Check the type of each neighbor
                neighbors.filter((item) => !item.processed).forEach(item => {
                    toprocess.push(item);
                    item.processed = true;
                });

            }
        }

        // Return the found cluster
        return foundcluster;
    }

    // Find floating clusters
    findFloatingClusters() {
        // Reset the processed flags
        this.resetProcessed();

        var foundclusters = [];

        // Check all tiles
        for (var i = 0; i < this.columns; i++) {
            for (var j = 0; j < this.rows; j++) {
                var tile = this.tiles[i][j];
                if (!tile.processed) {
                    // Find all attached tiles
                    // the processed flag will increase performance :-)
                    var foundcluster = this.findCluster(i, j, false, false, true);

                    // Check if the cluster is floating (not attached to the roof)
                    var floating = foundcluster.length > 0 && foundcluster.find(item => item.y == 0) === undefined;

                    if (floating) {
                        // Found a floating cluster
                        for (let clusterItem of foundcluster) {
                            foundclusters.push(clusterItem);
                        }
                    }
                }
            }
        }

        return foundclusters;
    }


    // Get the tile coordinate
    getTileCoordinate(column, row) {
        var tilex = column;

        // X offset for odd or even rows
        if ((row + this.rowoffset) % 2) {
            tilex += 0.5;
        }

        var tiley = row;
        return { posX: tilex, posY: tiley };
    }

    // Get the closest grid position
    getGridPosition(posX, posY) {
        // grid center position
        let x = posX + 0.5;
        let y = posY + 0.5;

        var gridy = Math.floor((y) / 1);
        // Check for offset
        var xoffset = 0;
        if ((gridy + this.rowoffset) % 2) {
            xoffset = 0.5;
        }
        var gridx = Math.floor(((x - xoffset)) / 1);
        return { x: gridx, y: gridy };
    }

    getTile(x, y) {
        if (x < 0 || y < 0 || x >= this.columns || y >= this.rows) {
            return null;
        }
        return this.tiles[x][y];
    }

    // Finds a snappable coordinate on the grid
    findSnappableCoord(posX, posY) {
        // Get the grid position
        var gridpos = this.getGridPosition(posX, posY);
        // Make sure the grid position is valid
        gridpos.x = Math.min(this.columns - 1, Math.max(0, gridpos.x));
        gridpos.y = Math.min(this.rows - 1, Math.max(0, gridpos.y));

        // Check if the tile is empty
        if (this.tiles[gridpos.x][gridpos.y].tileid != TILE_ID_NONE) {
            // Tile is not empty, shift the new tile downwards
            for (var newrow = gridpos.y + 1; newrow < this.rows; newrow++) {
                if (this.tiles[gridpos.x][newrow].tileid == TILE_ID_NONE) {
                    gridpos.y = newrow;
                    return { posX: gridpos.x, posY: gridpos.y };
                }
            }
        } else {
            return { posX: gridpos.x, posY: gridpos.y };
        }

        return null;
    }

    snapBubble(gridposX, gridposY, bubbleInfo) {
        let tile = this.tiles[gridposX][gridposY];
        tile.tileid = bubbleInfo.index;

        if (bubbleInfo.specialFunc == SPECIAL_FUNCTION_TRANSPARENT) {
            // find a neighbor and change tile type
            let neighbors = this.getNeighbors(tile).filter(it => it.tileid != TILE_ID_NONE);
            if (neighbors.length > 0) {
                tile.tileid = neighbors[0].tileid;
            }
        }
    }

    areBubblesAtVeryTop() {
        for (var i = 0; i < this.columns; i++) {
            if (this.tiles[i][0].tileid != TILE_ID_NONE) {
                return true
            }
        }
        return false;
    }

    areBubblesAtVeryBottom() {
        for (var i = 0; i < this.columns; i++) {
            // Check if there are bubbles in the bottom row
            if (this.tiles[i][this.rows - 1].tileid != TILE_ID_NONE) {
                return true
            }
        }
        return false;
    }
}