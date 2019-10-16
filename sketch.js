let config;
let player;
let fft;
let myBackground;

function preload() {
  config = loadJSON("./assets/config.json");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  rectMode(CENTER);
  angleMode(DEGREES);

  // background image
  myBackground = createElement('img');
  myBackground.style('position', 'absolute');
  myBackground.style('top', '0');
  myBackground.style('left', '0');
  myBackground.style('max-width', '100%');
  myBackground.style('object-fit', 'cover');
  myBackground.style('object-position', 'center');
  myBackground.style('z-index', '-1');

  // audio player
  player = new Player(config);
  player.initialize();

  // audio visualizer
  fft = new p5.FFT(0.7, 512);

  playerButtons();
}

function draw() {
  clear();

  playerUI();
  playerVisualizer();

  loadingBar();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function playerUI() {
  let radius = width / 10;
  let middleWidth = width / 2 - radius;
  let middleHeight = height / 2 - radius;

  noStroke();
  fill(220, 220, 220, 20);

  ellipse(middleWidth + radius, middleHeight + radius, radius * 2);
}

function playerButtons() {
  function Button(_xpos, _ypos, _name, _action) {
    let button = createButton(_name);
    this.name = _name;
  
    button.position(_xpos, _ypos);
    button.style('width', '60px');
    button.style('height', '40px');
    button.style('font-weight', 'bold');
    button.style('font-size', '22px');
    button.style('border', '0');
    button.style('outline', 'none');
    button.style('background', 'none');
    button.style('font-family', 'Jura');
    button.style('color', 'white');
  
    button.mousePressed(_action);
  }
  
  // prev button
  Button(
    (width / 2) - 100,
    (windowHeight / 2),
    'Prev',
    function () {
      player.prevTrack();
    }
  );

  // play button
  Button(
    (width / 2) - 70,
    (windowHeight / 2) - 40,
    'Play/Pause',
    function () {
      if (player.isTrackPlaying() == false) {
        player.playTrack();
      } else {
        player.pauseTrack();
      }
    }
  );

  // next button
  Button(
    (width / 2) + 35,
    (windowHeight / 2),
    'Next',
    function() {
      player.nextTrack();
    }
  );
}

// Show loading bar while track is loading
function loadingBar() {
  stroke(255, 255, 255);
  strokeWeight(8);

  if (player.loadingLevel != 0.99) {
    line(0, 0, map(player.loadingLevel, 0, 1, 0, width), 0);
  }
}

// Audio visualizer
function playerVisualizer() {
  let spectrum = fft.analyze();

  points = 180; // number of points
  pointAngle = 360 / points; // angle between points
  radius = width / 10; // length of each line from centre to edge of circle
  angle = 0;
  angle = angle + pointAngle;

  strokeWeight(5);

  let middleWidth = width / 2 - radius;
  let middleHeight = height / 2 - radius;

  for (let j = 0; j >= -180; j -= pointAngle) {
    let spectrumValue = spectrum[Math.abs(j)] * 0.3;

    x = cos(j) * (radius + spectrumValue);
    y = sin(j) * (radius + spectrumValue);

    stroke(255, map(spectrumValue * 0.3, 0, 15, 255, 0), 255);

    point(
      middleWidth + x + radius,
      middleHeight + y + radius
    );
  }

  for (let j = 0; j <= 180; j += pointAngle) {
    let spectrumValue = spectrum[j] * 0.3;

    x = cos(j) * (radius + spectrumValue);
    y = sin(j) * (radius + spectrumValue);

    stroke(255, map(spectrumValue * 0.3, 0, 15, 255, 0), 255);

    point(
      middleWidth + x + radius,
      middleHeight + y + radius
    );
  }
}

// Music player
function Player(_config) {
  this.config = _config.tracks;

  this.currentTrack;
  this.currentTrackIndex = 0;

  this.loading = false;
  this.loadingLevel = 0;

  this.autoplay = false;

  this.initialize = function () {
    this.loadTrack();
  }

  // return count of available tracks
  this.getTracksCount = function () {
    return this.config.length;
  }

  // switch to prev track
  this.prevTrack = function () {
    this.currentTrackIndex = this.currentTrackIndex - 1;

    if (this.currentTrackIndex < 0) {
      this.currentTrackIndex = this.getTracksCount() - 1;
    }

    if (player.isTrackPlaying() == true) {
      player.autoplay = true;
    }

    // stop the track before loading
    this.stopTrack();

    // load current track
    this.loadTrack();
  }

  // switch to next track
  this.nextTrack = function () {
    this.currentTrackIndex = this.currentTrackIndex + 1;

    if (this.currentTrackIndex == this.getTracksCount()) {
      this.currentTrackIndex = 0;
    }

    if (player.isTrackPlaying() == true) {
      player.autoplay = true;
    }

    // stop the track before loading
    this.stopTrack();

    // load current track
    this.loadTrack();
  }

  // load current track index into player
  this.loadTrack = function () {
    const _this = this;

    const trackInfo = this.config[this.currentTrackIndex];

    // https://p5js.org/reference/#/p5.SoundFile/loadSound
    this.currentTrack = loadSound(
      "./assets/" + trackInfo.audio,

      // load sound success callback
      function () {
        _this.loading = false;
        
        // start track automatically when this.autoplay = true
        if (_this.autoplay == true) {
          _this.playTrack();
        }
      },

      // load sound error callback
      function () {
        _this.loading = false;
      },

      // loading callback
      function (loadingValue) {
        _this.loading = true;
        _this.loadingLevel = loadingValue;
      }
    );

    myBackground.attribute('src', "./assets/" + trackInfo.image);
  }

  // return loading status
  this.isTrackLoading = function () {
    return this.loading;
  }

  // return playing status
  this.isTrackPlaying = function () {
    return this.currentTrack.isPlaying();
  }

  // play current audio track
  this.playTrack = function () {
    this.currentTrack.play();
  }

  // pause current audio track
  this.pauseTrack = function () {
    this.currentTrack.pause();
  }

  // stop current audio track
  this.stopTrack = function () {
    this.currentTrack.stop();
  }

  // set current audio track loop
  this.setLoopTrack = function (toggle) {
    this.currentTrack.setLoop(toggle);
  }
}