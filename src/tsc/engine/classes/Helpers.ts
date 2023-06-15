import { COLOUR_FILTERS_ARRAY } from "../../config";
import { Collision } from "../../types/Collision";
import { XYBase } from "../../types/XYBase";
import { Jet } from "./Jet";
import { Player } from "./Player";
import { Vector2 } from "./Vector2";

export const Helpers : any = {
    isCollision( e : Object ) : e is Collision
    {
        if( e == null ) return false;
        return ( e as Collision ).angle !== undefined;
    },

    isPlayer( e : Object ) : e is Player
    {
        if( e == null ) return false;
        return ( e as Player ).velocity !== undefined;
    },

    isJet( e : Object ) : e is Jet
    {
        if( e == null ) return false;
        return ( e as Jet ).ceiling !== undefined;
    },

    randomColourFilter() : string
    {
        return COLOUR_FILTERS_ARRAY[ Math.round( Math.random() * COLOUR_FILTERS_ARRAY.length ) ];
    },

    distance( a : Vector2, b : Vector2 ) : number
    {
        return Math.sqrt( (a.x - b.x) ** 2 + (a.y - b.y) ** 2 );
    },

    async sleepyTime( n : number )
    {
        return new Promise( res => setTimeout( ()=> res(true), n ) )
    }
}