import * as vscode from 'vscode';
import * as path from 'path';

// Album interface to represent an album
interface Album {
    label: string;
    artist: string;
    uri?: vscode.Uri;
    contextValue?: string;
}

// Tree Data Provider for Music Shelf
class MusicShelfProvider implements vscode.TreeDataProvider<Album> {
    private _onDidChangeTreeData: vscode.EventEmitter<Album | undefined | null | void> = new vscode.EventEmitter<Album | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<Album | undefined | null | void> = this._onDidChangeTreeData.event;

    private albums: Album[] = [
        // Example albums - you'll want to replace this with actual data storage
        { 
            label: 'Random Album', 
            artist: 'Example Artist',
            contextValue: 'album' // This allows for context menu actions
        }
    ];

    getTreeItem(element: Album): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(element.label);
        
        // Configure the tree item
        treeItem.description = element.artist;
        treeItem.contextValue = element.contextValue;
        
        // Optional: Add an icon or tooltip
        // treeItem.iconPath = vscode.Uri.file(path.join(__filename, '..', 'resources', 'album-icon.svg'));
        treeItem.tooltip = `${element.label} by ${element.artist}`;
        
        // Add a command to play the album when clicked
        treeItem.command = {
            command: 'musicshelf.playAlbum',
            title: 'Play Album',
            arguments: [element]
        };

        return treeItem;
    }

    getChildren(element?: Album): Thenable<Album[]> {
        // If no element is passed, return the root albums
        return Promise.resolve(this.albums);
    }

    // Method to add a new album
    addAlbum(album: Album) {
        this.albums.push(album);
        this._onDidChangeTreeData.fire();
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Musicshelf extension is now active!');

    // Create the Music Shelf Tree View Provider
    const musicShelfProvider = new MusicShelfProvider();
    
    // Register the Tree View
    const treeView = vscode.window.createTreeView('musicShelf', {
        treeDataProvider: musicShelfProvider,
        canSelectMany: false
    });

    // Command to play an album
    const playAlbumCommand = vscode.commands.registerCommand('musicshelf.playAlbum', (album: Album) => {
        vscode.window.showInformationMessage(`Playing album: ${album.label} by ${album.artist}`);
        // Here you would integrate with Spotify or your music player
    });

    // Command to add a new album
    const addAlbumCommand = vscode.commands.registerCommand('musicshelf.addAlbum', () => {
        vscode.window.showInputBox({
            prompt: 'Enter Album Name',
            placeHolder: 'Album Name'
        }).then(albumName => {
            if (albumName) {
                vscode.window.showInputBox({
                    prompt: 'Enter Artist Name',
                    placeHolder: 'Artist Name'
                }).then(artistName => {
                    if (artistName) {
                        musicShelfProvider.addAlbum({
                            label: albumName,
                            artist: artistName,
                            contextValue: 'album'
                        });
                    }
                });
            }
        });
    });

    // Add commands to subscriptions
    context.subscriptions.push(
        treeView,
        playAlbumCommand,
        addAlbumCommand
    );
}

export function deactivate() {}