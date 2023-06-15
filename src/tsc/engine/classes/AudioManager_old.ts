import { SOUND_SOURCES } from "../../config";

export abstract class AudioManager {

    private static _context : AudioContext;

    private static _buffers : any;
    
    public static async init()
    {
        AudioManager._context = new AudioContext();
        AudioManager._buffers = {

        };
        await AudioManager.loadSounds();
    }

    private static async loadSounds()
    {
        for( const soundName in SOUND_SOURCES )
        {
            const res = await fetch( SOUND_SOURCES[ soundName ] );
            if( !res.ok )
                throw new Error( "fetch audio not workie for: " + soundName + " (" + SOUND_SOURCES[ soundName ] + ")" );
            const buffer = await AudioManager._context.decodeAudioData( await res.arrayBuffer() );
            AudioManager._buffers[ soundName ] = buffer;
        }
        console.log( AudioManager._buffers );
    }

    public static play( sound : string ) : void
    {
        const source : AudioBufferSourceNode = AudioManager._context.createBufferSource();
        source.buffer = AudioManager._buffers[ sound ];
        source.connect( AudioManager._context.destination );
        source.start(0);
    }

}