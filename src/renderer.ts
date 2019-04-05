
// ---------------------------------------------
// Viewer information

let camera = {
  x: 512, // x position on the map
  y: 800, // y position on the map
  height: 78, // height of the camera
  angle: 0, // direction of the camera
  horizon: 100, // horizon position (look up and down)
  distance: 800, // distance of map
};

// ---------------------------------------------
// Landscape data

let map = {
  width: 1024,
  height: 1024,
  shift: 10, // power of two: 2^10 = 1024
  altitude: new Uint8Array(1024 * 1024), // 1024 * 1024 byte array with height information
  color: new Uint32Array(1024 * 1024), // 1024 * 1024 int array with RGB colors
};

// ---------------------------------------------
// Screen data

let screendata = {
  canvas: null,
  context: null,
  imagedata: null,

  bufarray: null, // color data
  buf8: null, // the same array but with bytes
  buf32: null, // the same array but with 32-Bit words

  backgroundcolor: 0xffe09090,
};

// ---------------------------------------------
// Keyboard and mouse interaction

let input = {
  forwardbackward: 0,
  leftright: 0,
  updown: 0,
  lookup: false,
  lookdown: false,
  mouseposition: null,
  keypressed: false,
};

let updaterunning = false;

let time = new Date().getTime();

// for fps display
let timelastframe = new Date().getTime();
let framesQtd: number = 0;

// Update the camera for next frame. Dependent on keypresses
function updateCamera() {
  const current = new Date().getTime();

  input.keypressed = false;
  if (input.leftright !== 0) {
    camera.angle += input.leftright * 0.1 * (current - time) * 0.03;
    input.keypressed = true;
  }
  if (input.forwardbackward !== 0) {
    camera.x -=
      input.forwardbackward * Math.sin(camera.angle) * (current - time) * 0.03;
    camera.y -=
      input.forwardbackward * Math.cos(camera.angle) * (current - time) * 0.03;
    input.keypressed = true;
  }
  if (input.updown !== 0) {
    camera.height += input.updown * (current - time) * 0.03;
    input.keypressed = true;
  }
  if (input.lookup) {
    camera.horizon += 2 * (current - time) * 0.03;
    input.keypressed = true;
  }
  if (input.lookdown) {
    camera.horizon -= 2 * (current - time) * 0.03;
    input.keypressed = true;
  }

  // Collision detection. Don't fly below the surface.
  const mapoffset =
    (((Math.floor(camera.y) & (map.width - 1)) << map.shift) +
      (Math.floor(camera.x) & (map.height - 1))) |
    0;
  if (map.altitude[mapoffset] + 10 > camera.height) {
    camera.height = map.altitude[mapoffset] + 10;
  }
  time = current;
}

// ---------------------------------------------
// Keyboard and mouse event handlers
// ---------------------------------------------
// Keyboard and mouse event handlers

function getMousePosition(e) {
  // fix for Chrome
  if (e.type.startsWith('touch')) {
    return [e.targetTouches[0].pageX, e.targetTouches[0].pageY];
  }
  return [e.pageX, e.pageY];
}

function detectMouseDown(e) {
  input.forwardbackward = 3;
  input.mouseposition = getMousePosition(e);
  time = new Date().getTime();

  if (!updaterunning) draw();
  return;
}

function detectMouseUp() {
  input.mouseposition = null;
  input.forwardbackward = 0;
  input.leftright = 0;
  input.updown = 0;
  return;
}

function detectMouseMove(e) {
  e.preventDefault();
  if (input.mouseposition == null) return;
  if (input.forwardbackward === 0) return;

  const currentMousePosition = getMousePosition(e);

  input.leftright =
    ((input.mouseposition[0] - currentMousePosition[0]) / window.innerWidth) *
    2;
  camera.horizon =
    100 +
    ((input.mouseposition[1] - currentMousePosition[1]) / window.innerHeight) *
    500;
  input.updown =
    ((input.mouseposition[1] - currentMousePosition[1]) / window.innerHeight) *
    10;
}

