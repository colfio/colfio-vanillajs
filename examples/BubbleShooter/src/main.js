/**
 * @file Bootstrapper of the game, initializes game loop and the scene
 * @author Adam Vesecky <vesecky.adam@gmail.com>
 */


var gameTime = 0;  // number of ms since the game started

var spriteAssets = [ASSETS_BACKGROUND_1, ASSETS_ATLAS];	// path to all assets
var soundAssets = [ASSETS_SND_BONUS, ASSETS_SND_CLEAR, ASSETS_SND_CRACK,
    ASSETS_SND_EXPLOSION, ASSETS_SND_GAME_OVER, ASSETS_SND_HIT, ASSETS_SND_NEW_GAME,
    ASSETS_SND_SHOT, ASSETS_SND_SHOT2, ASSETS_SND_SWITCH, ASSETS_SND_SWITCH2, ASSETS_SND_SWITCH3
];
var loadedImages = [];
var loadedSounds = [];

var canvas;
var canvasCtx;

window.onload = function () {
	// get canvas
	canvas = document.getElementById('gameCanvas');
	canvasCtx = canvas.getContext('2d');

	// init component microengine
	scene = new Scene(canvas);

	// load assets, init game and start the loop
	loadAssets()
		.then(loadSounds)
		.then(initGame)
		.then(gameLoop);
}

function loadAssets() {
	let promises = [];
	// load all images (there is only one at the moment)
	for (let spriteAsset of spriteAssets) {
		promises.push(loadImage("images/" + spriteAsset).then((prom) => {
			loadedImages[spriteAsset] = prom;
		}));
	}

	return Promise.all(promises);
}

function loadSounds() {
	let promises = [];

	soundAssets.forEach(asset => {
		promises.push(new Promise((resolve, reject) => {
			const path = './audio/' + asset + '.mp3';
			const audio = new Audio();
			audio.src = path;
			loadedSounds[asset] = audio;
			resolve();
		}));
	});

	return Promise.all(promises);
}

// initializes the whole game scene, its game entities, attributes and components
function initGame() {
	// Timing and frames per second
	this.lastframe = 0;
	this.initialized = false;

	// Call init to start the game
	Factory.newGame();

	return true;
}

// ========================= GAME LOOP =========================
function gameLoop(tframe = 0) {
	// Request animation frames
	window.requestAnimationFrame(gameLoop);

	// deltatime
	let dt = (tframe - lastframe) / 1000;
	lastframe = tframe;

	gameTime += dt;
	scene.update(dt, gameTime);
    // clear canvas and call update and render function upon the scene
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
	scene.draw();
}
// =============================================================
