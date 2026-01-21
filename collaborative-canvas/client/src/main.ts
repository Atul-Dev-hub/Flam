import { SocketClient } from './SocketClient';
import { CanvasManager } from './CanvasManager';
import './style.css';

const SERVER_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('drawingCanvas') as HTMLCanvasElement;
    const colorPicker = document.getElementById('colorPicker') as HTMLInputElement;
    const brushSize = document.getElementById('brushSize') as HTMLInputElement;
    const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
    const undoBtn = document.getElementById('undoBtn') as HTMLButtonElement;
    const redoBtn = document.getElementById('redoBtn') as HTMLButtonElement;
    const statusDiv = document.getElementById('status') as HTMLElement;

    const socketClient = new SocketClient(SERVER_URL);
    const canvasManager = new CanvasManager(canvas, socketClient);

    // Setup Socket Callbacks to bridge to CanvasManager
    socketClient.setCallbacks({
        onConnect: () => {
            statusDiv.innerText = 'Connected';
            statusDiv.style.color = '#4caf50';
        },
        onRoomJoined: (data: any) => {
            console.log('My Color:', data.color);
            // Optionally set my own color to this if we want enforced colors
            // But requirement says "assign colors to users", usually means their cursor color.
            // Let's let them pick drawing color freely or use assigned?
            // "assign colors to users" often implies identity color.
            // Let's use assigned color for cursor, but allow drawing color change?
            // Requirement: "Assign colors to users" might mean drawing color too.
            // Let's start with allowing them to pick.
        },
        onDrawStart: (data: any) => canvasManager.onRemoteDrawStart(data),
        onDrawChunk: (data: any) => canvasManager.onRemoteDrawChunk(data),
        onDrawEnd: (data: any) => canvasManager.onRemoteDrawEnd(data),
        onCursorMove: (data: any) => canvasManager.onRemoteCursorMove(data),
        onClearCanvas: () => canvasManager.clear(),
        onHistoryUpdate: (history: any[]) => canvasManager.onHistoryUpdate(history)
    });

    // UI Listeners
    colorPicker.addEventListener('change', (e: any) => {
        canvasManager.setColor(e.target.value);
    });

    brushSize.addEventListener('input', (e: any) => {
        canvasManager.setBrushSize(parseInt(e.target.value));
    });

    clearBtn.addEventListener('click', () => {
        canvasManager.clear();
        socketClient.emitClearCanvas();
    });

    undoBtn.addEventListener('click', () => {
        socketClient.emitUndo();
    });

    redoBtn.addEventListener('click', () => {
        socketClient.emitRedo();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            socketClient.emitUndo();
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
            e.preventDefault();
            socketClient.emitRedo();
        }
    });
});
