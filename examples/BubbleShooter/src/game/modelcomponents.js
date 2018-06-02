/**
 * @file Components that define overall behavior of all game elements in the scene
 * @author Adam Vesecky <vesecky.adam@gmail.com>
 */

let scene = null;

/** 
 * Base class of all Bubble Shooter components 
 */
class BubbleShooterComponent extends Component {
	oninit() {
		// load global components
		this.level = this.scene.getGlobalAttribute(ATTR_LEVEL);
		this.spriteMgr = this.scene.getGlobalAttribute(ATTR_SPRITE_MGR);
		this.config = this.scene.getGlobalAttribute(ATTR_CONFIG_MGR);
		this.game = this.scene.getGlobalAttribute(ATTR_GAME);
	}

	getGameState() {
		return this.game.getGameState();
	}

	setGameState(state) {
		this.game.setGameState(state);
		this.sendmsg(MSG_GAME_STATE_CHANGED, state);
	}
}

/** 
 * Component responsible for bubble physics (movement and collisions) 
 */
class BubblePhysics extends BubbleShooterComponent {
	oninit() {
		super.oninit();
	}

	updateBubbleMovement(dt) {
		let bubbleEntity = this.owner.getAttribute(ATTR_BUBBLE);
		// Move the bubble in the direction of the mouse
		this.owner.trans.posX += dt * bubbleEntity.speed * Math.cos(degToRad(bubbleEntity.angle));
		this.owner.trans.posY += dt * bubbleEntity.speed * -1 * Math.sin(degToRad(bubbleEntity.angle));

		// Handle left and right collisions with the borders
		if (this.owner.trans.posX <= 0.5) {
			// Left edge
			bubbleEntity.angle = 180 - bubbleEntity.angle; // TODO replace angle and speed with velocity vector...
			this.owner.trans.posX = 0.5;
			playSound(ASSETS_SND_HIT);
		} else if (this.owner.trans.posX + 0.5 >= this.scene.getWidth()) {
			// Right edge
			bubbleEntity.angle = 180 - bubbleEntity.angle;
			this.owner.trans.posX = this.scene.getWidth() - 0.5;
			playSound(ASSETS_SND_HIT);
		}

		if (this.owner.trans.posY <= 0) {
			this.owner.trans.posY = 0;
		}

		// update abs coords
		this.owner.trans._updateTransform(this.owner.parent.trans);
	}

	checkBubbleCollision() {
		// Collisions with the top of the level
		if (this.owner.trans.posY <= 0) {
			// Top collision
			return true;
		}
		// Collisions with other tiles
		for (var i = 0; i < this.level.columns; i++) {
			for (var j = 0; j < this.level.rows; j++) {
				var tile = this.level.tiles[i][j];

				// Skip empty tiles
				if (tile.tileid == TILE_ID_NONE) {
					continue;
				}

				// Check for intersections
				let tileObject = tile.gameObject;

				// recalculate absolute transform
				this.owner.trans._updateTransform(this.owner.parent.trans);

				// moving bubble has always its position in the center
				if (circleIntersection(this.owner.trans.absPosX - this.owner.trans.rotationOffsetX + this.owner.mesh.width / 2,
					this.owner.trans.absPosY - this.owner.trans.rotationOffsetY + this.owner.mesh.height / 2,
					0.4, // X-axis is more tolerant
					tileObject.trans.absPosX + tileObject.mesh.width / 2,
					tileObject.trans.absPosY + tileObject.mesh.height / 2,
					0.5)) {
					return true;
				}
			}
		}
		return false;
	}

	update(delta, absolute) {
		this.updateBubbleMovement(delta);
		if (this.checkBubbleCollision()) {
			playSound(ASSETS_SND_HIT);
			this.sendmsg(MSG_BUBBLE_COLLIDED);
			this.finish();
		}

	}
}

/** 
 * Component responsible for inserting new rows at given time interval 
 */
class RowInserter extends BubbleShooterComponent {
	oninit() {
		super.oninit();
		this.lastTime = 0;
		this.period = this.config.rowIncrementInterval;
		this.subscribe(MSG_CLUSTER_REMOVED);
		this.bubbles = this.scene.findFirstObjectByTag("bubbles");
	}

