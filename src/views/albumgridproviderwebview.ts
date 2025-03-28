import * as vscode from 'vscode';
import { AlbumManager } from '../providers/albummanager';

export class AlbumGridWebview implements vscode.WebviewViewProvider {
  public static readonly viewType = 'musicShelfGrid';
  private view?: vscode.WebviewView;
  private albumManager: AlbumManager;

  constructor(private context: vscode.ExtensionContext) {
    this.albumManager = AlbumManager.getInstance();
  }

  // Method to post messages to the webview
  public postMessage(message: any) {
    this.view?.webview.postMessage(message);
  }

  // Resolve the webview view
  public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
    this.view = webviewView;

    const webview = webviewView.webview;
    webview.options = {
      enableScripts: true,
    };

    // Set the HTML content for the webview
    webview.html = this.getWebviewContent(webviewView.webview);

    // Handle messages from the webview
    webview.onDidReceiveMessage((message) => {
      switch (message.type) {
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
    const albums = this.albumManager.getAlbums(); // Get albums from AlbumManager
    const genres = ['All', 'Rock', 'Pop', 'Jazz', 'Hip-Hop']; // Example genres

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Music Shelf</title>
        <style>
            .album-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
            }
            .album-item {
                cursor: pointer;
                transition: transform 0.2s;
            }
            .album-item:hover {
                transform: scale(1.05);
            }
        </style>
    </head>
    <body>
        <h1>Music Shelf</h1>
        <select id="genreSelect">
            ${genres.map(genre => `<option value="${genre}">${genre}</option>`).join('')}
        </select>
        <div class="album-grid" id="albumGrid">
            ${albums.map(album => `
                <div class="album-item" data-album='${JSON.stringify(album)}'>
                    <img src="${album.coverUrl}" alt="${album.title}" style="max-width: 100%;">
                    <p>${album.title} - ${album.artist}</p>
                </div>
            `).join('')}
        </div>

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
