// returns true with given probability
function getBool(trueProb) {
    return Math.random() < trueProb;
}

// contains the data for each bit in the matrix
class Bit {
    constructor(context, val, x, y, fadeOptions) {
        this.context = context; // canvas context to be drawn on
        this.val = val; // value drawn (0 or 1)

        this.x = x; // x position on canvas
        this.y = y; // y position on canvas

        this.fadingIn = false; // true if this bit is currently fading in
        this.fadingOut = false; // true if this bit is currently fading out
        this.animating = false; // true if fadingIn or fadingOut is true

        this.minOpacity = fadeOptions.minBitOpacity; // maximum opacity bit should reach
        this.maxOpacity = fadeOptions.maxBitOpacity; // minimum opacity bit should reach 
        this.opacity = fadeOptions.minBitOpacity; // current opacity of bit

        this.fadeDelta = fadeOptions.bitFadeDelta; // rate that opacity increases or decreases per frame

        // current probability per frame that the bit starts to fade in once reaching max opacity
        this._currentFadeInProb = 0;
        // maximum probability per frame that bit starts to fade in once reaching max opacity
        this.fadeInProb = fadeOptions.fadeInProb;
        // rate that _currentFadeInProb increases per frame
        this.fadeInProbIncrement = fadeOptions.fadeInProbIncrement;

        // current probability per frame that the bit starts to fade out once reaching min opacity
        this._currentFadeOutProb = 0;
        // maximum probability per frame that bit starts to fade out once reaching min opacity
        this.fadeOutProb = fadeOptions.fadeOutProb;
        // rate that _currentFadeOutProb increases per frame
        this.fadeOutProbIncrement = fadeOptions.fadeOutProbIncrement;

        // true if bit-value has switched, reset to false if triggerAnimation() is called
        this.switched = false;
    }

    // increment _currentFadeInProb and _currentFadeOutProb
    _incrementFadeProbs() {
        // increment _currentFadeInProb by fadeInProbIncrement if it is less than fadeInProb
        if (this._currentFadeInProb < this.fadeInProb) {
            this._currentFadeInProb += this.fadeInProbIncrement;
        }

        // increment _currentFadeOutProb by fadeOutProbIncrement if it is less than fadeOutProb
        if (this._currentFadeOutProb < this.fadeOutProb) {
            this._currentFadeOutProb += this.fadeOutProbIncrement;
        }

        // set _currentFadeInProb to fadeInProb if it exceeds fadeInProb
        if (this._currentFadeInProb > this.fadeInProb) {
            this._currentFadeInProb = this.fadeInProb;
        }

        // set _currentFadeOutProb to fadeInProb if it exceeds fadeOutProb
        if (this._currentFadeOutProb > this.fadeOutProb) { 
            this._currentFadeOutProb = this.fadeOutProb;
        }
    }


    // change values fadingIn or fadingOut
    triggerAnimation() {
        // if bit is already animating, exit function
        if (this.animating) {
            return;
        }

        // set fadingOut to true and fadingIn to false if bit is at max opacity
        if (this.opacity === this.maxOpacity) {
            this.fadingOut = true;
            this.fadingIn = false;
        }
        // set fadingOut to false and fadingIn to true if bit is at min opacity
        else {
            this.fadingIn = true;
            this.fadingOut = false;
        }

        // set animating to true and switched to false
        this.animating = true;
        this.switched = false;
    }

    // switch value of bit
    switchBitVal() {
        this.val = this.val === 1 ? 0 : 1;
        this.switched = true;
    }

    // increment or decrement opacity
    animateFade() {
        // increment opacity if fadingIn
        if (this.fadingIn && this.opacity < this.maxOpacity) {
            this.opacity += this.fadeDelta;
        }
        // decrement opacity if fadingOut 
        else if(this.fadingOut && this.opacity > this.minOpacity) {
            this.opacity -= this.fadeDelta;
        }

        // set opacity to min opacity if it is less than minOpacity
        if (this.opacity <= this.minOpacity) {
            this.opacity = this.minOpacity;
            this.animating = false;
        }
        // set opacity to max opacity if it exceeds maxOpacity
        else if(this.opacity >= this.maxOpacity) {
            this.opacity = this.maxOpacity;
            this.animating = false;
        }
    }