	onmessage(msg) {
		if (msg.action == MSG_CLUSTER_REMOVED) {
			if (!this.level.areBubblesAtVeryTop()) {
				this.lastTime += this.period;
				// add 3 new rows
				this._addNewRow(3);
				playSound(ASSETS_SND_CLEAR);
			}
		}
	}

	update(delta, absolute) {
		if (this.getGameState() == GAME_STATE_READY) {
			if (this.lastTime == 0) {
				this.lastTime = absolute;
			}

			let frequency = 1.0 / this.period;
			if (isTime(frequency, this.lastTime, absolute)) {
				this.lastTime = absolute;
				this._addNewRow();
			}
		}
	}

	_addNewRow(num = 1) {
		for(let i=0; i<num; i++){
			this.level.addNewRow();
		}
		
		this.period /= (1 + Math.log(Math.min(1.01, this.config.rowIncrementAcceleration)));
		this.sendmsg(MSG_ROW_ADDED, num);
	}
}

/** 
 * Component responsible for dealing with a bubble that was snapped to the tile grid
 * Contains special functions and cluster removal
 */
class BubbleSnapResolver extends BubbleShooterComponent {
	oninit() {
		super.oninit();
		this.subscribe(MSG_BUBBLE_SNAPPED);
	}

	onmessage(msg) {
		if (msg.action == MSG_BUBBLE_SNAPPED) {
			let coords = msg.data.coordinates;
			let bubble = msg.data.bubbleEntity;

			this.level.snapBubble(coords.posX, coords.posY, bubble.bubbleInfo);
			let newTile = this.level.getTile(coords.posX, coords.posY);
			newTile.gameObject.sendmsgToComponents(new Msg(MSG_SYNCHRONIZE), false);

			let cluster = this.level.findCluster(coords.posX, coords.posY, true, true, false, bubble.bubbleInfo);
			// Handle cluster removal
			this.setGameState(GAME_STATE_ANIMATION);
			this.removeCluster(cluster, bubble, newTile, coords);
		}
	}

	removeCluster(cluster, srcBubble, newTile, newBubbleCoords) {
		this.level.resetRemoved();

		let srcBubbleObject = newTile.gameObject;

		let floatingclusters = [];
		let tilesToRemove = [];

		// if the bomb hits an empty space, just let the bomb explode...
		if ((cluster.length < this.config.minClusterSize && srcBubble.bubbleInfo.specialFunc == SPECIAL_FUNCTION_BOMB)
	|| (cluster.length == 1 && srcBubble.bubbleInfo.specialFunc == SPECIAL_FUNCTION_TRANSPARENT)) {
			cluster.push(newTile);
			newTile.removed = true;
			tilesToRemove = cluster;
		}

		if (cluster.length >= this.config.minClusterSize) {
			// find other clusters only if the first one is long enough 
			for (let tile of cluster) {
				tile.removed = true;
			}

			// Find floating clusters
			floatingclusters = this.level.findFloatingClusters();
			tilesToRemove = cluster.concat(floatingclusters);
		}

		let totalScoreIncrement = this.game.handleBonus(tilesToRemove.length, srcBubble.bubbleInfo.specialFunc, this.config);
		let currentScoreIncrement = 0;
		let currentScore = this.game.score;

		let removed = 0;

		if (tilesToRemove.length == 0) {
			this.setGameState(GAME_STATE_READY);
		}

		for (let i = 0; i < tilesToRemove.length; i++) {
			let tile = tilesToRemove[i];
			// assign an animation to each object
			let gameObject = tile.gameObject;

			let cmp = null;
			// first cluster.length tiles are not part of the floatingclusters structure -> they will be just blown away
			// floating tiles will drop down
			if (i < cluster.length) {
				cmp = new BubbleBlowAwayAnim();
			} else {
				cmp = new TranslateAnimation(
					gameObject.trans.posX, gameObject.trans.posY,
					gameObject.trans.posX, gameObject.trans.posY + 10, 0.5);
			}

			let manhattanDist = Math.abs(tile.x - newBubbleCoords.posX) + Math.abs(tile.y - newBubbleCoords.posY);

			// execute animation with delay according to their distance
			this.scene.addPendingInvocation(Math.log(manhattanDist)*0.2, () => {
				playSound(ASSETS_SND_CRACK);
				currentScoreIncrement++;
				this.game.score = currentScore + Math.floor(currentScoreIncrement / tilesToRemove.length * totalScoreIncrement);
				gameObject.addComponent(cmp);
			});

			if (srcBubble.bubbleInfo.specialFunc == SPECIAL_FUNCTION_BOMB) {
				// for bomb, add also translate animation
				let randomPosX = Math.sign(gameObject.trans.posX - srcBubbleObject.trans.posX);
				let randomPosY = Math.sign(gameObject.trans.posY - srcBubbleObject.trans.posY);
				playSound(ASSETS_SND_EXPLOSION);
				gameObject.addComponent(new TranslateAnimation(
					gameObject.trans.posX, gameObject.trans.posY,
					gameObject.trans.posX + randomPosX, gameObject.trans.posY + randomPosY, 0.5));
			}

			// when the animation is finished...
			cmp.onFinished = () => {
				tile.reset(); // here we reset the tile that has been just removed
				// ... update game state
				if (++removed >= tilesToRemove.length) {
					if (this.getGameState() != GAME_STATE_GAME_OVER) {
						this.sendmsg(MSG_CLUSTER_REMOVED, tilesToRemove);
						this.setGameState(GAME_STATE_READY);
					}
				}
			}
		}
	}
}

