import { io, Socket } from 'socket.io-client';

export class SocketClient {
    private socket: Socket;
    private callbacks: any = {};

    constructor(url: string) {
        this.socket = io(url);
        this.setupListeners();
    }

    private setupListeners() {
        this.socket.on('connect', () => {
            console.log('Connected to server', this.socket.id);
            // hardcoded room for now for verification
            this.socket.emit('join_room', 'room1');
            if (this.callbacks.onConnect) this.callbacks.onConnect();
        });

        this.socket.on('room_joined', (data) => {
            console.log('Joined room', data);
            if (this.callbacks.onRoomJoined) this.callbacks.onRoomJoined(data);
        });

        this.socket.on('draw_start', (data) => {
            if (this.callbacks.onDrawStart) this.callbacks.onDrawStart(data);
        });

        this.socket.on('draw_chunk', (data) => {
            if (this.callbacks.onDrawChunk) this.callbacks.onDrawChunk(data);
        });

        this.socket.on('draw_end', (data) => {
            if (this.callbacks.onDrawEnd) this.callbacks.onDrawEnd(data);
        });

        this.socket.on('cursor_move', (data) => {
            if (this.callbacks.onCursorMove) this.callbacks.onCursorMove(data);
        });

        this.socket.on('clear_canvas', () => {
            if (this.callbacks.onClearCanvas) this.callbacks.onClearCanvas();
        });

        this.socket.on('history_update', (history) => {
            if (this.callbacks.onHistoryUpdate) this.callbacks.onHistoryUpdate(history);
        });
    }

    public setCallbacks(callbacks: any) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    public emitDrawStart(data: any) {
        this.socket.emit('draw_start', data);
    }

    public emitDrawChunk(data: any) {
        this.socket.emit('draw_chunk', data);
    }

    public emitDrawEnd(data: any) {
        this.socket.emit('draw_end', data);
    }

    public emitCursorMove(data: any) {
        this.socket.emit('cursor_move', data);
    }

    public emitClearCanvas() {
        this.socket.emit('clear_canvas');
    }

    public emitUndo() {
        this.socket.emit('undo');
    }

    public emitRedo() {
        this.socket.emit('redo');
    }
}
