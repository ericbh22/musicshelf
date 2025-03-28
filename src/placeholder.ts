// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "musicshelf" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json


    const testalbums = vscode.commands.registerCommand('musicshelf.addAlbum', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        vscode.window.showInformationMessage('adding album!');
    });

    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = "music shelf"; // no icons yet 
    statusBarItem.tooltip = "Open music Shelf";
    statusBarItem.command = "musicshelf.openShelf";
    statusBarItem.show();

    context.subscriptions.push(statusBarItem);

    const disposable = vscode.commands.registerCommand("musicshelf.openShelf", () => {
        openMusicShelf(context);
    });


    context.subscriptions.push(disposable);
}

function openMusicShelf(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        "musicshelf",
        "Music Shelf",
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
        }
    );

    panel.webview.html = getWebviewContent();
}

function getWebviewContent(): string {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Album Shelf</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; }
                .shelf { display: flex; justify-content: center; gap: 10px; padding: 20px; }
                .album { cursor: pointer; width: 100px; }
            </style>
        </head>
        <body>
            <h2>Album Shelf</h2>
            <div class="shelf">
                <img class="album" src="https://via.placeholder.com/100" onclick="playAlbum()">
            </div>
            <script>
                function playAlbum() {
                    alert("Playing Album (integrate Spotify here)");
                }
            </script>
        </body>
        </html>
    `;
}

// This method is called when your extension is deactivated
export function deactivate() {}
