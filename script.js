const moduleFunctions = {
	"loadSettings": loadSettings,
	"play": play,
	"playSong": playSong,
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

let items = [];
let folderName = '../../userData/Music/';

let queue = [];

///////////////////
//// FUNCTIONS ////
///////////////////

async function loadSettings(name, event) {
	items = Utility.getAllPaths(module.globalSettings.fileStructure.userData.Music, SUPPORTED_EXTENSIONS);
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

	await player.play();
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
		return;
	}
	
	// Try playing the next item in the queue
	let itemName = queue.shift();
	module.F('Console.Log', 'Now playing \"' + itemName + '\".');
	let item = await tryGetItem(itemName);
	
	player.src = folderName + item;
	await player.play();
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

///////////////////
//// LISTENERS ////
///////////////////

player.addEventListener('ended', tryPlayNextInQueue);