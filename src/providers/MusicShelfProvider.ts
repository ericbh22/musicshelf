// src/providers/MusicShelfProvider.ts
import * as vscode from 'vscode';
import * as path from 'path';
import { Album } from '../models/Album';
import { AlbumManager } from './AlbumManager';

export class MusicShelfProvider implements vscode.TreeDataProvider<Album> { // again type script type specifications here, we are essetnialyl sayuing it MUST implement methods from tree data bprovider, and defining it as a class 
    private _onDidChangeTreeData = new vscode.EventEmitter<Album | undefined>(); // makes a new vscode emitter, that either listens to album changes or undefined changes 
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private albumManager: AlbumManager;

    constructor() {
        this.albumManager = AlbumManager.getInstance(); // makes an instance of an album manager, basically we can now use albumManager functions. Its unique in the fact that its a signleton instance, theres only one instance of this running 
        //this. means self 
        // If you want to start with some default albums
        if (this.albumManager.getAlbums().length === 0) {
            this.albumManager.addAlbum({
                title: 'Random Album', 
                artist: 'Example Artist',
                coverUrl: "C:/Users/HUANG/Documents/GitHub/anic/musicshelf/src/assets/albumpics/takecare.png"
            });
        }
        
        // Listen for album changes
        this.albumManager.onDidChangeAlbums(() => {
            this._onDidChangeTreeData.fire(undefined);
        });
    }

    getTreeItem(album: Album): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(album.title);
        
        treeItem.description = album.artist;
        treeItem.contextValue = 'album';
        
        treeItem.tooltip = `${album.title} by ${album.artist}`;
        
        // Add a command to play the album when clicked
        treeItem.command = {
            command: 'musicshelf.playAlbum',
            title: 'Play Album',
            arguments: [album]
        };

        return treeItem;
    }

    getChildren(): Thenable<Album[]> {
        return Promise.resolve(this.albumManager.getAlbums());
    }
}