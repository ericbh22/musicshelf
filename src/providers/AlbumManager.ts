// src/providers/AlbumManager.ts
// i think we need to use global rpoviders https://code.visualstudio.com/api/references/vscode-api#ExtensionContext.globalState and then use some node stuff 
import * as vscode from 'vscode';
import { Album } from '../models/Album';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs'; // used to read and write to files 
import * as path from 'path'; // convenience 
let extensionStorageFolder: string = '';
let albumsPath: string;
export class AlbumManager { // we need to write export otherwise this class is not exportable...
    private static instance: AlbumManager; // private basically means not global basicallyt ther same as _instance = None in python :AlbumManager is just type hinting 
    private _albums: Album[] = []; // _ symbolises private, good practice, again typing hinting on Album [] = [] 
    private _onDidChangeAlbums = new vscode.EventEmitter<void>();
    
    // Event to notify when albums change, this is a listener
    readonly onDidChangeAlbums = this._onDidChangeAlbums.event;
    constructor(private context?: vscode.ExtensionContext) { // we path trhough the context into this constructor, context contains subscriptions, and global storage 
        if (context) {
            extensionStorageFolder = context.globalStorageUri.fsPath; // so this is where our extension is stored 
            albumsPath = path.join(extensionStorageFolder, 'albums.json'); // and we add albums.json to it, this is always safe as we are just returning a string 
            if (!fs.existsSync(extensionStorageFolder)) {  // if the path exists 
                fs.mkdirSync(extensionStorageFolder, { recursive: true });  //create the path if it doesnt already exist, saves us from crashes, rmbr we just need the path to exist here, before we were doing string checks 
            }
    
            this.loadAlbumsFile(); //  Try loading albums from file
        }
    }
    // Singleton pattern, making sure our album manager has only one instance 
    public static getInstance(context?: vscode.ExtensionContext): AlbumManager {
        if (!AlbumManager.instance) {
            AlbumManager.instance = new AlbumManager(context);
            if (context) {
                AlbumManager.instance.loadAlbumsFile(); // Load albums when context is available
            }
        }
        return AlbumManager.instance;
    }

    // Add a new album
    addAlbum(album: Omit<Album, 'id'>): Album {
        const newAlbum: Album = {
            ...album, // take existing album data 
            id: uuidv4(),// this just generates a unique id 
            position: this.calculateNextPosition()
        }; // generates a new album with a unique ID 
        console.log(newAlbum);
        this._albums.push(newAlbum); // append the albunm 
        // we might ned to add smthn to save permanentlky 
        this._onDidChangeAlbums.fire();
        this.saveAlbumsToFile();

        return newAlbum;
    }



    // Remove an album
    removeAlbum(albumName: string): void {
        this._albums = this._albums.filter(album => album.title !== albumName); // goes through the list and removes the album if it isnt what we want, the arrow is basically a callback function, kinda like lambda,  
        const temp = this._albums;
        this._albums = [];
        for (var album of temp){
            this.addAlbum(album); // this can be done so we basically reinsert all the albums to prevent gaps after deleting from the middle 
        }
        this._onDidChangeAlbums.fire();
        this.saveAlbumsToFile();
    }

    // Move album position
    moveAlbum(albumId: string, newPosition: { row: number; column: number }): void {
        const album = this._albums.find(a => a.id === albumId);
        if (album) {
            album.position = newPosition; // if album is in a new position, fire 
            this._onDidChangeAlbums.fire();
            this.saveAlbumsToFile();

        }
    }
    //Imagine you are in a large room with multiple people (representing different parts of your app). One person (let’s say, the album manager) announces, "The albums have been updated!" but doesn’t give any specifics (that’s where void comes in — no additional data). Everyone else in the room (the listeners) hears this announcement and reacts accordingly, maybe by updating their display, recalculating data, etc.
    // basically fire allows us to be more efficient, only checking when it matters, and void means the event doesnt carry any data 
    // Get all albums
    getAlbums(): Album[] {
        return [...this._albums];
    } // returns a shallow copy 

    private loadAlbumsFile() {
        if (fs.existsSync(albumsPath)) { // if path exists 
            try {
                const raw = fs.readFileSync(albumsPath, 'utf8'); //try read the json files, we read it as a string so its not in raw binary 
                const parsed = JSON.parse(raw); // now turn it into a ts array we can use 
                if (Array.isArray(parsed)) { // conver to js array 
                    this._albums = parsed;
                    this._onDidChangeAlbums.fire();
                    // console.log('Albums loaded from file:', parsed);
                }
            } catch (e) {
                console.error('Error loading albums file:', e);
                this._albums = [];
            }
        } else {
            this.saveAlbumsToFile(); // create an empty file
        }
    }
    
    private saveAlbumsToFile() {
        try {
            fs.writeFileSync(albumsPath, JSON.stringify(this._albums, null, 2)); // write it to file 
            // console.log('Albums saved to file.');
        } catch (e) {
            // console.error('Error saving albums file:', e);
        }
    }
    // structure of our json file should look like this right now 
    // [
    //     {
    //       "id": "abc123",
    //       "title": "Jazz Collection",
    //       "position": {
    //         "row": 0,
    //         "column": 0
    //       }
    //     },
    //     {
    //       "id": "def456",
    //       "title": "Hip Hop Vibes",
    //       "position": {
    //         "row": 0,
    //         "column": 1
    //       }
    //     }
    //   ]
    // Calculate next available position in 2x3 grid
    private calculateNextPosition(): { row: number; column: number } {
        const maxRows = 2;
        const maxColumns = 4;

        // Find the first empty spot in our grid system 
        for (let row = 0; row < maxRows; row++) {
            for (let column = 0; column < maxColumns; column++) {
                if (!this._albums.some(a => 
                    a.position?.row === row && a.position?.column === column //a["position"]["row"] == row equivalent 
                )) {
                    return { row, column };
                }
            }
        }

        // If grid is full, throw an error
        throw new Error('Album grid is full');
    }

}

