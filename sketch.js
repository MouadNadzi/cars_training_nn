

// Constants
const TOTAL = 100;
const MUTATION_RATE = 0.1;
const LIFESPAN = 25;
const SIGHT = 50;

// Global variables
let generationCount = 0;
let currentCircuit = 0;
let walls = [];
let ray;
let population = [];
let savedVehicles = [];
let start, end;
let debugMode = false;
let isUpdatingUI = false;  // Add this line


// UI Elements
let speedSlider;
let visionAngleSlider;
let hiddenLayersSlider;
let neuronsPerLayerSlider;
let saveButton;
let loadButton;
let circuitSelect;
let savedBrainsList;
let controlPanel;
let bottomPanel;

// Track elements
let inside = [];
let outside = [];
let checkpoints = [];

function createCircuit(difficulty) {
    checkpoints = [];
    inside = [];
    outside = [];

    let noiseMax = 4;
    const total = 60;
    let pathWidth = 80 - (difficulty * 10); // Path gets narrower with difficulty
    let startX = random(1000);
    let startY = random(1000);

    switch (difficulty) {
        case 0: // Easy - Oval track
            for (let i = 0; i < total; i++) {
                let a = map(i, 0, total, 0, TWO_PI);
                let xr = 200;
                let yr = 150;
                let x1 = width / 2 + (xr - pathWidth) * cos(a);
                let y1 = height / 2 + (yr - pathWidth) * sin(a);
                let x2 = width / 2 + (xr + pathWidth) * cos(a);
                let y2 = height / 2 + (yr + pathWidth) * sin(a);
                addCheckpoint(x1, y1, x2, y2);
            }
            break;

        case 1: // Medium - S-curves with varying width
            for (let i = 0; i < total; i++) {
                let a = map(i, 0, total, 0, TWO_PI);
                let xr = 250 + 50 * sin(3 * a);
                let yr = 180 + 30 * sin(2 * a);
                let localPathWidth = pathWidth + 10 * sin(4 * a);
                let x1 = width / 2 + (xr - localPathWidth) * cos(a);
                let y1 = height / 2 + (yr - localPathWidth) * sin(a);
                let x2 = width / 2 + (xr + localPathWidth) * cos(a);
                let y2 = height / 2 + (yr + localPathWidth) * sin(a);
                addCheckpoint(x1, y1, x2, y2);
            }
            break;

        case 2: // Hard - Complex curves
            for (let i = 0; i < total; i++) {
                let a = map(i, 0, total, 0, TWO_PI);
                let xoff = map(cos(a), -1, 1, 0, noiseMax) + startX;
                let yoff = map(sin(a), -1, 1, 0, noiseMax) + startY;
                let xr = map(noise(xoff, yoff), 0, 1, 100, width * 0.4);
                let yr = map(noise(xoff + 5, yoff + 5), 0, 1, 100, height * 0.4);
                let x1 = width / 2 + (xr - pathWidth) * cos(a);
                let y1 = height / 2 + (yr - pathWidth) * sin(a);
                let x2 = width / 2 + (xr + pathWidth) * cos(a);
                let y2 = height / 2 + (yr + pathWidth) * sin(a);
                addCheckpoint(x1, y1, x2, y2);
            }
            break;

        case 3: // Very Hard - Tight corners
            for (let i = 0; i < total; i++) {
                let a = map(i, 0, total, 0, TWO_PI);
                let r = 200 + 100 * sin(3 * a) * cos(2 * a);
                let x1 = width / 2 + (r - pathWidth) * cos(a);
                let y1 = height / 2 + (r - pathWidth) * sin(a);
                let x2 = width / 2 + (r + pathWidth) * cos(a);
                let y2 = height / 2 + (r + pathWidth) * sin(a);
                addCheckpoint(x1, y1, x2, y2);
            }
            break;

        case 4: // Expert - Maze-like
            for (let i = 0; i < total; i++) {
                let a = map(i, 0, total, 0, TWO_PI);
                let r = 200 + 80 * sin(5 * a) * cos(3 * a);
                let x1 = width / 2 + (r - pathWidth) * cos(a);
                let y1 = height / 2 + (r - pathWidth) * sin(a);
                let x2 = width / 2 + (r + pathWidth) * cos(a);
                let y2 = height / 2 + (r + pathWidth) * sin(a);
                addCheckpoint(x1, y1, x2, y2);
            }
            break;
    }

    buildWalls();
}

