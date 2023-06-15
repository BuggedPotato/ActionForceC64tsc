import { XYBase } from "../../types/XYBase";

export class Vector2
{
    private _x : number;
    private _y : number;
    private _magnitude : number;

    constructor( x : number, y : number )
    {
        this._x = x;
        this._y = y;
        this.setMagnitude();
    }

    get x() : number { return this._x; }
    set x( val : number ) { this._x = val }

    get y() : number{ return this._y; }
    set y( val : number ) { this._y = val }

    public addXY( obj : XYBase ) : void
    {
        this._x += obj.x;
        this._y += obj.y;
        // this.round();
        this.setMagnitude();
    }
    
    public addVector( ...a : Vector2[] ) : void
    {
        a.map( (vector : Vector2) => {
            this._x += vector.x;
            this._y += vector.y;
        } );
        // this.round();
        this.setMagnitude();
    }

    public multiply( n : number ) : void
    {
        this._x *= n;
        this._y *= n;
        // this.round();
        this.setMagnitude();
    }

    public scalarProduct( v : Vector2 ) : void
    {
        this._x *= v.x;
        this._y *= v.y;
        // this.round();
    }

    public round( n : number = 3 ) : void
    {
        this._x = Math.round( this._x * Math.pow(10, n) ) / Math.pow(10, n);
        this._y = Math.round( this._y * Math.pow(10, n) ) / Math.pow(10, n);
    }
    
    public copy() : Vector2
    {
        return new Vector2( this._x, this._y ) 
    }

    public normalized() : Vector2
    {
        let v : Vector2 = this.copy();
        v.multiply( 1 / this.magnitude );
        v.round();
        return v;
    }

    private setMagnitude() : void
    {
        this._magnitude = Math.sqrt( Math.pow( this._x, 2 ) + Math.pow( this._y, 2 ) );
    }

    get magnitude() : number { return this._magnitude }
}