    // draw bit to context
    draw() {
        // call triggerAnimation() with the _currentFadeInProb or _currentFadeOutProb if bit is at min or max opacity
        if (this.opacity === this.minOpacity && getBool(this._currentFadeInProb) || 
            this.opacity === this.maxOpacity && getBool(this._currentFadeOutProb)) {
            this.triggerAnimation();
        }

        this.animateFade();
        this.context.globalAlpha = this.opacity; // set context opacity to this bit's opacity
        this.context.fillText(this.val, this.x, this.y); // draw text

        this._incrementFadeProbs(); // increment _currentFadeInProb and _currentFadeOutProb
    }
}

// contains the data for entire matrix drawn on the canvas
class BitMatrix {
    constructor(containerId, props) {
        this.canvas = document.createElement('canvas'); // canvas to be drawn on
        this.context = this.canvas.getContext('2d'); // canvas context

        this.container = document.getElementById(containerId); // dom element with specified id
        this.container.appendChild(this.canvas); // attach canvas to container

        this._numRows = 0; // number of rows of matrix
        this._numCols = 0; // number of columns of matrix
        this._matrix = []; // 2d array containig Bit objects

        this._matrixBuilt = false; // set to true once _buildMatrix() is called

        // if props is a string, try to read it in as a json file
        if (typeof props === 'string') {
            // initialize ref to this to maintain scope once inside callback
            let ref = this;
            // read in json file
            this._readJSONFile(props, (json) => {
                // parse raw json and start canvas animation
                ref._start(JSON.parse(json));
            });
        }
        // if props is not a string, treat it as a json object
        else {
            // start canvas animation
            this._start(props);
        }
    }

    // try to read in "file" as a json file and return data via callback
    _readJSONFile(file, callback) {
        let jsonFile = new XMLHttpRequest();
        jsonFile.overrideMimeType("application/json");
        jsonFile.open("GET", file, true);
        jsonFile.onreadystatechange = function() {
            if (jsonFile.readyState === 4 && jsonFile.status == "200") {
                callback(jsonFile.responseText);
            }
        }
        jsonFile.send(null);
    }

    // add each key of props as key of this object
    _addPropsToObject(props) {
        for(let key in props) {
            this[key] = props[key];
        }
    }

