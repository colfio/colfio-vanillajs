Factory = {};

var game = null;

// Start a new game
Factory.newGame = function () {

	// global resource managers
	let spriteMgr = new SpriteManager(spritesData, loadedImages[ASSETS_ATLAS], gameConfig)
	// 1 = [size of a bubble], ~ 72px
	// !!!EVERYTHING SHOULD BE DERIVED FROM THE UNIT SIZE!!!
	UNIT_SIZE = spriteMgr.getBubbleSize();

	// background
	let bgr = loadedImages[ASSETS_BACKGROUND_1];

	scene.clearScene();

	// change the size of the canvas


	// set width equal to the width of the background and the height according to the size of the viewport
	scene.setWidth(bgr.width / UNIT_SIZE);
	scene.setHeight(bgr.height / UNIT_SIZE);
	scene.addGlobalAttribute(ATTR_SPRITE_MGR, spriteMgr);
	scene.addGlobalAttribute(ATTR_MSG_MANAGER, new TextMessageManager(scene));
	let configMgr = new ConfigManager(gameConfig);
	scene.addGlobalAttribute(ATTR_CONFIG_MGR, configMgr);

	if (configMgr.displaySceneDebug) {
		scene.addGlobalComponent(new DebugComponent(configMgr.displayBoundingBoxDebug, document.getElementById("debugSect")));
	} else {
		document.getElementById('debugSect').style.visibility = 'collapse';
	}


	// create game manager (all global components should be put into this object)
	let shootingBubbleGenerator = new BubbleGenerator(GENERATOR_MODE_PLAYER, configMgr);

	let backgroundDiff = bgr.height / UNIT_SIZE - scene.getHeight();

	let gameManager = new Builder("game_manager")
		.withComponent(new GameComponent())
		.withComponent(new InputManager(INPUT_DOWN | INPUT_MOVE))
		.withComponent(new PlayerMouseController())
		.withComponent(new BasicRenderer())
		.withComponent(new RowInserter())
		.withComponent(new CollisionResolver())
		.withComponent(new BubbleSnapResolver())
		.withComponent(new CannonBubbleAnimator())
		.withComponent(new RowInsertAnimator())
		.withAttribute(ATTR_BUBBLE_GENERATOR, shootingBubbleGenerator)
		.withPosition(0, -backgroundDiff / 2)
		.withMesh(new ImageMesh(bgr)) // assign the background image as a mesh of the main game object 
		.asGlobal().build(scene);

	let gameOver = new Builder("gameOverOverlay")
        .withComponent(new GameOverOverlay())
        .withComponent(new BasicRenderer())
        .withMesh(new RectMesh("#00000055", scene.getWidth(), scene.getHeight()))
        .withZIndex(30)
        .asGlobal().build(scene);

    let scoreDisplay = new Builder("scoreDisplay")
        .withPosition(scene.getWidth() - 3.5, scene.getHeight() - 4)
        .withComponent(new ScoreDisplay())
        .withComponent(new BasicRenderer())
        .withMesh(new TextMesh("", "42px Impact", "#FFFFFF", 1, 1))
        .withZIndex(32)
        .asGlobal().build(scene);

	// parent object for all bubbles
	let bubbles = new Builder("bubbles")
		.withPosition(0, -0.3)
		.asGlobal().build(scene);

	// this will place the stuff (cannon and the creature) further from the bottom for wide-screen device
	let stuffPosition = scene.getHeight() - 2 + (bgr.height / UNIT_SIZE - scene.getHeight()) / 4;

	// how many rows from the bottom won't be a part of the bubble grid 
	let bottomRowMargin = Math.floor(scene.getHeight() - stuffPosition + 1);


	// initial number of visible rows
	let initRowsCount = Math.floor(scene.getHeight() - stuffPosition);

	// Level entity
	let level = new Level(
		Math.floor(scene.getWidth()),    	// Number of MAX tile columns
		Math.floor(scene.getHeight()) - bottomRowMargin,	// Number of MAX tile rows
		new BubbleGenerator(GENERATOR_MODE_LEVEL, configMgr)
	);

	level.init();
	level.createTiles(initRowsCount);
	scene.addGlobalAttribute(ATTR_LEVEL, level);

	// Game entity
	game = new BubbleGame(configMgr.initSightLength);
	game.setGameState(GAME_STATE_READY);
	scene.addGlobalAttribute(ATTR_GAME, game);

	// ===================================================================
	// Cannon

	let cannonGroup = new Builder("cannon_group")
		.withPosition(3.4, stuffPosition)
		.withCenteredOrigin()
		.asGlobal().build(scene);

	let cannonSpr = spriteMgr.getSpriteByName("cannon", "cannon");
	let cannon = new Builder("cannon")
		.withZIndex(cannonSpr.zIndex)
		.withMesh(spriteMgr.createSpriteEntity("cannon", "cannon"))
		.withPosition(cannonSpr.posX, cannonSpr.posY)
		.withCenteredOrigin()
		.withComponent(new BasicRenderer())
		.withParent(cannonGroup).build(scene);


	let glowSpr = spriteMgr.getSpriteByName("cannon", "glow");
	let glow = new Builder("glow")
		.withMesh(spriteMgr.createSpriteEntity("cannon", "glow"))
		.withPosition(glowSpr.posX, glowSpr.posY)
		.withZIndex(glowSpr.zIndex)
		.withComponent(new BasicRenderer())
		.withComponent(new GlowAnimator())
		.withParent(cannon)
		.build(scene);

	let sightsSpr = spriteMgr.getSpriteByName("cannon", "sights");
	let sights = new Builder("sights")
		.withMesh(spriteMgr.createSpriteEntity("cannon", "sights"))
		.withPosition(sightsSpr.posX, sightsSpr.posY)
		.withZIndex(sightsSpr.zIndex)
		.withComponent(new SightsRenderer())
		.withParent(cannon)
		.build(scene);

	let cannonBaseSpr = spriteMgr.getSpriteByName("cannon", "base");
	let cannonBase = new Builder("base")
		.withMesh(spriteMgr.createSpriteEntity("cannon", "base"))
		.withPosition(cannonBaseSpr.posX, cannonBaseSpr.posY)
		.withZIndex(cannonBaseSpr.zIndex)
		.withComponent(new BasicRenderer())
		.withParent(cannonGroup).build(scene);

	let cannonGrassSpr = spriteMgr.getSpriteByName("cannon", "grass");
	let cannonGrass = new Builder("grass")
		.withMesh(spriteMgr.createSpriteEntity("cannon", "grass"))
		.withPosition(cannonGrassSpr.posX, cannonGrassSpr.posY)
		.withZIndex(cannonGrassSpr.zIndex)
		.withComponent(new BasicRenderer())
		.asGlobal().build(scene);

	let cannonShadowSpr = spriteMgr.getSpriteByName("cannon", "shadow");
	let cannonShadow = new Builder("shadow")
		.withMesh(spriteMgr.createSpriteEntity("cannon", "shadow"))
		.withPosition(cannonShadowSpr.posX, cannonShadowSpr.posY)
		.withZIndex(cannonShadowSpr.zIndex)
		.withComponent(new BasicRenderer())
		.withParent(cannonGroup).build(scene);

	// ===================================================================
	// Creature

	let creature = new Builder("creature")
		.withPosition(1, stuffPosition - 1.5)
		.withZIndex(CREATURE_ZINDEX)
		.withComponent(new CreatureAnimator())
		.asGlobal()
		.build(scene);

	let leftHand = null;

	// add all creature parts
	for (let sprite of spriteMgr.getSprites("character")) {
		let part = new Builder(sprite.name)
			.withPosition(sprite.posX, sprite.posY)
			.withZIndex(sprite.zIndex)
			.withMesh(spriteMgr.createSpriteEntity("character", sprite.name))
			.withComponent(new BasicRenderer())
			.withRotation(0, sprite.rotationOffsetX || null, sprite.rotationOffsetY || null)
			.withParent(creature)
			.build(scene);

		if (part.tag == "left_hand") {
			leftHand = part;
		}
	}

	// ===================================================================
	// Dynamic bubbles

	// object that will represent a bubble in the cannon
	let cannonBubble = new Builder("cannonBubble")
		.withAttribute(ATTR_BUBBLE, new Bubble(90, configMgr.bubbleSpeed, configMgr.getBubbleByIndex(0))) // get any bubbleInfo
		.withTransform(new Trans(-0.36, -1.2, 0, 0.5, 0.5))
		.withZIndex(MOVINGBUBBLE_ZINDEX)
		.withComponent(new BasicRenderer())
		.withComponent(new TileStaticAnimator())
		.withParent(cannon)
		.build(scene);

	// object that will represent the next bubble
	let nextBub = new Builder("nextBubble")
		.withAttribute(ATTR_BUBBLE, new Bubble(0, configMgr.bubbleSpeed, configMgr.getBubbleByIndex(0))) // get any bubbleInfo
		.withComponent(new BasicRenderer())
		.withComponent(new TileStaticAnimator())
		.withZIndex(MOVINGBUBBLE_ZINDEX)
		.withPosition(-0.15, -0.4)
		.withParent(leftHand).build(scene);

	scene.submitChanges();

	// create bubble for each tile
	for (var j = 0; j < level.rows; j++) {
		for (var i = 0; i < level.columns; i++) {
			Factory.createBubbleView(level.tiles[i][j]);
		}
	}

	// Init first two bubbles
	Factory.addNextBubble(shootingBubbleGenerator.next(0, 0, level));
	Factory.addNextBubble(shootingBubbleGenerator.next(0, 0, level));

	Factory.pushNewMessage(configMgr.messages["msg_game_start"]);
	
	// play the first sound a bit later
	scene.callWithDelay(0.5, () => {
		playSound(ASSETS_SND_NEW_GAME);
	});
}

