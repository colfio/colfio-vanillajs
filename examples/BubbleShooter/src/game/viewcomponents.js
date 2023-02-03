
/** 
 * Coordinator that only updates sprites according to the game model (tile structure) and animation sprites 
 */
class TileCoordinator extends Component {

    onInit() {
        this.spriteMgr = this.scene.getGlobalAttribute(ATTR_SPRITE_MGR);
        this.level = this.scene.getGlobalAttribute(ATTR_LEVEL);
        this.lastTileId = TILE_ID_NONE;
        this.tile = this.owner.getAttribute(ATTR_TILE);
        this.viewState = this.owner.getAttribute(ATTR_BUBBLE_VIEWSTATE);
        this.lastAnimFrame = this.viewState.animFrame;
        this.subscribe(MSG_SYNCHRONIZE);
    }

    onMessage(msg) {
        // we can enforce the synchronization even via this message
        if (msg.action == MSG_SYNCHRONIZE) {
            this.synchronize();
        }
    }

    synchronize() {
        let tile = this.tile;
        let viewState = this.viewState;
        if (tile.tileid == TILE_ID_NONE) {
            // tile id is NONE, it means that bubble is actually not here, hence invisible
            this.owner.removeState(STATE_DRAWABLE);
        } else {
            this.owner.addState(STATE_DRAWABLE);
            if (this.lastTileId != tile.tileid || viewState.animFrame != this.lastAnimFrame) {
                // update sprite entity according to the current animation frame
                this.lastTileId = tile.tileid;
                this.lastAnimFrame = viewState.animFrame;

                let sprite = null;
                let spriteOffset = 0;

                if (viewState.isAnimating) {
                    let animationType = viewState.animationType;
                    // change the offset of an animating sprite
                    sprite = this.spriteMgr.getBubble(tile.tileid)[animationType];
                    spriteOffset = this.spriteMgr.getTileSize() * Math.floor(viewState.animFrame);
                } else {
                    sprite = this.spriteMgr.getBubble(tile.tileid);
                }

                this.owner.mesh.offsetX = sprite.offsetX + spriteOffset;
                this.owner.mesh.offsetY = sprite.offsetY;
            }
        }

        // if not animating, sync tile coordinate with the position of the object
        if (!viewState.isAnimating) {
            let coord = this.level.getTileCoordinate(tile.x, tile.y);
            this.owner.trans.posX = coord.posX;
            this.owner.trans.posY = coord.posY;
        }
    }

    onUpdate(delta, absolute) {
        this.synchronize();
    }
}

/** 
 * Component responsible for animating a new inserted row
 */
class RowInsertAnimator extends BubbleShooterComponent {

    onInit() {
        super.onInit();
        this.subscribe(MSG_ROW_ADDED);
    }

    onMessage(msg) {
        if (msg.action == MSG_ROW_ADDED) {
            let newRows = msg.data;
            let bubbles = this.scene.findObjectByTag("bubbles");
            // shift the whole structure a bit and animate it down
            let translateAnim = new TranslateAnimation(bubbles.trans.posX, bubbles.trans.posY - newRows,
                bubbles.trans.posX, bubbles.trans.posY, this.config.rowAnimDuration);
            bubbles.addComponent(translateAnim);
            bubbles.trans.posY -= newRows;
            // a bit hacky -> update the whole bubble structure once again to avoid flickering since we changed the position
            bubbles.onUpdate(this.lastDelta, this.lastAbsolute);
        }
    }

    onUpdate(delta, absolute) {
        this.lastDelta = delta;
        this.lastAbsolute = absolute;
    }
}

/** 
 * Component responsible for animating bubble showing up at the top of the cannon 
 */
class CannonBubbleAnimator extends BubbleShooterComponent {

    onInit() {
        super.onInit();
        this.subscribe(MSG_GAME_STATE_CHANGED);
    }

    onMessage(msg) {
        if (msg.action == MSG_GAME_STATE_CHANGED) {
            let currentState = msg.data;
            if (currentState == GAME_STATE_READY) {
                let cannonBubble = this.scene.findObjectByTag("cannonBubble");
                if (!cannonBubble.hasState(STATE_DRAWABLE)) {
                    cannonBubble.addState(STATE_DRAWABLE);

                    // animate cannonBubble to show up
                    let trans = cannonBubble.trans;
                    cannonBubble.addComponent(new TranslateAnimation(trans.posX, trans.posY + 0.5, trans.posX, trans.posY, this.config.cannonAnimShowUpDelay));
                    cannonBubble.trans.posY += 0.5;
                    cannonBubble.submitChanges(false);
                }
            }
        }
    }
}

