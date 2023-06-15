import { IFrame } from "../../interfaces/IFrame";
import { Helpers } from "./Helpers";
import { SpriteSetSources } from "../../types/SpriteSetSources";
import { Entity } from "./Entity";
import { Ursus } from "./Ursus";
import { Vector2 } from "./Vector2";
import GUI from "./PlayerGuiHandle";
import { Projectile } from "./Projectile";
import { Directions } from "../enums/EDirections";
import * as CONFIG from "../../config"
import { SpriteSet } from "../../types/SpriteSet";
import { Zone } from "./Zone";
import { ZoneTypes } from "../enums/EZoneTypes";
import { Bridge } from "../../types/Bridge";
import { XYBase } from "../../types/XYBase";
import { ColourFilters } from "../enums/EColourFilters";
import { AudioManager } from "./AudioManager";
import { isFloatingResponse } from "../../types/IsFloatingResponse";
import { EntityType } from "../enums/EEntityType";

export class Player extends Entity implements IFrame
{
    private readonly _MAX_AMMO = CONFIG.PLAYER_CONSTANTS.maxAmmo;
    private readonly _MAX_BOMBS = CONFIG.PLAYER_CONSTANTS.maxBombs;
    public readonly MAX_FUEL = CONFIG.PLAYER_CONSTANTS.maxFuel;
    private readonly _ACCELERATION : number = CONFIG.PLAYER_CONSTANTS.acceleration;

    private _ammo : number = 100;
    private _lastResupplyTick : number;
    private _bombs : number = 50;
    private _fuel : number = 0;
    private _lastFuelTick : number;
    private _lastRefuelTick : number;
    private _accelerationTick: number;
    public hp : number;
    
    private _bridges : number = 0;
    public score : number = 0;

    private _lastAnimationTick : number;
    
    private _velocity : Vector2 = new Vector2( 0, 0 );
    public velocityFactor : number = 0;
    private _direction : Directions = Directions.East;

    private _isTurning : boolean = false;
    private _iAmAlive : boolean = true;

    private _ROCKET_SPRITE : SpriteSet;
    private _BOMB_SPRITE : SpriteSet;

    constructor( w : number, h : number, pos : Vector2, engine : Ursus, canvasName : string, sprites? : SpriteSetSources )
    {
        super( {x:w, y:h}, pos, engine, canvasName, sprites );
        
        this._lastFuelTick = window.performance.now();
        this._lastResupplyTick = window.performance.now();
        this._lastRefuelTick = window.performance.now();
        this._lastAnimationTick = window.performance.now();
        this._accelerationTick = 0;
        this.hp = 5;
        this.setRocketSprites();
        this.setBombSprites();

        let foo = ()=> {
            this._fuel++;
            if( this._fuel < this.MAX_FUEL )
                setTimeout( foo, 160 / CONFIG.PLAYER_CONSTANTS.fuelPerRefuelSecond )
        };
        setTimeout( foo, CONFIG.PLAYER_CONSTANTS.fuelPerRefuelSecond );
    }

    
    public frame()
    {
        if( !this._iAmAlive )
            return;
        this.updateVelocity();
        this.updatePosition();
        this.updateCollisionBox();
        this.updateDirection();
        this.checkZones();
        this.burnFuel();
        console.log( this.velocity )
    }
    
    public override draw() : void
    {
        if( !this._iAmAlive )
        {
            this.wereDoneFor();
            return;
        }
        let x : number = this.getDrawingPos();

        const ctx : CanvasRenderingContext2D = this._canvas.getContext( "2d" );
        ctx.imageSmoothingEnabled = false;
        if( this._SPRITES )
        {
            let img : HTMLImageElement;
            let multiplier : number = 1;
            const spriteSize : XYBase = { x: 96, y: 40 };
            if( this._isTurning )
            {
                img = this._SPRITES.turn;
                multiplier = this._direction == Directions.East ? -1 : 1;
            }
            else
                img = this._direction == Directions.East ? this._SPRITES.idleR : this._SPRITES.idleL;
            if( window.performance.now() - this._lastAnimationTick >= CONFIG.PLAYER_CONSTANTS.animationInterval )
            {
                this._spritesheetPosition.x += spriteSize.x * multiplier; // 96 == sprite width in px
                if( this._spritesheetPosition.x >= img.naturalWidth || this._spritesheetPosition.x < 0 )
                {
                    this._spritesheetPosition.x = 0;
                    img = this._direction == Directions.East ? this._SPRITES.idleR : this._SPRITES.idleL;
                    this._isTurning = false;
                }
                this._lastAnimationTick = window.performance.now();
            }
            ctx.drawImage( img, this._spritesheetPosition.x, this._spritesheetPosition.y, spriteSize.x, spriteSize.y, x, this._position.y, this._size.x, this._size.y );
        }
        else
        {
            ctx.fillStyle = "gold";
            ctx.fillRect( x, this._position.y, this._size.x, this._size.y );
        }
    }

