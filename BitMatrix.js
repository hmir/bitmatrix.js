function getBool(trueProb) {
    return Math.random() < trueProb;
}

class Bit {
    constructor(context, val, x, y, fadeOptions) {
        this.context = context;
        this.val = val;

        this.x = x;
        this.y = y;

        this.fadingIn = false;
        this.fadingOut = false;
        this.animating = false;

        this.minOpacity = fadeOptions.minBitOpacity;
        this.maxOpacity = fadeOptions.maxBitOpacity;
        this.opacity = fadeOptions.minBitOpacity;

        this.fadeDelta = fadeOptions.bitFadeDelta;

        this.fadeInProb = fadeOptions.fadeInProb;
        this.fadeInProbIncrement = fadeOptions.fadeInProbIncrement;
        this.fadeOutProb = fadeOptions.fadeOutProb;
        this.fadeOutProbIncrement = fadeOptions.fadeOutProbIncrement;

        this._currentFadeInProb = 0;
        this._currentFadeOutProb = 0;
    }

    _incrementFadeProbs() {
        if (this._currentFadeInProb < this.fadeInProb) {
            this._currentFadeInProb += this.fadeInProbIncrement;
        }

        if (this._currentFadeOutProb < this.fadeOutProb) {
            this._currentFadeOutProb += this.fadeOutProbIncrement;
        }

        if (this._currentFadeInProb > this.fadeInProb) {
            this._currentFadeInProb = this.fadeInProb;
        }

        if (this._currentFadeOutProb > this.fadeOutProb) { 
            this._currentFadeOutProb = this.fadeOutProb;
        }
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

    switchBitVal() {
        this.val = this.val === 1 ? 0 : 1;
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

        if (this.opacity === this.minOpacity && getBool(this._currentFadeInProb) || 
            this.opacity === this.maxOpacity && getBool(this._currentFadeOutProb)) {
            this.triggerAnimation();
        }

        this.animateFade();
        this.context.globalAlpha = this.opacity;
        this.context.fillText(this.val, this.x, this.y);

        this._incrementFadeProbs();
    }
}

class BitMatrix {
    constructor(canvas, width, height, props) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');

        for(let key in props) {
            this[key] = props[key];
        }

        this._currentFadeInProb = 0;
        this._currentFadeOutProb = 0;

        this._numRows = 0;
        this._numCols = 0;
        this._matrix = [];

        this._setupCanvas(width, height, this.textOptions, this.padding)
    }

    _setupCanvas(width, height, textOptions, padding) {
        this.width = width;
        this.height = height;

        this.canvas.width = width * window.devicePixelRatio;
        this.canvas.height = height * window.devicePixelRatio;

        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';

        this.context.fillStyle = textOptions.textColor;

        this.textOptions.fontFamily = textOptions.fontFamily;
        this.textOptions.fontSizePx = textOptions.fontSizePx;
        this.textOptions.fontWeight = textOptions.fontWeight;

        this.padding.horizontal = padding.horizontal;
        this.padding.vertical = padding.vertical;

        this._widthSpacing = this.textOptions.fontSizePx + this.padding.horizontal;
        this._heightSpacing = this.textOptions.fontSizePx + this.padding.vertical;

        this._marginLeft = this._widthSpacing/2;
        this._marginTop = this._heightSpacing/2;

        this.context.font = this.textOptions.fontWeight + ' ' + this.textOptions.fontSizePx + 'px ' + this.textOptions.fontFamily;
        this.context.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    resizeCanvas(width, height) {
        this._setupCanvas(width, height, this.textOptions, this.padding);
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
        let newBit = new Bit(this.context, this._generateRandomBit(), x, y, this.fadeOptions);
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

                let isAtMinOpacity = currentBit.opacity === this.fadeOptions.minBitOpacity;
                let isAtMaxOpacity = currentBit.opacity === this.fadeOptions.maxBitOpacity;

                if (!(this.bitValueOptions.onlySwitchOnMinOpacity && !isAtMinOpacity) && 
                    !(this.bitValueOptions.onlySwitchOnMaxOpacity && !isAtMaxOpacity)) {

                    if (currentBit.val === 0 && getBool(this.bitValueOptions.switchToZeroProb) || 
                        currentBit.val === 1 && getBool(this.bitValueOptions.switchToOneProb)) {
                        currentBit.switchBitVal();
                    }
                }

                currentBit.draw();
            }
        }

        this._requestDraw();

    }

    _requestDraw() {
        let ref = this;
        window.requestAnimationFrame(() => {
            ref._draw();
        });
    }

    _generateRandomBit() {
        return getBool(this.bitValueOptions.initialZeroProb) ? 0 : 1;
    }
}