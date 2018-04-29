"use strict";var _typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e};window.requestAnimFrame=window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||function(e){return window.setTimeout(e,1e3/60)},window.cancelAnimFrame=window.cancelAnimationFrame||window.webkitCancelAnimationFrame||window.mozCancelAnimationFrame||window.oCancelAnimationFrame||window.msCancelAnimationFrame||window.cancelRequestAnimationFrame||window.webkitRequestCancelAnimationFrame||window.mozRequestCancelAnimationFrame||window.oRequestCancelAnimationFrame||window.msRequestCancelAnimationFrame||function(e){return clearTimeout(e)};var App={start:function(){this.originalSimonSounds={UL:164.814,UR:440,LL:277.18,LR:329.628},this.simonSwipeSounds={UL:523.251,UR:329.628,LL:261.63,LR:391.995},this.soundLib=this.simonSwipeSounds,this.fanfareSounds={G1:392,C2:523.251,E2:659.255,G2:783.99},this.fanfareSeq=[["G1",.25],["C2",.25],["E2",.25],["G2",.5],["E2",.25],[["C2","E2","G2"],.5]],this.stepsInGame=3,this.currentStep=1,this.currentNoteInStep=1,this.tempo=120,this.strictMode=!1,this.reactionDelay=1e3,this.messageError="!!",this.messageStop="--",this.messageWin="00",this.gameButtonNames=["UR","LR","LL","UL"],this.notesInQueue=[],this.lastNoteToDraw="",this.requestId=-1,this.playSequence=this.playSequence.bind(this),this.repeatSequence=this.repeatSequence.bind(this),this.playPhrase=this.playPhrase.bind(this),this.handleStart=this.handleStart.bind(this),this.playSound=this.playSound.bind(this),this.setStrictMode=this.setStrictMode.bind(this),this.handleGameState=this.handleGameState.bind(this),this.draw=this.draw.bind(this)},playSequence:function(e,t){var n=this;log.debug("Playing sequence on step "+t),e.slice(0,t).forEach(function(e,t){n.notesInQueue.push({note:e,time:60*t/n.tempo+n.context.currentTime}),n.playInTime(n.soundLib[e],60*t/n.tempo)}),log.debug(JSON.stringify(this.notesInQueue)),this.requestId=window.requestAnimFrame(this.draw)},playPhrase:function(e){var n=this;log.debug("Playing musical phrase");var i=0;e.forEach(function(e,t){console.log("note in phrase: "+e),"object"!==_typeof(e[0])?(n.playInTime(n.fanfareSounds[e[0]],i),n.notesInQueue.push({note:n.gameButtonNames[3<t?t%4:t],time:i+n.context.currentTime})):e[0].forEach(function(e){n.playInTime(n.fanfareSounds[e],i,i),n.notesInQueue.push({note:"ALL",time:i+n.context.currentTime})}),i+=e[1]}),this.requestId=window.requestAnimFrame(this.draw)},randomRange:function(e){return e[Math.floor(Math.random()*e.length)]},generateSequence:function(e){var i=this;log.debug("Generating sequence");var s=new Array(e).fill(void 0);return s.reduce(function(e,t,n){for(;e===(t=i.randomRange(Object.keys(i.soundLib))););return s[n]=t},""),s},handleStart:function(e){var t=this;this.currentStep=1,this.currentNoteInStep=1,this.sequence=this.generateSequence(this.stepsInGame),this.syncMessage(this.messageStop),setTimeout(function(){t.syncMessage(t.currentStep),t.playSequence(t.sequence,t.currentStep)},this.reactionDelay)},handleWin:function(){this.playPhrase(this.fanfareSeq)},repeatSequence:function(){this.playSequence(this.sequence,this.currentStep)}},UI={listen:function(){var t=this;log.debug("Listening on UI");var e=document.querySelectorAll(".buttonGame"),n=document.querySelector("#btnStart"),i=document.querySelector("#btnRepeat"),s=document.querySelector("#btnStrict");log.trace("Buttons selected:"),log.trace(e),n.addEventListener("click",this.handleStart),e.forEach(function(e){return e.addEventListener("click",t.handleGameState)}),i.addEventListener("click",this.repeatSequence),s.addEventListener("click",this.setStrictMode)},changeStyle:function(e){e.classList.toggle("--blink"),setTimeout(function(){return e.classList.toggle("--blink")},200)},getElementByName:function(e){return document.querySelector("#button_"+e)},getNote:function(e){return e.target.id.split("_")[1]},handleGameState:function(e){var t=this;this.playSound(e);var n=this.getNote(e);this.sequence[this.currentNoteInStep-1]===n?(log.debug("Bingo!"),this.currentNoteInStep===this.currentStep?this.currentStep===this.stepsInGame?(this.syncMessage(this.messageWin),setTimeout(function(){return t.handleWin()},this.reactionDelay)):(this.currentStep+=1,this.currentNoteInStep=1,this.syncMessage(this.currentStep),setTimeout(function(){return t.playSequence(t.sequence,t.currentStep)},this.reactionDelay)):this.currentNoteInStep+=1):(log.debug("Missed!"),this.syncMessage(this.messageError),this.strictMode?setTimeout(function(){return t.handleStart()},this.reactionDelay):setTimeout(function(){return t.syncMessage(t.currentStep)},this.reactionDelay))},playSound:function(e){log.debug("Play sound on a mouse click"),log.trace(e);var t=[this.getNote(e)];this.playSequence([t],1)},togglePressedState:function(e){e.target.classList.toggle("--pressed")},setStrictMode:function(e){this.strictMode=!this.strictMode,this.togglePressedState(e)},syncMessage:function(e){document.querySelector("#messageElm").innerHTML=e},draw:function(){var t=this,e=this.context.currentTime,n=void 0;for(log.trace("Inside this.draw() notesInQueue: "+JSON.stringify(this.notesInQueue));0<this.notesInQueue.length&&this.notesInQueue[0].time<e;)n=this.notesInQueue[0].note,this.notesInQueue.splice(0,1);log.debug("Styling button; currentNote: "+n+", lastNote: "+this.lastNoteToDraw),void 0!==n&&this.lastNoteToDraw!==n&&("ALL"!==n?(this.changeStyle(this.getElementByName(n)),this.lastNoteToDraw=n):this.gameButtonNames.forEach(function(e){return t.changeStyle(t.getElementByName(e))})),this.requestId=window.requestAnimFrame(this.draw),0===this.notesInQueue.length&&(window.cancelAnimationFrame(this.requestId),this.lastNoteToDraw="",this.requestId=void 0)}},SoundGen={init:function(){this.context=new(window.AudioContext||window.webkitAudioContext)},setup:function(){this.oscillator=this.context.createOscillator(),this.gainNode=this.context.createGain(),this.oscillator.connect(this.gainNode),this.gainNode.connect(this.context.destination),this.oscillator.type="sine"},playInTime:function(e,t){this.setup(),log.debug("Tone value: "+e),this.oscillator.frequency.setValueAtTime(e,this.context.currentTime+t),this.gainNode.gain.setValueAtTime(0,this.context.currentTime+t),this.gainNode.gain.linearRampToValueAtTime(1,this.context.currentTime+t+.01),this.oscillator.start(this.context.currentTime+t),this.stopAtTime(t)},stopAtTime:function(e){this.gainNode.gain.exponentialRampToValueAtTime(.001,this.context.currentTime+e+1),this.oscillator.stop(this.context.currentTime+e+1)}};log.setLevel("debug"),Object.assign(App,SoundGen,UI),App.init(),App.start(),App.listen();
//# sourceMappingURL=script.js.map
