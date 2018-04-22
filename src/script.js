/* eslint no-var: 0 */
/* eslint vars-on-top: 0 */
/* eslint prefer-const: 0 */
/* eslint arrow-parens: 0 */

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
      UL: 783.991,
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
    this.play(e);
    this.stop();
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

  play(e) {
    this.setup();
    var value = this.soundLib[e.target.id.split('_')[1]];
    log.debug(`Tone value: ${value}`);
    this.oscillator.frequency.setValueAtTime(value, this.context.currentTime);
    this.gainNode.gain.setValueAtTime(0, this.context.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(
      1,
      this.context.currentTime + 0.01,
    );
    this.oscillator.start(this.context.currentTime);
    this.stop(this.context.currentTime);
  },

  stop() {
    this.gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      this.context.currentTime + 1,
    );
    this.oscillator.stop(this.context.currentTime + 1);
  },
};

var UI = {
  listen() {
    log.debug('Listening on UI');
    var buttons = document.querySelectorAll('.buttonGame');
    log.trace('Buttons selected:');
    log.trace(buttons);
    buttons.forEach(btn => btn.addEventListener('click', this.playSound));
  },

  changeStyle(elm) {
    elm.classList.toggle('--blink');
    setTimeout(() => elm.classList.toggle('--blink'), 300);
  },
};

log.setLevel('debug');
Object.assign(App, SoundGen, UI);
App.init();
App.start();
App.listen();
