import { Zone } from "../engine/classes/Zone";
import { XYBase } from "./XYBase"

export type Bridge = {
    position : XYBase;
    size : XYBase;
    built : boolean;
    zone : Zone;
}