export const AudioManager : { sounds : { [key : string] : HTMLAudioElement }, init : ( sources : any )=> void, play : ( sound : string )=> void } = {

    sounds: {},
    init: ( sources : any ) =>
    {
        AudioManager.sounds = {};
        for( const soundName in sources )
            AudioManager.sounds[ soundName ] = new Audio( sources[ soundName ] );
    },

    play: ( sound : string ) =>
    {
        if( AudioManager.sounds[ sound ].currentTime > 0 )
        {
            AudioManager.sounds[ sound ].pause();
            AudioManager.sounds[ sound ].currentTime = 0;
        }
        AudioManager.sounds[ sound ].play();
    }

}