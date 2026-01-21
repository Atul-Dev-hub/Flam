export class CanvasManager {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private isDrawing = false;
    private color = '#000000';
    private brushSize = 5;
    private socketClient: any;

    // Remote cursors: userId -> { x, y, color, element }
    private remoteCursors: Map<string, HTMLElement> = new Map();

    constructor(canvas: HTMLCanvasElement, socketClient: any) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.socketClient = socketClient;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.initInputListeners();
    }

    private resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    public setColor(color: string) {
        this.color = color;
    }

    public setBrushSize(size: number) {
        this.brushSize = size;
    }

    private initInputListeners() {
        // Mouse
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));

        // Touch
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // prevent scrolling
            this.startDrawing(e.touches[0]);
        }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        }, { passive: false });
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
    }

    private startDrawing(e: MouseEvent | Touch | any) {
        this.isDrawing = true;
        const { x, y } = this.getPos(e);
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = this.brushSize;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.socketClient.emitDrawStart({ x, y, color: this.color, size: this.brushSize });
    }

    private draw(e: MouseEvent | Touch | any) {
        const { x, y } = this.getPos(e);

        // Emit cursor move regardless of drawing
        this.socketClient.emitCursorMove({ x, y });

        if (!this.isDrawing) return;

        this.ctx.lineTo(x, y);
        this.ctx.stroke();

        this.socketClient.emitDrawChunk({ x, y });
    }

    private stopDrawing() {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        this.ctx.closePath();
        this.socketClient.emitDrawEnd({});
    }

    private getPos(e: any) {
        return {
            x: e.clientX,
            y: e.clientY
        };
    }

    // --- Remote Drawing ---

    public onRemoteDrawStart(data: any) {
        this.ctx.beginPath();
        this.ctx.moveTo(data.x, data.y);
        this.ctx.strokeStyle = data.color;
        this.ctx.lineWidth = data.size;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }

    public onRemoteDrawChunk(data: any) {
        this.ctx.lineTo(data.x, data.y);
        this.ctx.stroke();
    }

    public onRemoteDrawEnd(data: any) {
        this.ctx.closePath();
    }

    public onRemoteCursorMove(data: any) {
        const { x, y, userId, color } = data;
        let cursor = this.remoteCursors.get(userId);

        if (!cursor) {
            cursor = document.createElement('div');
            cursor.className = 'remote-cursor';
            cursor.style.position = 'absolute';
            cursor.style.width = '10px';
            cursor.style.height = '10px';
            cursor.style.borderRadius = '50%';
            cursor.style.pointerEvents = 'none';
            cursor.style.backgroundColor = color;
            cursor.style.border = '2px solid white';
            cursor.style.zIndex = '1000';

            // Label
            const label = document.createElement('span');
            label.innerText = userId.substr(0, 4);
            label.style.position = 'absolute';
            label.style.top = '-20px';
            label.style.left = '10px';
            label.style.color = 'white';
            label.style.fontSize = '10px';
            label.style.backgroundColor = 'rgba(0,0,0,0.5)';
            label.style.padding = '2px 4px';
            label.style.borderRadius = '4px';
            cursor.appendChild(label);

            document.body.appendChild(cursor);
            this.remoteCursors.set(userId, cursor);
        }

        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;
    }

    public clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    public onHistoryUpdate(history: any[]) {
        this.clear();
        // Redraw all strokes from history
        history.forEach(stroke => {
            if (stroke.points.length === 0) return;

            this.ctx.beginPath();
            this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            this.ctx.strokeStyle = stroke.color;
            this.ctx.lineWidth = stroke.size;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';

            for (let i = 1; i < stroke.points.length; i++) {
                this.ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
            this.ctx.stroke();
            this.ctx.closePath();
        });
    }
}
