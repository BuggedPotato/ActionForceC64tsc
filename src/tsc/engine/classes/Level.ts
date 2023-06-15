import { DISPLAY_OPTIONS, SPRITES } from "../../config";
import { Bounds } from "../../types/Bounds";
import { Entity } from "./Entity";
import { Ursus } from "./Ursus";
import { Zone } from "./Zone";
import { HTML_IDS } from "../../config";
import { XYBase } from "../../types/XYBase";
import { ZoneTypes } from "../enums/EZoneTypes";
import { Bridge } from "../../types/Bridge";
import { Vector2 } from "./Vector2";
import { ColourFilters } from "../enums/EColourFilters";
import { Colours } from "../enums/EColours";

export class Level
{
    private _BACKGROUND : HTMLImageElement = new Image();
    private _OVERLAY : HTMLImageElement = new Image();
    private _BRIDGE : HTMLImageElement = new Image();
    private _REFUEL : HTMLImageElement = new Image();
    private _RESUPPLY : HTMLImageElement = new Image();
    private _BOUNDS : Bounds;

    private _BG_CANVAS : HTMLCanvasElement;
    private _OL_CANVAS : HTMLCanvasElement;
    private _CRT_CANVAS : HTMLCanvasElement;
    public SCREEN_WIDTH : number;

    private _obstacles : Entity[];
    private _zones : Zone[];
    private _bridges : Bridge[] = [];
    private _engine : Ursus;

    constructor( bg : string, ol : string, bounds : Bounds, engine : Ursus, obstacles : Entity[], zones : Zone[], bridgesVisible : number[] )
    {
        this.setSprites( bg, ol );        
        
        this._BOUNDS = bounds;
        this._obstacles = obstacles;
        this._zones = zones;
        this._zones.sort( ( a, b )=>{ return a.position.x - b.position.x } );

        this._zones.map( ( z : Zone )=>{
            if( z.type == ZoneTypes.Bridge )
            {
                this._bridges.push( { position: {x: z.position.x, y: z.position.y + z.size.y}, size: { x: 120, y: 85 }, built: bridgesVisible.includes( this._bridges.length ), zone: z } )
                this._obstacles.push( new Entity( z.size, new Vector2( z.position.x, z.position.y + 85 ), null, HTML_IDS.gameCanvasId ) );
            }
        } );

        this._BG_CANVAS = document.getElementById( HTML_IDS.backgroundCanvasId ) as HTMLCanvasElement;
        this._OL_CANVAS = document.getElementById( HTML_IDS.overlayCanvasId ) as HTMLCanvasElement;
        this._CRT_CANVAS = document.getElementById( HTML_IDS.crtCanvasId ) as HTMLCanvasElement;
        const GAME_CANVAS : HTMLCanvasElement = (document.getElementById( HTML_IDS.gameCanvasId ) as HTMLCanvasElement);
        this._BG_CANVAS.getContext( "2d" ).imageSmoothingEnabled = false;
        this._OL_CANVAS.getContext( "2d" ).imageSmoothingEnabled = false;
        this._CRT_CANVAS.getContext( "2d" ).imageSmoothingEnabled = false;
        GAME_CANVAS.getContext( "2d" ).imageSmoothingEnabled = false;
        
        this.SCREEN_WIDTH = window.outerWidth / 1.6;
        this._BG_CANVAS.width = this.SCREEN_WIDTH;
        this._OL_CANVAS.width = this.SCREEN_WIDTH;
        GAME_CANVAS.width = this.SCREEN_WIDTH;
        this._CRT_CANVAS.width = this.SCREEN_WIDTH;
        this._CRT_CANVAS.height = window.innerHeight;

        if( DISPLAY_OPTIONS.crt )
            this.drawCRT();
    }

