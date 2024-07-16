import {Utility} from "../../shared/utility.js";
import CSVParser from "../../shared/csvParser.js";

export default class MusicDataController {
	albumDataByName = {};
	trackDataset = [];
	
	// Gets an object containing data for all the albums
	// and songs. Includes artist details, whatever can be
	// found through data files, and whatever can be assumed
	// from structure.
	async updateData(pathToFileStructure, fileStructure) {
		let csvFilePaths = Utility.getAllPaths(fileStructure, [ 'csv' ]);
		console.log(csvFilePaths);
		
		let trackDataset = [];
		let albumDataByName = {};
		for(let i = 0; i < csvFilePaths.length; i ++) {
			let csvFilePath = csvFilePaths[i];
			let csvResponse = await fetch(pathToFileStructure + csvFilePath);
			let csvText = await csvResponse.text();

			// Load in the album's track data
			// TODO: Figure out another way to do this, because this blocks
			// the ability to have different albums with files with
			// the same name.
			let objArray = await CSVParser.CSVToArray(csvText);
			trackDataset.push(...objArray);
			
			// Load in the album's data
			// TODO: Don't assume all files in the same folder
			//  are from the same album.
			let albumPath = csvFilePath.replace(/\/[^\/]+$/i, '');
			// TODO: Don't assume that we have a top-level folder
			//  for our album path (figure out how to get the path
			//  another way)
			let imagePaths = Utility.getAllPaths(fileStructure[albumPath], ['png', 'jpg', 'jpeg']);
			let albumArtPath = imagePaths[0];
			let albumData = {
				albumPath: albumPath + '/',
				albumArtPath: albumPath + '/' + albumArtPath
			};
			let albumName = objArray[0].album;
			albumDataByName[albumName] = albumData;
		}

		this.trackDataset = trackDataset;
		this.albumDataByName = albumDataByName;
	}
	
	async getTrackTitles() {
		let trackTitles = await this.getUniqueTrackValuesByKey('title');
		return trackTitles;
	}
	
	async getArtistNames() {
		let artistNames = await this.getUniqueTrackValuesByKey('artist');
		return artistNames;
	}
	
	async getAlbumNames() {
		let albumNames = await this.getUniqueTrackValuesByKey('album');
		return albumNames;
	}
	
	async getAllByArtistName(artistName) {
		let tracksByArtist = this.trackDataset.filter((x) => x.artist === artistName);
		return tracksByArtist;
	}
	
	async getAllByAlbumName(albumName) {
		let tracksByAlbumName = this.trackDataset.filter((x) => x.album === albumName);
		return tracksByAlbumName;
	}
	
	async getFirstByTrackTitle(trackName) {
		let tracksByTrackName = this.trackDataset.filter((x) => x.title === trackName);
		let trackData = tracksByTrackName[0] ?? null;
		return trackData;
	}

	async getUniqueTrackValuesByKey(key) {
		let values = [];
		for(let i = 0; i < this.trackDataset.length; i++) {
			let trackData = this.trackDataset[i];
			let value = trackData[key];
			if(values.indexOf(value) === -1) {
				values.push(value);
			}
		}

		return values;
	}

	async getAlbumDataFromTrackData(trackData) {
		return this.albumDataByName[trackData.album];
	}
	
	static async Create() {
		let instance = new MusicDataController();
		return instance;
	}
}