    /**
     * called on player being destroyed
     */
    private wereDoneFor() : void
    {
        const spriteSize : XYBase = { x: 48, y: 42 };
        const x : number = this.getDrawingPos();
        const shift : number = this._engine.fpsStuff.frameCount * 3;
        if( this._spritesheetPosition.x >= this._SPRITES.destroyed.naturalWidth )
        {
            this._engine.delete( EntityType.Player );
            return;
        }
        // const ctx : CanvasRenderingContext2D = this._canvas.getContext( "2d" );
        const ctx : CanvasRenderingContext2D = this._engine.level.OL_CANVAS.getContext( "2d" );
        ctx.drawImage( this._SPRITES.destroyed, this._spritesheetPosition.x, this._spritesheetPosition.y, spriteSize.x, spriteSize.y, x - shift, this._position.y, this._size.x / 2, this._size.y ); // main left
        ctx.drawImage( this._SPRITES.destroyed, this._spritesheetPosition.x, this._spritesheetPosition.y, spriteSize.x, spriteSize.y, x + shift + this._size.x / 2, this._position.y, this._size.x / 2, this._size.y ); // main right
        
        ctx.filter = Helpers.randomColourFilter();
        ctx.drawImage( this._SPRITES.destroyed, this._spritesheetPosition.x, this._spritesheetPosition.y + spriteSize.y, spriteSize.x, spriteSize.y, x - shift, this._position.y, this._size.x / 2, this._size.y ); // inner left
        
        ctx.filter = Helpers.randomColourFilter();
        ctx.drawImage( this._SPRITES.destroyed, this._spritesheetPosition.x, this._spritesheetPosition.y + spriteSize.y, spriteSize.x, spriteSize.y, x + shift + this._size.x / 2, this._position.y, this._size.x / 2, this._size.y ); // inner right
        ctx.filter = ColourFilters.Black;

        if( window.performance.now() - this._lastAnimationTick >= CONFIG.PLAYER_CONSTANTS.deathAnimationInterval )
        {
            this._spritesheetPosition.x += spriteSize.x;
            this._lastAnimationTick = window.performance.now();
        }
    }
 

    private updateVelocity() : void
    {
        let deltaY : number = 0;
        if( this._fuel > 0 )
        {
            const shouldAccelerate : boolean = window.performance.now() - this._accelerationTick > 90;
            if( this._engine.input.up )
                deltaY = -2 * this._ACCELERATION;
            if( this._engine.input.down )
                deltaY = this._ACCELERATION;
            if( this._engine.input.left && shouldAccelerate && this.velocityFactor > -4 )
            {
                this.velocityFactor--;
                this._accelerationTick = window.performance.now()
            }
            if( this._engine.input.right && shouldAccelerate && this.velocityFactor < 4 )
            {
                this.velocityFactor++;
                this._accelerationTick = window.performance.now()
            }
        }
        const touchingGround : boolean = this._position.y + this._size.y >= this._engine.level.bounds.bl.y;
        if( touchingGround )
        {
            if( this._engine.input.left )
            this._velocity.x = -1;
            else if( this._engine.input.right )
            this._velocity.x = 1;
            this.updateDirection();
            this._velocity.scalarProduct( new Vector2( 0, 1 ) );
            this.velocityFactor = 0;
        }
        this._velocity = new Vector2( this._ACCELERATION * this.velocityFactor, deltaY )
        this._velocity.addVector( new Vector2( 0, this._ACCELERATION / 2 ) ); // gravity
    }

    protected updateDirection() : void
    {
        if( this._velocity.x > 0 && this._direction == Directions.West ) // turn -->
        {
            this._isTurning = true;
            this._direction = Directions.East;
            this._spritesheetPosition.x =  4 * 96;
        }
        else if( this._velocity.x < 0 && this._direction == Directions.East ) // turn <--
        {
            this._isTurning = true;
            this._direction = Directions.West;
            this._spritesheetPosition.x = 0;
        }
    }

