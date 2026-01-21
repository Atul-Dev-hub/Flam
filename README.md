# Real-Time Collaborative Canvas

A multi-user drawing application with real-time synchronization and global undo/redo.

## Features
- **Real-time Drawing**: See others draw as they move.
- **Global Undo/Redo**: Shared history state managed by the server.
- **User Presence**: See cursors of other users with assigned colors.
- **Tools**: Color picker, Brush size adjustment.

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm

### Installation

1. **Server**:
   ```bash
   cd server
   npm install
   npm run dev
   ```
   Server runs on `http://localhost:3000`.

2. **Client**:
   ```bash
   cd client
   npm install
   npm run dev
   ```
   Client runs on `http://localhost:5173`.

### Usage
- Open the Client URL in multiple browser windows.
- Start drawing!
- Click "Undo" or "Ctrl+Z" to undo the last global action.

## Testing with Multiple Users
1. Open `http://localhost:5173` in Browser Window A.
2. Open `http://localhost:5173` in Browser Window B (incognito recommended for separate session, though socket.io handles it).
3. Draw in Window A. Watch Window B.
4. Click Undo in Window B. Watch Window A revert.

## Known Limitations
- "Clear" button clears local view but global history update might supersede it if not handled as a global "Clear Event" (Currently wired to broadcast clear).
- High latency networks might see slight delay in cursor trailing.

## Time Spent
~2 hours planning and implementation.