function addCheckpoint(x1, y1, x2, y2) {
    checkpoints.push(new Boundary(x1, y1, x2, y2));
    inside.push(createVector(x1, y1));
    outside.push(createVector(x2, y2));
}

function buildWalls() {
    walls = [];
    for (let i = 0; i < checkpoints.length; i++) {
        let a1 = inside[i];
        let b1 = inside[(i + 1) % checkpoints.length];
        walls.push(new Boundary(a1.x, a1.y, b1.x, b1.y));
        let a2 = outside[i];
        let b2 = outside[(i + 1) % checkpoints.length];
        walls.push(new Boundary(a2.x, a2.y, b2.x, b2.y));
    }

    start = checkpoints[0].midpoint();
    end = checkpoints[checkpoints.length - 1].midpoint();
}

function setup() {
    createCanvas(1200, 800);
    tf.setBackend('cpu');

    createUIControls();
    styleUIElements();

    // Initialize first circuit
    createCircuit(0);

    // Create initial population
    for (let i = 0; i < TOTAL; i++) {
        population[i] = new Vehicle(null, visionAngleSlider.value());
    }
}

function createUIControls() {
    // Control panel
    controlPanel = createDiv('');
    controlPanel.addClass('control-panel');
    controlPanel.style('position', 'absolute');
    controlPanel.style('top', '10px');
    controlPanel.style('left', '10px');
    controlPanel.style('background', 'rgba(0, 0, 0, 0.7)');
    controlPanel.style('padding', '15px');
    controlPanel.style('border-radius', '10px');
    controlPanel.style('border', '1px solid #444');
    controlPanel.style('width', '250px');

    // Circuit selector
    createDiv('Select Circuit:').parent(controlPanel).style('color', '#fff').style('margin-bottom', '5px');
    circuitSelect = createSelect();
    circuitSelect.parent(controlPanel);
    circuitSelect.style('width', '100%');
    circuitSelect.option('Easy Circuit', 0);
    circuitSelect.option('S-Curves Circuit', 1);
    circuitSelect.option('Complex Circuit', 2);
    circuitSelect.option('Challenge Circuit', 3);
    circuitSelect.option('Expert Circuit', 4);
    circuitSelect.changed(changeCircuit);

    // Speed control
    createDiv('Simulation Speed:').parent(controlPanel).style('color', '#fff').style('margin-top', '15px').style('margin-bottom', '5px');
    speedSlider = createSlider(1, 10, 1);
    speedSlider.parent(controlPanel);
    speedSlider.style('width', '100%');

    // Vision control
    createDiv('Vision Angle:').parent(controlPanel).style('color', '#fff').style('margin-top', '15px').style('margin-bottom', '5px');
    visionAngleSlider = createSlider(30, 180, 90);
    visionAngleSlider.parent(controlPanel);
    visionAngleSlider.style('width', '100%');
    /*visionAngleSlider.input(() => {
      const newAngle = visionAngleSlider.value();
      for (let vehicle of population) {
          vehicle.updateVisionAngle(newAngle);
      }
  });*/
  /*visionAngleSlider.input(() => {
    tf.engine().startScope(); // Start memory management scope
    updateVisionAngle();
    tf.engine().endScope();   // Clean up tensors
});*/
visionAngleSlider.input(() => {
  if (!isUpdatingUI) {
      isUpdatingUI = true;
      try {
          updateVisionAngle();
      } finally {
          isUpdatingUI = false;
      }
  }
});
  

    // Neural network controls
    createDiv('Neural Network:').parent(controlPanel).style('color', '#fff').style('margin-top', '15px').style('margin-bottom', '5px');
    createDiv('Hidden Layers:').parent(controlPanel).style('color', '#fff').style('margin-top', '10px').style('margin-bottom', '5px');
    hiddenLayersSlider = createSlider(1, 3, 1);
    hiddenLayersSlider.parent(controlPanel);
    hiddenLayersSlider.style('width', '100%');

    createDiv('Neurons per Layer:').parent(controlPanel).style('color', '#fff').style('margin-top', '10px').style('margin-bottom', '5px');
    neuronsPerLayerSlider = createSlider(4, 16, 8);
    neuronsPerLayerSlider.parent(controlPanel);
    neuronsPerLayerSlider.style('width', '100%');

    // Create a more organized bottom panel
    bottomPanel = createDiv('');
    bottomPanel.addClass('bottom-panel');
    bottomPanel.style('position', 'absolute');
    bottomPanel.style('bottom', '10px');
    bottomPanel.style('left', '50%');
    bottomPanel.style('transform', 'translateX(-50%)'); // Center horizontally
    bottomPanel.style('background', 'rgba(0, 0, 0, 0.8)');
    bottomPanel.style('padding', '15px');
    bottomPanel.style('border-radius', '10px');
    bottomPanel.style('border', '1px solid #666');
    bottomPanel.style('display', 'flex');
    bottomPanel.style('gap', '15px');
    bottomPanel.style('align-items', 'center');
    bottomPanel.style('width', 'auto');
    bottomPanel.style('min-width', '500px');

    // Save/Load controls
    saveButton = createButton('💾 Save Best Model');
    saveButton.parent(bottomPanel);
    saveButton.mousePressed(saveBestModel);

    loadButton = createButton('📂 Load Model');
    loadButton.parent(bottomPanel);
    loadButton.mousePressed(loadSavedModel);

    savedBrainsList = createSelect();
    savedBrainsList.parent(bottomPanel);
    savedBrainsList.style('flex-grow', '1');
    updateSavedBrainsList();
}

