import { COLOUR_FILTERS_ARRAY } from "./config";
import { Level } from "./engine/classes/Level";
import { Ursus } from "./engine/classes/Ursus";
import * as levelAData from "./levelAData";

const levelA : Level = new Level( levelAData.data.backgroundSrc, levelAData.data.overlaySrc, { tr: {x: levelAData.data.size.x, y: -80}, br: {x: levelAData.data.size.x, y:515}, tl: {x: 0, y: -80}, bl: {x: 0, y: 515} }, null, levelAData.obstacles, levelAData.zones, levelAData.data.bridgesVisible );
let engine : Ursus = new Ursus( levelA );
levelA.engine = engine;
await engine.init();
engine.start();
/**@todo fix bridges on restart */

// const c = document.getElementById( "colours" ) as HTMLCanvasElement;
// const ctx = c.getContext( "2d" );
// ctx.fillStyle = "black";
// COLOUR_FILTERS_ARRAY.map( ( filter : string, i : number )=>{
//     ctx.filter = filter;
//     ctx.fillRect( 0, i * 50, 50, 50 );
// } );
// ctx.filter = "none";