/* eslint no-var: 0 */
/* eslint vars-on-top: 0 */
/* eslint prefer-const: 0 */
/* eslint arrow-parens: 0 */
/* eslint no-restricted-syntax: 0 */

/*
  +(game engine) implement sequence generator;
  +(game engine) implement game loop;
  +(UI) add control panel;
  +(UI) conditions to stop requestAnimationFrame loop;
  +(UI) make UI elements wait till current routine executes;
  (UI) block game buttons while playing sequence;
  +(game) test thorouhgly:
    - strict is not working;
    - sometimes after error it starts to play the whole sequence;
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
  start() {
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
    this.stepsInGame = 20;
    this.currentStep = 1;
    this.currentNoteInStep = 1;
    this.tempo = 120;
    this.strictMode = false;
    this.reactionDelay = 1 * 1000;
    this.messageError = '!!';
    this.messageStop = '--';
    this.messageWin = '00';
    this.gameButtonNames = ['UR', 'LR', 'LL', 'UL'];

    // utility
    this.notesInQueue = [];
    this.lastNoteToDraw = '';
    this.requestId = -1;
    this.playSequence = this.playSequence.bind(this);
    this.repeatSequence = this.repeatSequence.bind(this);
    this.playPhrase = this.playPhrase.bind(this);
    this.handleStart = this.handleStart.bind(this);
    this.playSound = this.playSound.bind(this);
    this.setStrictMode = this.setStrictMode.bind(this);
    this.handleGameState = this.handleGameState.bind(this);
    this.draw = this.draw.bind(this);
  },

  playSequence(sequence, step) {
    log.debug(`Playing sequence on step ${step}`);
    sequence.slice(0, step).forEach((note, ndx) => {
      this.notesInQueue.push({
        note,
        time: ndx * 60 / this.tempo + this.context.currentTime,
      });
      // this.playInTime(this.soundLib[note], ndx * 60 / this.tempo);
    });
    log.debug(JSON.stringify(this.notesInQueue));
    this.requestId = window.requestAnimFrame(this.draw);
    return Promise.all(
      this.notesInQueue.map(item =>
        this.playInTimePromise(
          this.soundLib[item.note],
          item.time - this.context.currentTime,
        ),
      ),
    );
  },

  playPhrase(sequence, soundLib) {
    log.debug('Playing musical phrase');
    let time = 0;
    sequence.forEach((note, ndx) => {
      console.log(`note in phrase: ${note}`);
      if (typeof note[0] !== 'object') {
        this.playInTime(soundLib[note[0]], time);
        this.notesInQueue.push({
          note: this.gameButtonNames[ndx > 3 ? ndx % 4 : ndx],
          time: time + this.context.currentTime,
        });
      } else {
        note[0].forEach(item => {
          this.playInTime(soundLib[item], time, time);
          this.notesInQueue.push({
            note: 'ALL',
            time: time + this.context.currentTime,
          });
        });
      }
      time += note[1];
    });
    this.requestId = window.requestAnimFrame(this.draw);
  },

  randomRange(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  generateSequence(length) {
    log.debug('Generating sequence');
    let sequence = new Array(length).fill(undefined);
    sequence.reduce((prev, current, ndx) => {
      do {
        current = this.randomRange(Object.keys(this.soundLib));
      } while (prev === current);
      sequence[ndx] = current;
      return current;
    }, '');
    return sequence;
  },

  handleWin() {
    let fanfareSeq = [
      ['G1', 0.25],
      ['C2', 0.25],
      ['E2', 0.25],
      ['G2', 0.5],
      ['E2', 0.25],
      [['C2', 'E2', 'G2'], 0.5],
    ];
    let fanfareSounds = {
      G1: 392.0,
      C2: 523.251,
      E2: 659.255,
      G2: 783.99,
    };
    this.playPhrase(fanfareSeq, fanfareSounds);
  },

  repeatSequence() {
    this.pauseListen();
    this.later(this.reactionDelay * 0.5, [this.sequence, this.currentStep])
      .then(args => this.playSequence(...args))
      .then(() => this.resumeListen());
  },
};

var UI = {
  listen() {
    log.debug('Listening on UI');
    this.soundButtons = document.querySelectorAll('.buttonGame');
    this.repeatBtn = document.querySelector('#btnRepeat');
    let startBtn = document.querySelector('#btnStart');
    let strictBtn = document.querySelector('#btnStrict');
    log.trace('Buttons selected:');
    log.trace(this.soundButtons);
    startBtn.addEventListener('click', this.handleStart);
    this.soundButtons.forEach(btn =>
      btn.addEventListener('click', this.handleGameState),
    );
    this.repeatBtn.addEventListener('click', this.repeatSequence);
    strictBtn.addEventListener('click', this.setStrictMode);
    this.pauseListen();
  },

  pauseListen() {
    log.debug('Pause listening on color buttons');
    [...this.soundButtons, this.repeatBtn].forEach(elm =>
      this.pauseListenElm(elm),
    );
  },

  resumeListen() {
    log.debug('Resume listening on color buttons');
    [...this.soundButtons, this.repeatBtn].forEach(elm =>
      this.resumeListenElm(elm),
    );
  },

  pauseListenElm(elm) {
    elm.classList.add('--noevents');
  },

  resumeListenElm(elm) {
    elm.classList.remove('--noevents');
  },

  blinkAttr(elm, className) {
    elm.classList.toggle(className);
    setTimeout(() => elm.classList.toggle(className), 200);
  },

  changeStyle(elm) {
    var noteName = this.getNote({ target: elm });
    this.blinkAttr(elm, `--blink-${noteName}`);
  },

  getElementByName(name) {
    return document.querySelector(`#button_${name}`);
  },

  getNote(e) {
    return e.target.id.split('_')[1];
  },

  handleGameState(e) {
    this.playSound(e);
    this.pauseListen();
    var notePressed = this.getNote(e);
    if (this.sequence[this.currentNoteInStep - 1] === notePressed) {
      log.debug('Bingo!');
      // We've played the whole step
      if (this.currentNoteInStep === this.currentStep) {
        // we've played the whole sequence
        if (this.currentStep === this.stepsInGame) {
          this.syncMessage(this.messageWin);
          this.later(this.reactionDelay).then(this.handleWin());
          // we are still somewhere in a sequence and ready for a new step
        } else {
          this.currentStep += 1;
          this.currentNoteInStep = 1;
          this.syncMessage(this.currentStep);
          this.later(this.reactionDelay, [this.sequence, this.currentStep])
            .then(args => this.playSequence(...args))
            .then(() => this.resumeListen());
        }
        // wait for another note in current step
      } else {
        this.currentNoteInStep += 1;
        this.resumeListen();
      }
    } else {
      log.debug('Missed!');
      this.syncMessage(this.messageError);
      if (this.strictMode) {
        this.later(this.reactionDelay * 2).then(() => this.handleStart());
      } else {
        this.currentNoteInStep = 1;
        this.later(this.reactionDelay, [this.currentStep])
          .then(args => {
            this.syncMessage(...args);
            return this.later(this.reactionDelay, [
              this.sequence,
              this.currentStep,
            ]);
          })
          .then(args => this.playSequence(...args))
          .then(() => this.resumeListen());
      }
    }
  },

  handleStart(e) {
    this.currentStep = 1;
    this.currentNoteInStep = 1;
    this.sequence = this.generateSequence(this.stepsInGame);
    this.syncMessage(this.messageStop);
    this.togglePressedState(e);
    this.later(this.reactionDelay, [this.currentStep])
      .then(args => {
        this.syncMessage(...args);
        return [e];
      })
      .then(args => {
        this.togglePressedState(...args);
        return this.later(this.reactionDelay, [
          this.sequence,
          this.currentStep,
        ]);
      })
      .then(args => this.playSequence(...args))
      .then(() => this.resumeListen());
  },

  later(delay, value = []) {
    return new Promise(resolve => setTimeout(() => resolve([...value]), delay));
  },

  playSound(e) {
    log.debug('Play sound on a mouse click');
    log.trace(e);
    let value = this.getNote(e);
    this.playSequence([value], 1);
  },

  togglePressedState(e) {
    if (e) e.target.classList.toggle('--pressed');
  },

  setStrictMode(e) {
    this.strictMode = !this.strictMode;
    this.togglePressedState(e);
  },

  syncMessage(message) {
    let messageElm = document.querySelector('#messageElm');
    messageElm.innerHTML = message;
  },

  draw() {
    let currentTime = this.context.currentTime;
    let currentNote;
    log.trace(
      `Inside this.draw() notesInQueue: ${JSON.stringify(this.notesInQueue)}`,
    );
    while (
      this.notesInQueue.length > 0 &&
      this.notesInQueue[0].time < currentTime
    ) {
      currentNote = this.notesInQueue[0].note;
      this.notesInQueue.splice(0, 1);
    }

    log.trace(
      `Styling button; currentNote: ${currentNote}, lastNote: ${
        this.lastNoteToDraw
      }`,
    );
    if (currentNote !== undefined && this.lastNoteToDraw !== currentNote) {
      if (currentNote !== 'ALL') {
        this.changeStyle(this.getElementByName(currentNote));
        this.lastNoteToDraw = currentNote;
      } else {
        this.gameButtonNames.forEach(name =>
          this.changeStyle(this.getElementByName(name)),
        );
      }
    }
    this.requestId = window.requestAnimFrame(this.draw);
    if (this.notesInQueue.length === 0) {
      window.cancelAnimationFrame(this.requestId);
      this.lastNoteToDraw = '';
      this.requestId = undefined;
    }
  },
};

var SoundGen = {
  init() {
    this.context = new (window.AudioContext || window.webkitAudioContext)();
  },

  setup() {
    this.oscillator = this.context.createOscillator();
    this.gainNode = this.context.createGain();

    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.context.destination);
    this.oscillator.type = 'sine';
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
    this.oscillator.onended = () => Promise.resolve();
  },

  playInTimePromise(value, time) {
    return new Promise(resolve => {
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
      this.oscillator.onended = () => resolve(value);
    });
  },

  stopAtTime(time) {
    this.gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      this.context.currentTime + time + 1,
    );
    this.oscillator.stop(this.context.currentTime + time + 1);
  },
};

log.setLevel('debug');
Object.assign(App, SoundGen, UI);
App.init();
App.start();
App.listen();
