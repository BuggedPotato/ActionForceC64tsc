import { Input } from "./Input";
import { Level } from "./Level";
import { Player } from "./Player";
import { Projectile } from "./Projectile";
import { Vector2 } from "./Vector2";
import { DISPLAY_OPTIONS, ENGINE_CONSTANTS, HTML_IDS, SPRITES, VELOCITIES, SOUND_SOURCES, PLAYER_CONSTANTS, CAR_CONSTANTS } from "../../config";
import { Entity } from "./Entity";
import { AudioManager } from "./AudioManager";
import { Car } from "./Car";
import { Jet } from "./Jet";
import { SpriteSetSources } from "../../types/SpriteSetSources";
import { ZoneTypes } from "../enums/EZoneTypes";
import { Zone } from "./Zone";
import { EntityType } from "../enums/EEntityType";
import { Helikopter } from "./Helikopter";
import GUI from "./PlayerGuiHandle";
import { SpriteSet } from "../../types/SpriteSet";

export class Ursus
{
    private _level : Level;
    private _enemies : Helikopter[];
    private _jet : Jet;
    private _player : Player;
    private _car : Car;
    private _projectiles : Projectile[];
    private _raf : any;

    private _canvas : HTMLCanvasElement;

    public fpsStuff : { fps : number, fpsInterval : number, now : number, then : number, start : number, frameCount : number };

    public backgroundOffset : number = 0;
    public input : Input;

    constructor( l : Level )
    {
        this._level = l;
        this.fpsStuff = {
            fps: ENGINE_CONSTANTS.fps,
            fpsInterval: null,
            now: null,
            then: null,
            start: null,
            frameCount: 0
        }
    }

    public async init( first : boolean = true )
    {
        this._player = new Player( 240, 100, new Vector2( 3000, 100 ), this, HTML_IDS.gameCanvasId, SPRITES.chopper );
        this._car = new Car( 120, 100, new Vector2( 100, this._level.bounds.bl.y - 100 ), new Vector2( VELOCITIES.car, 0 ), this, HTML_IDS.gameCanvasId, SPRITES.car );
        this._level.draw( 0, false );
        this._projectiles = [];
        this._enemies = [];
        this._canvas = document.getElementById( HTML_IDS.gameCanvasId ) as HTMLCanvasElement;
        this.fpsStuff = {
            fps: ENGINE_CONSTANTS.fps,
            fpsInterval: null,
            now: null,
            then: null,
            start: null,
            frameCount: 0
        }
        AudioManager.init( SOUND_SOURCES );
        if( first )
        {
            this.setHtml();
            this.setEventListeners();
            GUI.drawBackground( PLAYER_CONSTANTS.guiBgCanvasId, PLAYER_CONSTANTS.guiCanvasId, this._level );
        }
    }

    private setHtml() : void
    {
        (document.getElementById( HTML_IDS.crtOn ) as HTMLInputElement).checked = DISPLAY_OPTIONS.crt;
    }

    private setEventListeners() : void
    {
        (document.getElementById( HTML_IDS.crtOn ) as HTMLInputElement).addEventListener( "change", ( e : Event )=>{
            DISPLAY_OPTIONS.crt = (e.target as HTMLInputElement).checked;
            if( DISPLAY_OPTIONS.crt )
                this._level.drawCRT();
            else
                this._level.clearCRT();
        } )
    }

    public start() : void
    {
        this.input = new Input();
        this.input.start( this._player );

        this.fpsStuff.fpsInterval = 1000 / this.fpsStuff.fps;
        this.fpsStuff.then = window.performance.now();
        this.fpsStuff.start = window.performance.now();

        this.frame( window.performance.now() );
        AudioManager.play( "soundtrack" );
    }

    public clear() : void
    {
        const ctx : CanvasRenderingContext2D = this._canvas.getContext( "2d" );
        ctx.clearRect( 0, 0, this._canvas.width, this._canvas.height )
    }

    public frame( newTime : number ) : void
    {
        this._raf = requestAnimationFrame( () => this.frame( window.performance.now() ) );
        this.fpsStuff.now = newTime;
        let elapsed = this.fpsStuff.now - this.fpsStuff.then;
        
        this.trySpawnEnemies( EntityType.Jet );
        this.trySpawnEnemies( EntityType.Helikopter );

        if( this._player )
            this._player.frame();
        if( this._car )
            this._car.frame();
            this._enemies.map( e => e.frame() );
        if( this._jet )
            this._jet.frame();
        this._projectiles.map( p => p.frame() );

        if( elapsed >= this.fpsStuff.fpsInterval )
        {
            this.fpsStuff.frameCount++;
            // draws only when its the right time because of framerate
            this.fpsStuff.then = this.fpsStuff.now - ( elapsed % this.fpsStuff.fpsInterval );
            this._level.draw( this.backgroundOffset, this._car === undefined );
            this.clear();
            this._enemies.map( e => { 
                 e.draw();
            } );
            if( this._jet )
                this._jet.draw();
            if( this._car )
                this._car.draw();
            if( this._player )
            {
                this.updateBackgroundOffset();
                this._player.draw();
            }
            if( this._player && this._car )
                GUI.draw( this._player.fuel, this._player.MAX_FUEL, this._player.hp, (CAR_CONSTANTS.hitpoints - this._car.hp), this._player.score, this._player.bridges, this._player.ammo, this._player.bombs );
            this._projectiles.map( p => p.draw() );
        }
    }


