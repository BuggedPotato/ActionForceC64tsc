import { Entity } from "../engine/classes/Entity";
import { XYBase } from "./XYBase";

export type  Collision = {
    point : string;
    pointPos : XYBase;
    angle : number;
    parent : any;
    target : any;
}