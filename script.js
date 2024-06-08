const moduleFunctions = {
	"loadSettings": loadSettings,
	"play": play,
	"playSong": playSong,
	"playAlbum": playAlbum,
	"pause": pause,
	"stop": stop,
	"shuffle": shuffle,
	"skip": skip,
	"queueSong": queueSong,
	"queueAlbum": queueAlbum,
	"shuffleAlbum": shuffleAlbum,
	"logAllOptions": logAllOptions,
};


module.LoadModule(moduleFunctions);

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

let eventStartPlaying = new Event();
let eventPausePlayer = new Event();

///////////////////
//// FUNCTIONS ////
///////////////////

async function loadSettings(name, event) {
	items = Utility.getAllPaths(module.globalSettings.fileStructure.userData.Music, SUPPORTED_EXTENSIONS);
	
	// Temporary:
	if(player.paused)
		shuffleAlbum(null, "Songs to Code By");
}

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

async function play(name, event) {
	if(!player.paused) {
		module.F('Console.LogError', 'Music is currently playing.');
		return;
	}
	
	if(player.src === null) {
		module.F('Console.LogError', 'No song is currently queued.');
		return;
	}
	
	await player.play();
}

async function playSong(name, event) {
	let item = await tryGetItem(event);
	if (item === null) {
		return;
	}
	
	queue = [event];
	await tryPlayNextInQueue();
}

async function playAlbum(name, event) {
	let albumItems = await tryGetAlbum(event);
	if (albumItems === null) {
		return;
	}
	
	queue = albumItems;
	await tryPlayNextInQueue();
}

async function pause(name, event) {
	player.pause();
}

async function stop(name, event) {
	queue = [];
	player.currentTime = 0;
	player.pause();
}

async function shuffle(name, event) {
	queue = Utility.getArrayShuffled(items);
	await tryPlayNextInQueue();
}

async function skip(name, event) {
	await tryPlayNextInQueue();
}

async function queueSong(name, event) {
	let item = await tryGetItem(event);
	if (item === null) {
		return;
	}
	
	queue.push(event);
	
	if(player.paused) {
		await tryPlayNextInQueue();
	}
}

async function queueAlbum(name, event) {
	let albumItems = await tryGetAlbum(event);
	if (albumItems === null) {
		return;
	}
	
	queue.push(...albumItems);
	
	if(player.paused) {
		await tryPlayNextInQueue();
	}
}

async function shuffleAlbum(name, event) {
	let albumItems = await tryGetAlbum(event);
	if (albumItems === null) {
		return;
	}
	
	queue = Utility.getArrayShuffled(albumItems);
	
	await tryPlayNextInQueue();
}

async function tryPlayNextInQueue() {
	// Stop the current track
	await player.pause();
	player.currentTime	= 0;
	player.src = null;
	
	// If we have no other songs, exit
	if(queue.length === 0) {
		module.F('Console.Log', 'The end of the music queue has been reached.');
		eventPausePlayer.invoke();
		return;
	}
	
	// Try playing the next item in the queue
	let itemName = queue.shift();
	module.F('Console.Log', 'Now playing \"' + itemName + '\".');
	let item = await tryGetItem(itemName);
	
	player.src = folderName + item;
	await player.play();
	
	onSongChange(item);
}

async function logAllOptions(name, event) {
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

const RECORD = document.getElementById('record');
const RECORD_IMAGE = document.querySelector('.record-image');
const RECORD_GRAPHIC = document.querySelector('.record-cover');
const NEEDLE = document.getElementById('needle');
const SONG_TITLE_EL = document.getElementById('title');
const SONG_CREDITS_EL = document.getElementById('credits');
const PROGRESS_BAR = document.getElementById('progress-bar');
const PROGRESS_TIME = document.getElementById('progress-time');
let recordAngle = 0;
let RPM = 45; // 45 RPM, a vinyl single
let recordRotationPerMs = -(RPM / 60 / 1000) * 360; // Amount of total rotation to rotate per ms
let lastFrameTimestamp = 0;

let needleRestingAngle = 0;
let needleMinAngle = 8;
let needleMaxAngle = 27;

function onAnimationFrame(frameTimestamp)
{
	let deltaTime = (frameTimestamp - lastFrameTimestamp);
	lastFrameTimestamp = frameTimestamp;
	if(!player.paused) {
		recordAngle += (deltaTime * recordRotationPerMs);
		RECORD.style.transform = 'rotate(' + recordAngle + 'deg)';
		
		let percentProgress = (player.currentTime / player.duration);
		PROGRESS_BAR.style.width = (percentProgress * 100) + '%';
		
		// Update needle
		let needleAngle = needleMinAngle + ((needleMaxAngle - needleMinAngle) * percentProgress);
		NEEDLE.style.transform = 'rotate(' + -needleAngle + 'deg)';
	} else {
		NEEDLE.style.transform = 'rotate(' + -needleRestingAngle + 'deg)';
	}
	
	window.requestAnimationFrame(onAnimationFrame);
}

async function onSongChange(songData){
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
	
	RECORD_IMAGE.src = albumArtPath;
	
	SONG_CREDITS_EL.innerHTML = trackData.album + ' - ' + trackData.artist;
	SONG_TITLE_EL.innerHTML = trackData.title;
}

///////////////////
//// LISTENERS ////
///////////////////

player.addEventListener('ended', tryPlayNextInQueue);
window.requestAnimationFrame(onAnimationFrame);