    private trySpawnEnemies( type : EntityType ) : void
    {
        if( this.shouldSpawn( type ) )
            type === EntityType.Jet ? this.spawnJet() : this.spawnHelikopter();
    }

    /**
     * @param type .Helikopter or .Jet only
     * @returns whether enemy of 'type' should spawn
     */
    private shouldSpawn( type : EntityType ) : boolean
    {
        return type === EntityType.Jet ? this._jet == null : this._enemies.length < ENGINE_CONSTANTS.maxEnemies;
    }

    private spawnHelikopter() : void
    {
        const dist : number = this._level.SCREEN_WIDTH * Math.random() * 2;
        let pos : Vector2 = new Vector2( this._player.position.x + (Math.round(Math.random()) ?  dist : -dist), -200 );
        if( pos.x < 0 || pos.x >= this._level.bounds.tr.x )
        {
            this.spawnHelikopter();
            return;   
        }
        const helikopter : Helikopter = new Helikopter( 120, 100, pos, this, this._canvas.id, SPRITES.helikopter as SpriteSetSources, helikipoterSprites );
        this._enemies.push( helikopter );
    }

    public spawnJet() : void
    {
        const foo : Zone[] = this._level.zones.filter( z => z.type === ZoneTypes.JetTrigger );
        let i = Math.round( Math.random() );
        const exitZone : Zone = foo[ i ];
        const pos : Vector2 = new Vector2( foo[ 1 - i ].position.x, -105 );
        const v : Vector2 = new Vector2( i ? VELOCITIES.jet : -VELOCITIES.jet, 0 );
        const jet : Jet = new Jet( { x: 240, y: 105 }, pos, v, 2, exitZone, this, HTML_IDS.gameCanvasId, SPRITES.jet as SpriteSetSources );
        this._jet = jet;
    }


    public updateBackgroundOffset() : void
    {
        this.backgroundOffset = ( this._player.position.x + this._player.size.x/2 - this._level.SCREEN_WIDTH / 2 ) / 5;
        // oh god this took so much bloody time, i hate it with all my heart
        if( this.backgroundOffset < 0 )
            this.backgroundOffset = 0;
        else if( this.backgroundOffset * 5 + this._level.SCREEN_WIDTH > this._level.bounds.tr.x )
            this.backgroundOffset = (this._level.bounds.tr.x - this._level.SCREEN_WIDTH) / 5;
    }

    public deleteProjectile( p : Projectile ) : void
    {
        const i : number = this._projectiles.indexOf( p );
        if( i == -1 )
            throw new Error( "Projectile not found in engine!" );
        this._projectiles.splice( i, 1 );
    }

    public deleteObstacle( obs : Entity )
    {
        const i : number = this._level.obstacles.indexOf( obs );
        if( i == -1 )
            throw new Error( "Obstacle not found in engine!" );
        this._level.obstacles.splice( i, 1 );
    }

    public deleteEnemy( enemy : Helikopter ) // todo
    {
        for( let i = 0; i < this._enemies.length; i++ )
        {
            if( this._enemies[i] === enemy )
            {
                this._enemies.splice( i, 1 );
                return;
            }
        }
        throw new Error( "Enemy not found in engine!" );
    }

    public delete( type : EntityType ) : void
    {
        switch( type )
        {
            case EntityType.Player:
                this._player = undefined;
                cancelAnimationFrame( this._raf )
                alert( "PRZEGRANA" );
                this.init( false );
                this.start();
            break;
            case EntityType.Car:
                this._car = undefined;
            break;
            case EntityType.Jet:
                this._jet = undefined;
            break;
        }
    }

    get level() { return this._level }
    get player() { return this._player }
    get car() { return this._car }
    get jet() { return this._jet }
    get projectiles() { return this._projectiles }
    get enemies() { return this._enemies }
}

var helikipoterSprites : SpriteSet = await (async () => {
        let idleRImg : HTMLImageElement = new Image();
        idleRImg.src = SPRITES.helikopter.idleRsrc;
        await idleRImg.decode();
        let sprites : SpriteSet = {
            idleR: idleRImg
        };

        let idleLImg : HTMLImageElement = new Image( 100, 100 );
        idleLImg.src = SPRITES.helikopter.idleLsrc;
        await idleLImg.decode();
        sprites.idleL = idleLImg;

        let turnImg : HTMLImageElement = new Image( 100, 100 );
        turnImg.src = SPRITES.helikopter.turnSrc;
        await turnImg.decode();
        sprites.turn = turnImg;

        let destroyedImg : HTMLImageElement = new Image( 100, 100 );
        destroyedImg.src = SPRITES.helikopter.destroyedSrc;
        await destroyedImg.decode();
        sprites.destroyed = destroyedImg;
        return sprites;
})()