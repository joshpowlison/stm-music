import {Utility} from '../../shared/utility.js';
import Event from '../../shared/event.js';
import Record from './record.js';
import SongInfo from './songInfo.js';

let self; // This only works if we're good with a singleton...

export default class MusicPlayer {
	eventNewSong = new Event();
	eventPlay = new Event();
	eventPause = new Event();
	eventStop = new Event();
	eventTimeUpdate = new Event();
	
	currentRecord = null;
	currentSongInfo = null;
	
	constructor() {
		self = this;
		
		player.addEventListener('ended', this.tryPlayNextInQueue.bind(this));
		window.requestAnimationFrame(this.onAnimationFrame.bind(this));
	}
	
	getModuleFunctions() {
		return {
			"loadSettings": this.loadSettings.bind(this),
			"play": this.play.bind(this),
			"playSong": this.playSong.bind(this),
			"playAlbum": this.playAlbum.bind(this),
			"pause": this.pause.bind(this),
			"stop": this.stop.bind(this),
			"shuffle": this.shuffle.bind(this),
			"skip": this.skip.bind(this),
			"queueSong": this.queueSong.bind(this),
			"queueAlbum": this.queueAlbum.bind(this),
			"shuffleAlbum": this.shuffleAlbum.bind(this),
			"logAllOptions": this.logAllOptions.bind(this),
		}
	}
	
	async loadSettings(name, event) {
		console.log('IS SELF SET?', this);
		items = Utility.getAllPaths(module.globalSettings.fileStructure.userData.Music, SUPPORTED_EXTENSIONS);
		
		// Temporary:
		if(player.paused)
			this.shuffleAlbum(null, "Songs to Code By");
	}
	
	async play(name, event) {
		if(!player.paused) {
			module.F('Console.LogError', 'Music is currently playing.');
			return;
		}
		
		if(player.src === null) {
			module.F('Console.LogError', 'No song is currently queued.');
			return;
		}
		
		await player.play();
		this.eventPlay.invoke();
	}

	async playSong(name, event) {
		let item = await tryGetItem(event);
		if (item === null) {
			return;
		}
		
		queue = [event];
		await this.tryPlayNextInQueue();
	}

	async playAlbum(name, event) {
		let albumItems = await tryGetAlbum(event);
		if (albumItems === null) {
			return;
		}
		
		queue = albumItems;
		await this.tryPlayNextInQueue();
	}

	async pause(name, event) {
		player.pause();
		this.eventPause.invoke();
	}

	async stop(name, event) {
		queue = [];
		player.currentTime = 0;
		player.pause();
		this.eventStop.invoke();
		PROGRESS_BAR.style.width = '0%'; // Reduce the progress bar
	}

	async shuffle(name, event) {
		queue = Utility.getArrayShuffled(items);
		await this.tryPlayNextInQueue();
	}

	async skip(name, event) {
		await this.tryPlayNextInQueue();
	}

	async queueSong(name, event) {
		let item = await tryGetItem(event);
		if (item === null) {
			return;
		}
		
		queue.push(event);
		
		if(player.paused) {
			await this.tryPlayNextInQueue();
		}
	}

	async queueAlbum(name, event) {
		let albumItems = await tryGetAlbum(event);
		if (albumItems === null) {
			return;
		}
		
		queue.push(...albumItems);
		
		if(player.paused) {
			await this.tryPlayNextInQueue();
		}
	}

	async shuffleAlbum(name, event) {
		let albumItems = await tryGetAlbum(event);
		if (albumItems === null) {
			return;
		}
		
		queue = Utility.getArrayShuffled(albumItems);
		
		await this.tryPlayNextInQueue();
	}
	
	async logAllOptions(name, event) {
		let regexGet = /\/(.+)\.[^.]+$/;
		let trackNames = [];
		let publicLog = '';

		// Get clean names
		for(let i = 0, l = items.length; i < l; i ++) {
			let displayName = regexGet.exec(items[i])[1];
			trackNames.push(displayName);
		}

		// Compile them all into one sorted log
		trackNames.sort();
		for(let i = 0, l = trackNames.length; i < l; i ++) {
			if(i > 0)
				publicLog += '|';

			publicLog += '"' + trackNames[i] + '"';
		}

		console.log(publicLog);
	}
	
