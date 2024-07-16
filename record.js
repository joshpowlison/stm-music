import {Utility} from '../../shared/utility.js';
import Event from '../../shared/event.js';

// TODO: Move NEEDLE out from here?
const NEEDLE = document.getElementById('needle');
let recordAngle = 0;
let RPM = 45; // 45 RPM, a vinyl single
let recordRotationPerMs = -(RPM / 60 / 1000) * 360; // Amount of total rotation to rotate per ms

let needleRestingAngle = 0;
let needleMinAngle = 8;
let needleMaxAngle = 27;

export default class Record {
	el;
	isPlaying = false;
	lastFrameTimestamp = 0;
	
	isActive = true;
	
	eventRemoved = new Event();
	
	constructor(imagePath, parentEl) {
		// Build the record element out
		let containerEl = document.createElement('div');
		containerEl.className = 'record';
		
		let recordCoverEl = document.createElement('img');
		recordCoverEl.className = 'record-cover';
		recordCoverEl.src = 'record-cover.svg';
		containerEl.appendChild(recordCoverEl);
		
		// Create the image for the record, but only add
		// an actual graphic if we have one
		let recordImageEl = document.createElement('div');
		if(imagePath !== null) {
			recordImageEl.style.backgroundImage = `url("${imagePath}")`;
		}
		recordImageEl.className = 'record-image';
		containerEl.appendChild(recordImageEl);
		
		window.requestAnimationFrame(this.onAnimationFrame.bind(this));
		
		this.el = containerEl;
		parentEl.appendChild(containerEl);
	}
	
	async setPlaying() {
		this.isPlaying = true;
	}
	
	async setPaused() {
		this.isPlaying = false;
	}
	
	async remove() {
		this.eventRemoved.invoke(this);
		this.isPlaying = false;
		this.isActive = false;
		this.el.classList.add('out');
		
		await Utility.wait(5000);
		this.el.remove();
	}
	
	async updateTime(data) {
		let percentProgress = data.percentProgress;
		
		// Update needle
		let needleAngle = needleMinAngle + ((needleMaxAngle - needleMinAngle) * percentProgress);
		NEEDLE.style.transform = 'rotate(' + -needleAngle + 'deg)';
	}
	
	onAnimationFrame(frameTimestamp) {
		let deltaTime = (frameTimestamp - this.lastFrameTimestamp);
		this.lastFrameTimestamp = frameTimestamp;
		if(this.isPlaying) {
			recordAngle += (deltaTime * recordRotationPerMs);
			this.el.style.transform = 'rotate(' + recordAngle + 'deg)';
		} else {
			console.log('Oh no');
			NEEDLE.style.transform = 'rotate(' + -needleRestingAngle + 'deg)';
		}
		
		if(this.isActive) {
			window.requestAnimationFrame(this.onAnimationFrame.bind(this));
		}
	}
}