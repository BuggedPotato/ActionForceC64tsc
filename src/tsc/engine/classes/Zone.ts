import { XYBase } from "../../types/XYBase";
import { ZoneTypes } from "../enums/EZoneTypes";
import { Entity } from "./Entity";
import { Ursus } from "./Ursus";
import { Vector2 } from "./Vector2";

export class Zone extends Entity
{
    private _type : ZoneTypes;
    constructor( s : XYBase,  pos : Vector2, type : ZoneTypes )
    {
        super( s, pos, null, null );
        this._type = type;
    }
    
    get type() { return this._type };
}