/** 
 * Component responsible for collision resolving and bubble snapping 
 */
class CollisionResolver extends BubbleShooterComponent {
	oninit() {
		super.oninit();
		this.subscribe(MSG_BUBBLE_COLLIDED);
	}

	onmessage(msg) {
		if (msg.action == MSG_BUBBLE_COLLIDED) {
			this.bubbleCollided(msg.gameObject);
		}
	}

	bubbleCollided(bubble) {
		// snap bubble to the grid
		let newTileCoord = this.level.findSnappableCoord(bubble.trans.posX - bubble.trans.rotationOffsetX, bubble.trans.posY - bubble.trans.rotationOffsetY);

		if (newTileCoord != null) {
			// animate bubble to the position it should be snapped and pass the event forward to snapresolver
			let tile = this.level.getTile(newTileCoord.posX, newTileCoord.posY);
			let tileObject = tile.gameObject;
			let targetPos = tileObject.bbox;
			bubble.trans.changeRotationOffset(0, 0);
			bubble.trans._updateTransform(bubble.parent.trans);
			let translateAnim = new TranslateAnimation(bubble.trans.posX, bubble.trans.posY, tileObject.trans.posX, tileObject.trans.posY, this.config.bubbleSnapDelay);
			bubble.addComponent(translateAnim);
			translateAnim.onFinished = () => {
				bubble.remove();
				this.sendmsg(MSG_BUBBLE_SNAPPED, new BubbleSnapMessage(newTileCoord, bubble.getAttribute(ATTR_BUBBLE)));
			};
		}
	}
}

/** 
 * Component responsible for managing overall game state 
 */
class GameComponent extends BubbleShooterComponent {

	oninit() {
		super.oninit();
		this.subscribe(MSG_GAME_STATE_CHANGED);
		this.subscribe(MSG_ROW_ADDED);
		this.generator = this.owner.getAttribute(ATTR_BUBBLE_GENERATOR);
	}

	onmessage(msg) {
		if (msg.action == MSG_GAME_STATE_CHANGED) {
			let currentState = msg.data;
			if (currentState == GAME_STATE_READY) {
				this.checkGameOver();
				let nextBubbleType = this.generator.next(0, 0, this.level);
				Factory.addNextBubble(nextBubbleType);
			}
		} else if (msg.action == MSG_ROW_ADDED) {
			this.checkGameOver();
			// decrease the length of sight
			this.game.sightLength = Math.max(this.config.minSightLength, this.game.sightLength - this.config.sightDecrement);
		}
	}

	checkGameOver() {
		if (this.level.areBubblesAtVeryBottom()) {
			this.setGameState(GAME_STATE_GAME_OVER);
			playSound(ASSETS_SND_GAME_OVER);
			Factory.pushNewMessage(this.config.messages["msg_game_over"]);
		}
	}
}

/** 
 * Component responsible for cannon controlling 
 */
class PlayerController extends BubbleShooterComponent {

