// SETTINGS
const moduleFunctions = {
	"loadSettings": loadSettings,
	"play": musicPlay,
	"pause": musicPause,
	"stop": musicStop,
	"shuffle": musicShuffle,
	"logAllOptions": logAllOptions
};

module.LoadModule(moduleFunctions);

let onTrackEnd = new Event();

// CONSTANTS
const player = document.querySelector('audio');

// VARIABLES
var items = [];

var folderName = 'assets';

// FUNCTIONS
async function loadSettings(name, event)
{
	items = Utility.getAllPaths(module.settings.global.fileStructure.modules.Music[folderName]);
}

async function musicPlay(name, event)
{
	// If we've moved to a new track, go there
	if (event != null)
	{
		let item = null;
		
		// If it's an exact match to an item in the list
		if (items.indexOf(event) > -1)
			item = event;
		
		// If no exact match, look for a general match
		if (item == null)
			item = Utility.getMatchingFileInList(items, event);

		// If no match STILL, log an error
		if (item == null)
		{
			module.F('Console.LogError', 'No Music track named "' + JSON.stringify(event) + '" found.');
			return;
		}

		player.currentTime	= 0;
		player.src = folderName + '/' + item;
	}

	player.play();

	// Mute game
	module.F('OBS.MuteAudioSource', 'Zoom HD60S');
}

async function musicPause(name, event)
{
	player.pause();

	// Unmute game
	module.F('OBS.UnmuteAudioSource', 'Zoom HD60S');
}

async function musicStop(name, event)
{
	player.currentTime = 0;
	player.pause();

	// Unmute game
	module.F('OBS.UnmuteAudioSource', 'Zoom HD60S');
}

let isShuffling = false;

async function musicShuffle(name, event) {
	let shouldShuffle = (event === true);
	
	console.log("try changing shuffling from:", isShuffling, "to", shouldShuffle);
	// If the setting is the same as it was, exit here
	if(shouldShuffle === isShuffling)
		return;
	
	if(shouldShuffle) {
		player.addEventListener('ended', playRandomTrack);
		isShuffling = true;
	}
	else {
		player.removeEventListener('ended', playRandomTrack);
		isShuffling = false;
	}
}

async function playRandomTrack() {
	let track = Utility.getRandomItem(items);
	await musicPlay(null, track);
}

async function logAllOptions(name, event)
{
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

// LISTENERS
player.addEventListener('ended', () => musicStop(null, null));