function styleUIElements() {
    // Style select elements
    const selects = selectAll('select');
    selects.forEach(el => {
        el.style('padding', '8px');
        el.style('border-radius', '5px');
        el.style('border', '1px solid #666');
        el.style('background', '#222');
        el.style('color', '#fff');
        el.style('font-size', '14px');
        el.style('cursor', 'pointer');
    });

    // Style buttons
    const buttons = selectAll('button');
    buttons.forEach(btn => {
        btn.style('padding', '8px 15px');
        btn.style('border-radius', '5px');
        btn.style('border', '1px solid #666');
        btn.style('background', '#222');
        btn.style('color', '#fff');
        btn.style('font-size', '14px');
        btn.style('cursor', 'pointer');
        btn.style('transition', 'all 0.3s ease');

        btn.mouseOver(() => {
            btn.style('background', '#444');
        });
        btn.mouseOut(() => {
            btn.style('background', '#222');
        });
    });

    // Style sliders
    const sliders = selectAll('input[type="range"]');
    sliders.forEach(slider => {
        slider.style('cursor', 'pointer');
    });
}



function draw() {
  const cycles = speedSlider.value();
  background(0);

  try {
      let bestP = population[0];

      for (let n = 0; n < cycles; n++) {
          for (let vehicle of population) {
              if (!vehicle) continue;  // Skip if vehicle is undefined
              
              vehicle.applyBehaviors(walls);
              vehicle.check(checkpoints);
              vehicle.update();
              
              if (vehicle.fitness > bestP.fitness) {
                  bestP = vehicle;
              }
          }

          // Remove dead or finished vehicles
          for (let i = population.length - 1; i >= 0; i--) {
              const vehicle = population[i];
              if (!vehicle) continue;  // Skip if vehicle is undefined
              
              if (vehicle.dead || vehicle.finished) {
                  savedVehicles.push(population.splice(i, 1)[0]);
              }
          }

          // Next generation if all vehicles are done
          if (population.length === 0) {
              nextGeneration();
              generationCount++;
          }
      }

      // Draw walls
      for (let wall of walls) {
          if (wall) wall.show();  // Check if wall exists
      }

      // Draw vehicles
      for (let vehicle of population) {
          if (vehicle) vehicle.show();  // Check if vehicle exists
      }

      if (bestP) bestP.highlight();

      // Draw UI info
      drawUIInfo();
      if (debugMode) {
          drawDebugInfo();
      }
      
  } catch (error) {
      console.error('Error in draw loop:', error);
  }
}