Factory.createBubbleView = function (tile) {
	let bubbles = scene.findObjectByTag("bubbles");
	let spriteMgr = scene.getGlobalAttribute(ATTR_SPRITE_MGR);

	let bubble = new Builder("bubble")
		.withMesh(spriteMgr.createSpriteBubbleEntity(0)) // just add a random bubble, we need its dimensions
		.withAttribute(ATTR_TILE, tile)
		.withAttribute(ATTR_BUBBLE_VIEWSTATE, new BubbleViewState())
		.withZIndex(STATICBUBBLE_ZINDEX)
		.withComponent(new BasicRenderer())
		.withComponent(new TileCoordinator())
		.withParent(bubbles)
		.build(scene);

	tile.gameObject = bubble; // assign game object
}

Factory.createMovingBubble = function () {
	// get bubble that is in the cannon
	let cannonBubble = scene.findObjectByTag("cannonBubble");

	// position of zero-rotated bubble must be the same as for the rotated one
	let bbox = cannonBubble.bbox.getCenter();

	let newBubble = new Builder("movingBubble")
		.withZIndex(MOVINGBUBBLE_ZINDEX)
		.withMesh(cannonBubble.mesh) // the same as for cannon bubble
		.withAttribute(ATTR_BUBBLE, cannonBubble.getAttribute(ATTR_BUBBLE).clone()) // copy the bubble entity
		.withComponent(new BubblePhysics())
		.withComponent(new TileStaticAnimator())
		.withComponent(new BasicRenderer())
		.withPosition(bbox.posX, bbox.posY)
		.withCenteredOrigin()
		.asGlobal().build(scene);
}

