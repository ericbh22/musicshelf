// src/providers/AlbumManager.ts
// i think we need to use global rpoviders https://code.visualstudio.com/api/references/vscode-api#ExtensionContext.globalState and then use some node stuff 
import * as vscode from 'vscode';
import { Album } from '../models/Album';
import { v4 as uuidv4 } from 'uuid';
import { AlbumGridWebview } from '../views/albumgridproviderwebview';
export class AlbumManager { // we need to write export otherwise this class is not exportable...
    private static instance: AlbumManager; // private basically means not global basicallyt ther same as _instance = None in python :AlbumManager is just type hinting 
    private _albums: Album[] = []; // _ symbolises private, good practice, again typing hinting on Album [] = [] 
    private _onDidChangeAlbums = new vscode.EventEmitter<void>();
    
    // Event to notify when albums change, this is a listener
    readonly onDidChangeAlbums = this._onDidChangeAlbums.event;
    constructor(private context?: vscode.ExtensionContext) {}
    public saveAlbums(): void {
        if (this.context) { // basic error handling if self.context exists 
            console.log('Saving albums:', this._albums);
            this.context.workspaceState.update('albums', this._albums); // using the workspacestate feature to store information about albums under "albums"
        }
    }

    // Load albums from workspaceState
    public loadAlbums(): void {
        if (this.context) {
            const saved = this.context.workspaceState.get<Album[]>('albums', []); // get the albums from the workspace state, notice we are doing a type assertion cuz its TS
            console.log('Loaded albums:', saved);
            this._albums = saved;  // set our albums to this._ albums 
            this._onDidChangeAlbums.fire(); // fire change for UI to update
        }
    }

    // Singleton pattern, making sure our album manager has only one instance 
    public static getInstance(context?: vscode.ExtensionContext): AlbumManager {
        if (!AlbumManager.instance) {
            AlbumManager.instance = new AlbumManager(context);
            if (context) {
                AlbumManager.instance.loadAlbums(); // Load albums when context is available
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
        this._albums.push(newAlbum); // append the albunm 
        // we might ned to add smthn to save permanentlky 
        this._onDidChangeAlbums.fire();
        this.saveAlbums(); // persist change
        return newAlbum;
    }

    // Remove an album
    removeAlbum(albumName: string): void {
        this._albums = this._albums.filter(album => album.title !== albumName); // goes through the list and removes the album if it isnt what we want, the arrow is basically a callback function, kinda like lambda,  
        this._onDidChangeAlbums.fire();
        this.saveAlbums(); // persist change
        
    }

    // Move album position
    moveAlbum(albumId: string, newPosition: { row: number; column: number }): void {
        const album = this._albums.find(a => a.id === albumId);
        if (album) {
            album.position = newPosition; // if album is in a new position, fire 
            this._onDidChangeAlbums.fire();
            this.saveAlbums(); // persist change
        }
    }
    //Imagine you are in a large room with multiple people (representing different parts of your app). One person (let’s say, the album manager) announces, "The albums have been updated!" but doesn’t give any specifics (that’s where void comes in — no additional data). Everyone else in the room (the listeners) hears this announcement and reacts accordingly, maybe by updating their display, recalculating data, etc.
    // basically fire allows us to be more efficient, only checking when it matters, and void means the event doesnt carry any data 
    // Get all albums
    getAlbums(): Album[] {
        return [...this._albums];
    } // returns a shallow copy 
    

    // Calculate next available position in 2x3 grid
    private calculateNextPosition(): { row: number; column: number } {
        const maxRows = 2;
        const maxColumns = 3;

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