let musicPlayer;

async function start() {
	// Wait for the module to load
	while(!module) {
		await Utility.wait(36);
	}
	
	console.log('We got module!');
	let MusicPlayer = (await import('./musicPlayer.js')).default;
	musicPlayer = await MusicPlayer.Create();

	let moduleActions = {
		"loadSettings": musicPlayer.loadSettings.bind(musicPlayer),
		"play": musicPlayer.play.bind(musicPlayer),
		"playSong": musicPlayer.playSong.bind(musicPlayer),
		"playAlbum": musicPlayer.playAlbum.bind(musicPlayer),
		"pause": musicPlayer.pause.bind(musicPlayer),
		"stop": musicPlayer.stop.bind(musicPlayer),
		"shuffle": musicPlayer.shuffle.bind(musicPlayer),
		"skip": musicPlayer.skip.bind(musicPlayer),
		"queueSong": musicPlayer.queueSong.bind(musicPlayer),
		"queueAlbum": musicPlayer.queueAlbum.bind(musicPlayer),
		"shuffleAlbum": musicPlayer.shuffleAlbum.bind(musicPlayer),
		"playArtist": musicPlayer.playArtist.bind(musicPlayer),
		"shuffleArtist": musicPlayer.shuffleArtist.bind(musicPlayer),
		"logAllOptions": musicPlayer.logAllOptions.bind(musicPlayer),
	};
	
	console.log(moduleActions);
	await module.addActions(moduleActions);
	
	musicPlayer.eventMessage.addListener(null, onMessage);
	musicPlayer.eventError.addListener(null, onError);
}

async function onMessage(errorMessage) {
	module.F('Console.Log', errorMessage);
}

async function onError(errorMessage) {
	module.F('Console.LogError', errorMessage);
}

start();