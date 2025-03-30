// src/providers/AlbumManager.ts
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
    private constructor() {}

    // Singleton pattern, making sure our album manager has only one instance 
    public static getInstance(): AlbumManager { // static means it belogsn to a class, not an instance 
        if (!AlbumManager.instance) {
            AlbumManager.instance = new AlbumManager();
        }
        return AlbumManager.instance;
    } // creates an instance of the album manager 

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

        return newAlbum;
    }

    // Remove an album
    removeAlbum(albumName: string): void {
        this._albums = this._albums.filter(album => album.title !== albumName); // goes through the list and removes the album if it isnt what we want, the arrow is basically a callback function, kinda like lambda,  
        this._onDidChangeAlbums.fire();
    }

    // Move album position
    moveAlbum(albumId: string, newPosition: { row: number; column: number }): void {
        const album = this._albums.find(a => a.id === albumId);
        if (album) {
            album.position = newPosition; // if album is in a new position, fire 
            this._onDidChangeAlbums.fire();
        }
    }
    //Imagine you are in a large room with multiple people (representing different parts of your app). One person (let’s say, the album manager) announces, "The albums have been updated!" but doesn’t give any specifics (that’s where void comes in — no additional data). Everyone else in the room (the listeners) hears this announcement and reacts accordingly, maybe by updating their display, recalculating data, etc.
    // basically fire allows us to be more efficient, only checking when it matters, and void means the event doesnt carry any data 
    // Get all albums
    getAlbums(): Album[] {
        this._onDidChangeAlbums.fire();
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