	oninit() {
		super.oninit();
		this.nextBubble = this.scene.findFirstObjectByTag("nextBubble");
		this.cannonBubble = this.scene.findFirstObjectByTag("cannonBubble");
		this.cannon = this.scene.findFirstObjectByTag("cannon");
		this.base = this.scene.findFirstObjectByTag("base");
		this.setAngle(90); // set initial angle to 90°
	}

	setAngle(angle) {
		if (this.getGameState() != GAME_STATE_GAME_OVER) {
			// restrict the angle
			angle = Math.max(this.config.cannonMinAngle, Math.min(angle, this.config.cannonMaxAngle));

			// Set the player angle
			this.cannonBubble.getAttribute(ATTR_BUBBLE).angle = angle;
			this.nextBubble.getAttribute(ATTR_BUBBLE).angle = angle;
			this.cannon.trans.rotation = degToRad(90 - angle);
		}
	}

	// Shoot the bubble
	shootBubble() {
		if (this.getGameState() == GAME_STATE_READY) {
			this.cannonBubble.removeState(STATE_DRAWABLE);
			Factory.createMovingBubble();
			playSound(ASSETS_SND_SHOT2);
			// Set the gamestate
			this.setGameState(GAME_STATE_SHOOTING);
		}
	}

	// swap cannon bubble with the one the creature is holding
	swapBubbles() {
		if (this.getGameState() == GAME_STATE_READY) {
			let cannonBubble = this.scene.findFirstObjectByTag("cannonBubble");
			let nextBubble = this.scene.findFirstObjectByTag("nextBubble");
			let cannonBubbleStr = cannonBubble.getAttribute(ATTR_BUBBLE);
			let nextBubbleStr = nextBubble.getAttribute(ATTR_BUBBLE);
			// swap bubble structures
			cannonBubble.addAttribute(ATTR_BUBBLE, nextBubbleStr);
			nextBubble.addAttribute(ATTR_BUBBLE, cannonBubbleStr);
			// swap sprites
			let mesh = nextBubble.mesh;
			nextBubble.mesh = cannonBubble.mesh;
			cannonBubble.mesh = mesh;
			playSound(ASSETS_SND_SWITCH);
		}
	}
}

/** 
 * Component responsible for cannon controlling via mouse 
 */
class PlayerMouseController extends PlayerController {

	oninit() {
		super.oninit();
		this.subscribe(MSG_MOVE);
		this.subscribe(MSG_DOWN);
		this.subscribe(MSG_TOUCH);
		this.nextBubble = this.scene.findFirstObjectByTag("nextBubble");
	}

	onmessage(msg) {
		if (msg.action == MSG_MOVE) {
			this.onMouseMove(msg.data.mousePos);
		} else if ((msg.action == MSG_DOWN && !msg.data.isTouch) || msg.action == MSG_TOUCH) {
			this.onMouseDown(msg.data.mousePos);
		}
	}

	// On mouse movement
	onMouseMove(pos) {
		// Get the mouse angle
		var mouseangle = radToDeg(Math.atan2((this.cannonBubble.trans.absPosY * UNIT_SIZE + this.spriteMgr.getBubbleSize() / 2) - pos.posY,
			pos.posX - (this.cannonBubble.trans.absPosX * UNIT_SIZE + this.spriteMgr.getBubbleSize() / 2)));

		// tangent fix
		if (mouseangle < -90) {
			mouseangle = 180;
		}

		this.setAngle(mouseangle);
	}

	// On mouse button click
	onMouseDown(pos) {
		this.onMouseMove(pos);
		// update transforms
		this.cannon.submitChanges(true);

		let gamestate = this.getGameState();
		if (this.nextBubble.bbox.intersects(new BBox(pos.posX / UNIT_SIZE, pos.posY / UNIT_SIZE, pos.posX / UNIT_SIZE, pos.posY / UNIT_SIZE))) {
			// we clicked on the bubble the creature is holding -> swap bubbles
			if (gamestate == GAME_STATE_READY) {
				this.swapBubbles();
			}
		} else {
			if (gamestate == GAME_STATE_READY) {
				this.shootBubble();
			} else if (gamestate == GAME_STATE_GAME_OVER) {
				Factory.newGame();
			}
		}
	}
}