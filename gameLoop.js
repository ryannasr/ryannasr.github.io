
let Utils = {
    sleep: function(ms){
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    rand: function(top){
        return Math.floor(Math.random() * Math.floor(top));
    },
    testAABB: function(s1, s2){
        return (s1.x < (s2.x + s2.width) &&
            (s1.x + s1.width) > s2.x &&
            s1.y < (s2.y + s2.height) &&
            (s1.y + s1.height) > s2.y);
    },
    arrowKeyDown: 40,
    arrowKeyUp: 38,
    arrowKeyLeft: 37,
    arrowKeyRight: 39,
    spaceKey:32
}

let GameLoop = class {


    constructor(onUserUpdateFunc, onUserStartFunc, onUserDrawFunc, drawFps = true){
        this._onUserUpdate = onUserUpdateFunc;
        this._onUserStartFunc = onUserStartFunc;
        this._onUserDrawFunc = onUserDrawFunc;
        this._drawFps = drawFps;
        this.stopGameLoop = false;
        this._keyboardEvents = {};
        this.canvasWidth = 0;
        this.canvasHeight = 0;
        this.CTX = false;
        this.CANVAS = false;
        this.t1 = 0;
        this._started = 0;
        this._frameCntr = 0;
    };

    init(canvasId, canvasDivId){
        let CANVAS = $("#" + canvasId);
        let canvasDiv = $("#"+canvasDivId);
        canvasDiv.keydown((e) => this.canvasKeyDown(e));
        canvasDiv.keyup((e) => this.canvasKeyUp(e));
        canvasDiv.focus();

        let CTX = CANVAS.get(0).getContext("2d");
        this.canvasHeight = CANVAS.height();
        this.canvasWidth = CANVAS.width();

        this.CTX = CTX;
        this.CANVAS = CANVAS;

        console.log("Initializing game loop with: " + this.canvasWidth + " x " + this.canvasHeight);
    };

    run(){
        if (this._onUserStartFunc) {
            this._onUserStartFunc();
        }

        this._frameCntr = 0;
        this._started = performance.now();
        return this.gameLoop(this.CTX, this.CANVAS);
    }

    async gameLoop(CTX, CANVAS) {
        let t2 = performance.now();
        let deltaMS = t2 - this.t1;
        this.t1 = t2;
        let msPassed = t2 - this._started;
        if (msPassed > 5000) {
            this._started = t2;
            this._frameCntr = 0;
        }

        this.clearCanvas(CTX, CANVAS);
        let fps = this._frameCntr / (msPassed / 1000);

        if (this._onUserStartFunc) {
            this._onUserUpdate(deltaMS);
        }
        if (this._onUserDrawFunc) {
            this._onUserDrawFunc(CTX);
        }
        if (this._drawFps) {
            this.drawFps(CTX, fps);
        }

        this._frameCntr++;
        window.requestAnimationFrame((time) => this.gameLoop(CTX, CANVAS));
    };

    drawFps(CTX, fps){
        fps = Math.floor(fps);

        CTX.font = '18px serif';
        CTX.fillStyle = 'black';

        let txt = 'FPS: ' + fps;
        let txtWidth = CTX.measureText(txt);
        CTX.fillText(txt,this.canvasWidth-txtWidth.width-5, 20);
    };

    clearCanvas(CTX, CANVAS){
        CTX.clearRect(0, 0, CANVAS.width(), CANVAS.height());
    };

    canvasKeyUp(e){
        this._keyboardEvents[e.which] = false;
    };

    canvasKeyDown(e){
        this._keyboardEvents[e.which] = true;
    };

    getKeyPressed(key){
        return this._keyboardEvents[key];
    };
}