    protected updatePosition()
    {
        let probe = new Entity( this._size, this._position, this._engine, this._canvas.id );
        probe.position.addVector( this._velocity );
        probe.updateCollisionBox();
        const collision = probe.collided();
        let step : Vector2 = this._velocity.normalized();
        step.multiply( -0.1 );

        if( Helpers.isCollision( collision ) )
        {
            // const shouldDie : boolean = Math.abs(this._velocity.x) >= CONFIG.PLAYER_CONSTANTS.criticalVelocity || this._velocity.y <= -CONFIG.PLAYER_CONSTANTS.criticalVelocity;
            const shouldDie : boolean = Math.abs(this.velocityFactor) >= CONFIG.PLAYER_CONSTANTS.criticalVelocityFactor && (collision.angle > 162 || (collision.angle > 78 && collision.angle < 120) || collision.angle < 30 )
            if( shouldDie )
            {
                this.die();
                return;
            }
            
            this._velocity.multiply( 0 );
            this.velocityFactor = 0;
            while( probe.collided() != null )
            {
                probe.position.addVector( step );
                probe.updateCollisionBox();
            }

            const res : isFloatingResponse = this.isFloating( collision.pointPos, collision.point );
            if( res.isFloating )
            {
                const acc : number = 2 * CONFIG.PLAYER_CONSTANTS.acceleration * (res.direction == Directions.East ? 1 : -1);
                this._position.addVector( new Vector2( acc, -CONFIG.PLAYER_CONSTANTS.minVelocityFactor * 4 ) )
            }

            this._position = probe.position;
            return;
        }
        else
            this._position.addVector( this._velocity );

        if( this._position.x + this._size.x > this._engine.level.bounds.tr.x )
        {
            this._position.x = this._engine.level.bounds.tr.x - this._size.x;
            this._velocity.x = 0;
        }
        else if( this._position.x < this._engine.level.bounds.tl.x )
        {
            this._position.x = this._engine.level.bounds.tl.x;
            this._velocity.x = 0;
        }

        if( this._position.y + this._size.y >= this._engine.level.bounds.bl.y )
        {
            this._position.y = this._engine.level.bounds.bl.y - this._size.y;
            this._velocity.multiply(0)
            // this.velocityFactor = 0;
        }
        else if( this._position.y < this._engine.level.bounds.tl.y )
        {
            this._position.y = this._engine.level.bounds.tl.y;
        }
    }

    private checkZones() : void
    {
        this._engine.level.zones.map( ( zone : Zone ) => {
            if( zone.isInside( { x: this._collisionBox.bl.x + this._size.x/2, y: this._collisionBox.bl.y - 1 } ) )
            {
                switch( zone.type )
                {
                    case ZoneTypes.Refuel:
                        this.refuel();
                    break;
                    case ZoneTypes.Resupply:
                        this.resupply();
                    break;
                }
            }
        } );
    }

    private burnFuel() : void
    {
        if( this._fuel <= 0 )
            return;
        if( window.performance.now() - this._lastFuelTick >= CONFIG.PLAYER_CONSTANTS.fuelTickDuration * 1000 )
        {
            this._fuel--;
            this._lastFuelTick = window.performance.now();
        }
    }

    public shoot() : void
    {
        const bridges = this._engine.level.bridges;
        for( let i = 0; i < bridges.length; i++ )
        {
            if( bridges[i].zone.isInside( { x: this._collisionBox.bl.x + this._size.x/2, y: this._collisionBox.bl.y - 1 } ) )
            {
                this.engineering( bridges[ i ] );
                return;
            }
        }

        if( this._ammo <= 0 )
            return;
    
        const rocketPos : Vector2 = this._position.copy();
        rocketPos.addXY( { x: this._direction == Directions.East ? this.size.x : 0, y: this.size.y / 3 * 2 } );
        const vel : Vector2 = new Vector2( this._direction == Directions.East ? CONFIG.VELOCITIES.rocket : -CONFIG.VELOCITIES.rocket, 0 )
        const rocket : Projectile = new Projectile( EntityType.Player, { x: 40, y: 20 }, vel, rocketPos, this._engine, this._canvas.id, this._ROCKET_SPRITE );
        this._engine.projectiles.push( rocket );
        this._ammo--;
        AudioManager.play( "shot" );
    }

