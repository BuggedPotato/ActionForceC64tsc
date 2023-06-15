import { XYBase } from "./XYBase"

/**
 * tr - top right, tl - top left,
 * br - bottom right, bl - bottom left
 */
export type Bounds = {
    tr : XYBase;
    br : XYBase;
    tl : XYBase;
    bl : XYBase;
}
