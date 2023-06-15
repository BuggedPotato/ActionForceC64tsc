import { XYBase } from "../../types/XYBase";
import { Infos } from "../enums/EInfos";
import { Level } from "./Level";
import { IMAGE_SOURCES } from "../../config";
import { ColourFilters } from "../enums/EColourFilters";
import { Colours } from "../enums/EColours";

export default abstract class PlayerGui
{
    private static _canvasName : string;
    private static _canvas : HTMLCanvasElement;
    private static _charset : HTMLImageElement;
    private static _fuelLowImg : HTMLImageElement;
    private static _LEVEL : Level;

    public static async drawBackground( bgName : string, name : string, level : Level )
    {
        this._LEVEL = level;
        let c : HTMLCanvasElement = document.getElementById( bgName ) as HTMLCanvasElement;
        const SCREEN_HEIGHT : number = parseInt(window.getComputedStyle(document.body)['height']);
        c.width = this._LEVEL.SCREEN_WIDTH;
        c.height = SCREEN_HEIGHT - this._LEVEL.BG_CANVAS.height;
        const ctx : CanvasRenderingContext2D = c.getContext( "2d" );
        ctx.imageSmoothingEnabled = false;
        const bg : HTMLImageElement = new Image( 100, 100 );
        bg.src = IMAGE_SOURCES.backgroundSrc;
        bg.onload = ()=> {
            ctx.drawImage( bg, 0, 0, c.width, c.height )
        }

        PlayerGui._canvasName = name;
        c = document.getElementById( name ) as HTMLCanvasElement;
        PlayerGui._canvas = c;
        c.width = this._LEVEL.SCREEN_WIDTH;
        c.height = SCREEN_HEIGHT - this._LEVEL.BG_CANVAS.height;
        
        PlayerGui._charset = new Image(100, 100);
        PlayerGui._charset.src = IMAGE_SOURCES.overlaySrc;
        await PlayerGui._charset.decode();

        PlayerGui._fuelLowImg = new Image(100, 100);
        PlayerGui._fuelLowImg.src = IMAGE_SOURCES.fuelLowImgSrc;
        await PlayerGui._fuelLowImg.decode();
    }

    public static draw( fuel : number, maxFuel : number, chopperHP : number, carHP : number, score : number, bridges : number, ammo : number, bombs : number  ) : void
    {
        const ctx : CanvasRenderingContext2D = PlayerGui._canvas.getContext( "2d" );
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect( 0, 0, PlayerGui._canvas.width, PlayerGui._canvas.height );
        PlayerGui.drawFuel( fuel, maxFuel );
        PlayerGui.drawAllInfo( chopperHP, carHP, score, bridges, ammo, bombs );
    }
    
    private static drawFuel( fuel : number, maxFuel : number ) : void
    {
        // x fuel -> w * .1446 // w * .296
        // y fuel -> h * 7/30 // h * 11/30
        const empty : XYBase = { x: PlayerGui._canvas.width * .1446, y: PlayerGui._canvas.height * 7/30 };
        const full : XYBase = { x: PlayerGui._canvas.width * .296, y: PlayerGui._canvas.height * 11/30 };
        const ctx : CanvasRenderingContext2D = PlayerGui._canvas.getContext( "2d" );
        ctx.fillStyle = Colours.Cyan;
        ctx.fillRect( empty.x, empty.y, (full.x - empty.x) * fuel / maxFuel, full.y - empty.y );
        let b : boolean = Math.round( window.performance.now() / 1000 ) % 2 == 0;
        if( fuel / maxFuel < 0.15 && b )
            PlayerGui.drawFuelLow();
    }

