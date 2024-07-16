import {Utility} from '../../shared/utility.js';
import Event from '../../shared/event.js';
import Record from './record.js';
import SongInfo from './songInfo.js';
import MusicDataController from './musicDataController.js';

// TODO: Resolve redundant code

///////////////////
//// CONSTANTS ////
///////////////////

const player = document.querySelector('audio');

///////////////////
//// VARIABLES ////
///////////////////

let folderName = '../../userData/Music/';

let trackQueue = [];

///////////////////
//// FUNCTIONS ////
///////////////////

const PROGRESS_BAR = document.getElementById('progress-bar');
let lastFrameTimestamp = 0;

export default class MusicPlayer {
	musicDataController;

	eventNewSong = new Event();
	eventPlay = new Event();
	eventPause = new Event();
	eventStop = new Event();
	eventTimeUpdate = new Event();

	eventMessage = new Event();
	eventError = new Event();
	
	animationFrameBound = this.onAnimationFrame.bind(this);
	
	async initialize() {
		player.addEventListener('ended', this.tryPlayNextTrackInQueue.bind(this));
		window.requestAnimationFrame(this.animationFrameBound);
		this.musicDataController = await MusicDataController.Create();
	}
	
	async loadSettings(event) {
		let fileStructure = module.globalSettings.fileStructure.userData.Music;
		await this.musicDataController.updateData(folderName, fileStructure);
	}
	
	async play(event) {
		if(!player.paused) {
			this.eventError.invoke('Music is currently playing.');
			return;
		}
		
		if(player.src === null) {
			this.eventError.invoke('No song is currently queued.');
			return;
		}
		
		await player.play();
		this.eventPlay.invoke();
	}

	async playSong(event) {
		let trackData = await this.tryGetTrack(event);
		if (trackData === null) {
			return;
		}
		
		trackQueue = [trackData];
		await this.tryPlayNextTrackInQueue();
	}

	async playAlbum(event) {
		let trackDataset = await this.tryGetAlbum(event);
		if (trackDataset === null) {
			return;
		}
		
		trackQueue = trackDataset;
		await this.tryPlayNextTrackInQueue();
	}

	async pause(event) {
		player.pause();
		this.eventPause.invoke();
	}

	async stop(event) {
		trackQueue.length = 0;
		player.currentTime = 0;
		player.pause();
		this.eventStop.invoke();
		PROGRESS_BAR.style.width = '0%'; // Reduce the progress bar
	}

	async shuffle(event) {
		let allTracks = await this.musicDataController.getAllTracks();
		trackQueue = Utility.getArrayShuffled(allTracks);
		await this.tryPlayNextTrackInQueue();
	}

	async skip(event) {
		await this.tryPlayNextTrackInQueue();
	}

	async queueSong(event) {
		let trackDataset = await this.tryGetTrack(event);
		if (trackDataset === null) {
			return;
		}
		
		trackQueue.push(event);
		
		if(player.paused) {
			await this.tryPlayNextTrackInQueue();
		}
	}

	async queueAlbum(event) {
		let trackDataset = await this.tryGetAlbum(event);
		if (trackDataset === null) {
			return;
		}
		
		trackQueue.push(...trackDataset);
		
		if(player.paused) {
			await this.tryPlayNextTrackInQueue();
		}
	}

	async shuffleAlbum(event) {
		let trackDataset = await this.tryGetAlbum(event);
		if (trackDataset === null) {
			return;
		}
		
		trackQueue = Utility.getArrayShuffled(trackDataset);
		
		await this.tryPlayNextTrackInQueue();
	}

	async playArtist(event) {
		let trackDataset = await this.tryGetArtist(event);
		if (trackDataset === null) {
			return;
		}

		trackQueue = trackDataset;
		await this.tryPlayNextTrackInQueue();
	}

	async shuffleArtist(event) {
		let trackDataset = await this.tryGetArtist(event);
		if (trackDataset === null) {
			return;
		}

		trackQueue = Utility.getArrayShuffled(trackDataset);

		await this.tryPlayNextTrackInQueue();
	}
	
	async logAllOptions(event) {
		let publicLog = '';
		
		let trackNames = await this.musicDataController.getTrackTitles();
		
		// Compile them all into one sorted log
		trackNames.sort();
		for(let i = 0, l = trackNames.length; i < l; i ++) {
			if(i > 0)
				publicLog += '|';

			publicLog += '"' + trackNames[i] + '"';
		}

		console.log(publicLog);
	}
	
	async tryPlayNextTrackInQueue() {
		// Stop the current track
		await player.pause();
		this.eventPause.invoke();
		player.currentTime	= 0;
		player.src = null;
		
		// If we have no other songs, exit
		if(trackQueue.length === 0) {
			this.eventMessage.invoke('The end of the music queue has been reached.');
			this.eventStop.invoke();
			return;
		}
		
		// Try playing the next item in the queue
		let trackData = trackQueue.shift();
		this.eventMessage.invoke(`Now playing "${trackData.title}".`);

		let albumData = await this.musicDataController.getAlbumDataFromTrackData(trackData);
		
		player.src = folderName + albumData.albumPath + trackData.filename;
		this.onSongChange(albumData, trackData);
		
		await player.play();
		this.eventPlay.invoke();
	}

	async tryGetTrack(name) {
		let item = await this.musicDataController.getFirstByTrackTitle(name);

		if (item === null) {
			this.eventError.invoke(`No Music track named "${name}" found.`);
		}

		return item;
	}

	async tryGetArtist(artistName) {
		let albumItems = await this.musicDataController.getAllByArtistName(artistName);

		if (albumItems === null) {
			this.eventError.invoke(`No artist named "${artistName}" found.`);
		}

		return albumItems;
	}

	async tryGetAlbum(albumName) {
		let albumItems = await this.musicDataController.getAllByAlbumName(albumName);

		if (albumItems === null) {
			this.eventError.invoke('No Music album named "' + albumName + '" found.');
		}

		return albumItems;
	}

	async onSongChange(albumData, trackData){

		// Get the first image from the folder
		this.eventNewSong.invoke(trackData);
		
		// Create a new record
		let albumArtPath = folderName + albumData.albumArtPath;
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
		
		window.requestAnimationFrame(this.animationFrameBound);
	}
	
	static async Create() {
		let instance = new MusicPlayer();
		await instance.initialize();
		return instance;
	}
}