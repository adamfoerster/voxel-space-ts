export const state = {
    // ---------------------------------------------
    // Viewer information
    camera: {
        x: 512,
        y: 800,
        height: 78,
        angle: 0,
        horizon: 100,
        distance: 800,
    },
    // ---------------------------------------------
    // Landscape data
    map: {
        width: 1024,
        height: 1024,
        shift: 10,
        altitude: new Uint8Array(1024 * 1024),
        color: new Uint32Array(1024 * 1024),
    },
    // ---------------------------------------------
    // Screen data
    screendata: {
        canvas: null,
        context: null,
        imagedata: null,
        bufarray: null,
        buf8: null,
        buf32: null,
        backgroundcolor: 0xffe09090,
    },
    // ---------------------------------------------
    // Keyboard and mouse interaction
    input: {
        forwardbackward: 0,
        leftright: 0,
        updown: 0,
        lookup: false,
        lookdown: false,
        mouseposition: null,
        keypressed: false,
    },
    updaterunning: false,
    time: new Date().getTime(),
    // for fps display
    timelastframe: new Date().getTime(),
    framesQtd: 0,
};
//# sourceMappingURL=state.js.map