    public dropBomb() : void
    {
        if( this._bombs <= 0 || this._engine.input.shoot || this._velocity.x != 0 )
            return;

        const bombPos : Vector2 = this._position.copy();
        bombPos.addXY( { x: this.size.x / 2, y: this.size.y } );
        const vel : Vector2 = new Vector2( 0, CONFIG.VELOCITIES.bomb );
        const bomb : Projectile = new Projectile( EntityType.Player, { x: 40, y: 40 }, vel, bombPos, this._engine, this._canvas.id, this._BOMB_SPRITE );
        this._engine.projectiles.push( bomb );
        this._bombs--;
        AudioManager.play( "shot" );
    }

    private refuel() : void
    {
        if( this._fuel < this.MAX_FUEL && Date.now() - this._lastRefuelTick > (1000 / CONFIG.PLAYER_CONSTANTS.fuelPerRefuelSecond) )
        {
            this._fuel++;
            this._lastRefuelTick = Date.now();
        }    
    }

    private resupply() : void
    {
        if( Date.now() - this._lastResupplyTick > (1000 / CONFIG.PLAYER_CONSTANTS.ammoPerResupplySecond) )
        {
            if( this._ammo < this._MAX_AMMO )
            {
                this._ammo++;
                this._lastResupplyTick = Date.now();
            }    
            if( this._bombs < this._MAX_BOMBS )
            {
                this._bombs++;
                this._lastResupplyTick = Date.now();
            }
        }
    }

    private engineering( bridge : Bridge )
    {
        if( bridge.built )
            this._bridges++;
        else if( !bridge.built && this._bridges > 0 )
            this._bridges--;
        else
            return;
        bridge.built = !bridge.built;
        AudioManager.play( "engineering" );
    }

    public mayday( damage? : number ) : void
    {
        console.log( damage )
        if( damage == 100 )
            this.die();
    }

    protected die() : void
    {
        this._spritesheetPosition.x = 0;
        this._lastAnimationTick = window.performance.now();
        this._iAmAlive = false;
        this._engine.fpsStuff.frameCount = 0;
        AudioManager.play( "death" );
    }

    protected async setRocketSprites()
    {
        let sources = CONFIG.SPRITES.rocket as SpriteSetSources;
        let idleRImg = new Image( 100,100 );
        idleRImg.src = sources.idleRsrc;
        await idleRImg.decode();
        let idleLImg = new Image( 100,100 );
        idleLImg.src = sources.idleLsrc;
        await idleLImg.decode();
        this._ROCKET_SPRITE = {
            idleR: idleRImg,
            idleL: idleLImg
        }
    }

    private async setBombSprites()
    {
        let sources = CONFIG.SPRITES.bomb as SpriteSetSources;
        let idleRImg = new Image( 100,100 );
        idleRImg.src = sources.idleRsrc;
        await idleRImg.decode();
        this._BOMB_SPRITE = {
            idleR: idleRImg
        }
    }

    private getDrawingPos() : number
    {
        let x : number = this._engine.level.SCREEN_WIDTH / 2 - this._size.x / 2;
        if( this._engine.backgroundOffset <= 0 )
            x = this._position.x;
        /** right side slidestop handle - fml*/
        else if( this._engine.backgroundOffset * 5 + this._engine.level.SCREEN_WIDTH >= this._engine.level.bounds.tr.x )
            x = this._position.x - this._engine.backgroundOffset * 5;
        return x;
    }

    /**
     * determines whether the player should be moved to accommodate for not graphically touching the ground
     * @param point obstacle collision point
     */
    private isFloating( point : XYBase, pointName : string ) : isFloatingResponse
    {
        let res : isFloatingResponse  = { isFloating: false };
        if( this._isTurning )
            return res;
        /**no check for x > 0 cuz collision assures that? */
        const isFloatingEast : boolean = pointName == "tr" && this._direction == Directions.East && point.x - this._collisionBox.bl.x <= this._size.x / 3;
        const isFloatingWest : boolean = pointName == "tl" && this._direction == Directions.West && this._collisionBox.br.x - point.x <= this._size.x / 3;
        if( isFloatingEast || isFloatingWest )
            res = { isFloating: true, direction: this._direction };
        return res;
    }

    get velocity() { return this._velocity }
    get canvas() { return this._canvas }
    get alive() { return this._iAmAlive }
    get ammo() { return this._ammo }
    get bombs() { return this._bombs }
    get fuel() { return this._fuel }
    get bridges() { return this._bridges }
}

