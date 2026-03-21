# TEMPO — BPM Song Sorter

A local web app that connects to Spotify to search/import tracks, sort and filter by BPM and duration, and manage custom setlists.

## Quick Start

### 1. Create a Spotify Developer App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click **Create App**
3. Fill in:
   - **App name**: `Tempo BPM Sorter` (or whatever you like)
   - **Redirect URI**: `http://localhost:3000/callback`
   - **APIs used**: Select **Web API**
4. Accept the terms and click **Create**
5. Copy your **Client ID** from the app settings

### 2. Configure the App

Open `src/App.js` and replace the placeholder on line 5:

```js
const SPOTIFY_CLIENT_ID = 'YOUR_CLIENT_ID'; // ← paste your Client ID here
```

### 3. Install & Run

```bash
npm install
npm start
```

The app opens at `http://localhost:3000`. Click **Connect Spotify** to authenticate.

## Features

- **Search** tracks by name, artist, or album
- **Import** entire playlists from your Spotify library
- **Filter** by BPM range (e.g., 120–150) and duration range (e.g., 3–5 min)
- **Sort** by BPM, duration, track name, or artist (click column headers)
- **Click ▶** on any track to open/play it in Spotify
- **Create lists** — save curated setlists, add/remove tracks
- **Drag to reorder** tracks within a list
- **Persistent** — lists are saved to localStorage

## BPM Data Note

Spotify restricted the Audio Features endpoint for new apps (Nov 2024+). If your app was created recently, BPM data will show as "—". Options:

1. **If you have an older Spotify app** with existing access, use those credentials
2. **Manual BPM entry** — a future enhancement
3. **Alternative BPM source** — integrate GetSongBPM API or similar

The app is built to gracefully handle missing BPM data — tracks still appear and can be sorted/filtered by duration.

## Tech Stack

- React 18 (Create React App)
- Spotify Web API (OAuth implicit grant)
- No additional dependencies — pure CSS, no UI library

## Project Structure

```
bpm-sorter/
├── public/
│   └── index.html
├── src/
│   ├── index.js
│   └── App.js        ← all app logic + styles
├── package.json
└── README.md
```
