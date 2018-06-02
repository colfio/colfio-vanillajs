/**
 * @file Sprites and their offsets as they are placed in the main sprite sheet
 * @author Adam Vesecky <vesecky.adam@gmail.com>
 */
var spritesData = {
	"tile_size" : 128,
	"bubble_size" : 75,
	"character" : [
		{
			"name" : "body",
			"offsetX": 751,
			"offsetY" : 181,
			"width" : 932 - 751,
			"height" : 361 - 181,
			"posX" : -0.2,
			"posY" : -0.08,
			"zIndex" : 8
		},
		{
			"name" : "left_ear",
			"offsetX" : 834,
			"offsetY" : 147,
			"width" : 871 - 834,
			"height" : 183 - 147,
			"posX" : 0.8,
			"posY" : 0.32,
			"rotationOffsetX" : 0.4,
			"rotationOffsetY" : 0.4,
			"zIndex" : 10
		},
		{
			"name" : "right_ear",
			"offsetX" : 877,
			"offsetY" : 152,
			"width" : 908 - 877,
			"height" : 181 - 152,
			"posX" : 1.80,
			"posY" : 0.28,
			"rotationOffsetX" : 0.3,
			"rotationOffsetY" : 0.3,
			"zIndex" : 10
		},
		{
			"name" : "eye",
			"offsetX" : 916,
			"offsetY" : 158,
			"width" : 18,
			"height" : 18,
			"posX" : 1.43,
			"posY" : 0.54,
			"rotationOffsetX" : 0.19,
			"rotationOffsetY" : 0.19,
			"zIndex" : 9
		},
		{
			"name" : "eyelid1",
			"offsetX" : 938,
			"offsetY" : 156,
			"width" : 43,
			"height" : 24,
			"posX" : 1.15,
			"posY" : 0.5,
			"zIndex" : 10
		},
		{
			"name" : "eyelid2",
			"offsetX" : 938,
			"offsetY" : 182,
			"width" : 43,
			"height" : 24,
			"posX" : 1.15,
			"posY" : 0.5,
			"zIndex" : 10
		},
		{
			"name" : "eyelid3",
			"offsetX" : 938,
			"offsetY" : 211,
			"width" : 43,
			"height" : 39,
			"posX" : 1.15,
			"posY" : 0.33,
			"zIndex" : 10
		},
		{
			"name" : "left_hand",
			"offsetX" : 997,
			"offsetY" : 131,
			"width" : 1054-997,
			"height" : 203-131,
			"posX" : 0.7,
			"posY" : 1.2,
			"rotationOffsetX" : 0.2,
			"rotationOffsetY" : 0.2,
			"zIndex" : 20
		},
		{
			"name" : "right_hand",
			"offsetX" : 1064,
			"offsetY" : 149,
			"width" : 1109-1064,
			"height" : 195-149,
			"posX" : 1.83,
			"posY" : 1.1,
			"rotationOffsetX" : 0.3,
			"rotationOffsetY" : 0.1,
			"zIndex" : 14
		},
		{
			"name" : "creature_shadow",
			"offsetX" : 788,
			"offsetY" : 416,
			"width" : 206,
			"height" : 82,
			"posX" : -0.3,
			"posY" : 1.9,
			"zIndex" : 5
		}
	],
	"cannon" : [
		{
			"name" : "cannon",
			"offsetX" : 1032,
			"offsetY" : 497,
			"width" : 1142-1032,
			"height" : 653-497,
			"posX" : 1.12,
			"posY" : -0.3,
			"zIndex" : 20
		},
		{
			"name" : "base",
			"offsetX" : 1000,
			"offsetY" : 291,
			"width" : 153,
			"height" : 92,
			"posX" : 0,
			"posY" : 0,
			"zIndex" : 10
		},
		{
			"name" : "grass",
			"offsetX" : 1052,
			"offsetY" : 414,
			"width" : 62,
			"height" : 24,
			"posX" : 1.8,
			"posY" : 11.35,
			"zIndex" : 13
		},
		{
			"name" : "shadow",
			"offsetX" : 128*6,
			"offsetY" : 128*4,
			"width" : 256,
			"height" : 112,
			"posX" : -1.0,
			"posY" : 0.4,
			"zIndex" : 9
		},
		{
			"name" : "glow",
			"offsetX" : 128*6,
			"offsetY" : 128*5,
			"width" : 232,
			"height" : 192,
			"posX" : -1.6,
			"posY" : -3.5,
			"zIndex" : 25
		},
		{
			"name" : "sights",
			"offsetX" : 1078,
			"offsetY" : 833,
			"width" : 6,
			"height" : 18,
			"posX" : 0,
			"posY" : -1,
			"zIndex" : 20
		}
	],
	"bubbles" : [
		{
			"name" : "bubble_green",
			"offsetX" : 0,
			"offsetY" : 128*6,
			"animation_blowaway": {
				"sprites" : 5,
				"offsetX" : 128,
				"offsetY" : 128*6
			}
		},
		{
			"name" : "bubble_violet",
			"offsetX" : 0,
			"offsetY" : 128*4,
			"animation_blowaway": {
				"sprites" : 5,
				"offsetX" : 128,
				"offsetY" : 128*4
			}
		},
		{
			"name" : "bubble_blue",
			"offsetX" : 0,
			"offsetY" : 128*3,
			"animation_blowaway": {
				"sprites" : 5,
				"offsetX" : 128,
				"offsetY" : 128*3
			}
		},
		{
			"name" : "bubble_yellow",
			"offsetX" : 0,
			"offsetY" : 128*5,
			"animation_blowaway": {
				"sprites" : 5,
				"offsetX" : 128,
				"offsetY" : 128*5
			}
		},
		{
			"name" : "bubble_red",
			"offsetX" : 0,
			"offsetY" : 128*2,
			"animation_blowaway": {
				"sprites" : 5,
				"offsetX" : 128,
				"offsetY" : 128*2
			}
		},
		{
			"name" : "bubble_2x",
			"offsetX" : 0,
			"offsetY" : 128*1,
			"animation_blowaway": {
				"sprites" : 5,
				"offsetX" : 128,
				"offsetY" : 128*1
			}
		},
		{
			"name" : "bubble_bomb",
			"offsetX" : 0,
			"offsetY" : 128*0,
			"animation_blowaway": {
				"sprites" : 5,
				"offsetX" : 128*3,
				"offsetY" : 128*0
			},
			"animation_static" : {
				"sprites" : 3,
				"offsetX" : 0,
				"offsetY" : 128*0
			}
		},
		{
			"name" : "bubble_trans",
			"offsetX" : 128*8,
			"offsetY" : 0
		}
	]
};
