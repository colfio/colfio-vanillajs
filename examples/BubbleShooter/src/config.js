var gameConfig = {
    "displaySceneDebug" : false,        // if true, displays structure of the whole scene
    "displayBoundingBoxDebug" : false,  // if true, displays bounding boxes around all objects
    "minClusterSize" : 3,               // minimal size of a cluster to remove
    "bubbleSpeed" : 10,                  // speed of a bubble
    "bubbleSnapDelay" : 0.1,            // duration of the snapping animation 
    "rowAnimDuration" : 1,              // duration of the animation that pushes a new row from the top
    "cannonMinAngle" : 35,              // min angle for the cannon
    "cannonMaxAngle" : 145,             // max angle for the cannon
    "rowIncrementInterval" : 10,        // number of seconds before a new row appears
    "rowIncrementAcceleration" : 1.1,   // multiplier of a speed at which a new row appears
    "cannonAnimShowUpDelay" : 0.5,      // duration of the show-up animation when a new bubble is loaded into cannon
    "blowAwayAnimSpeed" : 10,           // speed of the stop-motion animation that blows hit bubbles away 
    "handAnimDuration" : 1.5,           // duration of an animation of hands of the creature
    "eyeAnimSpeed" : 3,                 // speed of the animation of eyes of the creature
    "eyeBlinkPeriod" : 5,               // period at which the creature blinks
    "blinkingSpeed" : 20,               // speed at which the creature blinks
    "earAnimPeriod" : 2,                // period at which the ears of the creature moves
    "earAnimDuration" : 1,              // duration of the animation of the ears
    "initialDifficulty" : 5,            // initial difficulty (seed for the Perlin's noise)
    "difficultyIncreaseSpeed" : 2,      // difficulty multiplier (higher frequency of the noise -> more randomness)
    "rowVariantGroup" : 10,             // indicates that once at each X rows the selection of possible color changes
    "bonusAnimDuration" : 1,            // duration of one loop of the rotation animation of messages
    "bonusAnimTotalDuration" : 0.7,       // total duration of messages
    "bonusAnimMinAngle" : -0.1,         // min angle of the rotation animation of messages
    "bonusAnimMaxAngle" : 0.1,          // max angle of the rotation animation of messages
    "bonusAnimInterpolation" : "easeinout", // interpolator of rotation animation of messages
    "bonusShowComboCounter" : true,     // if true, displays combo counter messages
    "bonusMultIncrease" : 0.1,          // increase of a bonus-multiplier with each combo (e.g combo 10 -> 1.5x bonus, combo 11 -> 1.6 bonus) 
    "bonusMinClusterLength" : 10,       // minimal length of a cluster to receive additional bonus
    "initSightLength" : 20,             // initial size of the sights
    "sightDecrement" : 0.3,             // decrement of sights with each new row
    "minSightLength" : 4,               // min sight length
    "messages" : {                      // message strings
        "msg_bonus_2x" : "BONUS 2X",
        "msg_superhit" : "!!!SUPER HIT!!!",
        "msg_combo" : "COMBO",
        "msg_combo_bonus" : "COMBO BONUS",
        "msg_game_over" : "GAME OVER",
        "msg_game_start" : "PLAY"
    },
    "bubbles" : [ 
       {
           "name" : "bubble_green",
           "function" : "none",
           "appearance" : "player|level",
           "rate" : 1                   // appearance probability 
       },
       {
           "name" : "bubble_violet",
           "function" : "none",
           "appearance" : "player|level",
           "rate" : 1
       },
       {
           "name" : "bubble_blue",
           "function" : "none",
           "appearance" : "player|level",
           "rate" : 1
       },
       {
           "name" : "bubble_yellow",
           "function" : "none",
           "appearance" : "player|level",
           "rate" : 1
       },
       {
           "name" : "bubble_red",
           "function" : "none",
           "appearance" : "player|level",
           "rate" : 1
       },
       {
           "name" : "bubble_bomb",
           "function" : "bubble_bomb",
           "appearance" : "player",
           "rate" : 0.1
       },
       {
           "name" : "bubble_trans",
           "function" : "bubble_trans",
           "appearance" : "player",
           "rate" : 0.1
       }
   ]
}