    // sets canvas size, padding, and font
    _setupCanvas() {
        // set frame duration in milliseconds
        this.frameDuration = (1/this.fps) * 1000;

        // set canvas dimensions
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;

        // scale canvas resolution based on device DPI
        this.canvas.width = this.width * window.devicePixelRatio;
        this.canvas.height = this.height * window.devicePixelRatio;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';

        // set text color
        this.context.fillStyle = this.textOptions.textColor;

        // _widthSpacing and _heightSpacing are distance between bits in pixels
        this._widthSpacing = this.textOptions.fontSizePx + this.padding.horizontal;
        this._heightSpacing = this.textOptions.fontSizePx + this.padding.vertical;

        // set distances of matrix from the left and top of the canvas
        this._marginLeft = this._widthSpacing/2;
        this._marginTop = this._heightSpacing/2;

        // set canvas font
        this.context.font = this.textOptions.fontWeight + ' ' + this.textOptions.fontSizePx + 'px ' + this.textOptions.fontFamily;

        // scale canvas elements based on device DPI
        this.context.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    // setup canvas, build matrix, and start canvas animation
    _start(props) {
        this._addPropsToObject(props);
        this._setupCanvas();
        this._buildMatrix();
        this._requestDraw();
    }

    // add Bit objects to _matrix 
    _buildMatrix() {
        // initialize _numRows and _numCols 
        this._numRows = parseInt(this.height/this._heightSpacing);
        this._numCols = parseInt(this.width/this._widthSpacing);

        // initialize _matrix
        for(let i = 0; i < this._numRows; i++) {
            this._addRowToMatrix(i);
        }

        this._matrixBuilt = true; // set _matrixBuilt to true
    }

    // add row of Bit objects to matrix
    _addRowToMatrix(i) {
        this._matrix.push([]); // append empty array to _matrix
        
        // add Bit to new row for each column in the matrix
        for(let j = 0; j < this._numCols; j++) {
            this._addBitToMatrix(i, j);
        }
    }

    // add a Bit object to a matrix row
    _addBitToMatrix(i, j) {
        // initialize Bit coordinates
        let x = j * this._widthSpacing + this._marginLeft;
        let y = i * this._heightSpacing + this._marginTop;
        
        // instantiate new Bit object
        let newBit = new Bit(this.context, this._generateRandomBit(), x, y, this.fadeOptions);

        // add new Bit object to matrix
        this._matrix[i].push(newBit);
    }

    // alters the number of matrix rows and columns based on current canvas size
    _resizeMatrix() {
        // if the matrix has yet to be initially created, exit this function
        if (!this._matrixBuilt) {
            return;
        }

        // recalculate number of rows and columns
        let newNumRows = parseInt(this.height/this._heightSpacing);
        let newNumCols = parseInt(this.width/this._widthSpacing);

        // calculate difference between new and old number of rows and columns
        let numRowsDelta = newNumRows - this._numRows;
        let numColsDelta = newNumCols - this._numCols;

        // if matrix has shrunk vertically, remove rows according to numRows delta
        if (numRowsDelta < 0) {
            this._matrix.splice(numRowsDelta, Math.abs(numRowsDelta));
        }
        
        // if matrix has grown vertically, add rows according to numRows delta
        else if (numRowsDelta > 0) {
            for (let i = this._numRows; i < this._numRows + numRowsDelta; i++) {
                this._addRowToMatrix(i);
            }
        }

        // if matrix has shrunk horizontally, remove columns according to numColsDelta
        if (numColsDelta < 0) {
            for (let i = 0; i < newNumRows; i++) {
                this._matrix[i].splice(numColsDelta, Math.abs(numColsDelta));
            }
        }

        // if matrix has shrunk horizontally, add columns according to numColsDelta
        else if (numColsDelta > 0) {
            for (let i = 0; i < newNumRows; i++) {
                for (let j = this._numCols; j < this._numCols + numColsDelta; j++) {
                    this._addBitToMatrix(i, j);
                }
            }
        }

        // reassign _numRows and _numCols
        this._numRows = newNumRows;
        this._numCols = newNumCols;

    }

    // draws matrix to context (should not be called directly, but rather invoked via _requestDraw())
    _draw() {
        // resize canvas and matrix if container has changed size
        if (this.container.clientWidth !== this.width || this.container.clientHeight !== this.height) {
            this._setupCanvas();
            this._resizeMatrix();
        }

        // clear canvas context
        this.context.clearRect(0,0, this.canvas.width, this.canvas.height);

        // iterate through each Bit object in the matrix and draw it
        for(let i = 0; i < this._matrix.length; i++) {
            for(let j = 0; j < this._matrix[i].length; j++) {
                let currentBit = this._matrix[i][j];

                // booleans indicating whether or not the current bit is at its maximum or minimum state
                let isAtMinOpacity = currentBit.opacity === this.fadeOptions.minBitOpacity;
                let isAtMaxOpacity = currentBit.opacity === this.fadeOptions.maxBitOpacity;

                // check if the conditions for switching the curent bit value are satisfied
                if (!(this.bitValueOptions.onlySwitchOnMinOpacity && !isAtMinOpacity) && 
                    !(this.bitValueOptions.onlySwitchOnMaxOpacity && !isAtMaxOpacity) &&
                    !(this.bitValueOptions.onlySwitchOnceAtMinOpacity && (!isAtMinOpacity || currentBit.switched)) &&
                    !(this.bitValueOptions.onlySwitchOnceAtMaxOpacity && (!isAtMaxOpacity || currentBit.switched))) {

                    // switch the value of the curent bit with the given probability
                    if (currentBit.val === 0 && getBool(this.bitValueOptions.switchToZeroProb) || 
                        currentBit.val === 1 && getBool(this.bitValueOptions.switchToOneProb)) {
                        currentBit.switchBitVal();
                    }
                }

                // draw the current bit onto the canvas
                currentBit.draw();
            }
        }

        // repeat draw animation
        this._requestDraw();

    }

    // calls requestAnimationFrame() using the _draw() method
    _requestDraw() {
        // initialize ref to this to maintain scope once inside callback 
        let ref = this;
        // call _draw() method after number of milliseconds specified by frameDuration
        setTimeout(() => {
            ref._draw();
        }, this.frameDuration);
    }

    // generates 0 or 1 based on given bitValueOptions.initializeZeroProb
    _generateRandomBit() {
        return getBool(this.bitValueOptions.initialZeroProb) ? 0 : 1;
    }
}