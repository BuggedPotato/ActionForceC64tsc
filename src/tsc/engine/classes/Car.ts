import { CAR_CONSTANTS } from "../../config";
import { IFrame } from "../../interfaces/IFrame";
import { Bridge } from "../../types/Bridge";
import { Collision } from "../../types/Collision";
import { SpriteSetSources } from "../../types/SpriteSetSources";
import { XYBase } from "../../types/XYBase";
import { ColourFilters } from "../enums/EColourFilters";
import { EntityType } from "../enums/EEntityType";
import { ZoneTypes } from "../enums/EZoneTypes";
import { AudioManager } from "./AudioManager";
import { Entity } from "./Entity";
import { Helpers } from "./Helpers";
import { Ursus } from "./Ursus";
import { Vector2 } from "./Vector2";
import { Zone } from "./Zone";

export class Car extends Entity implements IFrame
{
    private _velocity : Vector2;
    private _iAmAlive : boolean;
    private _lastAnimationTick: number;
    public hp : number;

    private _isFalling : boolean;

    constructor( w : number, h : number, pos : Vector2, vel : Vector2, engine : Ursus, canvasName : string, sprites? : SpriteSetSources )
    {
        super( { x: w, y: h }, pos, engine, canvasName, sprites );
        this._velocity = vel;
        this._iAmAlive = true;
        this._isFalling = false;
        this._lastAnimationTick = window.performance.now();
        this.hp = CAR_CONSTANTS.hitpoints;
    }

    public frame() : void
    {
        if( !this._iAmAlive )
            return;
        this.checkZones();
        this.updatePosition();
        this.updateCollisionBox();
    }

    public override draw() : void
    {
        if( !this._iAmAlive )
        {
            this.wereDoneFor();
            return;
        }
        const ctx : CanvasRenderingContext2D = this._canvas.getContext( "2d" );
        const x : number = this.getDrawingPos();
        const spriteSize : XYBase = { x: 48, y: 40 };
        if( this._SPRITES )
        {
            if( window.performance.now() - this._lastAnimationTick > CAR_CONSTANTS.animationInterval )
            {
                this._spritesheetPosition.x += spriteSize.x;
                if( this._spritesheetPosition.x >= this._SPRITES.idleR.naturalWidth )
                    this._spritesheetPosition.x = 0;
                this._lastAnimationTick = window.performance.now();
            }
            ctx.drawImage( this._SPRITES.idleR, this._spritesheetPosition.x, this._spritesheetPosition.y, spriteSize.x, spriteSize.y, x, this._position.y, this._size.x, this._size.y );
        }
        else
        {
            ctx.fillStyle = "gold";
            ctx.fillRect( x, this._position.y, this._size.x, this._size.y );
        }
    }

    public wereDoneFor() : void
    {
        const spriteSize : XYBase = { x: 48, y: 42 };
        const x : number = this.getDrawingPos();
        if( this._spritesheetPosition.x >= this._SPRITES.destroyed.naturalWidth )
        {
            this._engine.delete( EntityType.Car );
            return;
        }
        const ctx : CanvasRenderingContext2D = this._canvas.getContext( "2d" );
        ctx.drawImage( this._SPRITES.destroyed, this._spritesheetPosition.x, this._spritesheetPosition.y, spriteSize.x, spriteSize.y, x, this._position.y, this._size.x, this._size.y ); // main
        
        ctx.filter = Helpers.randomColourFilter();
        ctx.drawImage( this._SPRITES.destroyed, this._spritesheetPosition.x, this._spritesheetPosition.y + spriteSize.y, spriteSize.x, spriteSize.y, x, this._position.y, this._size.x, this._size.y ); // inner
        ctx.filter = ColourFilters.Black;

        if( window.performance.now() - this._lastAnimationTick >= CAR_CONSTANTS.deathAnimationInterval )
        {
            this._spritesheetPosition.x += spriteSize.x;
            this._lastAnimationTick = window.performance.now();
        }
    }

    private updatePosition() : void
    {
        const collision : Collision = this.collided();
        if( Helpers.isCollision( collision ) )
        {
            this.die();
            return;
        }
        const point : XYBase = { x: this._engine.player.position.x + this._engine.player.size.x / 2, y: this._engine.player.position.y + this._engine.player.size.y / 3 * 2 }
        if( this.isInside( point ) && Date.now() % 40 < 10 )
        {
            this.mayday();
        }

        this._position.addVector( this._velocity );
        if( this._isFalling )
            this._position.addVector( new Vector2( 0, 8 ) );
    }

    private checkZones() : void
    {
        const collisionPoint : XYBase = { x: this._collisionBox.bl.x, y: this._collisionBox.bl.y - 1 };
        this._engine.level.bridges.map( ( bridge : Bridge, i : number )=>{
            if( !bridge.built && bridge.zone.isInside( collisionPoint ) )
                this._isFalling = true;
        } );
        let exit = this._engine.level.zones.find( z => z.type === ZoneTypes.Exit );
        if( exit !== undefined && exit.isInside( collisionPoint ) )
            alert( "========= END ========" );
    }

    public mayday( damage : number = 1 ) : void
    {
        this.hp -= damage;
        if( this.hp <= 0 )
            this._iAmAlive = false;
    }

    private die()
    {
        this._iAmAlive = false;
        this._lastAnimationTick = window.performance.now();
        this._engine.fpsStuff.frameCount = 0;
        AudioManager.play( "death" );
    }

    private getDrawingPos() : number
    {
        // let x : number = this._position.x - this._engine.backgroundOffset * 5;
        return this._position.x - this._engine.backgroundOffset * 5;
    }

    get alive() { return this._iAmAlive }
}