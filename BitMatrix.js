class Bit {
    constructor(context, val, x, y, minOpacity=0, maxOpacity=1, fadeDelta=0.05) {

        this.context = context;
        this.val = val;

        this.x = x;
        this.y = y;

        this.fadingIn = false;
        this.fadingOut = false;
        this.animating = false;

        this.minOpacity = minOpacity;
        this.maxOpacity = maxOpacity;
        this.opacity = minOpacity;

        this.fadeDelta = fadeDelta;
    }

    triggerAnimation() {
        if (this.animating) {
            return;
        }

        if (this.opacity === 1) {
            this.fadingOut = true;
            this.fadingIn = false;
        }
        else {
            this.fadingIn = true;
            this.fadingOut = false;
        }

        this.animating = true;
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
    constructor(canvas, width, height, color, fontFamily='monospace', fontSizePx=12, fontWeight='normal') {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');

        this._numRows = 0;
        this._numCols = 0;

        this._matrix = [];

        this._setupCanvas(width, height, color, fontFamily, fontSizePx, fontWeight);

        this.requestAnimFrame = null;

        // let ref = this;
        // canvas.addEventListener('resize', () => {
        //     ref.resizeCanvas();
        // });
    }

    _setupCanvas(width, height, color, fontFamily, fontSizePx, fontWeight) {
        this.width = width;
        this.height = height;

        this.canvas.width = width * window.devicePixelRatio;
        this.canvas.height = height * window.devicePixelRatio;

        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';

        this.context.fillStyle = color;

        this.fontFamily = fontFamily;
        this.fontSizePx = fontSizePx;
        this.fontWeight = fontWeight;

        this._widthSpacing = (this.fontSizePx + 5) * 1;
        this._heightSpacing = (this.fontSizePx + 5) * 1;

        this._marginLeft = this._widthSpacing/2;
        this._marginTop = this._heightSpacing/2;

        this.context.font = fontWeight + ' ' + fontSizePx + 'px ' + fontFamily;
        this.context.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    resizeCanvas(width, height) {
        this._setupCanvas(width, height, this.context.fillStyle, this.fontFamily, this.fontSizePx, this.fontWeight);
        this._resizeMatrix();
    }

    start() {
        this._requestDraw();
        this._buildMatrix();
    }

    _buildMatrix() {
        this._numRows = parseInt(this.height/this._heightSpacing);
        this._numCols = parseInt(this.width/this._widthSpacing);

        for(let i = 0; i < this._numRows; i++) {
            this._addRowToMatrix(i);
        }
    }

    _addRowToMatrix(i) {
        this._matrix.push([]);
        for(let j = 0; j < this._numCols; j++) {
            this._addBitToMatrix(i, j);
        }
    }

    _addBitToMatrix(i, j) {
        let x = j * this._widthSpacing + this._marginLeft;
        let y = i * this._heightSpacing + this._marginTop;
        this._matrix[i].push(new Bit(this.context, this._generateRandomBit(), x, y));
    }

    _resizeMatrix() {
        // TODO deal with unbuilt matrix
        let newNumRows = parseInt(this.height/this._heightSpacing);
        let newNumCols = parseInt(this.width/this._widthSpacing);

        let numRowsDelta = newNumRows - this._numRows;
        let numColsDelta = newNumCols - this._numCols;

        if (numRowsDelta < 0) {
            this._matrix.splice(numRowsDelta, Math.abs(numRowsDelta));
        }
        
        else if (numRowsDelta > 0) {
            for (let i = this._numRows; i < this._numRows + numRowsDelta; i++) {
                this._addRowToMatrix(i);
            }
        }

        if (numColsDelta < 0) {
            for (let i = 0; i < newNumRows; i++) {
                this._matrix[i].splice(numColsDelta, Math.abs(numColsDelta));
            }
        }

        else if (numColsDelta > 0) {
            for (let i = 0; i < newNumRows; i++) {
                for (let j = this._numCols; j < this._numCols + numColsDelta; j++) {
                    this._addBitToMatrix(i, j);
                }
            }
        }

        this._numRows = newNumRows;
        this._numCols = newNumCols;

    }

    _draw() {
        this.context.clearRect(0,0, this.canvas.width, this.canvas.height);
        for(let i = 0; i < this._matrix.length; i++) {
            for(let j = 0; j < this._matrix[i].length; j++) {
                let currentBit = this._matrix[i][j];
                if (!currentBit.animating && Math.random() < .01) {
                    currentBit.triggerAnimation();
                }
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
}