function drawUIInfo() {
    // Stats panel
    push();
    translate(width - 200, 10);

    fill(0, 0, 0, 180);
    stroke(80);
    rect(0, 0, 190, 100, 10);

    fill(255);
    noStroke();
    textSize(16);
    textAlign(LEFT);

    text('Generation: ' + generationCount, 10, 30);
    text('Vehicles: ' + population.length, 10, 55);
    text('Speed: ' + speedSlider.value() + 'x', 10, 80);

    // Settings panel
    translate(0, 110);
    fill(0, 0, 0, 180);
    stroke(80);
    rect(0, 0, 190, 90, 10);

    fill(255);
    noStroke();
    text('Vision: ' + visionAngleSlider.value() + '°', 10, 25);
    text('Layers: ' + hiddenLayersSlider.value(), 10, 50);
    text('Neurons: ' + neuronsPerLayerSlider.value(), 10, 75);

    pop();
}

function drawDebugInfo() {
  push();
  translate(10, height - 150);

  fill(0, 0, 0, 180);
  stroke(80);
  rect(0, 0, 250, 100, 10);

  fill(255);
  noStroke();
  textSize(14);
  textAlign(LEFT);

  let bestP = population[0];
  for (let vehicle of population) {
      if (vehicle.fitness > bestP.fitness) {
          bestP = vehicle;
      }
  }

  text('Debug Mode (Press D to toggle)', 10, 20);
  text('Checkpoints visible: Green lines', 10, 40);
  text('Ray intersections: Visible', 10, 60);
  text('Best fitness: ' + bestP.fitness.toFixed(2), 10, 80);

  pop();
}

function keyPressed() {
  if (key === 'd' || key === 'D') {
      debugMode = !debugMode;
      console.log('Debug mode:', debugMode);
  }
}

function changeCircuit() {
  currentCircuit = parseInt(circuitSelect.value());
  createCircuit(currentCircuit);
  resetSimulation();
  updateSavedBrainsList();
}

function resetSimulation() {
  for (let vehicle of population) {
      if (vehicle) vehicle.dispose();
  }
  for (let vehicle of savedVehicles) {
      if (vehicle) vehicle.dispose();
  }

  population = [];
  savedVehicles = [];
  generationCount = 0;

  for (let i = 0; i < TOTAL; i++) {
      population[i] = new Vehicle(null, visionAngleSlider.value());
  }
}






// Add function to clear saved models if needed
function clearSavedModels() {
  localStorage.removeItem('savedModels');
  updateSavedBrainsList();
  console.log('All saved models cleared');
}

function updateSavedBrainsList() {
  if (savedBrainsList) {
      savedBrainsList.remove();
  }
  savedBrainsList = createSelect();
  savedBrainsList.parent(bottomPanel);
  savedBrainsList.style('flex-grow', '1');
  savedBrainsList.option('Select a saved brain...', '');

  try {
      const savedModels = JSON.parse(localStorage.getItem('savedModels') || '[]');
      const circuitModels = savedModels.filter(m => m.circuit === currentCircuit);

      for (let model of circuitModels) {
          // Safely access config properties
          const visionAngle = model.config?.visionAngle || '?';
          const neuronsPerLayer = model.config?.neuronsPerLayer || '?';
          const fitness = model.fitness?.toFixed(0) || '0';
          
          const configInfo = `(V:${visionAngle}° N:${neuronsPerLayer})`;
          const fitnessInfo = ` F:${fitness}`;
          savedBrainsList.option(`${model.name}${fitnessInfo} ${configInfo}`, model.name);
      }
  } catch (error) {
      console.error('Error updating brain list:', error);
  }
}

