// ---------------------------------------------
// Keyboard and mouse event handlers
// ---------------------------------------------
// Keyboard and mouse event handlers

export const getMousePosition = (e, input) => {
  // fix for Chrome
  if (e.type.startsWith('touch')) {
    return [e.targetTouches[0].pageX, e.targetTouches[0].pageY];
  }
  return [e.pageX, e.pageY];
}

export const detectMouseDown = (e, input, time, updaterunning, draw) => {
  input.forwardbackward = 3;
  input.mouseposition = getMousePosition(e, input);
  time = new Date().getTime();

  if (!updaterunning) draw();
  return;
}

export const detectMouseUp = (input) => {
  input.mouseposition = null;
  input.forwardbackward = 0;
  input.leftright = 0;
  input.updown = 0;
  return;
}

export const detectMouseMove = (e, input, camera) => {
  e.preventDefault();
  if (input.mouseposition == null) return;
  if (input.forwardbackward === 0) return;

  const currentMousePosition = getMousePosition(e, input);

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

export const detectKeysDown = (e, input, updaterunning, time, draw) => {
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

export const detectKeysUp = (e, input) => {
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
  }
  return false;
}