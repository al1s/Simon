/* eslint no-var: 0 */
/* eslint vars-on-top: 0 */
/* eslint prefer-const: 0 */
/* eslint arrow-parens: 0 */
/* eslint no-restricted-syntax: 0 */

/*
  (game engine) implement sequence generator;
  (UI) add control panel;

*/

/*
UL: E -  164.814 (octave lower)
UR: A -  440
LL: C# - 277.18
LR: E -  329.628
*/
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
    this.playSound = this.playSound.bind(this);
  },

  playSound(e) {
    log.debug('Play sound on a mouse click');
    log.trace(e);
    this.changeStyle(e.target);
    var value = this.soundLib[e.target.id.split('_')[1]];
    this.play(value);
    this.stop();
  },
};

var GameEngine = {
  playSequence(sequence, step) {
    log.debug(`Playing sequence on step ${step}`);
    for (let i of sequence.slice(0, step - 1)) {
      var elm = this.getElementByName(i);
      this.playSound({ target: elm });
    }
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
};

log.setLevel('debug');
Object.assign(App, SoundGen, GameEngine, UI);
App.init();
App.start();
App.listen();