/** 
 * Animator for bubbles that have more static sprites (e.g. the bomb)
 */
class TileStaticAnimator extends BubbleShooterComponent {

    onInit() {
        super.onInit();
        this.animFrame = 0;
    }

    onUpdate(delta, absolute) {
        this.bubble = this.owner.getAttribute(ATTR_BUBBLE);
        if (this.bubble.bubbleInfo.index != TILE_ID_NONE) {
            let sprite = this.spriteMgr.getBubble(this.bubble.bubbleInfo.index);
            if (sprite[ANIMATION_STATIC] != null) {
                let spriteAnim = sprite[ANIMATION_STATIC];
                let spriteOffset = this.spriteMgr.getTileSize() * Math.floor(this.animFrame);

                this.owner.mesh.offsetX = spriteAnim.offsetX + spriteOffset;
                this.owner.mesh.offsetY = spriteAnim.offsetY;
                this.animFrame = (this.animFrame + delta * 6) % spriteAnim.sprites;
            }
        }
    }
}

/** 
 * Component that synchronizes score
 */
class ScoreDisplay extends BubbleShooterComponent {

    onInit() {
        super.onInit();
    }

    onUpdate(delta, absolute) {
        this.owner.mesh.text = "SCORE: " + this.game.score;
    }
}

/** 
 * Animation for bubble disappearing
 */
class BubbleBlowAwayAnim extends BubbleShooterComponent {
    onInit() {
        super.onInit();
        this.tile = this.owner.getAttribute(ATTR_TILE);
        this.viewState = this.owner.getAttribute(ATTR_BUBBLE_VIEWSTATE);
        this.viewState.animationType = ANIMATION_TYPE_BLOW_AWAY;

        let bubbleSprite = null;
        if (this.tile.tileid != TILE_ID_NONE) {
            bubbleSprite = this.spriteMgr.getBubble(this.tile.tileid);
        }
        // some bubbles don't have animation sprites
        if (this.tile.tileid == TILE_ID_NONE || bubbleSprite[ANIMATION_TYPE_BLOW_AWAY] == null) {
            this.viewState.reset();
            this.finish();
        }

    }

    onUpdate(delta, absolute) {
        let bubbleSprite = this.spriteMgr.getBubble(this.tile.tileid);
        let animation = bubbleSprite[ANIMATION_TYPE_BLOW_AWAY];

        if (animation !== undefined && animation != null &&
            (this.viewState.animFrame <= animation.sprites)) {
            // increment animation
            this.viewState.animFrame = Math.min(this.viewState.animFrame + delta * this.config.blowAwayAnimSpeed, animation.sprites);
            // increment one more because we want the last item to be shown the same amount of time as all others
            if (this.viewState.animFrame >= animation.sprites) {
                this.viewState.animFrame = animation.sprites - 1;
                this.viewState.reset();
                this.finish();
            } else {
                this.viewState.isAnimating = this.viewState.animFrame <= animation.sprites;
            }
        } else {
            // animation has ended
            this.viewState.reset();
            this.finish();
        }
    }
}

/** 
 * Component responsible for animation of the glow at the top of the cannon 
 */
class GlowAnimator extends Component {

    onUpdate(delta, absolute) {
        this.owner.mesh.alpha = (Math.cos(absolute * 3) + 1) / 3 + 0.6;
    }
}

/** 
 * Component responsible for displaying messages 
 */
class TextMessageAnimator extends Component {
    constructor(totalDuration) {
        super();
        this.totalDuration = totalDuration;
        this.interpolator = Interpolation.linear;
        this.start = 0;
    }

    onUpdate(delta, absolute) {
        if (this.start == 0) {
            this.start = absolute;
        } else {
            let lerp = this.interpolator(absolute, this.start, this.totalDuration * 2);
            this.owner.mesh.alpha = lerp < 0.5 ? (lerp * 2) : (2 - lerp * 2);
            if (lerp >= 1) {
                this.finish();
                this.owner.remove();
            }
        }
    }
}

