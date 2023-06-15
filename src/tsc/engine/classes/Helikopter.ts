import { ENEMY_CONSTANTS, PLAYER_CONSTANTS, SPRITES, VELOCITIES } from "../../config";
import { IFrame } from "../../interfaces/IFrame";
import { SpriteSet } from "../../types/SpriteSet";
import { SpriteSetSources } from "../../types/SpriteSetSources";
import { XYBase } from "../../types/XYBase";
import { ColourFilters } from "../enums/EColourFilters";
import { Directions } from "../enums/EDirections";
import { EntityType } from "../enums/EEntityType";
import { AudioManager } from "./AudioManager";
import { Entity } from "./Entity";
import { Helpers } from "./Helpers";
import { Projectile } from "./Projectile";
import { Ursus } from "./Ursus";
import { Vector2 } from "./Vector2";

export class Helikopter extends Entity implements IFrame {

    private _lastAnimationTick : number;
    private _ROCKET_SPRITE : SpriteSet;

    private readonly _ACCELERATION : number = ENEMY_CONSTANTS.helikopter.acceleration;

    private _velocity : Vector2;
    public velocityFactor : number;
    private _direction : Directions;
    private _isTurning : boolean;
    private _iAmAlive : boolean;
    // private _accelerationTick: number;
    private _lastShootingTick : number;

    private _moveBusy : boolean;
    // private _forceTurnThingy: boolean;

    constructor( w : number, h : number, pos : Vector2, engine : Ursus, canvasName : string, sprites : SpriteSetSources, spriteImages : SpriteSet )
    {
        super( {x:w, y:h}, pos, engine, canvasName, sprites );
        this._SPRITES = spriteImages;
        this._lastAnimationTick = window.performance.now();
        this.setRocketSprites();
        this._lastAnimationTick = window.performance.now();
        // this._accelerationTick = window.performance.now();
        this.velocityFactor = 0;
        this._velocity = new Vector2( 0, 0 );
        this._direction = Directions.East;
        this._isTurning = false;
        this._iAmAlive = true;
        this._moveBusy = false;
        this._lastShootingTick = window.performance.now();
        // this._forceTurnThingy = true;
    }

