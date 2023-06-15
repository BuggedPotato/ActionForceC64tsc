import { Bounds } from "../../types/Bounds";
import { Collision } from "../../types/Collision";
import { SpriteSet } from "../../types/SpriteSet";
import { SpriteSetSources } from "../../types/SpriteSetSources";
import { XYBase } from "../../types/XYBase";
import { Ursus } from "./Ursus";
import { Vector2 } from "./Vector2";

export class Entity
{
    protected _size : XYBase;
    protected _position : Vector2;
    protected _collisionBox : Bounds;
    protected _engine : Ursus;
    protected _isDestructible : boolean;

    protected _canvas : HTMLCanvasElement;

    protected _SPRITES? : SpriteSet;
    protected _spritesheetPosition : XYBase = { y: 0, x: 0 };
    
    constructor( s : XYBase, pos : Vector2, engine : Ursus, canvasName : string, sprites? : SpriteSetSources, destructible? : boolean )
    {
        this._size = s;
        this._position = pos;
        this._engine = engine;
        this._canvas = document.getElementById( canvasName ) as HTMLCanvasElement;
        
        if( sprites )
            this.setSprites( sprites, "idleLsrc" in sprites, "turnSrc" in sprites, "destroyedSrc" in sprites );
        if( typeof destructible === "boolean" ) // if argument is there
        {
            this._isDestructible = destructible;
            if( destructible === false ) // if its false
                this.destroy = undefined;
        }
        
        this.updateCollisionBox();
    }

    public updateCollisionBox() : void
    {
        this._collisionBox = {
            tr : { x: this._position.x + this._size.x, y: this._position.y },
            br : { x: this._position.x + this._size.x, y: this._position.y + this._size.y },
            tl : { x: this._position.x, y: this._position.y },
            bl : { x: this._position.x, y: this._position.y + this._size.y },
        }
    }


    
    public draw() : void
    {
        const ctx : CanvasRenderingContext2D = this._canvas.getContext( "2d" );
        let x : number = this._position.x - this._engine.backgroundOffset * 5;
        if( this._SPRITES )
        {
            ctx.drawImage( this._SPRITES.idleR, 0, 0, this._size.x, this._size.y, x, this._position.y, this._size.x * 5, this._size.y * 5 );
        }
        else
        {
            ctx.fillStyle = "red";
            ctx.fillRect( x, this._position.y, this._size.x, this._size.y );
        }
    }
    
    /**only works for destructible entities */
    public destroy() : void
    {
        this._engine.deleteObstacle( this );
    }

    public isInside( point : XYBase ) : boolean // ( ͡° ͜ʖ ͡°)
    {
        // let res : boolean = false;
        // let i, j : number = 0;
        // const selfPoints : XYBase[] = Object.values( this._collisionBox );
        // /**@todo not only for rectangles - maybe done? Check that! */
        // for( i = 0, j = selfPoints.length - 1; i < selfPoints.length; j = i++ )
        // {
        //     // if( JSON.stringify( point ) == JSON.stringify( selfPoints[i] ) || JSON.stringify( point ) == JSON.stringify( selfPoints[j] ) )
        //     //     return true;
        //     if( (( selfPoints[i].y < point.y ) != ( selfPoints[j].y < point.y )) && ( point.x < ( selfPoints[j].x - selfPoints[i].x ) * ( point.y - selfPoints[i].y ) / ( selfPoints[j].y - selfPoints[i].y ) + selfPoints[i].x ) )
        //     {
        //         res = !res;
        //     }
        // }
        // if( res )
        //     console.log( point, selfPoints );
        // return res;

        return (
            (point.x > this._collisionBox.tl.x && point.x < this._collisionBox.tr.x) && (point.y > this._collisionBox.tr.y && point.y < this._collisionBox.br.y)
        )
    }
    
    public collided() : Collision | null
    {
        const selfPoints : XYBase[] = Object.values( this._collisionBox );
        const keys : string[] = Object.keys( this._collisionBox );
        const obs : Entity[] = this._engine.level.obstacles;

        const zero : Vector2 = new Vector2( 0, 1 );
        // angle between two vectors
        let alpha : number;
        if( !this._engine.player )
            alpha = 0;
        else
            alpha = Math.acos( ((this._engine.player.velocity.x) * zero.x + this._engine.player.velocity.y * zero.y) / (this._engine.player.velocity.magnitude * zero.magnitude ) ) / Math.PI * 180;

        for( let i = 0; i < obs.length; i++ )            
        {
            const obsPoints : XYBase[] = Object.values( obs[i].collisionBox )
            for( let j = 0; j < obsPoints.length; j++ )
            {
                if( this.isInside( obsPoints[j] ) )
                {
                    // console.log( this, obsPoints[j] );
                    return { point: keys[j], pointPos: obsPoints[j], angle: alpha, parent: obs[i], target: this };
                }
            }
        }
        for( let i = 0; i < obs.length; i++ )            
        {
            for( let j = 0; j < selfPoints.length; j++ )
            {
                if( obs[i].isInside( selfPoints[j] ) )
                {
                    // console.log( obs[i], selfPoints[j] );
                    return { point: keys[j], pointPos: selfPoints[j], angle: alpha, parent: this, target: obs[i] };
                }
            }
        }
        return null;
    }

    protected async setSprites( sources : SpriteSetSources, idleL? : boolean, turning? : boolean, destroyed? : boolean )
    {
        let idleRImg : HTMLImageElement = new Image();
        idleRImg.src = sources.idleRsrc;
        await idleRImg.decode();
        this._SPRITES = {
            idleR: idleRImg
        };

        if( idleL )
        {
            let idleLImg : HTMLImageElement = new Image( 100, 100 );
            idleLImg.src = sources.idleLsrc;
            await idleLImg.decode();
            this._SPRITES.idleL = idleLImg;
        }
        if( turning )
        {
            let turnImg : HTMLImageElement = new Image( 100, 100 );
            turnImg.src = sources.turnSrc;
            await turnImg.decode();
            this._SPRITES.turn = turnImg;
        }
        if( destroyed )
        {
            let destroyedImg : HTMLImageElement = new Image( 100, 100 );
            destroyedImg.src = sources.destroyedSrc;
            await destroyedImg.decode();
            this._SPRITES.destroyed = destroyedImg;
        }
    }

    set engine( engine : Ursus ) { this._engine = engine }
    get collisionBox() : Bounds { return this._collisionBox }
    get position() : Vector2 { return this._position }
    get size() : XYBase { return this._size }
    get isDestructible() : boolean { return this._isDestructible }
}