import { ENEMY_CONSTANTS, ENGINE_CONSTANTS } from "../../config";
import { IFrame } from "../../interfaces/IFrame";
import { Collision } from "../../types/Collision";
import { SpriteSet } from "../../types/SpriteSet";
import { SpriteSetSources } from "../../types/SpriteSetSources";
import { XYBase } from "../../types/XYBase";
import { ColourFilters } from "../enums/EColourFilters";
import { EntityType } from "../enums/EEntityType";
import { Entity } from "./Entity";
import { Helpers } from "./Helpers";
import { Ursus } from "./Ursus";
import { Vector2 } from "./Vector2";

export class Projectile extends Entity implements IFrame
{
    private _velocity : Vector2;
    private _parent : EntityType;
    private _damages : boolean;
    private _blowsUp : boolean;
    private _lastAnimationTick: number;

    constructor( parent : EntityType, s : XYBase, v : Vector2, pos : Vector2, engine : Ursus, canvasName : string, spritesImages: SpriteSet, blowsUp? : boolean, sprites? : SpriteSetSources )
    {
        super( s, pos, engine, canvasName, sprites );
        this._velocity = v;
        this._SPRITES = spritesImages;
        this._parent = parent;
        this._damages = true;
        if( blowsUp )
            this._blowsUp = blowsUp;
        else blowsUp = false;
    }

    public frame() : void
    {
        if( !this._engine.player )
        {
            this.suicide();
            return;
        }
        this.updatePosition();
    }
    
    public override draw() : void
    {
        if( !this._engine.player )
            return;
        if( !this._damages )
        {
            this.blowUp();
            return;
        }

        const ctx : CanvasRenderingContext2D = this._canvas.getContext( "2d" );
        ctx.fillStyle = "transparent";
        const x : number = this.getDrawingPos();

        if( x < 0 - this._size.x || x > this._engine.level.BG_CANVAS.width && this._parent === EntityType.Player )
        {
            this.suicide();
        }
        ctx.fillRect( x, this._position.y, this._size.x, this._size.y );

        if( this._SPRITES )
        { 
            let img : HTMLImageElement;
            if( this._SPRITES.idleL && this._velocity.x < 0 )
                img = this._SPRITES.idleL;
            else
                img = this._SPRITES.idleR;
            const size : XYBase = { x: img.naturalWidth, y: img.naturalHeight };
            if( this._blowsUp )
                ctx.filter = ColourFilters.Yellow;
            ctx.drawImage( img, 0, 0, size.x, size.y, x, this._position.y, this._size.x, this._size.y );    
            ctx.filter = ColourFilters.Black;
        }
        else
        {
            ctx.fillStyle = "red";
            ctx.fillRect( x, this._position.y, this._size.x, this._size.y );
        }
    }

    private blowUp() : void
    {
        const spriteSize : XYBase = { x: 48, y: 42 };
        const x : number = this.getDrawingPos();
        if( this._spritesheetPosition.x >= this._SPRITES.destroyed.naturalWidth )
        {
            this.suicide();
            return;
        }
        const ctx : CanvasRenderingContext2D = this._canvas.getContext( "2d" );
        ctx.drawImage( this._SPRITES.destroyed, this._spritesheetPosition.x, this._spritesheetPosition.y, spriteSize.x, spriteSize.y, x, this._position.y, this._size.x, this._size.y ); // main
        
        ctx.filter = Helpers.randomColourFilter();
        ctx.drawImage( this._SPRITES.destroyed, this._spritesheetPosition.x, this._spritesheetPosition.y + spriteSize.y, spriteSize.x, spriteSize.y, x, this._position.y, this._size.x, this._size.y ); // inner
        ctx.filter = ColourFilters.Black;

        if( window.performance.now() - this._lastAnimationTick >= ENEMY_CONSTANTS.jet.projectiles.deathAnimationInterval )
        {
            this._spritesheetPosition.x += spriteSize.x;
            this._lastAnimationTick = window.performance.now();
        }
    }

    private updatePosition() : void
    {
        if( !this._damages )
            return;
        this._position.addVector( this._velocity );
        this.updateCollisionBox();
        if( this.hit() || this.isInLevelBounds( this ) /*!this._engine.level.isInBounds( this )*/ )
        {
            if( this._blowsUp )
            {
                this._lastAnimationTick = 0;
                this._damages = false;
            }
            else
                this.suicide();
        }
    }
    private isInLevelBounds( p : Projectile ) // yeah yeah almost duplicate - theres too little time
    {
        return ( p.position.x > p.engine.level.bounds.tr.x || p.position.x - p.size.x < p.engine.level.bounds.tl.x || p.position.y + p.size.y > p.engine.level.bounds.br.y )
    }

    private hit() : boolean
    {
        const collision : Collision = this.collided();
        const kill : Collision = this.collidedWith( this._parent );
        if( Helpers.isCollision( collision ) )
        {
            if( collision.target.isDestructible )
                collision.target.destroy();
            else if( collision.parent.isDestructible )
                collision.parent.destroy();
            return true;
        }
        else if( Helpers.isCollision( kill ) )
        {
            if( kill.parent === EntityType.Jet )
                kill.target.mayday( 100 );
            else
                kill.target.mayday();
            return true;
        }
        else 
            return false;
    }

    /**
     * whether projectile hit player or enemy depending on its parent
     * @param parent of projectile
     * @returns 
     */
    private collidedWith( parent : EntityType ) : Collision | null
    {
        const point : XYBase = { x: this._collisionBox.tl.x + this._size.x/2, y: this._collisionBox.tl.y + this._size.y/2 };
        if( this._engine.car && this._engine.car.isInside( point ) )
            return { point: "center", pointPos: point, angle: -1, parent: parent, target: this._engine.car };
        switch( parent )
        {
            case EntityType.Jet:
            case EntityType.Enemy:
                if( this._engine.player.isInside( point ) )
                {
                    return { point: "center", pointPos: point, angle: -1, parent: parent, target: this._engine.player };
                }
            break;
            case EntityType.Player:
                if( this._engine.jet && this._engine.jet.isInside( point ) )
                    return { point: "center", pointPos: point, angle: -1, parent: this._engine.player, target: this._engine.jet };
                for( let i = 0; i < this._engine.enemies.length; i++ )
                {
                    const enemy = this._engine.enemies[i];
                    if( enemy.isInside( point ) )
                    {
                        return { point: "center", pointPos: point, angle: -1, parent: this._engine.player, target: enemy };
                    }
                }
            break;
            default:
                return null;
        }
    }

    private getDrawingPos() : number
    {
        let x : number = this._position.x - this._engine.player.position.x - this._engine.player.size.x/2 + this._engine.level.SCREEN_WIDTH/2;
        if( this._engine.player.position.x < this._engine.level.SCREEN_WIDTH / 2 )
            x = this._position.x;
        else if( this._engine.player.position.x > this._engine.level.bounds.tr.x - this._engine.level.SCREEN_WIDTH / 2 )
            x = this._position.x - this._engine.backgroundOffset * 5;
        return x;
    }

    private suicide() : void
    {
        this._engine.deleteProjectile( this );
    }

    get engine() { return this._engine }
    get damages() { return this._damages }
    get blowsUp() { return this._blowsUp }
}