	async tryPlayNextInQueue() {
		// Stop the current track
		await player.pause();
		this.eventPause.invoke();
		player.currentTime	= 0;
		player.src = null;
		
		// If we have no other songs, exit
		if(queue.length === 0) {
			module.F('Console.Log', 'The end of the music queue has been reached.');
			this.eventPause.invoke();
			return;
		}
		
		// Try playing the next item in the queue
		let itemName = queue.shift();
		module.F('Console.Log', 'Now playing \"' + itemName + '\".');
		let item = await tryGetItem(itemName);
		
		player.src = folderName + item;
		this.onSongChange(item);
		
		await player.play();
		this.eventPlay.invoke();
	}
	
	async onSongChange(songData){
		if (CSV === null) {
			CSV = (await import('../../shared/csvParser.js')).default;
		}
		
		let data = /^([^/\\]+)[\\/]([^/\\]+)$/.exec(songData);
		let albumPath = folderName + data[1];
		let songFile = data[2];
		console.log(albumPath);
		
		let albumArtPath = albumPath + '/cover.jpg';
		let albumDataPath = albumPath + '/data.csv';
		
		if(!(albumPath in albumData)) {
			let csvText = await fetch(albumDataPath).then(response => response.text());
			console.log(csvText);
			let objectified = await CSV.objectify(csvText, "filename");
			console.log(objectified);
			
			albumData[albumPath] = {
				data: objectified
			};
		}
		
		let trackData = albumData[albumPath].data[songFile];
		console.log(albumPath, songFile);
		
		this.eventNewSong.invoke(trackData);
		
		// Create a new record
		let record = new Record(albumArtPath, document.body);
		await this.eventTimeUpdate.addListener(record, record.updateTime);
		await this.eventPlay.addListener(record, record.setPlaying);
		await this.eventPause.addListener(record, record.setPaused);
		await this.eventStop.addListener(record, record.remove);
		await this.eventNewSong.addListener(record, record.remove);
		record.eventRemoved.addListener(this, this.onRemoveRecord);
		
		// Create new song info
		let songInfo = new SongInfo(trackData, document.body);
		await this.eventStop.addListener(songInfo, songInfo.remove);
		await this.eventNewSong.addListener(songInfo, songInfo.remove);
		songInfo.eventRemoved.addListener(this, this.onRemoveSongInfo);
	}
	
	async onRemoveRecord(record) {
		await this.eventTimeUpdate.removeCallerListeners(record);
		await this.eventPlay.removeCallerListeners(record);
		await this.eventPause.removeCallerListeners(record);
		await this.eventStop.removeCallerListeners(record);
	}
	
	async onRemoveSongInfo(songInfo) {
		await this.eventStop.removeCallerListeners(songInfo);
	}
	
	onAnimationFrame(frameTimestamp){
		let deltaTime = (frameTimestamp - lastFrameTimestamp);
		lastFrameTimestamp = frameTimestamp;
		if(!player.paused) {
			let percentProgress = (player.currentTime / player.duration);
			PROGRESS_BAR.style.width = (percentProgress * 100) + '%';
			
			let data = {
				currentTime: player.currentTime,
				duration: player.duration,
				percentProgress: percentProgress
			};
			this.eventTimeUpdate.invoke(data).catch(e => console.log(e));
		}
		
		window.requestAnimationFrame(this.onAnimationFrame.bind(this));
	}
}

///////////////////
//// CONSTANTS ////
///////////////////

const player = document.querySelector('audio');
const SUPPORTED_EXTENSIONS = [ 'mp3', 'wav', 'flac', 'aiff' ];

///////////////////
//// VARIABLES ////
///////////////////

let albumData = {};
let CSV = null;

let items = [];
let folderName = '../../userData/Music/';

let queue = [];

///////////////////
//// FUNCTIONS ////
///////////////////



async function tryGetItem(name) {
	let item = null;
	
	if (name !== null) {
		item = Utility.getMatchingFileInList(items, name);
	}
	
	if (item === null) {
		module.F('Console.LogError', 'No Music track named "' + JSON.stringify(name) + '" found.');
	}
	
	return item;
}

async function tryGetAlbum(albumName) {
	let albumItems = null;
	
	if(albumName in module.globalSettings.fileStructure.userData.Music){
		albumItems = Utility.getAllPaths(module.globalSettings.fileStructure.userData.Music[albumName], SUPPORTED_EXTENSIONS);
	}
	
	if (albumItems === null) {
		module.F('Console.LogError', 'No Music album named "' + JSON.stringify(albumName) + '" found.');
	}
	
	return albumItems;
}

const SONG_TITLE_EL = document.getElementById('title');
const SONG_CREDITS_EL = document.getElementById('credits');
const PROGRESS_BAR = document.getElementById('progress-bar');
const PROGRESS_TIME = document.getElementById('progress-time');
let lastFrameTimestamp = 0;