import { ENEMY_CONSTANTS, SPRITES, VELOCITIES } from "../../config";
import { IFrame } from "../../interfaces/IFrame";
import { Collision } from "../../types/Collision";
import { SpriteSet } from "../../types/SpriteSet";
import { SpriteSetSources } from "../../types/SpriteSetSources";
import { XYBase } from "../../types/XYBase";
import { EntityType } from "../enums/EEntityType";
import { AudioManager } from "./AudioManager";
import { Entity } from "./Entity";
import { Helpers } from "./Helpers";
import { Projectile } from "./Projectile";
import { Ursus } from "./Ursus";
import { Vector2 } from "./Vector2";
import { Zone } from "./Zone";

export class Jet extends Entity implements IFrame {

    private _velocity : Vector2;
    private _iAmAlive : boolean;
    private _ceiling : number;
    private _falling : boolean;
    private _exit : Zone;
    private _lastAnimationTick : number;
    private _canShoot : boolean;
    private _PROJECTILE_SPRITE: SpriteSet;

    constructor( s : XYBase, pos : Vector2, vel : Vector2, ceiling : number, exit : Zone, engine : Ursus, canvasName : string, sprites : SpriteSetSources )
    {
        super( s, pos, engine, canvasName, sprites );
        this._velocity = vel;
        this._velocity.addVector( new Vector2( 0, 2.5 ) );
        this._iAmAlive = true;
        this._ceiling = ceiling;
        this._exit = exit;
        this._falling = false;
        this._canShoot = true;
        this.setProjectileSprites();
    }

    public frame() : void
    {
        this.updatePosition();
        this.updateCollisionBox();
        this.tryShoot();
    }

    public draw() : void
    {
        if( !this._iAmAlive )
        {
            this.wereDoneFor();
            return;
        }
        const ctx : CanvasRenderingContext2D = this._canvas.getContext( "2d" );
        const x : number = this.getDrawingPos();
        const spriteSize : XYBase = { x: 96, y: 40 };
        if( this._SPRITES )
        {
            try{
                ctx.drawImage( this._velocity.x > 0 ? this._SPRITES.idleR : this._SPRITES.idleL, this._spritesheetPosition.x, this._spritesheetPosition.y, spriteSize.x, spriteSize.y, x, this._position.y, this._size.x, this._size.y );
            }
            catch( err ){
                console.warn( "Image not loaded?" )
            }
        }
        else
        {
            ctx.fillStyle = "blue";
            ctx.fillRect( x, this._position.y, this._size.x, this._size.y );
        }
    }

    private updatePosition() : void
    {
        if( !this._iAmAlive )
            return;
        if( !this._falling && this._position.y >= this._ceiling )
            this._velocity.y = 0;

        if( this._velocity.y == 0 && this._exit.isInside( this._collisionBox.tr ) )
        {
            this._velocity.addVector( new Vector2( 0, -2.5 ) );
        }
        this._position.addVector( this._velocity );

        if( this._position.y + this._size.y < 0 )
            this.suicide();
        if( this._falling && ( Helpers.isCollision( this.collided() ) || this._position.y + this._size.y >= this._engine.level.bounds.bl.y ) )
        {
            this.die();
            return;
        }
    }

    private tryShoot() : void
    {
        if( !this._canShoot || this._falling || !this._engine.player || !this._engine.car )
            return;
        
        const playerDist : number = Math.abs( this._position.x - this._engine.player.position.x );
        const carDist : number = Math.abs( this._position.x - this._engine.car.position.x );
        const limit : number = this._engine.level.SCREEN_WIDTH / 3;
        if( playerDist < limit || carDist < limit )
        {
            const timeout = Math.random() * 300;
            this._canShoot = false;
            setTimeout( () => {
                this.shoot();
                setTimeout( ()=> { this._canShoot = true }, ENEMY_CONSTANTS.jet.shootingInterval )
            }, timeout );
        }
    }

    private shoot() : void
    {
        const s : XYBase = { x: 136, y: 118 }
        const v : Vector2 = new Vector2( this._velocity.x < 0 ? -VELOCITIES.jetProjectile : VELOCITIES.jetProjectile, VELOCITIES.jetProjectile / 2 );
        const pos : Vector2 = new Vector2( this._position.x + this._size.x/2, this._position.y + this._size.y );
        let bombs : Projectile = new Projectile( EntityType.Jet, s, v, pos, this._engine, this._canvas.id, this._PROJECTILE_SPRITE, true );
        this._engine.projectiles.push( bombs );
    }

    public mayday() : void
    {
        this._falling = true;
        this._velocity.addVector( new Vector2( 0, 4 ) );
        this._engine.player.score += 300;
    }

    public wereDoneFor() : void
    {
        const spriteSize : XYBase = { x: 96, y: 42 };
        const x : number = this.getDrawingPos();
        if( this._spritesheetPosition.x >= this._SPRITES.destroyed.naturalWidth )
        {
            this.suicide();
            return;
        }
        const ctx : CanvasRenderingContext2D = this._canvas.getContext( "2d" );
        ctx.drawImage( this._SPRITES.destroyed, this._spritesheetPosition.x, this._spritesheetPosition.y, spriteSize.x, spriteSize.y, x, this._position.y, this._size.x, this._size.y );
        
        if( window.performance.now() - this._lastAnimationTick >= ENEMY_CONSTANTS.jet.deathAnimationInterval )
        {
            this._spritesheetPosition.x += spriteSize.x;
            this._lastAnimationTick = window.performance.now();
        }
    }

    private die() : void
    {
        this._iAmAlive = false;
        this._lastAnimationTick = window.performance.now();
        this._engine.fpsStuff.frameCount = 0;
        AudioManager.play( "death" );
    }

    private suicide() : void
    {
        this._engine.delete( EntityType.Jet );
    }

    private async setProjectileSprites()
    {
        let sources = SPRITES.jetProjectiles as SpriteSetSources;
        let idleRImg = new Image( 100,100 );
        idleRImg.src = sources.idleRsrc;
        // await idleRImg.decode(); ???????
        let destroyedImg = new Image( 100,100 );
        destroyedImg.src = sources.destroyedSrc;
        this._PROJECTILE_SPRITE = {
            idleR: idleRImg,
            destroyed: destroyedImg
        }
    }

    private getDrawingPos() : number
    {
        return this._position.x - this._engine.backgroundOffset * 5;
    }

    get alive() { return this._iAmAlive }
    get ceiling() { return this._ceiling }
}