import * as vscode from 'vscode';
import {
    playSpotify,
    pauseSpotify,
    skipSpotify, 
    backSpotify,
    displayCurrentSpotify,
    resumeSpotify,
    checkStatus,
    shuffleSpotify,
    refreshDeviceId,
} from '../services/spotifyplayer';

// import {
//   resetAlbums
// } from "../providers/AlbumManager"

export function registerStatusBarControls(context: vscode.ExtensionContext) {
  // ⏮️ Go Back
  const backButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  backButton.text = '$(chevron-left)';
  backButton.tooltip = 'Previous Track';
  backButton.command = 'spotifyControls.previousTrack';
  backButton.show();

  // ⏯️ Pause/Play
  const playPauseButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
  playPauseButton.text = '$(debug-pause)';
  playPauseButton.tooltip = 'Pause';
  playPauseButton.command = 'spotifyControls.togglePlayPause';
  playPauseButton.show();

  // ⏭️ Skip
  const skipButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 98);
  skipButton.text = '$(chevron-right)';
  skipButton.tooltip = 'Next Track';
  skipButton.command = 'spotifyControls.nextTrack';
  skipButton.show();

  // 🎵 Current Song Display
  const songDisplay = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 97);
  songDisplay.text = '🎵 Loading...';
  songDisplay.tooltip = 'Currently Playing';
  songDisplay.show();

  // 🔀 Shuffle
  const shuffleButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 97);
  let isShuffleOn = false; 
  shuffleButton.text = '$(arrow-swap)'; // 
  shuffleButton.tooltip = 'Toggle Shuffle';
  shuffleButton.command = 'spotifyControls.toggleShuffle';
  shuffleButton.show();

  function updateShuffleIcon() {
    shuffleButton.text = isShuffleOn ? '$(arrow-swap)' : '$(arrow-swap)'; 
    shuffleButton.tooltip = `Shuffle ${isShuffleOn ? 'On' : 'Off'}`;
  }
  // Command registrations
  context.subscriptions.push(
    vscode.commands.registerCommand('spotifyControls.previousTrack', async () => {
      await backSpotify(context);
      updateCurrentSongDisplay();
    }),

    vscode.commands.registerCommand('spotifyControls.nextTrack', async () => {
      await skipSpotify(context);
      updateCurrentSongDisplay();
    }),

    vscode.commands.registerCommand('spotifyControls.togglePlayPause', async () => {
      const isPlaying = await togglePlayPause(context);
      playPauseButton.text = isPlaying ? '$(debug-pause)' : '$(debug-start)';
      playPauseButton.tooltip = isPlaying ? 'Pause' : 'Play';
    }),
    vscode.commands.registerCommand('spotifyControls.toggleShuffle', async () => {
      isShuffleOn = !isShuffleOn;
      const success = await shuffleSpotify(context, isShuffleOn);
      if (!success) {
        isShuffleOn = !isShuffleOn; // Rollback if it failed
      }
      updateShuffleIcon();
    })
  );

  // Toggle play/pause state
  async function togglePlayPause(context: vscode.ExtensionContext): Promise<boolean> {
    const currentTrack = await checkStatus(context);
    if (currentTrack?.is_playing) {
      await pauseSpotify(context);
      return false;
    } else {
      await resumeSpotify(context);
      return true;
    }
  }

  // Display current song
  async function updateCurrentSongDisplay() {
    const temp = refreshDeviceId(context);
    const track = await displayCurrentSpotify(context);
    if (track) {
      songDisplay.text = `🎵 ${track}`;
    } else {
      songDisplay.text = '🎵 Not playing';
    }
  }

  // Refresh display every 1s
  const interval = setInterval(updateCurrentSongDisplay, 1000);
  context.subscriptions.push({ dispose: () => clearInterval(interval) });

  // Initial update
  updateCurrentSongDisplay();
}
