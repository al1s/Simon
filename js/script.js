"use strict";window.requestAnimFrame=window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||function(e){return window.setTimeout(e,1e3/60)},window.cancelAnimFrame=window.cancelAnimationFrame||window.webkitCancelAnimationFrame||window.mozCancelAnimationFrame||window.oCancelAnimationFrame||window.msCancelAnimationFrame||window.cancelRequestAnimationFrame||window.webkitRequestCancelAnimationFrame||window.mozRequestCancelAnimationFrame||window.oRequestCancelAnimationFrame||window.msRequestCancelAnimationFrame||function(e){return clearTimeout(e)};var App={init:function(){this.originalSimonSounds={UL:164.814,UR:440,LL:277.18,LR:329.628},this.simonSwipeSounds={UL:523.251,UR:329.628,LL:261.63,LR:391.995},this.soundLib=this.simonSwipeSounds,this.stepsInGame=30,this.currentStep=1,this.tempo=160,this.notesInQueue=[],this.lastNote="",this.requestId=-1,this.sequence=this.generateSequence(this.stepsInGame),this.playSound=this.playSound.bind(this)},playSound:function(e){log.debug("Play sound on a mouse click"),log.trace(e),this.changeStyle(e.target);var t=this.soundLib[e.target.id.split("_")[1]];this.play(t)},playSequence:function(e,t){var n=this;log.debug("Playing sequence on step "+t),e.slice(0,t).forEach(function(e,t){n.notesInQueue.push({note:e,time:60*t/n.tempo+n.context.currentTime}),n.playInTime(n.soundLib[e],60*t/n.tempo)}),log.debug(JSON.stringify(this.notesInQueue)),this.requestId=window.requestAnimFrame(this.draw)},randomRange:function(e){return e[Math.floor(Math.random()*e.length)]},generateSequence:function(e){var i=this;log.debug("Generating sequence");var o=new Array(e).fill(void 0);return o.reduce(function(e,t,n){for(;e===(t=i.randomRange(Object.keys(i.soundLib))););return o[n]=t},""),o}},SoundGen={start:function(){this.context=new(window.AudioContext||window.webkitAudioContext)},setup:function(){this.oscillator=this.context.createOscillator(),this.gainNode=this.context.createGain(),this.oscillator.connect(this.gainNode),this.gainNode.connect(this.context.destination),this.oscillator.type="sine"},play:function(e){this.setup(),log.debug("Tone value: "+e),this.oscillator.frequency.setValueAtTime(e,this.context.currentTime),this.gainNode.gain.setValueAtTime(0,this.context.currentTime),this.gainNode.gain.linearRampToValueAtTime(1,this.context.currentTime+.01),this.oscillator.start(this.context.currentTime),this.stop()},playInTime:function(e,t){this.setup(),log.debug("Tone value: "+e),this.oscillator.frequency.setValueAtTime(e,this.context.currentTime+t),this.gainNode.gain.setValueAtTime(0,this.context.currentTime+t),this.gainNode.gain.linearRampToValueAtTime(1,this.context.currentTime+t+.01),this.oscillator.start(this.context.currentTime+t),this.stopAtTime(t)},stop:function(){this.gainNode.gain.exponentialRampToValueAtTime(.001,this.context.currentTime+1),this.oscillator.stop(this.context.currentTime+1)},stopAtTime:function(e){this.gainNode.gain.exponentialRampToValueAtTime(.001,this.context.currentTime+e+1),this.oscillator.stop(this.context.currentTime+e+1)}},UI={listen:function(){var t=this;log.debug("Listening on UI");var e=document.querySelectorAll(".buttonGame"),n=document.querySelector("#btnPower");log.trace("Buttons selected:"),log.trace(e),e.forEach(function(e){return e.addEventListener("click",t.playSound)}),n.addEventListener("click",this.togglePressedState),this.draw=this.draw.bind(this)},changeStyle:function(e){e.classList.toggle("--blink"),setTimeout(function(){return e.classList.toggle("--blink")},300)},getElementByName:function(e){return document.querySelector("#button_"+e)},togglePressedState:function(e){e.target.classList.toggle("--pressed")},draw:function(){var e,t=this.context.currentTime;for(log.debug("Inside this.draw() notesInQueue: "+JSON.stringify(this.notesInQueue));0<this.notesInQueue.length&&this.notesInQueue[0].time<t;)e=this.notesInQueue[0].note,this.notesInQueue.splice(0,1);log.debug("currentNote: "+e+", lastNote: "+this.lastNote),void 0!==e&&this.lastNote!==e&&(this.changeStyle(this.getElementByName(e)),this.lastNote=e),this.requestId=window.requestAnimFrame(this.draw),0===this.notesInQueue.length&&(window.cancelAnimationFrame(this.requestId),this.requestId=void 0)}};log.setLevel("debug"),Object.assign(App,SoundGen,UI),App.init(),App.start(),App.listen();
//# sourceMappingURL=script.js.map