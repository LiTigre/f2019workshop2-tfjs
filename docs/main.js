const canvasWidth = 28 * 8;
const canvasHeight = 28 * 8;
const side = 28;

let strokes = [];
let currentStroke = [];

let sliders = [];

let mode = 'classifier';
const encodingDimension = 20;

let model;

async function initPrediction() {
  // FILL OUT
}

async function classifyDigit(classifier) {
  // FILL OUT
}

async function decodeLatentVector(decoder) {
  // FILL OUT
}

function rescaleCanvasToModel(value) {
  // FILL OUT
}

function rescaleModelToCanvas(value) {
  // FILL OUT
}

function getSliderTensor() {
  // FILL OUT
}

function generateSliders() {
  const sliderDiv = document.querySelector('#slider-div');

  for (let i = 0; i < encodingDimension; i++) {
    sliderDiv.innerHTML +=
      `<input id="slider${i}" type="range" min="0" max="1" step="any">`
  }
  for (let i = 0; i < encodingDimension; i++) {
    sliders.push(document.querySelector(`#slider${i}`));
  }
}

let mainP5Sketch = new p5(sketch => {
  sketch.setup = () => {
    let canvas = sketch.createCanvas(canvasWidth, canvasHeight);
    canvas.id('main-p5-canvas');
    sketch.strokeWeight(canvasWidth / 2 ** 4);
  }

  sketch.draw = () => {
    if (mode === 'classifier') {
      if (sketch.mouseIsPressed) {
        if (sketch.mouseX > 0 && sketch.mouseX < canvasWidth &&
          sketch.mouseY > 0 && sketch.mouseY < canvasHeight) {
          sketch.line(sketch.pmouseX, sketch.pmouseY,
            sketch.mouseX, sketch.mouseY);
          currentStroke.push([sketch.mouseX, sketch.mouseY]);
        } else if (currentStroke.length > 1) {
          strokes.push(currentStroke);
          currentStroke = [];
        }
      }
    }
  };

  sketch.mouseReleased = () => {
    if (currentStroke.length > 1) {
      strokes.push(currentStroke);
      currentStroke = [];
    }
  }
}, 'main-p5-div');

let preprocessingP5Sketch = new p5(sketch => {
  sketch.setup = () => {
    let canvas = sketch.createCanvas(side, side);
    canvas.id('preprocessing-p5-canvas');
    sketch.strokeWeight(2);
  }

  sketch.draw = () => {
    const allStrokes =
      strokes.concat(currentStroke.length > 0 ? [currentStroke] : []);
    const [xs, ys] = [0,1].map(i =>
      allStrokes.reduce((acc, cur) => acc.concat(cur.map(p => p[i])), [])
    );

    const minX = sketch.min(xs);
    const maxX = sketch.max(xs);
    const minY = sketch.min(ys);
    const maxY = sketch.max(ys);

    const dx = maxX - minX;
    const dy = maxY - minY;

    const mx = (maxX + minX) / 2;
    const my = (maxY + minY) / 2;

    const mins = dx > dy ? [minX, my - dx / 2] : [mx - dy / 2, minY];
    const maxs = dx > dy ? [maxX, my + dx / 2] : [mx + dy / 2, maxY];

    const ds = sketch.max(dx, dy, 20);

    const rescaledStrokes = allStrokes.map(stroke =>
      stroke.map(point => point.map((l, i) => 
        sketch.map(l, mins[i] - ds / 6, maxs[i] + ds / 6, 0, side)
      )));

    sketch.background(255);
    if (rescaledStrokes.length > 0) {
      rescaledStrokes.forEach(stroke => stroke.reduce((acc, cur) =>
        (sketch.line(acc[0], acc[1], cur[0], cur[1]), cur)
      ));
    }

    const dataURL =
      document.querySelector('#preprocessing-p5-canvas').toDataURL();
    document.querySelector('#preprocessing-p5-img').src = dataURL;
  }
}, 'preprocessing-p5-div');

let preprocessedP5Sketch = new p5(sketch => {
  sketch.setup = () => {
    const canvas = sketch.createCanvas(canvasWidth, canvasHeight);
    canvas.id('preprocessed-p5-canvas');
  }

  sketch.draw = () => {
    const img = document.querySelector('#preprocessing-p5-img');
    const ctx = document.querySelector('#preprocessed-p5-canvas').getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, 0, 0, side, side, 0, 0, canvasWidth, canvasHeight);
  }
}, 'preprocessed-p5-div');

window.onload = () => {
  document.querySelector('#clear-button').onclick = () => {
    strokes = [];
    currentStroke = [];
    document.querySelector('#main-p5-canvas').getContext('2d')
      .clearRect(0, 0, canvasWidth, canvasHeight);
  }

  // Tab switching logic
  const classifierTabButton = document.querySelector('#classifier-tab-button');
  const autoencoderTabButton = document.querySelector('#autoencoder-tab-button');
  const classifierDiv = document.querySelector('#classifier-div');
  const autoencoderDiv = document.querySelector('#autoencoder-div');

  classifierTabButton.onclick = () => {
    classifierTabButton.style.fontWeight = 'bold';
    autoencoderTabButton.style.fontWeight = 'normal';
    classifierDiv.style.display = 'block';
    autoencoderDiv.style.display = 'none';
    mode = 'classifier';
  }
  autoencoderTabButton.onclick = () => {
    classifierTabButton.style.fontWeight = 'normal';
    autoencoderTabButton.style.fontWeight = 'bold';
    classifierDiv.style.display = 'none';
    autoencoderDiv.style.display = 'block';
    mode = 'autoencoder';
  }

  const largerDecodedCanvas = document.querySelector('#larger-decoded-canvas');
  largerDecodedCanvas.width = canvasWidth;
  largerDecodedCanvas.height = canvasHeight;

  generateSliders()
  initPrediction()
}