    private static async drawFuelLow()
    {
		if( !PlayerGui._fuelLowImg )
            return;
        const ctx : CanvasRenderingContext2D = PlayerGui._LEVEL.OL_CANVAS.getContext( "2d" );
        ctx.filter = ColourFilters.Red;
        ctx.drawImage( PlayerGui._fuelLowImg, PlayerGui._LEVEL.SCREEN_WIDTH/2 - PlayerGui._fuelLowImg.naturalWidth*3/2, 20, PlayerGui._fuelLowImg.naturalWidth*3, PlayerGui._fuelLowImg.naturalHeight*3 );
        ctx.filter = ColourFilters.Black;
    }

    private static drawAllInfo( chopperHP : number, carHP : number, score : number, bridges : number, ammo : number, bombs : number, fps : number = null ) : void
    {
        PlayerGui.drawInfo( Infos.ChopperHP, chopperHP );
        PlayerGui.drawInfo( Infos.CarHP, carHP );
        PlayerGui.drawInfo( Infos.Score, score );
        PlayerGui.drawInfo( Infos.Bridges, bridges );
        PlayerGui.drawInfo( Infos.Ammo, ammo );
        PlayerGui.drawInfo( Infos.Bombs, bombs );
    }

    public static drawInfo( name : Infos, value : number ) : void
    {
        // x -> w * .472
        // score
        // y -> h * 37/60
        // bridges
        // x -> w * .673
        // ammo
        // x -> w * .748
        // bombs
        // x -> w * .874
        // carHP
        // x -> w * .195
        // y -> h * .5
        // chopperHP
        // x -> w * .07
        // y -> h * .5
        const ctx : CanvasRenderingContext2D = PlayerGui._canvas.getContext( "2d" );

        /** point where the drawing starts */
        let zeroPoint : XYBase = { x: 0, y: PlayerGui._canvas.height * 37/60 };
        let valueTargetLength = 1;
        switch( name )
        {
            case Infos.Score:
                zeroPoint.x = PlayerGui._canvas.width * .472;
                valueTargetLength = 6;
            break;
            case Infos.Bridges:
                zeroPoint.x = PlayerGui._canvas.width * .673;
                valueTargetLength = 1;
            break;
            case Infos.Ammo:
                zeroPoint.x = PlayerGui._canvas.width * .748;
                valueTargetLength = 3;
            break;
            case Infos.Bombs:
                zeroPoint.x = PlayerGui._canvas.width * .874;
                valueTargetLength = 3;
            break;
            case Infos.ChopperHP:
                zeroPoint.x = PlayerGui._canvas.width * .07;
                zeroPoint.y = PlayerGui._canvas.height * .5;
                valueTargetLength = 4;
            break;
            case Infos.CarHP:
                zeroPoint.x = PlayerGui._canvas.width * .195;
                zeroPoint.y = PlayerGui._canvas.height * .5;
                valueTargetLength = 4;
            break;
            case Infos.Fps:
                zeroPoint.x = 0;
                zeroPoint.y = 0;
                valueTargetLength = value.toString().length;
            break;
        }

        ctx.filter = ColourFilters.White; // draws in white

        const zeroSpritePos : XYBase = { x: 216, y: 0 };
        const charW : number = PlayerGui._canvas.width * .025;
        const charH : number = PlayerGui._canvas.height * 2/15;
        const w : number = PlayerGui._charset.naturalWidth;

        const digits : string[] = value.toString().padStart( valueTargetLength, "0" ).split( "" );
        digits.map( ( n : string, i : number ) => {
            const d : number = parseInt( n );
            let spritePos : XYBase = { x: zeroSpritePos.x + d * 8, y: 0 };
            if( spritePos.x >= w )
                spritePos = { x: spritePos.x -= w, y: spritePos.y + 8 };            
            ctx.drawImage( PlayerGui._charset, spritePos.x, spritePos.y, 8, 8, zeroPoint.x + i * charW, zeroPoint.y, charW, charH );
        } );
        ctx.filter = ColourFilters.Black;
    }

    set canvasName( name : string ) 
    { 
        PlayerGui._canvasName = name; PlayerGui._canvas = document.getElementById( PlayerGui._canvasName ) as HTMLCanvasElement
    }

    get canvas() { return PlayerGui._canvas }
}