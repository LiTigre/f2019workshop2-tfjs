const canvasWidth = 28 * 8;
const canvasHeight = 28 * 8;
const side = 28;

let strokes = [];
let currentStroke = [];

let sliders = [];

let mode = 'classification';
const encodingDimension = 20;

let model;

function rescaleCanvasToModel(value) {
  return value.mul(-1/255).add(1);
}

function rescaleModelToCanvas(value) {
  return value.sub(1).mul(-255).toInt();
}

function getSliderTensor() {
  return tf.tensor(sliders.map(slider => parseFloat(slider.value))).reshape([1, -1]);
}

function generateSliders() {
  const sliderDiv = document.querySelector('#slider-div');

  for (let i = 0; i < encodingDimension; i++) {
    sliderDiv.innerHTML +=
      `<input id="slider${i}" type="range" min="0" max="1" step="any">`
  }
  for (let i = 0; i < encodingDimension; i++) { //encoding_dimension; i++) {
    sliders.push(document.querySelector(`#slider${i}`));
  }
}

async function initPrediction() {
  const classifier = await tf.loadLayersModel('models/mnist_classifier/model.json');
  const decoder = await tf.loadLayersModel('models/mnist_decoder/model.json');

  setInterval(async () => {
    if (mode === 'autoencoder') {
      const input = getSliderTensor();
      const output = await rescaleModelToCanvas(
        decoder.predict(input).reshape([28, 28]));
      tf.browser.toPixels(output, document.querySelector('#decoded-canvas'));
      const dataURL = document.querySelector('#decoded-canvas').toDataURL();
      const img = document.querySelector('#decoded-img');
      img.src = dataURL;
    }
  }, 200);

  setInterval(async () => {
    if (mode === 'classification') {
      const input =
        tf.browser.fromPixels(document.querySelector('#preprocessing-p5-canvas'), 1);

      const output = await classifier.predict(
        rescaleCanvasToModel(input).reshape([1, 28, 28, 1])).argMax(1).data();
      document.querySelector('#message-p').innerHTML =
        'Model predicts ' + output[0];
    }
  }, 200);

}

let mainP5Sketch = new p5(sketch => {
  sketch.setup = () => {
    let canvas = sketch.createCanvas(canvasWidth, canvasHeight);
    canvas.id('main-p5-canvas');
    sketch.strokeWeight(canvasWidth / 2 ** 4);
  }

  sketch.draw = () => {
    if (mode === 'classification') {
      if (sketch.mouseIsPressed) {
        if (sketch.mouseX > 0 && sketch.mouseX < canvasWidth &&
          sketch.mouseY > 0 && sketch.mouseY < canvasHeight) {
          sketch.line(sketch.pmouseX, sketch.pmouseY, sketch.mouseX, sketch.mouseY);
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
    const allStrokes = strokes.concat(currentStroke.length > 0 ? [currentStroke] : []);
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

    const dataURL = document.querySelector('#preprocessing-p5-canvas').toDataURL();
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
  const classificationTabButton = document.querySelector('#classification-tab-button');
  const autoencoderTabButton = document.querySelector('#autoencoder-tab-button');
  const classificationDiv = document.querySelector('#classification-div');
  const autoencoderDiv = document.querySelector('#autoencoder-div');

  classificationTabButton.onclick = () => {
    classificationTabButton.style.fontWeight = 'bold';
    autoencoderTabButton.style.fontWeight = 'normal';
    classificationDiv.style.display = 'block';
    autoencoderDiv.style.display = 'none';
    mode = 'classification';
  }
  autoencoderTabButton.onclick = () => {
    classificationTabButton.style.fontWeight = 'normal';
    autoencoderTabButton.style.fontWeight = 'bold';
    classificationDiv.style.display = 'none';
    autoencoderDiv.style.display = 'block';
    mode = 'autoencoder';
  }

  generateSliders()
  initPrediction()
}
