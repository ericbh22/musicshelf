export interface Album {
    id?: string;      // Unique identifier for each album
    title: string;    // Name of the album
    artist: string;   // Name of the artist
    coverUrl: string; // URL or path to the album's cover image
    spotifyUri?: string; // Optional Spotify URI for future integration
    position?: {      // Optional grid position 
        row: number; 
        column: number; 
    };
} // this is like abstract base classes in python, basically we have all these things that can be defined later by children classes, but the parent calss is album 