/** 
 * Component responsible for animation of the creature
 */
class CreatureAnimator extends BubbleShooterComponent {
    onInit() {
        super.onInit();
        this.eye = this.scene.findObjectByTag("eye");
        this.leftHand = this.scene.findObjectByTag("left_hand");
        this.rightHand = this.scene.findObjectByTag("right_hand");
        this.cannonBubble = this.scene.findObjectByTag("cannonBubble");
        this.leftEar = this.scene.findObjectByTag("left_ear");
        this.rightEar = this.scene.findObjectByTag("right_ear");

        this.handAnimRunning = false;

        this.lastBlinkTime = 0;
        this.blinkingState = 0;
        // init blinking animation
        this.scene.findObjectByTag("eyelid3").removeState(STATE_DRAWABLE);
        this.scene.findObjectByTag("eyelid2").removeState(STATE_DRAWABLE);

        this.lastEarAnimTime = 0;
        this.earAnimRunning = false;
    }

    onUpdate(delta, absolute) {
        this._eyeAnim(delta, absolute);
        this._handAnim(delta, absolute);
        this._eyelidAnim(delta, absolute);
        this._earAnim(delta, absolute);
    }

    _eyeAnim(delta, absolute) {
        let trans1 = this.eye.trans;
        let bbox = null;

        if (this.getGameState() == GAME_STATE_SHOOTING) {
            if (this.movingBubble == null) {
                this.movingBubble = this.scene.findObjectByTag("movingBubble");
            }
            bbox = this.movingBubble.bbox;
        } else {
            this.movingBubble = null;
            bbox = this.cannonBubble.bbox;
        }
        let center = bbox.getCenter();

        // keep eye on the cannon bubble
        let currentRotation = this.eye.trans.rotation;
        let desiredRotation = Math.PI / 2 + Math.atan2(center.posY - trans1.absPosY, center.posX - trans1.absPosX);
        let increment = Math.min(delta * this.config.eyeAnimSpeed, Math.abs(desiredRotation - currentRotation));
        let sign = Math.sign(desiredRotation - currentRotation);

        this.eye.trans.rotation += increment * sign;
    }

    _eyelidAnim(delta, absolute) {
        if (this.blinkingState > 0) {
            let blinkState = Math.floor(this.blinkingState);
            if (blinkState == 1) {
                this.scene.findObjectByTag("eyelid2").addState(STATE_DRAWABLE);
            } else if (blinkState == 2) {
                this.scene.findObjectByTag("eyelid3").addState(STATE_DRAWABLE);
            } else if (blinkState == 3) {
                this.scene.findObjectByTag("eyelid3").removeState(STATE_DRAWABLE);
            } else if (blinkState >= 4) {
                this.scene.findObjectByTag("eyelid3").removeState(STATE_DRAWABLE);
                this.scene.findObjectByTag("eyelid2").removeState(STATE_DRAWABLE);
                this.blinkingState = 0; // stop the animation
            }

            if (this.blinkingState > 0) {
                this.blinkingState += delta * this.config.blinkingSpeed;
            }
        } else if (isTime(1.0 / this.config.eyeBlinkPeriod, this.lastBlinkTime, absolute)) {
            this.lastBlinkTime = absolute;
            this.blinkingState = 1;
        }

    }

    _handAnim(delta, absolute) {
        if (!this.handAnimRunning) {
            this.handAnimRunning = true;
            // just add relevant components
            let anim1 = new RotationAnimation(0, -0.15, this.config.handAnimDuration, true, 0);
            let anim2a = new RotationAnimation(0, -0.15, this.config.handAnimDuration, true, 0);
            let anim2b = new TranslateAnimation(
                this.rightHand.trans.posX - 0.05, this.rightHand.trans.posY + 0.05,
                this.rightHand.trans.posX, this.rightHand.trans.posY,
                this.config.handAnimDuration, true, 0);
            this.leftHand.addComponent(anim1);
            this.rightHand.addComponent(anim2a);
            this.rightHand.addComponent(anim2b);
        }
    }