// Create a random bubble for the player
Factory.addNextBubble = function (tileid) {
	let cannonBubble = scene.findObjectByTag("cannonBubble");
	let nextBubble = scene.findObjectByTag("nextBubble");
	let spriteMgr = scene.getGlobalAttribute(ATTR_SPRITE_MGR);
	let config = scene.getGlobalAttribute(ATTR_CONFIG_MGR);

	// Move attributes from nextBubble to the cannonBubble 
	cannonBubble.assignAttribute(ATTR_BUBBLE, nextBubble.getAttribute(ATTR_BUBBLE).clone());
	cannonBubble.mesh = nextBubble.mesh;

	// Change current bubble info entity
	nextBubble.getAttribute(ATTR_BUBBLE).bubbleInfo = config.getBubbleByIndex(tileid);
	nextBubble.mesh = spriteMgr.createSpriteBubbleEntity(tileid);
}

Factory.pushNewMessage = function (message) {
	let mgr = scene.getGlobalAttribute(ATTR_MSG_MANAGER);
	mgr.pushMessage(message);
}

Factory.createMessage = function (message) {
	let config = scene.getGlobalAttribute(ATTR_CONFIG_MGR);
	let mesh = new TextMesh(message, "42px Impact", "#FFFFFF", 1, 1);
	mesh.textAlign = "center";

	let rotation = new RotationAnimation(config.bonusAnimMinAngle, config.bonusAnimMaxAngle, config.bonusAnimDuration, true, 0);
	rotation.interpolation = Interpolation[config.bonusAnimInterpolation];

	let messageObj = new Builder("message")
		.withPosition(scene.getWidth() / 2, scene.getHeight() / 2 - 1)
		.withCenteredOrigin()
		.withComponent(new TextMessageAnimator(config.bonusAnimTotalDuration))
		.withComponent(new BasicRenderer())
		.withComponent(rotation)
		.withMesh(mesh)
		.withZIndex(32).gameObj; // don't add it to the scene yet!
	messageObj.mesh.alpha = 0;
	return messageObj;
}