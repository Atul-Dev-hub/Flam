export interface Stroke {
    id: string;
    userId: string;
    color: string;
    size: number;
    points: { x: number, y: number }[];
    timestamp: number;
}

export class HistoryManager {
    private history: Stroke[] = [];
    private redoStack: Stroke[] = [];
    private maxHistory: number = 50;

    public addStroke(stroke: Stroke) {
        this.history.push(stroke);
        this.redoStack = []; // Clear redo stack on new action
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }

    public undo(): Stroke | null {
        if (this.history.length === 0) return null;
        const stroke = this.history.pop()!;
        this.redoStack.push(stroke);
        return stroke;
    }

    public redo(): Stroke | null {
        if (this.redoStack.length === 0) return null;
        const stroke = this.redoStack.pop()!;
        this.history.push(stroke);
        return stroke;
    }

    public getHistory(): Stroke[] {
        return this.history;
    }

    public clear() {
        this.history = [];
        this.redoStack = [];
    }
}
