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

const SONG_TITLE_EL = document.getElementById('title');
const SONG_CREDITS_EL = document.getElementById('credits');

export default class SongInfo {
	el;
	eventRemoved = new Event();
	
	constructor(trackData, parentEl) {
		// Build the record element out
		let containerEl = document.createElement('div');
		containerEl.className = 'text';
		
		let creditsEl = document.createElement('p');
		creditsEl.className = 'credits';
		creditsEl.innerHTML = trackData.album + ' - ' + trackData.artist;
		containerEl.appendChild(creditsEl);
		
		let titleEl = document.createElement('p');
		titleEl.className = 'title';
		titleEl.innerHTML = trackData.title;
		containerEl.appendChild(titleEl);
		
		this.el = containerEl;
		parentEl.appendChild(containerEl);
	}
	
	async remove() {
		this.eventRemoved.invoke(this);
		
		this.el.classList.add('out');
		await Utility.wait(1000);
		this.el.remove();
	}
}