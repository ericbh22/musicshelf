import * as vscode from 'vscode';
import { AlbumManager } from './providers/AlbumManager';
import { AlbumGridWebview } from './views/albumgridproviderwebview';

export function activate(context: vscode.ExtensionContext) {
	
    const albumManager = AlbumManager.getInstance(); // singleton instance, basically creating an instnace of this class, albummamanger() basically

    // Create the view provider
    const albumGridWebview = new AlbumGridWebview(context);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(AlbumGridWebview.viewType, albumGridWebview)); // note the .viewType, remember the viewtype we have depdfiend it ion package.json. and albumgridwebview handles actual rendering and events 

	context.subscriptions.push(
		vscode.commands.registerCommand('musicshelf.addAlbum', async () => {
			const title = await vscode.window.showInputBox({ prompt: 'Album Title' });
			const artist = await vscode.window.showInputBox({ prompt: 'Artist Name' });
			const coverUrl = await vscode.window.showInputBox({ prompt: 'Album Cover URL (optional)' });
	
			if (title && artist) {
				albumManager.addAlbum({ // because we did getinstance() at the start we can use this like oop
					title,
					artist,
					coverUrl: coverUrl || 'default-cover-url'
				});
				albumGridWebview.postMessage({ type: 'updateAlbums', albums: albumManager.getAlbums() }); // sends message to the webview, we tell it we are delaing with updateAlbums  and we give it all its albums
			}
		}
	
	));

	context.subscriptions.push(
		vscode.commands.registerCommand('musicshelf.playAlbum', (album) => {
			vscode.window.showInformationMessage(`Playing: ${album.title} by ${album.artist}`);
		}));
	

	context.subscriptions.push(
		vscode.commands.registerCommand('musicshelf.removeAlbum', async() => {
			const name = await vscode.window.showInputBox({prompt : "Name of album to be removed"});
			if (name){
			albumManager.removeAlbum(name);
			}
			albumGridWebview.postMessage({ type: 'updateAlbums', albums: albumManager.getAlbums() });
		}));



}

export function deactivate() {}