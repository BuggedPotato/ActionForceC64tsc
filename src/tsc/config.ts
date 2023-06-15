import { ColourFilters } from "./engine/enums/EColourFilters"

export const SPRITES : any = {
    chopper: {
        idleLsrc: "./src/gfx/sprites/chopper/idle_left_spritesheet.bmp",
        idleRsrc: "./src/gfx/sprites/chopper/idle_right_spritesheet.bmp",
        turnSrc: "./src/gfx/sprites/chopper/turning_spritesheet.bmp",
        destroyedSrc: "./src/gfx/sprites/chopper/destroyed_spritesheet.bmp"
    },
    car: {
        idleRsrc: "./src/gfx/sprites/car/car_spritesheet.bmp",
        destroyedSrc: "./src/gfx/sprites/chopper/destroyed_spritesheet.bmp"
    },
    jet: {
        idleRsrc: "./src/gfx/sprites/jet/jet_r_spritesheet.bmp",
        idleLsrc: "./src/gfx/sprites/jet/jet_l_spritesheet.bmp",
        destroyedSrc: "./src/gfx/sprites/jet/jet_destroyed_spritesheet.bmp"
    },
    jetProjectiles: {
        idleRsrc: "./src/gfx/sprites/projectiles/jet_projectile.bmp",
        destroyedSrc: "./src/gfx/sprites/chopper/destroyed_spritesheet.bmp"
    },
    helikopter: {
        idleLsrc: "./src/gfx/sprites/helikopter/helikopter_l_spritesheet.bmp",
        idleRsrc: "./src/gfx/sprites/helikopter/helikopter_r_spritesheet.bmp",
        turnSrc: "./src/gfx/sprites/helikopter/helikopter_turn_spritesheet.bmp",
        destroyedSrc: "./src/gfx/sprites/chopper/destroyed_spritesheet.bmp"
    },

    rocket: {
        idleRsrc: "./src/gfx/sprites/projectiles/chopper_rocket_right.bmp",
        idleLsrc: "./src/gfx/sprites/projectiles/chopper_rocket_left.bmp",
        destroyedSrc: "./src/gfx/sprites/chopper/destroyed_spritesheet.bmp"
    },
    bomb: {
        idleRsrc: "./src/gfx/sprites/projectiles/bomb.bmp"
    },
    bridge: {
        idleRsrc: "./src/gfx/sprites/buildings/bridge.bmp"
    },

    ammoSign: {
        idleRsrc: "./src/gfx/sprites/buildings/ammo_sign_0.bmp"
    },
    fuelSign: {
        idleRsrc: "./src/gfx/sprites/buildings/fuel_sign_0.bmp"
    },

    spike: {
        idleRsrc: "./src/gfx/sprites/buildings/spike.bmp"
    },
    wall: {
        idleRsrc: "./src/gfx/sprites/buildings/wall.bmp"
    }
}

export const VELOCITIES : any = {
    rocket: 28,
    bomb: 20,
    car: 2,
    jet: 18,
    jetProjectile: 18
}

export const SOUND_SOURCES : any = {
    soundtrack: "./src/sound/action_force_ost.mp3",
    shot: "./src/sound/shot.mp3",
    engineering: "./src/sound/bridge_interaction.mp3",
    death: "./src/sound/death.mp3"
}

export const IMAGE_SOURCES : any = {
    backgroundSrc: "./src/gfx/gui/player_gui_bg.bmp",
    overlaySrc: "./src/gfx/gui/charset/charset.bmp",
    fuelLowImgSrc: "./src/gfx/gui/fuel_low.bmp"
}

export const ENGINE_CONSTANTS : any = {
    fps: 50,
    frameInterval: 1000 / 50,
    maxEnemies: 4
}

export const PLAYER_CONSTANTS : any = {
    fuelTickDuration: 7, // in seconds
    fuelPerRefuelSecond: 4,
    ammoPerResupplySecond: 16,

    animationInterval: 2 * ENGINE_CONSTANTS.frameInterval, // 2 frames
    deathAnimationInterval: 7 * ENGINE_CONSTANTS.frameInterval,

    maxFuel: 25,
    maxAmmo: 200,
    maxBombs: 100,

    minVelocityFactor: .16,
    criticalVelocityFactor: 4,
    acceleration: 2.5,

    guiBgCanvasId: "player-gui-bg",
    guiCanvasId: "player-gui"
}

export const CAR_CONSTANTS : any = {
    hitpoints: 100,
    animationInterval: 4 * ENGINE_CONSTANTS.frameInterval, // 4 frames
    deathAnimationInterval: 8 * ENGINE_CONSTANTS.frameInterval,
};

export const ENEMY_CONSTANTS : any = {
    jet: {
        deathAnimationInterval: 7 * ENGINE_CONSTANTS.frameInterval,
        projectiles: {
            deathAnimationInterval: 2 * ENGINE_CONSTANTS.frameInterval
        },
        shootingInterval: 700
    },
    helikopter: {
        acceleration: 2.5,
        animationInterval: 4 * ENGINE_CONSTANTS.frameInterval,
        deathAnimationInterval: 7 * ENGINE_CONSTANTS.frameInterval
    }
}

export const HTML_IDS : any = {
    crtOn: "checkbox-crt",
    gameCanvasId: "game",
    backgroundCanvasId: "background",
    overlayCanvasId: "overlay",
    crtCanvasId: "crt"
}

export const COLOUR_FILTERS_ARRAY : ColourFilters[] = [ ...Object.values( ColourFilters ) ];

export var DISPLAY_OPTIONS : any = {
    crt: false,
}