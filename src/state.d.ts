export interface EngineState {
    camera: {
        x: number;
        y: number;
        height: number;
        angle: number;
        horizon: number;
        distance: number;
    };
    map: {
        width: number;
        height: number;
        shift: number;
        altitude: Uint8Array;
        color: Uint32Array;
    };
    screendata: {
        canvas: any;
        context: any;
        imagedata: any;
        bufarray: any;
        buf8: any;
        buf32: any;
        backgroundcolor: any;
    };
    input: {
        forwardbackward: number;
        leftright: number;
        updown: number;
        lookup: boolean;
        lookdown: boolean;
        mouseposition: any;
        keypressed: boolean;
    };
    updaterunning: boolean;
    time: number;
    timelastframe: number;
    framesQtd: number;
}
export declare const state: EngineState;
