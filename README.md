## bitmatrix.js

### A JavaScript library for creating an animated array of bits

### `Usage`

```javascript
// BitMatrix constructor takes three parameters:
//    @containerId: ID of the parent dom element
//    @props: json options file path OR json object
//    @callback: callback executed after constructor is called (optional)
new BitMatrix('matrix_container', 'BitMatrixProps.json');
```

See test.html for a more in-depth example

-------------------------------

### `Options`

The following properties should be included in the JSON file or object passed into the BitMatrix class

key | description | type
----|---------|------
`fps` | frames per second of the canvas animation |  number
`fadeOptions.minBitOpacity` | lowest  opacity value a bit will reach | number
`fadeOptions.maxBitOpacity` |  highest  opacity value a bit will reach | number
`fadeOptions.bitFadeDelta` | amount that bit opacity increases or decreases per frame |  number
`fadeOptions.fadeInProb` | maximum probability per frame that a bit will fade in  | number
`fadeOptions.fadeInProbIncrement` | amount per frame by which the probability of a bit fading in per frame increases | number
`fadeOptions.fadeOutProb` | maximum probability per frame that a bit will fade out | number
`fadeOptions.fadeOutProbIncrement` | amount per frame by which the probability of a bit fading out per frame increases | number
`bitValueOptions.initialZeroProb` | probability that each bit is intialized with a value of `0` when the animation starts | number
`bitValueOptions.switchToZeroProb` | probability that a bit with a value of `1` switches to `0` per frame | number
`bitValueOptions.switchToOneProb` | probability that a bit with a value of `0` switches to `1` per frame | number
`bitValueOptions.onlySwitchOnMinOpacity` | determines if the value of a bit can only change when it has reached it's minimum opacity | boolean
`bitValueOptions.onlySwitchOnMaxOpacity` | determines if the value of a bit can only change when it has reached it's maximum opacity | boolean
`bitValueOptions.onlySwitchOnceAtMinOpacity` | determines if the value of a bit can only change one time when it has reached it's minimum opacity | boolean
`bitValueOptions.onlySwitchOnceAtMaxOpacity` | determines if the value of a bit can only change one time when it has reached it's maximum opacity  | boolean
