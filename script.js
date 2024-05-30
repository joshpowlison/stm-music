const moduleFunctions = {
	"loadSettings": loadSettings,
	"play": musicPlay,
	"playRandom": musicPlayRandom,
	"pause": musicPause,
	"stop": musicStop,
	"shuffle": musicShuffle,
	"logAllOptions": logAllOptions
};

module.LoadModule(moduleFunctions);

///////////////////
//// CONSTANTS ////
///////////////////

const player = document.querySelector('audio');

///////////////////
//// VARIABLES ////
///////////////////

let isShuffling = false;
let items = [];
let folderName = '../../userData/Music/';

///////////////////
//// FUNCTIONS ////
///////////////////
async function loadSettings(name, event) {
	items = Utility.getAllPaths(module.globalSettings.fileStructure.userData.Music, [ 'mp3', 'wav', 'flac', 'aiff' ]);
}

async function musicPlay(name, event) {
	// If we've moved to a new track, go there
	if (event !== null)
	{
		let item = Utility.getMatchingFileInList(items, event);
		
		// If no match, log an error
		if (item === null)
		{
			module.F('Console.LogError', 'No Music track named "' + JSON.stringify(event) + '" found.');
			return;
		}

		player.currentTime	= 0;
		player.src = folderName + item;
	}

	player.play();

	// Mute game
	// TODO: Pull this out. This is a separate piece of logic,
	//  Music shouldn't know about it. AND it's my personal setup,
	//  unrelated to many people, could cause random surprises.
	module.F('OBS.MuteAudioSource', 'Zoom HD60S');
}

async function musicPlayRandom() {
	let item = Utility.getRandomItem(items);

	player.currentTime	= 0;
	player.src = folderName + item;
	player.play();
}

async function musicPause(name, event) {
	player.pause();

	// Unmute game
	module.F('OBS.UnmuteAudioSource', 'Zoom HD60S');
}

async function musicStop(name, event) {
	player.currentTime = 0;
	player.pause();

	// Unmute game
	module.F('OBS.UnmuteAudioSource', 'Zoom HD60S');
}

async function musicShuffle(name, event) {
	let shouldShuffle = (event === true);
	
	console.log("try changing shuffling from:", isShuffling, "to", shouldShuffle);
	// If the setting is the same as it was, exit here
	if(shouldShuffle === isShuffling)
		return;
	
	if(shouldShuffle) {
		player.addEventListener('ended', playRandomTrack);
		isShuffling = true;
	} else {
		player.removeEventListener('ended', playRandomTrack);
		isShuffling = false;
	}
}

async function playRandomTrack() {
	let track = Utility.getRandomItem(items);
	await musicPlay(null, track);
}

async function logAllOptions(name, event) {
	var regexGet = /\/(.+)\.[^.]+$/;
	var trackNames = [];
	var publicLog = '';

	// Get clean names
	for(var i = 0, l = items.length; i < l; i ++)
	{
		var displayName = regexGet.exec(items[i])[1];
		trackNames.push(displayName);
	}

	// Compile them all into one sorted log
	trackNames.sort();
	for(var i = 0, l = trackNames.length; i < l; i ++)
	{
		if(i > 0)
			publicLog += '|';

		publicLog += '"' + trackNames[i] + '"';
	}

	console.log(publicLog);
}

///////////////////
//// LISTENERS ////
///////////////////

player.addEventListener('ended', () => musicStop(null, null));