import { Player } from "./Player";
import { Vector2 } from "./Vector2";

export class Input
{
    public up : boolean = false;
    public down : boolean = false;
    public left : boolean = false;
    public right : boolean = false;

    public shoot : boolean = false;
    private _accelerationTick : number;

    public start( player : Player ) : void
    {
        this._accelerationTick = 0;
        document.body.addEventListener( "keydown", ( e )=>{
            const key = e.key;
            switch( key )
            {
                case "ArrowUp":
                    this.up = true;
                break;
                case "ArrowDown":
                    this.down = true;
                break;
                case "ArrowLeft":
                    this.left = true;
                break;
                case "ArrowRight":
                    this.right = true;
                break;
                case "Insert":
                case "z":
                    if( player && !this.shoot )
                    {
                        if( this.down )
                            player.dropBomb();
                        else
                            player.shoot();
                        this.shoot = true;
                    }
                break;
            }
        } );
    
        document.body.addEventListener( "keyup", ( e )=>{
            const key = e.key;
            switch( key )
            {
                case "ArrowUp":
                    player.velocity.scalarProduct( new Vector2( 1, 0 ) );
                    this.up = false;
                break;
                case "ArrowDown":
                    this.down = false;
                break;
                case "ArrowLeft":
                    this.left = false;
                break;
                case "ArrowRight":
                    this.right = false;
                break;
                case "Insert":
                case "z":
                    this.shoot = false;
                break;
            }
        } );
    }
}