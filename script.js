// SETTINGS
const moduleFunctions = {
	"loadSettings": loadSettings,
	"play": musicPlay,
	"pause": musicPause,
	"stop": musicStop,
	"logAllOptions": logAllOptions,
};

Module.LoadModule(moduleFunctions);

// CONSTANTS
const player = document.querySelector('audio');

// VARIABLES
var items = [];

var folderName = 'assets';

// FUNCTIONS
async function loadSettings(name, event)
{
	items = Utility.getAllPaths(Module.settings.global.fileStructure.modules.Music[folderName]);
}

async function musicPlay(name, event)
{
	// If we've moved to a new track, go there
	if (event != null)
	{
		var item = Utility.getMatchingFileInList(items, event);

		if(item == null)
		{
			Module.F('Console.LogError', 'No Music track named "' + JSON.stringify(event) + '" found.');
			return;
		}

		player.currentTime	= 0;
		player.src = folderName + '/' + item;
	}

	player.play();

	// Mute game
	Module.F('OBS.MuteAudioSource', 'Zoom HD60S');
}

async function musicPause(name, event)
{
	player.pause();

	// Unmute game
	Module.F('OBS.UnmuteAudioSource', 'Zoom HD60S');
}

async function musicStop(name, event)
{
	player.currentTime = 0;
	player.pause();

	// Unmute game
	Module.F('OBS.UnmuteAudioSource', 'Zoom HD60S');
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