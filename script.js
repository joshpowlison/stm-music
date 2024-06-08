let musicPlayer;

async function start() {
	let MusicPlayer = (await import('./musicPlayer.js')).default;
	musicPlayer = new MusicPlayer();
	
	let moduleFunctions = musicPlayer.getModuleFunctions();
	module.LoadModule(moduleFunctions);
}

start();