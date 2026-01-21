import { Server, Socket } from 'socket.io';
import { HistoryManager } from './HistoryManager';
import { v4 as uuidv4 } from 'uuid';

interface User {
    id: string;
    roomId: string;
    color: string;
}

interface ActiveStroke {
    points: { x: number, y: number }[];
    color: string;
    size: number;
    startTime: number;
}

export class RoomManager {
    private io: Server;
    private users: Map<string, User> = new Map();
    private roomHistories: Map<string, HistoryManager> = new Map();
    private activeStrokes: Map<string, ActiveStroke> = new Map();

    constructor(io: Server) {
        this.io = io;
    }

    public handleConnection(socket: Socket) {
        socket.on('join_room', (roomId: string) => {
            this.joinRoom(socket, roomId);
        });

        socket.on('draw_start', (data: any) => { // data: { x, y, color, size }
            const user = this.users.get(socket.id);
            if (user) {
                this.activeStrokes.set(socket.id, {
                    points: [{ x: data.x, y: data.y }],
                    color: data.color,
                    size: data.size,
                    startTime: Date.now()
                });
                socket.to(user.roomId).emit('draw_start', data);
            }
        });

        socket.on('draw_chunk', (data: any) => { // data: { x, y }
            const user = this.users.get(socket.id);
            if (user) {
                const stroke = this.activeStrokes.get(socket.id);
                if (stroke) {
                    stroke.points.push({ x: data.x, y: data.y });
                }
                socket.to(user.roomId).emit('draw_chunk', data);
            }
        });

        socket.on('draw_end', (data: any) => {
            const user = this.users.get(socket.id);
            if (user) {
                const stroke = this.activeStrokes.get(socket.id);
                if (stroke && stroke.points.length > 0) {
                    const history = this.getOrCreateHistory(user.roomId);
                    history.addStroke({
                        id: uuidv4(),
                        userId: socket.id,
                        color: stroke.color,
                        size: stroke.size,
                        points: stroke.points,
                        timestamp: stroke.startTime
                    });
                }
                this.activeStrokes.delete(socket.id);
                socket.to(user.roomId).emit('draw_end', data);
            }
        });

        socket.on('cursor_move', (data: any) => {
            const user = this.users.get(socket.id);
            if (user) {
                socket.to(user.roomId).emit('cursor_move', { ...data, userId: socket.id, color: user.color });
            }
        });

        socket.on('clear_canvas', () => {
            const user = this.users.get(socket.id);
            if (user) {
                const history = this.getOrCreateHistory(user.roomId);
                history.clear();
                this.io.to(user.roomId).emit('history_update', []);
                this.io.to(user.roomId).emit('clear_canvas');
            }
        });

        socket.on('undo', () => {
            const user = this.users.get(socket.id);
            if (user) {
                const history = this.getOrCreateHistory(user.roomId);
                history.undo();
                this.io.to(user.roomId).emit('history_update', history.getHistory());
            }
        });

        socket.on('redo', () => {
            const user = this.users.get(socket.id);
            if (user) {
                const history = this.getOrCreateHistory(user.roomId);
                history.redo();
                this.io.to(user.roomId).emit('history_update', history.getHistory());
            }
        });
    }

    public handleDisconnect(socket: Socket) {
        const user = this.users.get(socket.id);
        if (user) {
            this.users.delete(socket.id);
            this.activeStrokes.delete(socket.id);
        }
    }

    private joinRoom(socket: Socket, roomId: string) {
        socket.join(roomId);
        const color = '#' + Math.floor(Math.random() * 16777215).toString(16);

        this.users.set(socket.id, {
            id: socket.id,
            roomId,
            color
        });

        const history = this.getOrCreateHistory(roomId);
        socket.emit('history_update', history.getHistory());

        socket.emit('room_joined', { roomId, userId: socket.id, color });
        console.log(`User ${socket.id} joined room ${roomId} with color ${color}`);
    }

    private getOrCreateHistory(roomId: string): HistoryManager {
        if (!this.roomHistories.has(roomId)) {
            this.roomHistories.set(roomId, new HistoryManager());
        }
        return this.roomHistories.get(roomId)!;
    }
}
