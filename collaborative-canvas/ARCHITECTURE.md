# Architecture - Collaborative Canvas

## Overview
This application is a real-time collaborative drawing canvas allowing multiple users to draw simultaneously. Any changes, including drawing strokes and Undoing/Redoing, are synchronized across all connected clients in real-time.

## Tech Stack
- **Frontend**: Vite + TypeScript + Native Canvas API
- **Backend**: Node.js + Express + Socket.IO + TypeScript
- **State Management**: Server-authoritative history (source of truth)

## Data Flow
1. **Drawing**:
    - Client generates mouse/touch events -> `CanvasManager`.
    - `CanvasManager` emits `draw_start`, `draw_chunk`, `draw_end` via `SocketClient`.
    - Server `RoomManager` receives events:
        - Broadcasts to other clients in room (optimistic UI on sender, stream to others).
        - Accumulates chunks into an `activeStroke`.
    - On `draw_end`, Server finalizes `activeStroke` -> `Stroke` object -> pushed to `HistoryManager`.

2. **Undo/Redo**:
    - Client emits `undo`.
    - Server `HistoryManager` moves top stroke from History Stack to Redo Stack.
    - Server broadcasts `history_update` with the new full history.
    - Clients receive `history_update` -> `CanvasManager` clears canvas and redraws all strokes in history.
    - *Rationale*: Global undo requires consistency. Sending full history ensures clients don't diverge.

3. **Cursors**:
    - `cursor_move` events are throttled/streamed to others to show real-time indicators.

## Components

### Server
- **Server.ts**: Entry point, HTTP/Socket setup.
- **RoomManager.ts**: Handles room logic, user sessions, active strokes accumulation.
- **HistoryManager.ts**: Manages the Undo/Redo stacks per room.

### Client
- **main.ts**: Bootstrap, event wiring.
- **SocketClient.ts**: Wrapper for Socket.IO interaction.
- **CanvasManager.ts**: Logic for rendering paths, handling inputs, and remote cursor rendering.

## Trade-offs & Optimizations
- **Full History Redraw**: For simplicity and robustness, specific operations trigger a full canvas redraw (Undo/Redo). With < 1000 strokes this is instant (~16ms). For larger scale, we would use offscreen canvas caching or delta updates.
- **Stroke Batching**: We emit `draw_chunk` on every mousemove. In production, we might batch these to 60fps to reduce network load.
- **Conflict Resolution**: The "Truth" is the server history. If two users undo at the same time, the server processes them sequentially. The resulting state is broadcasted to all.
