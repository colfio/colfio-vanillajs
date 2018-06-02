/**
 * @file Constants that are used across the game
 * @author Adam Vesecky <vesecky.adam@gmail.com>
 */

const ATTR_SPRITE_MGR = "SPRITE_MGR";	// sprite manager
const ATTR_LEVEL = "LEVEL";
const ATTR_GAME = "GAME";
const ATTR_BUBBLE = "BUBBLE";
const ATTR_TILE = "TILE";
const ATTR_BUBBLE_VIEWSTATE = "BUBBLE_VIEWSTATE";
const ATTR_CONFIG_MGR = "CONFIG_MGR";
const ATTR_BUBBLE_GENERATOR = "BUBBLE_GENERATOR";
const ATTR_MSG_MANAGER = "MSG_MANAGER";

const MSG_BUBBLE_COLLIDED = "BUBBLE_COLLIDED";
const MSG_GAME_STATE_CHANGED = "GAME_STATE_CHANGED";
const MSG_BUBBLE_SNAPPED = "BUBBLE_SNAPPED";
const MSG_SYNCHRONIZE = "SYNCHRONIZE";
const MSG_ROW_ADDED = "ROW_ADDED";
const MSG_CLUSTER_REMOVED = "CLUSTER_REMOVED";

const SPECIAL_FUNCTION_NONE = "none";
const SPECIAL_FUNCTION_BOMB = "bubble_bomb";
const SPECIAL_FUNCTION_2X = "bubble_2x";
const SPECIAL_FUNCTION_TRANSPARENT = "bubble_trans";

const ANIMATION_TYPE_BLOW_AWAY = "animation_blowaway";
const ANIMATION_STATIC = "animation_static";

const APPEARANCE_PLAYER = "player";
const APPEARANCE_LEVEL = "level";

const STATICBUBBLE_ZINDEX = 5;
const MOVINGBUBBLE_ZINDEX = 13;
const CREATURE_ZINDEX = 12;

const GAME_STATE_INIT = 0;              // init game state
const GAME_STATE_READY = 1;             // ready to shoot
const GAME_STATE_SHOOTING = 2;          // currently shooting
const GAME_STATE_ANIMATION = 3;         // blocking animation
const GAME_STATE_GAME_OVER = 4;         // game over

const TILE_ID_NONE = -1; // represents an undefined tile

// indices of assets, loaded in main.js
let ASSETS_BACKGROUND_1 = "background_01.jpg";
let ASSETS_ATLAS = "bsprites.png";

let ASSETS_SND_BONUS = "bonus";
let ASSETS_SND_CLEAR = "clear";
let ASSETS_SND_CRACK = "crack";
let ASSETS_SND_EXPLOSION = "explosion";
let ASSETS_SND_GAME_OVER = "game_over";
let ASSETS_SND_HIT = "hit";
let ASSETS_SND_NEW_GAME = "new_game";
let ASSETS_SND_SHOT = "shot";
let ASSETS_SND_SHOT2 = "shot2";
let ASSETS_SND_SWITCH = "switch";
let ASSETS_SND_SWITCH2 = "switch2";
let ASSETS_SND_SWITCH3 = "switch3";