/* eslint no-var: 0 */
/* eslint vars-on-top: 0 */
/* eslint prefer-const: 0 */
/* eslint arrow-parens: 0 */
/* eslint no-restricted-syntax: 0 */

/*
  +(game engine) implement sequence generator;
  (game engine) implement game loop;
  (UI) add control panel;
  +(UI) conditions to stop requestAnimationFrame loop;
  (Improvement) add tempo control to UI;

*/

/* Notes and game flow
To implement accessible game I need to assing special keyboard layout
to game process - map mouse gestures to keys;

Buttons in game:
On/Off
Repeat
Strict

Game process:
1. On Start game load the game engine.
2. Choose a random sequence and keep it as current.
3. Save current game position - 1. 
4. Play sequence from beginning to the current position inclusive.
5. Wait for user input.
6. Compare each entered element with corresponding element in sequence.
7. On error: show message; buzz.
8. On success: move current position one element right; repeat from step 3.
8. On success in strict mode: repeat from step 2.
*/

/*
UL: E -  164.814 (octave lower)
UR: A -  440
LL: C# - 277.18
LR: E -  329.628
*/

// First, let's shim the requestAnimationFrame API, with a setTimeout fallback
window.requestAnimFrame = (() => {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    (callback => window.setTimeout(callback, 1000 / 60))
  );
})();

window.cancelAnimFrame = (() => {
  return (
    window.cancelAnimationFrame ||
    window.webkitCancelAnimationFrame ||
    window.mozCancelAnimationFrame ||
    window.oCancelAnimationFrame ||
    window.msCancelAnimationFrame ||
    window.cancelRequestAnimationFrame ||
    window.webkitRequestCancelAnimationFrame ||
    window.mozRequestCancelAnimationFrame ||
    window.oRequestCancelAnimationFrame ||
    window.msRequestCancelAnimationFrame ||
    (id => clearTimeout(id))
  );
})();

var App = {
  init() {
    this.originalSimonSounds = {
      UL: 164.814,
      UR: 440,
      LL: 277.18,
      LR: 329.628,
    };
    this.simonSwipeSounds = {
      UL: 523.251, // 783.991 - original
      UR: 329.628,
      LL: 261.63,
      LR: 391.995,
    };
    this.soundLib = this.simonSwipeSounds;
    this.stepsInGame = 30;
    this.currentStep = 1;
    this.tempo = 160;
    this.notesInQueue = [];
    this.lastNote = '';
    this.requestId = -1;
    this.sequence = this.generateSequence(this.stepsInGame);
    this.playSound = this.playSound.bind(this);
  },

  playSound(e) {
    log.debug('Play sound on a mouse click');
    log.trace(e);
    this.changeStyle(e.target);
    var value = this.soundLib[e.target.id.split('_')[1]];
    this.play(value);
  },

  playSequence(sequence, step) {
    log.debug(`Playing sequence on step ${step}`);
    sequence.slice(0, step).forEach((note, ndx) => {
      this.notesInQueue.push({
        note,
        time: ndx * 60 / this.tempo + this.context.currentTime,
      });
      this.playInTime(this.soundLib[note], ndx * 60 / this.tempo);
    });
    log.debug(JSON.stringify(this.notesInQueue));
    this.requestId = window.requestAnimFrame(this.draw);
  },

  randomRange(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  generateSequence(length) {
    log.debug('Generating sequence');
    var sequence = new Array(length).fill(undefined);
    sequence.reduce((prev, current, ndx) => {
      do {
        current = this.randomRange(Object.keys(this.soundLib));
      } while (prev === current);
      sequence[ndx] = current;
      return current;
    }, '');
    return sequence;
  },
};

var SoundGen = {
  start() {
    this.context = new (window.AudioContext || window.webkitAudioContext)();
  },

  setup() {
    this.oscillator = this.context.createOscillator();
    this.gainNode = this.context.createGain();

    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.context.destination);
    this.oscillator.type = 'sine';
  },

  play(value) {
    this.setup();
    log.debug(`Tone value: ${value}`);
    this.oscillator.frequency.setValueAtTime(value, this.context.currentTime);
    this.gainNode.gain.setValueAtTime(0, this.context.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(
      1,
      this.context.currentTime + 0.01,
    );
    this.oscillator.start(this.context.currentTime);
    this.stop();
  },

  playInTime(value, time) {
    this.setup();
    log.debug(`Tone value: ${value}`);
    this.oscillator.frequency.setValueAtTime(
      value,
      this.context.currentTime + time,
    );
    this.gainNode.gain.setValueAtTime(0, this.context.currentTime + time);
    this.gainNode.gain.linearRampToValueAtTime(
      1,
      this.context.currentTime + time + 0.01,
    );
    this.oscillator.start(this.context.currentTime + time);
    this.stopAtTime(time);
  },

  stop() {
    this.gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      this.context.currentTime + 1,
    );
    this.oscillator.stop(this.context.currentTime + 1);
  },

  stopAtTime(time) {
    this.gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      this.context.currentTime + time + 1,
    );
    this.oscillator.stop(this.context.currentTime + time + 1);
  },
};

var UI = {
  listen() {
    log.debug('Listening on UI');
    var buttons = document.querySelectorAll('.buttonGame');
    var btnPower = document.querySelector('#btnPower');
    log.trace('Buttons selected:');
    log.trace(buttons);
    buttons.forEach(btn => btn.addEventListener('click', this.playSound));
    btnPower.addEventListener('click', this.togglePressedState);
    this.draw = this.draw.bind(this);
  },

  changeStyle(elm) {
    elm.classList.toggle('--blink');
    setTimeout(() => elm.classList.toggle('--blink'), 300);
  },

  getElementByName(name) {
    return document.querySelector(`#button_${name}`);
  },

  togglePressedState(e) {
    e.target.classList.toggle('--pressed');
  },

  draw() {
    var currentTime = this.context.currentTime;
    var currentNote;
    log.debug(
      `Inside this.draw() notesInQueue: ${JSON.stringify(this.notesInQueue)}`,
    );
    while (
      this.notesInQueue.length > 0 &&
      this.notesInQueue[0].time < currentTime
    ) {
      currentNote = this.notesInQueue[0].note;
      this.notesInQueue.splice(0, 1);
    }

    log.debug(`currentNote: ${currentNote}, lastNote: ${this.lastNote}`);
    if (currentNote !== undefined && this.lastNote !== currentNote) {
      this.changeStyle(this.getElementByName(currentNote));
      this.lastNote = currentNote;
    }
    this.requestId = window.requestAnimFrame(this.draw);
    if (this.notesInQueue.length === 0) {
      window.cancelAnimationFrame(this.requestId);
      this.requestId = undefined;
    }
  },
};

log.setLevel('debug');
Object.assign(App, SoundGen, UI);
App.init();
App.start();
App.listen();