    public async frame()
    {
        if( !this._iAmAlive )
            return;
        await this.updateVelocity();
        this.updatePosition();
        this.updateCollisionBox();
        this.updateDirection();
        this.tryShoot();
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
        if( this._SPRITES )
        {
            let img : HTMLImageElement;
            let multiplier : number = 1;
            const spriteSize : XYBase = { x: 48, y: 42 };
            if( this._isTurning )
            {
                img = this._SPRITES.turn;
                multiplier = this._direction == Directions.East ? -1 : 1;
            }
            else
                img = this._direction == Directions.East ? this._SPRITES.idleR : this._SPRITES.idleL;
            if( window.performance.now() - this._lastAnimationTick >= ENEMY_CONSTANTS.helikopter.animationInterval )
            {
                this._spritesheetPosition.x += spriteSize.x * multiplier;
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

    private async updateVelocity()
    {
        if( !this._engine.player )
            return

        if( this.velocityFactor == 0 )
            this.velocityFactor = this._position.x - this._engine.player.position.x >= 0 ? -1 : 1;
        const isToRightGoingRight : boolean = this._position.x - this._engine.player.position.x > 0 && this.velocityFactor > 0;
        const isToLeftGoingLeft : boolean = this._position.x - this._engine.player.position.x < 0 && this.velocityFactor < 0;
        const shouldTurn : boolean = isToRightGoingRight || isToLeftGoingLeft;
        const verticalDistance : number = this._engine.player.position.y - this._position.y;
        if( !this._moveBusy )
        {
            let timeout;
            if( shouldTurn )
            {
                timeout = Math.random() * 5000 + 100;
                this._moveBusy = true;
                await Helpers.sleepyTime( timeout )
                await this.turnAround();
                this._moveBusy = false;
            }
        }
        
        this._velocity = new Vector2( this._ACCELERATION * this.velocityFactor, verticalDistance / 100 );
        this._velocity.addVector( new Vector2( 0, this._ACCELERATION / 4 ) ); // gravity
    }

    private async turnAround()
    {
        const n : number = this.velocityFactor <= 0 ? 1 : -1;
        do
        {
            this.velocityFactor += n;
            await Helpers.sleepyTime( 110 );
        }while( Math.abs(this.velocityFactor) < 4 )
        return new Promise( res => setTimeout( ()=> res(true), 800 ) );
    }

    protected updateDirection() : void
    {
        if( this._velocity.x > 0 && this._direction == Directions.West ) // turn -->
        {
            this._isTurning = true;
            this._direction = Directions.East;
            this._spritesheetPosition.x =  4 * 48;
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
            this.velocityFactor = 0;
            while( probe.collided() != null )
            {
                probe.position.addVector( step );
                probe.updateCollisionBox();
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

        if( this._position.y + this._size.y > this._engine.level.bounds.bl.y )
        {
            this._position.y = this._engine.level.bounds.bl.y - this._size.y;
        }
        else if( this._position.y < this._engine.level.bounds.tl.y )
        {
            this._position.y = this._engine.level.bounds.tl.y;
        }
    }

    private tryShoot() : void
    {
        if( !this._engine.player )
            return;
        const distHorizontalPlayer : number = Math.abs( this._position.x - this._engine.player.position.x );
        const distVerticalPlayer : number = Math.abs( this._position.y - this._engine.player.position.y );
        const canShootPlayer = distHorizontalPlayer < this._engine.level.SCREEN_WIDTH && distVerticalPlayer < 60;
        let distHorizontalCar : number;
        let distVerticalCar : number
        let canShootCar : boolean = false;
        if( this._engine.car )
        {
            distHorizontalCar = Math.abs( this._position.x - this._engine.car.position.x );
            distVerticalCar = Math.abs( this._position.y - this._engine.car.position.y );
            canShootCar = distHorizontalCar < this._engine.level.SCREEN_WIDTH && distVerticalCar < 60
        }
        if( window.performance.now() - this._lastShootingTick > 800 && ( canShootCar || canShootPlayer ) )
        {
            this.shoot();
            this._lastShootingTick = window.performance.now();
        }    
    }

    private shoot()
    {
        const rocketPos : Vector2 = this._position.copy();
        rocketPos.addXY( { x: this._direction == Directions.East ? this.size.x : 0, y: this.size.y / 3 * 2 } );
        const vel : Vector2 = new Vector2( this._direction == Directions.East ? VELOCITIES.rocket : -VELOCITIES.rocket, 0 )
        const rocket : Projectile = new Projectile( EntityType.Enemy, { x: 40, y: 20 }, vel, rocketPos, this._engine, this._canvas.id, this._ROCKET_SPRITE );
        this._engine.projectiles.push( rocket );
        AudioManager.play( "shot" );
    }

    public mayday() : void
    {
        if( this._iAmAlive )
            this.die();
    }

    private wereDoneFor() : void
    {
        const spriteSize : XYBase = { x: 48, y: 42 };
        const x : number = this.getDrawingPos();
        if( this._spritesheetPosition.x >= this._SPRITES.destroyed.naturalWidth )
        {
            this._engine.deleteEnemy( this );
            return;
        }
        const ctx : CanvasRenderingContext2D = this._engine.level.OL_CANVAS.getContext( "2d" );
        ctx.drawImage( this._SPRITES.destroyed, this._spritesheetPosition.x, this._spritesheetPosition.y, spriteSize.x, spriteSize.y, x, this._position.y, this._size.x, this._size.y ); // main
        ctx.filter = Helpers.randomColourFilter();
        ctx.drawImage( this._SPRITES.destroyed, this._spritesheetPosition.x, this._spritesheetPosition.y + spriteSize.y, spriteSize.x, spriteSize.y, x, this._position.y, this._size.x, this._size.y ); // inner
        ctx.filter = ColourFilters.Black;

        if( window.performance.now() - this._lastAnimationTick >= ENEMY_CONSTANTS.helikopter.deathAnimationInterval )
        {
            this._spritesheetPosition.x += spriteSize.x;
            this._lastAnimationTick = window.performance.now();
        }
    }

    protected die() : void
    {
        this._spritesheetPosition.x = 0;
        this._lastAnimationTick = window.performance.now();
        this._iAmAlive = false;
        this._engine.fpsStuff.frameCount = 0;
        AudioManager.play( "death" );
        this._engine.player.score += 150;
    }

    public override async setSprites()
    {
        console.log( ":))))))))))))))))" )
    }


    private async setRocketSprites()
    {
        let sources = SPRITES.rocket as SpriteSetSources;
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

    private getDrawingPos() : number
    {
        return this._position.x - this._engine.backgroundOffset * 5;
    }
}