function detectKeysDown(e) {
  switch (e.keyCode) {
    case 37: // left cursor
    case 65: // a
      input.leftright = +1;
      break;
    case 39: // right cursor
    case 68: // d
      input.leftright = -1;
      break;
    case 38: // cursor up
    case 87: // w
      input.forwardbackward = 3;
      break;
    case 40: // cursor down
    case 83: // s
      input.forwardbackward = -3;
      break;
    case 82: // r
      input.updown = +2;
      break;
    case 70: // f
      input.updown = -2;
      break;
    case 69: // e
      input.lookup = true;
      break;
    case 81: // q
      input.lookdown = true;
      break;
    default:
      return;
  }

  if (!updaterunning) {
    time = new Date().getTime();
    draw();
  }
  return false;
}

function detectKeysUp(e) {
  switch (e.keyCode) {
    case 37: // left cursor
    case 65: // a
      input.leftright = 0;
      break;
    case 39: // right cursor
    case 68: // d
      input.leftright = 0;
      break;
    case 38: // cursor up
    case 87: // w
      input.forwardbackward = 0;
      break;
    case 40: // cursor down
    case 83: // s
      input.forwardbackward = 0;
      break;
    case 82: // r
      input.updown = 0;
      break;
    case 70: // f
      input.updown = 0;
      break;
    case 69: // e
      input.lookup = false;
      break;
    case 81: // q
      input.lookdown = false;
      break;
    default:
      return;
      break;
  }
  return false;
}

// ---------------------------------------------
// Fast way to draw vertical lines

function drawVerticalLine(argx, argytop, argybottom: number, argcol) {
  const x = argx || 0;
  let ytop = argytop | 0;
  const ybottom = argybottom | 0;
  const col = argcol | 0;
  const buf32 = screendata.buf32;
  const screenwidth = screendata.canvas.width | 0;
  if (ytop < 0) ytop = 0;
  if (ytop > ybottom) return;

  // get offset on screen for the vertical line
  let offset = (ytop * screenwidth + x) | 0;
  for (let k: number = ytop | 0; k < ybottom ? true : false; k = (k + 1) | 0) {
    buf32[offset | 0] = col | 0;
    offset = (offset + screenwidth) | 0;
  }
}

// ---------------------------------------------
// Basic screen handling

function drawBackground() {
  const buf32 = screendata.buf32;
  const color = screendata.backgroundcolor | 0;
  for (let i = 0; i < buf32.length; i++) buf32[i] = color | 0;
}

// Show the back buffer on screen
function flip() {
  screendata.imagedata.data.set(screendata.buf8);
  screendata.context.putImageData(screendata.imagedata, 0, 0);
}

// ---------------------------------------------
// The main render routine

function render() {
  const mapwidthperiod = map.width - 1;
  const mapheightperiod = map.height - 1;

  const screenwidth = screendata.canvas.width | 0;
  const sinang = Math.sin(camera.angle);
  const cosang = Math.cos(camera.angle);

  const hiddeny = new Int32Array(screenwidth);
  for (let i = 0; i < screendata.canvas.width ? true : 0; i = (i + 1) || 0) {
    hiddeny[i] = screendata.canvas.height;
  }
  let dz = 1;

  // Draw from front to back
  for (let z = 1; z < camera.distance; z += dz) {
    // 90 degree field of view
    let plx = -cosang * z - sinang * z;
    let ply = sinang * z - cosang * z;
    const prx = cosang * z - sinang * z;
    const pry = -sinang * z - cosang * z;

    const dx = (prx - plx) / screenwidth;
    const dy = (pry - ply) / screenwidth;
    plx += camera.x;
    ply += camera.y;
    const invz = (1 / z) * 240;
    for (let i = 0; i < screenwidth ? true : 0; i = (i + 1) | 0) {
      const mapoffset =
        (((Math.floor(ply) & mapwidthperiod) << map.shift) +
          (Math.floor(plx) & mapheightperiod)) |
        0;
      const heightonscreen =
        ((camera.height - map.altitude[mapoffset]) * invz + camera.horizon) | 0;
      drawVerticalLine(i, heightonscreen | 0, hiddeny[i], map.color[mapoffset]);
      if (heightonscreen < hiddeny[i]) hiddeny[i] = heightonscreen;
      plx += dx;
      ply += dy;
    }
  }
  dz += 0.01;
}