    _earAnim(delta, absolute) {
        if (!this.earAnimRunning && isTime(1.0 / this.config.earAnimPeriod, this.lastEarAnimTime, absolute)) {
            this.lastEarAnimTime = absolute;
            this.earAnimRunning = true;

            let ear1 = this.scene.findObjectByTag("left_ear");
            let ear2 = this.scene.findObjectByTag("right_ear");

            // add rotation animations
            let anim1 = new RotationAnimation(ear1.trans.rotation, ear1.trans.rotation + 0.3, this.config.earAnimDuration, true, 2);
            let anim2 = new RotationAnimation(ear2.trans.rotation, ear2.trans.rotation + 0.3, this.config.earAnimDuration, true, 2);

            ear1.addComponent(anim1);

            anim2.onFinish = () => {
                this.earAnimRunning = false;
            }

            // start the second animation a bit later
            this.scene.callWithDelay(0.5, () => {
                ear2.addComponent(anim2);
            });
        }
    }
}

/** 
 * Component responsible for displaying overlay background when game is over 
 */
 class GameOverOverlay extends BubbleShooterComponent {

    onInit() {
        super.onInit();
        this.subscribe(MSG_GAME_STATE_CHANGED);
        this.owner.removeState(STATE_DRAWABLE);
    }

    onMessage(msg) {
        if (msg.action == MSG_GAME_STATE_CHANGED) {
            if (this.getGameState() == GAME_STATE_GAME_OVER) {
                this.owner.addState(STATE_DRAWABLE);
            } else {
                this.owner.removeState(STATE_DRAWABLE);
            }
        }
    }
}

/**
 * Component that renders sights
 */
 class SightsRenderer extends Component {

    onInit() {
        super.onInit();
        this.cannon = this.scene.findObjectByTag("cannon");
        this.level = this.scene.getGlobalAttribute(ATTR_LEVEL);
        this.game = this.scene.getGlobalAttribute(ATTR_GAME);
    }

    onDraw(ctx) {
        let mesh = this.owner.mesh;

        let rot = this.cannon.trans.rotation;
        let bboxPos = this.cannon.bbox.getCenter();
        let bboxSize = this.cannon.bbox.getSize();

        // calculate borders of the scene
        let leftBorder = bboxPos.posX * UNIT_SIZE;
        let rightBorder = (this.scene.getWidth() - bboxPos.posX) * UNIT_SIZE;

        let trans = this.owner.trans;
        let posX = trans.absPosX * UNIT_SIZE;
        let posY = trans.absPosY * UNIT_SIZE;
        let originX = trans.rotationOffsetX * UNIT_SIZE;
        let originY = trans.rotationOffsetY * UNIT_SIZE;
        ctx.translate(posX, posY);
        ctx.rotate(trans.absRotation);

        // current number of iterations for the sight
        let iterations = Math.floor(this.game.sightLength);
        let sightMultiplier = 1.25;

        for (let i = 0; i < iterations; i++) {
            // length of the sight
            let dirLengthX = (1.5 * UNIT_SIZE + mesh.height * UNIT_SIZE * sightMultiplier * i) * Math.cos(rot - Math.PI / 2);
            let dirLengthY = (1.5 * UNIT_SIZE + mesh.height * UNIT_SIZE * sightMultiplier * i) * Math.sin(rot - Math.PI / 2);

            // sights shouldn't overlap bubbles
            let levPosX = bboxPos.posX * UNIT_SIZE + dirLengthX - UNIT_SIZE;
            let levPosY = bboxPos.posY * UNIT_SIZE + dirLengthY;
            let tilePos = this.level.getGridPosition(levPosX / UNIT_SIZE, levPosY / UNIT_SIZE);

            let tile = this.level.getTile(tilePos.x, tilePos.y);

            if (tile && tile.tileid != TILE_ID_NONE) {
                break;
            }

            // beyond the borders of the scene
            if (-dirLengthX > leftBorder || dirLengthX > rightBorder) {
                break;
            }

            ctx.drawImage(mesh.image, mesh.offsetX, mesh.offsetY,
                mesh.width * UNIT_SIZE, mesh.height * UNIT_SIZE, -originX, -originY - i * mesh.height * UNIT_SIZE * sightMultiplier,
                mesh.width * UNIT_SIZE, mesh.height * UNIT_SIZE);
        }

        ctx.rotate(-trans.absRotation);
        ctx.translate(-posX, -posY);
    }
}