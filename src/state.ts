export interface EngineState {
  camera: {
    x: number,
    y: number,
    height: number,
    angle: number,
    horizon: number,
    distance: number,
  },
  map: {
    width: number,
    height: number,
    shift: number,
    altitude: Uint8Array,
    color: Uint32Array,
  },
  screendata: {
    canvas: any,
    context: any,
    imagedata: any,

    bufarray: any,
    buf8: any,
    buf32: any,

    backgroundcolor: any,
  },
  input: {
    forwardbackward: number,
    leftright: number,
    updown: number,
    lookup: boolean,
    lookdown: boolean,
    mouseposition: any,
    keypressed: boolean,
  },
  updaterunning: boolean,
  time: number,
  timelastframe: number,
  framesQtd: number,
}

export const state: EngineState = {
  // ---------------------------------------------
  // Viewer information
  camera: {
    x: 512, // x position on the map
    y: 800, // y position on the map
    height: 78, // height of the camera
    angle: 0, // direction of the camera
    horizon: 100, // horizon position (look up and down)
    distance: 800, // distance of map
  },
  // ---------------------------------------------
  // Landscape data
  map: {
    width: 1024,
    height: 1024,
    shift: 10, // power of two: 2^10 = 1024
    altitude: new Uint8Array(1024 * 1024), // 1024 * 1024 byte array with height information
    color: new Uint32Array(1024 * 1024), // 1024 * 1024 int array with RGB colors
  },
  // ---------------------------------------------
  // Screen data
  screendata: {
    canvas: null,
    context: null,
    imagedata: null,

    bufarray: null, // color data
    buf8: null, // the same array but with bytes
    buf32: null, // the same array but with 32-Bit words

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