function loadSavedModel() {
  try {
      const modelName = savedBrainsList.value();
      if (!modelName) {
          console.log('No model selected');
          return;
      }

      const savedModels = JSON.parse(localStorage.getItem('savedModels') || '[]');
      const modelData = savedModels.find(m => m.name === modelName && m.circuit === currentCircuit);

      if (!modelData || !modelData.config || !modelData.weights) {
          console.error('Invalid model data:', modelData);
          return;
      }

      // First, disable any UI updates
      isUpdatingUI = true;

      try {
          // Update sliders to match saved configuration
          visionAngleSlider.value(modelData.config.visionAngle);
          hiddenLayersSlider.value(modelData.config.hiddenLayers);
          neuronsPerLayerSlider.value(modelData.config.neuronsPerLayer);

          // Log the loaded configuration
          console.log('Loading model with config:', modelData.config);
          console.log('Ray count:', modelData.config.rayCount);

          // Create brain with EXACT same structure
          const brain = new NeuralNetwork(
              modelData.config.rayCount,      // Use exact saved ray count
              modelData.config.neuronsPerLayer,
              2
          );

          // Verify weight shapes match before loading
          const savedWeights = modelData.weights;
          console.log('Saved weight shapes:', savedWeights.map(w => w.shape));
          console.log('Current weight shapes:', brain.model.getWeights().map(w => w.shape));

          // Load the weights
          const weights = savedWeights.map(w => tf.tensor(w.data, w.shape));
          brain.model.setWeights(weights);

          // Clean up existing vehicles
          cleanupVehicles();

          // Create new vehicles with exact saved configuration
          for (let i = 0; i < TOTAL; i++) {
              population[i] = new Vehicle(brain, modelData.config.visionAngle);
              // Force ray creation to match saved configuration
              population[i].rays = [];
              const rayCount = modelData.config.rayCount;
              const angleStep = modelData.config.visionAngle / (rayCount - 1);
              const startAngle = -modelData.config.visionAngle / 2;
              
              for (let j = 0; j < rayCount; j++) {
                  const angle = radians(startAngle + j * angleStep);
                  population[i].rays.push(new Ray(population[i].pos, angle));
              }
          }

          console.log('Model loaded successfully');
      } finally {
          // Re-enable UI updates
          isUpdatingUI = false;
      }

  } catch (error) {
      console.error('Error loading model:', error);
      isUpdatingUI = false;
      resetSimulation();
  }
}

// Also update the saveBestModel function to ensure exact configuration is saved
function saveBestModel() {
  const modelName = prompt('Enter a name for this brain:');
  if (!modelName) return;

  // Find best vehicle
  let bestVehicle = population[0];
  for (let vehicle of population) {
      if (vehicle.fitness > bestVehicle.fitness) {
          bestVehicle = vehicle;
      }
  }

  const rayCount = bestVehicle.rays.length;
  
  const modelData = {
      name: modelName,
      circuit: currentCircuit,
      weights: bestVehicle.brain.model.getWeights().map(w => {
          return {
              data: Array.from(w.dataSync()),
              shape: w.shape
          };
      }),
      fitness: bestVehicle.fitness,
      timestamp: Date.now(),
      config: {
          visionAngle: visionAngleSlider.value(),
          hiddenLayers: hiddenLayersSlider.value(),
          neuronsPerLayer: rayCount * 2,
          rayCount: rayCount
      }
  };

  try {
      const savedModels = JSON.parse(localStorage.getItem('savedModels') || '[]');
      const existingIndex = savedModels.findIndex(m => m.name === modelName && m.circuit === currentCircuit);
      
      if (existingIndex !== -1) {
          savedModels[existingIndex] = modelData;
      } else {
          savedModels.push(modelData);
      }
      
      localStorage.setItem('savedModels', JSON.stringify(savedModels));
      console.log('Model saved with config:', modelData.config);
      
      updateSavedBrainsList();
  } catch (error) {
      console.error('Error saving model:', error);
  }
}

/*function updateVisionAngle() {
  const newAngle = visionAngleSlider.value();
  
  // Clean up old neural networks
  for (let vehicle of population) {
      if (vehicle && vehicle.brain) {
          vehicle.brain.dispose();
      }
  }
  
  // Reset simulation with new vision angle
  resetSimulation();
}
*/
function updateVisionAngle() {
  const newAngle = visionAngleSlider.value();
  
  // Clean up old population
  try {
      // Dispose old vehicles
      for (let vehicle of population) {
          if (vehicle) vehicle.dispose();
      }
      for (let vehicle of savedVehicles) {
          if (vehicle) vehicle.dispose();
      }

      // Create new population
      population = [];
      savedVehicles = [];
      for (let i = 0; i < TOTAL; i++) {
          population[i] = new Vehicle(null, newAngle);
      }
  } catch (error) {
      console.error('Error updating vision angle:', error);
  }
}

function cleanupVehicles() {
  // Clean up existing vehicles
  for (let vehicle of population) {
      if (vehicle && vehicle.brain) {
          vehicle.dispose();
      }
  }
  for (let vehicle of savedVehicles) {
      if (vehicle && vehicle.brain) {
          vehicle.dispose();
      }
  }
  population = [];
  savedVehicles = [];
}