class Bit {
    constructor(val, x, y, context, fadingIn=true, fadingOut=false, fadeDelta=0.01, opacity=0) {

        this.x = x;
        this.y = y;

        this.context = context;

        this.fadingIn = fadingIn;
        this.fadingOut = fadingOut;
        this.fadeDelta = fadeDelta;

        this.animating = fadingIn && opacity < 1 || fadingOut && opacity > 0;

        this.val = val;
        this.opacity = opacity;
    }

    animateFade() {
        if (this.fadingIn && this.opacity < 1) {
            this.opacity += this.fadeDelta;
        }
        else if(this.fadingOut && this.opacity > 0) {
            this.opacity -= this.fadeDelta;
        }

        if (this.opacity <= 0) {
            this.opacity = 0;
            this.animating = false;
        }
        else if(this.opacity >= 1) {
            this.opacity = 1;
            this.animating = false;
        }
    }

    draw() {
        this.animateFade();
        this.context.globalAlpha = this.opacity;
        this.context.fillText(this.val, this.x, this.y);
    }
}

class BitMatrix {
    constructor(canvas, color, fontFamily='Lucida Console', fontSizePx=12, fontWeight='normal') {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');

        this._fixCanvasDPI();

        this.context.fillStyle = color;

        this.fontFamily = fontFamily;
        this.fontSizePx = fontSizePx;
        this.fontWeight = fontWeight;

        this.context.font = fontWeight + ' ' + fontSizePx + 'px ' + fontFamily;

        this.requestAnimFrame = null;

        this.matrix = [];

        canvas.addEventListener('resize', () => {

        });
    }

    start() {
        this._buildMatrix();
        this._requestDraw();
    }

    _fixCanvasDPI() {
        let width = this.canvas.width;
        let height = this.canvas.height;

        this.canvas.width = width * window.devicePixelRatio;
        this.canvas.height = height * window.devicePixelRatio;

        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';

        this.context.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    _buildMatrix() {
        let widthSpacing = (this.fontSizePx + 5) * 1;
        let heightSpacing = (this.fontSizePx + 5) * 1;

        let marginLeft = widthSpacing/2;
        let marginTop = heightSpacing/2;

        let numRows = parseInt(this.canvas.style.height.slice(0, -2)/widthSpacing);
        let numCols = parseInt(this.canvas.style.width.slice(0, -2)/heightSpacing);

        for(let i = 0; i < numRows; i++) {
            this.matrix.push([]);
            for(let j = 0; j < numCols; j++) {
                let x = j * widthSpacing + marginLeft;
                let y = i * heightSpacing + marginTop;
                this.matrix[i].push(new Bit(this._generateRandomBit(), x, y, this.context));
            }
        }
    }

    _draw() {
        this.context.clearRect(0,0, this.canvas.width, this.canvas.height);
        for(let i = 0; i < this.matrix.length; i++) {
            for(let j = 0; j < this.matrix[i].length; j++) {
                let currentBit = this.matrix[i][j];
                currentBit.draw();
            }
        }
        
        this._requestDraw();

    }

    _requestDraw() {
        var ref = this;
        window.requestAnimationFrame(() => {
            ref._draw();
        });
    }

    _generateRandomBit() {
        return Math.floor(Math.random() * 2);
    }

    _flipCoin() {
        return this._generateRandomBit() === 1;
    }
}