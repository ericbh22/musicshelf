import * as vscode from 'vscode';
import { AlbumManager } from '../providers/AlbumManager';
import { Album } from '../models/Album';

export class AlbumGridWebview implements vscode.WebviewViewProvider {
  public static readonly viewType = 'musicShelfGrid'; // class level constnat, basicaly sayting view_type musicshelfgrid 
  private view?: vscode.WebviewView; // instance properties that are local, type hinting, this view is optional 
  private albumManager: AlbumManager; // album manager is an isntance of albumManager, type hinting here  

  constructor(private context: vscode.ExtensionContext) {
    this.albumManager = AlbumManager.getInstance(); // constructort basically means init 
  }

  // Method to post messages to the webview
  public postMessage(message: any) {
    this.view?.webview.postMessage(message); // ?. acts as optional chaining. If this view exists, post message to the webview 
  }

  // Resolve the webview view
  public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
    this.view = webviewView;

    const webview = webviewView.webview;
    webview.options = {
      enableScripts: true,
    };

    // Set the HTML content for the webview
  


    // Handle messages from the webview
    webview.onDidReceiveMessage((message) => {
      switch (message.type) {
        case "updateAlbums":
          this.postMessage({ type: "updateAlbums", albums: this.albumManager.getAlbums() }); // post a message to 
          break; 
        case 'error':
          vscode.window.showErrorMessage(message.text);
          break;
        case 'info':
          vscode.window.showInformationMessage(message.text);
          break;
      }
    });
  }

  // Generate HTML content for the webview
  private getWebviewContent(webview: vscode.Webview): string {
    // use externtal style sheets
    const style = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'assets', 'style.css')); // convert the style.css into something vscode can use this.context.extensionUri is the root where its installed 
    const utilJS = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'assets', 'util.js'));
    const albums = this.albumManager.getAlbums(); // Get albums from AlbumManager
    const genres = ['All', 'Rock', 'Pop', 'Jazz', 'Hip-Hop']; // Example genres

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Music Shelf</title>
        <link href="${style}" rel="stylesheet">
    </head>
    <body>
        <h1>Music Shelf</h1>
        <div class="album-grid" id="albumGrid">
            ${albums.map(album => `
                <div class="album-item" data-album='${JSON.stringify(album)}'>
                    <img src="${album.coverUrl}" alt="${album.title}" style="max-width: 100%;">
                    <p>${album.title} - ${album.artist}</p>
                </div>
            `).join('')}
        </div>
        <script src="${utilJS}"></script> 
        <script>
            const genreSelect = document.getElementById('genreSelect');
            genreSelect.addEventListener('change', function(event) {
                const genre = event.target.value;
                vscode.postMessage({ type: 'filterAlbums', genre: genre });
            });

            const albumItems = document.querySelectorAll('.album-item');
            albumItems.forEach(item => {
                item.addEventListener('click', () => {
                    const album = JSON.parse(item.getAttribute('data-album'));
                    vscode.postMessage({ type: 'selectAlbum', album: album });
                });
            });
        </script>
    </body>
    </html>
    `;
  }
}