    public draw( xOffset : number, forceBlack : boolean ) : void
    {
        const ctx1 : CanvasRenderingContext2D = this._BG_CANVAS.getContext( "2d" ); 
        ctx1.imageSmoothingEnabled = false;
        const ctx2 : CanvasRenderingContext2D = this._OL_CANVAS.getContext( "2d" );
        ctx2.imageSmoothingEnabled = false;
        
        ctx1.clearRect( 0, 0, this._BG_CANVAS.width, this._BG_CANVAS.height );
        ctx1.filter = ColourFilters.Black;
        ctx1.fillStyle = Colours.LightBlue; // draw blue background
        ctx1.fillRect( 0, 0, this._BG_CANVAS.width, this._BG_CANVAS.height )
        if( forceBlack )
        {
            ctx1.filter = ColourFilters.ForceBlack;
            ctx2.filter = ColourFilters.ForceBlack;
        }

        ctx1.drawImage( this._BACKGROUND, xOffset, 0, this.SCREEN_WIDTH / 5, this._BG_CANVAS.height / 5, 0, 0, this._BG_CANVAS.width, this._BG_CANVAS.height );

        ctx2.clearRect( 0, 0, this._OL_CANVAS.width, this._OL_CANVAS.height );
        ctx2.drawImage( this._OVERLAY, xOffset, 0, this.SCREEN_WIDTH / 5, this._OL_CANVAS.height / 5, 0, 0, this._OL_CANVAS.width, this._OL_CANVAS.height );

        this._bridges.map( ( b : Bridge ) => {
            let x : number = b.position.x - xOffset * 5;
            if( b.built && x >= 0 - b.size.x && x < this._BG_CANVAS.width )
            {
                ctx1.drawImage( this._BRIDGE, 0, 0, 24, 17, x, b.position.y, 120, 85 );
            }
        } );

        this._obstacles.map( ( obs : Entity ) => {
            if( obs.isDestructible )
                obs.draw();
        } )

        const fuelSign : Zone = this._zones.find( z => z.type === ZoneTypes.Refuel );
        let x : number = fuelSign.position.x - xOffset * 5;
        if( x > 0 - fuelSign.size.x && x < this._BG_CANVAS.width )
            ctx2.drawImage( this._REFUEL, 0, 0, this._REFUEL.naturalWidth, this._REFUEL.naturalHeight, x, fuelSign.position.y, this._REFUEL.naturalWidth * 5, this._REFUEL.naturalHeight * 5 )
        const ammoSign : Zone = this._zones.find( z => z.type === ZoneTypes.Resupply );
        x = ammoSign.position.x - xOffset * 5;
        if( x > 0 - ammoSign.size.x && x < this._BG_CANVAS.width )
            ctx2.drawImage( this._RESUPPLY, 0, 0, this._RESUPPLY.naturalWidth, this._RESUPPLY.naturalHeight, x, ammoSign.position.y, this._RESUPPLY.naturalWidth * 5, this._RESUPPLY.naturalHeight * 5 )
    }

    public clearCRT() : void
    {
        const ctx : CanvasRenderingContext2D = this._CRT_CANVAS.getContext( "2d" );
        ctx.clearRect( 0, 0, this._CRT_CANVAS.width, this._CRT_CANVAS.height );
    }
    public drawCRT() : void
    {
        let p = document.createElement( "canvas" );
        p.width = this._CRT_CANVAS.width;
        p.height = 6;
        let pctx = p.getContext( "2d" );
        pctx.fillStyle = "rgba(192, 153, 255, 0.18)";
        pctx.fillRect( 0, 0, p.width, p.height/2.3 );

        const ctx : CanvasRenderingContext2D = this._CRT_CANVAS.getContext( "2d" );
        ctx.fillStyle = "rgba(192, 153, 255, 0.1)";
        ctx.fillRect( 0, 0, this._CRT_CANVAS.width, this._CRT_CANVAS.height );
        this.clearCRT();
        ctx.fillStyle = ctx.createPattern( p, "repeat" );
        ctx.fillRect( 0, 0, this._CRT_CANVAS.width, this._CRT_CANVAS.height );
    }

    private async setSprites( bgSrc : string, olSrc : string )
    {
        this._BACKGROUND.src = bgSrc;
        this._OVERLAY.src = olSrc;
        this._BRIDGE.src = SPRITES.bridge.idleRsrc;
        this._REFUEL.src = SPRITES.fuelSign.idleRsrc;
        this._RESUPPLY.src = SPRITES.ammoSign.idleRsrc;
        await this._BACKGROUND.decode();
        await this._OVERLAY.decode();
        await this._BRIDGE.decode();
        await this._REFUEL.decode();
    }

    public isInBounds( entity : Entity ) : boolean
    {
        return ( entity.position.x > this._BOUNDS.tl.x && entity.position.y + entity.size.y <= this._BOUNDS.bl.y && entity.position.x + entity.size.x < this._BOUNDS.tr.x && entity.position.y > 0 ); // this._BOUNDS.tl.y );
    }

    // public isOutOfLevel( entity : Entity ) : boolean
    // {
    //     return ( entity.position.x > this._BOUNDS.tr.x || entity.position.y + entity.size.y > this._BOUNDS.bl.y || entity.position.x + entity.size.x < this._BOUNDS.tr.x && entity.position.y > this._BOUNDS.tl.y );
    // }

    get background() { return this._BACKGROUND }
    get overlay() { return this._OVERLAY }
    get bounds() { return this._BOUNDS }
    get obstacles() { return this._obstacles }
    get zones() { return this._zones }
    get bridges() { return this._bridges }
    get BG_CANVAS() { return this._BG_CANVAS }
    get OL_CANVAS() { return this._OL_CANVAS }

    set engine( e : Ursus ) { 
        this._engine = e;
        this._obstacles.map( ( obs ) => { if( obs.isDestructible ) obs.engine = this._engine } ); 
    }
}