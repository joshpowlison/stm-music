import UserPanel from '/shared/userPanel.js';
import CollapsibleGroup from '/shared/collapsibleGroup.js';
import Typeforward from "../../shared/typeforward.js";
import MusicDataController from "./musicDataController.js";
import {Utility} from "../../shared/utility.js";

export default class ModuleUserPanel extends UserPanel {
	trackTypeforward;
	albumTypeforward;
	artistTypeforward;
	
	musicDataController;
	
	async generate(panel) {
		let pathToFileStructure = '../userData/Music/';
		let fileStructure = module.globalSettings.fileStructure.userData.Music;
		let musicDataController = await MusicDataController.Create();
		await musicDataController.updateData(pathToFileStructure, fileStructure);
		this.musicDataController = musicDataController;
		
		let fragment = document.createDocumentFragment();
		
		// Controls section
		let controlGroup = await CollapsibleGroup.Create('Controls');
		await this.createModuleFunctionButton({
			label: 'Stop',
			commandName: 'Music.Stop',
			parentEl: controlGroup
		});

		await this.createModuleFunctionButton({
			label: 'Pause',
			commandName: 'Music.Pause',
			parentEl: controlGroup
		});
		
		await this.createModuleFunctionButton({
			label: 'Play',
			commandName: 'Music.Play',
			parentEl: controlGroup
		});
		
		await this.createModuleFunctionButton({
			label: 'Shuffle',
			commandName: 'Music.Shuffle',
			parentEl: controlGroup
		});
		
		await this.createModuleFunctionButton({
			label: 'Skip',
			commandName: 'Music.Skip',
			parentEl: controlGroup
		});
		
		fragment.appendChild(controlGroup);
		
		// Create a section for playing an album
		// TODO: Make this logic shared with something in the music folder
		let albumNames = await musicDataController.getAlbumNames();

		let albumGroup = await CollapsibleGroup.Create('Play Album');
		let albumTypeforward = await Typeforward.Create(albumNames, albumGroup);

		await this.createModuleFunctionButton({
			label: 'Play',
			commandName: 'Music.PlayAlbum',
			valueGetter: this.getAlbumTypeforwardValue.bind(this),
			parentEl: albumGroup,
		});

		await this.createModuleFunctionButton({
			label: 'Queue',
			commandName: 'Music.QueueAlbum',
			valueGetter: this.getAlbumTypeforwardValue.bind(this),
			parentEl: albumGroup,
		});
		
		await this.createModuleFunctionButton({
			label: 'Shuffle',
			commandName: 'Music.ShuffleAlbum',
			valueGetter: this.getAlbumTypeforwardValue.bind(this),
			parentEl: albumGroup,
		});
		
		fragment.appendChild(albumGroup);
		
		// TODO: Make this logic shared with something in the music folder
		let artistGroup = await CollapsibleGroup.Create('Play Artist');

		let artistNames = await musicDataController.getArtistNames();
		let artistTypeforward = await Typeforward.Create(artistNames, artistGroup);

		await this.createModuleFunctionButton({
			label: 'Play',
			commandName: 'Music.PlayArtist',
			valueGetter: this.getArtistTypeforwardValue.bind(this),
			parentEl: artistGroup,
		});

		await this.createModuleFunctionButton({
			label: 'Shuffle',
			commandName: 'Music.ShuffleArtist',
			valueGetter: this.getArtistTypeforwardValue.bind(this),
			parentEl: artistGroup,
		});
		
		fragment.appendChild(artistGroup);
		
		// Create a section for playing a track
		let songGroup = await CollapsibleGroup.Create('Play Song');
		let trackTitles = await musicDataController.getTrackTitles();
		let trackTypeforward = await Typeforward.Create(trackTitles, songGroup);
		
		await this.createModuleFunctionButton({
			label: 'Play',
			commandName: 'Music.PlaySong',
			valueGetter: this.getTrackTypeforwardValue.bind(this),
			parentEl: songGroup,
		});
		
		await this.createModuleFunctionButton({
			label: 'Queue',
			commandName: 'Music.QueueSong',
			valueGetter: this.getTrackTypeforwardValue.bind(this),
			parentEl: songGroup,
		});

		fragment.appendChild(songGroup);
		
		//fragment.appendChild(await UserPanel.CreateSettingsBlock(panel, modulePath + '/settingsInputs.json'));

		this.trackTypeforward = trackTypeforward;
		this.albumTypeforward = albumTypeforward;
		this.artistTypeforward = artistTypeforward;
		
		console.log('did we get here?');
		
		return fragment;
	}
	
	async createModuleFunctionButton(data) {
		let labelText = data?.label ?? data?.commandName ?? "[ERROR]";
		let commandName = data?.commandName ?? "[ERROR]";
		let valueGetter = data?.valueGetter ?? null;
		let parentEl = data?.parentEl ?? null;

		let buttonEl = document.createElement('button');
		buttonEl.innerHTML = labelText;
		buttonEl.addEventListener('click', async () => {
			// TODO: Hoist
			let value = valueGetter ? (await valueGetter()) : null;
			module.F(commandName, value);
		});
		buttonEl.addEventListener('contextmenu', (event) => {

			(async function() {
				let value = valueGetter ? (await valueGetter()) : null;
				let text;
				
				if(value == null) {
					text = `${commandName}();`;
				} else {
					text = `${commandName}(${JSON.stringify(value)});`;
				}
				navigator.clipboard.writeText(text);
				console.log("Copied to clipboard");
			})();
			
			event.preventDefault();
			return false;
		});
		
		if(parentEl !== null) {
			parentEl.appendChild(buttonEl);
		}
		
		return buttonEl;
	}
	
	async getTrackTypeforwardValue() {
		return this.trackTypeforward.value;
	}
	
	async getAlbumTypeforwardValue() {
		return this.albumTypeforward.value;
	}
	
	async getArtistTypeforwardValue() {
		return this.artistTypeforward.value;
	}
}