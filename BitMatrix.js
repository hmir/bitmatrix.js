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

        if (this.opacity === this.maxOpacity) {
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
        if (this.fadingIn && this.opacity < this.maxOpacity) {
            this.opacity += this.fadeDelta;
        }
        else if(this.fadingOut && this.opacity > this.minOpacity) {
            this.opacity -= this.fadeDelta;
        }

        if (this.opacity <= this.minOpacity) {
            this.opacity = this.minOpacity;
            this.animating = false;
        }
        else if(this.opacity >= this.maxOpacity) {
            this.opacity = this.maxOpacity;
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
    constructor(canvas, width, height, color, bitFadeInProb=0.33, fadeInIncreaseRate=.00001, bitFadeOutProb=0.05, fadeOutIncreaseRate=1, minBitOpacity=0, maxBitOpacity=1, bitFadeDelta=0.05, fontFamily='monospace', fontSizePx=12, fontWeight='normal') {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');

        this._numRows = 0;
        this._numCols = 0;

        this._matrix = [];

        this.bitFadeInProb = bitFadeInProb;
        this.fadeInIncreaseRate = fadeInIncreaseRate;
        this.currentFadeInProb = 0;
        this.bitFadeOutProb = bitFadeOutProb;
        this.fadeOutIncreaseRate = fadeOutIncreaseRate;
        this.currentFadeOutProb= 0;

        this.minBitOpacity = minBitOpacity;
        this.maxBitOpacity = maxBitOpacity;
        this.bitFadeDelta = bitFadeDelta;

        this._setupCanvas(width, height, color, fontFamily, fontSizePx, fontWeight);

        this.requestAnimFrame = null;
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
        let newBit;
        newBit = new Bit(
            this.context, this._generateRandomBit(), x, y, this.minBitOpacity, this.maxBitOpacity, this.bitFadeDelta
        );
        this._matrix[i].push(newBit);
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
                if (currentBit.opacity === currentBit.minOpacity && this._returnTrueWithProb(this.currentFadeInProb)) {
                    currentBit.triggerAnimation();
                }
                else if(currentBit.opacity === currentBit.maxOpacity && this._returnTrueWithProb(this.currentFadeOutProb)) {
                    currentBit.triggerAnimation();
                }
                currentBit.draw();
            }
        }

        this._increaseFadeProbabilities();
        this._requestDraw();

    }

    _increaseFadeProbabilities() {
        if (this.currentFadeInProb < this.bitFadeInProb) {
            this.currentFadeInProb += this.fadeInIncreaseRate;
        }

        if (this.currentFadeOutProb < this.bitFadeOutProb) {
            this.currentFadeOutProb += this.fadeOutIncreaseRate;
        }

        if (this.currentFadeInProb > this.bitFadeInProb) {
            this.currentFadeInProb = this.bitFadeInProb;
        }

        if (this.currentFadeOutProb > this.bitFadeOutProb) {
            this.currentFadeOutProb = this.bitFadeOutProb;
        }
    }

    _requestDraw() {
        let ref = this;
        window.requestAnimationFrame(() => {
            ref._draw();
        });
    }

    _generateRandomBit() {
        return Math.floor(Math.random() * 2);
    }

    _returnTrueWithProb(prob) {
        return Math.random() < prob;
    }
}