import { HTML_IDS, SPRITES } from "./config";
import { Entity } from "./engine/classes/Entity";
import { Vector2 } from "./engine/classes/Vector2";
import { Zone } from "./engine/classes/Zone";
import { ZoneTypes } from "./engine/enums/EZoneTypes";
import { SpriteSetSources } from "./types/SpriteSetSources";
import { XYBase } from "./types/XYBase";

export const data : any = {
    size: { x: 12800, y: 680 },
    bridgesVisible: [ 0, 3 ],

    backgroundSrc: "./src/gfx/levels/A/base.bmp", 
    overlaySrc: "./src/gfx/levels/A/overlay.bmp",
}



const spikeWall : Entity[] = [
    new Entity( { x: 40, y: 40 }, new Vector2( 11240, 360 ), null, HTML_IDS.backgroundCanvasId, SPRITES.spike as SpriteSetSources, true ), // set engine!!!
    new Entity( { x: 40, y: 40 }, new Vector2( 11240, 400 ), null, HTML_IDS.backgroundCanvasId, SPRITES.spike as SpriteSetSources, true ),
    new Entity( { x: 40, y: 40 }, new Vector2( 11240, 440 ), null, HTML_IDS.backgroundCanvasId, SPRITES.spike as SpriteSetSources, true ),
    new Entity( { x: 40, y: 40 }, new Vector2( 11240, 480 ), null, HTML_IDS.backgroundCanvasId, SPRITES.spike as SpriteSetSources, true ),
];

const wall : Entity[] = [
    new Entity( { x: 30, y: 40 }, new Vector2( 11290, 360 ), null, HTML_IDS.backgroundCanvasId, SPRITES.wall as SpriteSetSources, true ), // set engine!!!
    new Entity( { x: 30, y: 40 }, new Vector2( 11290, 400 ), null, HTML_IDS.backgroundCanvasId, SPRITES.wall as SpriteSetSources, true ),
    new Entity( { x: 30, y: 40 }, new Vector2( 11290, 440 ), null, HTML_IDS.backgroundCanvasId, SPRITES.wall as SpriteSetSources, true ),
    new Entity( { x: 30, y: 40 }, new Vector2( 11290, 480 ), null, HTML_IDS.backgroundCanvasId, SPRITES.wall as SpriteSetSources, true ),
];

export const obstacles : Entity[] = [
    new Entity( { x: 640, y: 30 }, new Vector2( 0, 320 ), null, HTML_IDS.gameCanvasId ), // left bottom platform
    new Entity( { x: 640, y: 30 }, new Vector2( 0, 40 ), null, HTML_IDS.gameCanvasId ), // left top platform
    new Entity( { x: 600, y: 30 }, new Vector2( 4840, 360 ), null, HTML_IDS.gameCanvasId ), // middle base platform
    new Entity( { x: 240, y: 80 }, new Vector2( 5200, 280 ), null, HTML_IDS.gameCanvasId ), // middle base building
    new Entity( { x: 242, y: 30 }, new Vector2( 12560, 320 ), null, HTML_IDS.gameCanvasId ), // right roof

    ...spikeWall,
    ...wall
]


export const zones : Zone[] = [
    new Zone( { x: 120, y: 15 }, new Vector2( 6920, 500 ), ZoneTypes.Bridge ), // bridge 0
    new Zone( { x: 120, y: 15 }, new Vector2( 7080, 500 ), ZoneTypes.Bridge ), // bridge 1
    new Zone( { x: 120, y: 15 }, new Vector2( 9360, 500 ), ZoneTypes.Bridge ), // bridge 3
    new Zone( { x: 120, y: 15 }, new Vector2( 9200, 500 ), ZoneTypes.Bridge ), // bridge 2
    
    new Zone( { x: 160, y: 35 }, new Vector2( 4920, 325 ), ZoneTypes.Resupply ),
    new Zone( { x: 160, y: 35 }, new Vector2( 5240, 245 ), ZoneTypes.Refuel ),

    new Zone( { x: 40, y: 180 }, new Vector2( 12760, 345 ), ZoneTypes.Exit ),

    new Zone( { x: 200, y: 200 }, new Vector2( 1000, -105 ), ZoneTypes.JetTrigger ), // left
    new Zone( { x: 200, y: 200 }, new Vector2( 12000, -105 ), ZoneTypes.JetTrigger ) // right
]