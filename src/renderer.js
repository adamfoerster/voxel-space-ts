import { detectKeysDown, detectKeysUp, detectMouseDown, detectMouseUp, detectMouseMove } from './input-detection';
import { state } from './state';
// Update the camera for next frame. Dependent on keypresses
function updateCamera({ input, camera, time, map }) {
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
    const mapoffset = (((Math.floor(camera.y) & (map.width - 1)) << map.shift) +
        (Math.floor(camera.x) & (map.height - 1))) |
        0;
    if (map.altitude[mapoffset] + 10 > camera.height) {
        camera.height = map.altitude[mapoffset] + 10;
    }
    time = current;
}
// ---------------------------------------------
// Fast way to draw vertical lines
function drawVerticalLine(argx, argytop, argybottom, argcol, screendata) {
    const x = argx || 0;
    let ytop = argytop | 0;
    const ybottom = argybottom | 0;
    const col = argcol | 0;
    const buf32 = screendata.buf32;
    const screenwidth = screendata.canvas.width | 0;
    if (ytop < 0)
        ytop = 0;
    if (ytop > ybottom)
        return;
    // get offset on screen for the vertical line
    let offset = (ytop * screenwidth + x) | 0;
    for (let k = ytop | 0; k < ybottom ? true : false; k = (k + 1) | 0) {
        buf32[offset | 0] = col | 0;
        offset = (offset + screenwidth) | 0;
    }
}
// ---------------------------------------------
// Basic screen handling
function drawBackground(screendata) {
    const buf32 = screendata.buf32;
    const color = screendata.backgroundcolor | 0;
    for (let i = 0; i < buf32.length; i++)
        buf32[i] = color | 0;
}
// Show the back buffer on screen
function flip(screendata) {
    screendata.imagedata.data.set(screendata.buf8);
    screendata.context.putImageData(screendata.imagedata, 0, 0);
}
// ---------------------------------------------
// The main render routine
function render({ map, screendata, camera }) {
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
            const mapoffset = (((Math.floor(ply) & mapwidthperiod) << map.shift) +
                (Math.floor(plx) & mapheightperiod)) |
                0;
            const heightonscreen = ((camera.height - map.altitude[mapoffset]) * invz + camera.horizon) | 0;
            drawVerticalLine(i, heightonscreen || 0, hiddeny[i], map.color[mapoffset], screendata);
            if (heightonscreen < hiddeny[i])
                hiddeny[i] = heightonscreen;
            plx += dx;
            ply += dy;
        }
    }
    dz += 0.01;
}
// ---------------------------------------------
// Draw the next frame
function draw(state) {
    state.updaterunning = true;
    updateCamera(state);
    drawBackground(state.screendata);
    render(state);
    flip(state.screendata);
    state.framesQtd++;
    if (!state.input.keypressed) {
        state.updaterunning = false;
    }
    else {
        window.setTimeout(draw, 0);
    }
}
// ---------------------------------------------
// Init routines
// Util class for downloading the png
function downloadImagesAsync(urls, map) {
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
function loadMap(filenames, map) {
    const files = filenames.split(';');
    downloadImagesAsync([
        `maps/${files[0]}.png`,
        `maps/${files[1]}.png`,
    ], map).then(result => onLoadedImages(result, state));
}
function onLoadedImages(result, state) {
    const datac = result[0];
    const datah = result[1];
    for (let i = 0; i < state.map.width * state.map.height; i++) {
        state.map.color[i] =
            0xff000000 |
                (datac[(i << 2) + 2] << 16) |
                (datac[(i << 2) + 1] << 8) |
                datac[(i << 2) + 0];
        state.map.altitude[i] = datah[i << 2];
    }
    draw(state);
}
function onResizeWindow(state) {
    state.screendata.canvas = document.getElementById('fullscreenCanvas');
    const aspect = window.innerWidth / window.innerHeight;
    state.screendata.canvas.width = window.innerWidth < 800 ? window.innerWidth : 800;
    state.screendata.canvas.height = state.screendata.canvas.width / aspect;
    if (state.screendata.canvas.getContext) {
        state.screendata.context = state.screendata.canvas.getContext('2d');
        state.screendata.imagedata = state.screendata.context.createImageData(state.screendata.canvas.width, state.screendata.canvas.height);
    }
    state.screendata.bufarray = new ArrayBuffer(state.screendata.imagedata.width * state.screendata.imagedata.height * 4);
    state.screendata.buf8 = new Uint8Array(state.screendata.bufarray);
    state.screendata.buf32 = new Uint32Array(state.screendata.bufarray);
    draw(state);
}
function init(state) {
    let { map, input, time, updaterunning, camera, framesQtd, timelastframe } = state;
    for (let i = 0; i < map.width * map.height; i++) {
        map.color[i] = 0xff007050;
        map.altitude[i] = 0;
    }
    loadMap('C1W;D1', map);
    onResizeWindow(state);
    // set event handlers for keyboard, mouse, touchscreen and window resize
    const canvas = document.getElementById('fullscreenCanvas');
    document.onkeydown = (e) => detectKeysDown(e, input, updaterunning, time, draw);
    document.onkeyup = (e) => detectKeysUp(e, input);
    document.onmousedown = (e) => detectMouseDown(e, input, time, updaterunning, draw);
    document.onmouseup = () => detectMouseUp(input);
    document.onmousemove = (e) => detectMouseMove(e, input, camera);
    document.ontouchstart = (e) => detectMouseDown(e, input, time, updaterunning, draw);
    document.ontouchend = () => detectMouseUp(input);
    document.ontouchmove = (e) => detectMouseMove(e, input, camera);
    window.onresize = (e) => onResizeWindow(state);
    window.setInterval(() => {
        const current = new Date().getTime();
        const fps = (((framesQtd / (current - timelastframe)) * 1000).toFixed(1)).toString();
        document.getElementById('fps').innerText = `${fps} fps`;
        framesQtd = 0;
        timelastframe = current;
        // tslint:disable-next-line: align
    }, 2000);
}
init(state);
//# sourceMappingURL=renderer.js.map