// ---------------------------------------------
// Draw the next frame

function draw() {
  updaterunning = true;
  updateCamera();
  drawBackground();
  render();
  flip();
  framesQtd++;

  if (!input.keypressed) {
    updaterunning = false;
  } else {
    window.setTimeout(draw, 0);
  }
}

// ---------------------------------------------
// Init routines

// Util class for downloading the png
function downloadImagesAsync(urls) {
  return new Promise((resolve, reject) => {
    let pending = urls.length;
    const result = [];
    if (pending === 0) {
      resolve([]);
      return;
    }
    urls.forEach((url, i) => {
      const image = new Image();
      // image.addEventListener("load", function() {
      image.onload = function () {
        const tempcanvas = document.createElement('canvas');
        const tempcontext = tempcanvas.getContext('2d');
        tempcanvas.width = map.width;
        tempcanvas.height = map.height;
        tempcontext.drawImage(image, 0, 0, map.width, map.height);
        result[i] = tempcontext.getImageData(0, 0, map.width, map.height).data;
        pending--;
        if (pending === 0) {
          resolve(result);
        }
      };
      image.src = url;
    });
  });
}

function loadMap(filenames) {
  const files = filenames.split(';');
  downloadImagesAsync([
    `maps/${files[0]}.png`,
    `maps/${files[1]}.png`,
  ]).then(onLoadedImages);
}

function onLoadedImages(result) {
  const datac = result[0];
  const datah = result[1];
  for (let i = 0; i < map.width * map.height; i++) {
    map.color[i] =
      0xff000000 |
      (datac[(i << 2) + 2] << 16) |
      (datac[(i << 2) + 1] << 8) |
      datac[(i << 2) + 0];
    map.altitude[i] = datah[i << 2];
  }
  draw();
}

function onResizeWindow() {
  screendata.canvas = document.getElementById('fullscreenCanvas');

  const aspect = window.innerWidth / window.innerHeight;

  screendata.canvas.width = window.innerWidth < 800 ? window.innerWidth : 800;
  screendata.canvas.height = screendata.canvas.width / aspect;

  if (screendata.canvas.getContext) {
    screendata.context = screendata.canvas.getContext('2d');
    screendata.imagedata = screendata.context.createImageData(
      screendata.canvas.width,
      screendata.canvas.height,
    );
  }

  screendata.bufarray = new ArrayBuffer(
    screendata.imagedata.width * screendata.imagedata.height * 4,
  );
  screendata.buf8 = new Uint8Array(screendata.bufarray);
  screendata.buf32 = new Uint32Array(screendata.bufarray);
  draw();
}

function init() {
  for (let i = 0; i < map.width * map.height; i++) {
    map.color[i] = 0xff007050;
    map.altitude[i] = 0;
  }

  loadMap('C1W;D1');
  onResizeWindow();

  // set event handlers for keyboard, mouse, touchscreen and window resize
  const canvas = document.getElementById('fullscreenCanvas');
  canvas.onkeydown = detectKeysDown;
  canvas.onkeyup = detectKeysUp;
  canvas.onmousedown = detectMouseDown;
  canvas.onmouseup = detectMouseUp;
  canvas.onmousemove = detectMouseMove;
  canvas.ontouchstart = detectMouseDown;
  canvas.ontouchend = detectMouseUp;
  canvas.ontouchmove = detectMouseMove;

  window.onresize = onResizeWindow;

  window.setInterval(() => {
    const current = new Date().getTime();
    const fps = (((framesQtd / (current - timelastframe)) * 1000).toFixed(1)).toString();
    document.getElementById('fps').innerText = `${fps} fps`;
    framesQtd = 0;
    timelastframe = current;
// tslint:disable-next-line: align
  }, 2000);
}

init();
