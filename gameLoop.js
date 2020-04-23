
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


    constructor(onUserUpdateFunc, onUserStartFunc, onUserDrawFunc, drawFps = true, fpsColor = 'black'){
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
        this._fpsColor = fpsColor;
        this.mouseX = 0;
        this.mouseY = 0;
        this.buttons = [];
        this.mouseClicks = [];
        this.btnsClicked = [];
        this.imgs = {};
    };

    init(canvasId, canvasDivId, width = 0, height = 0){
        this.canvasId = canvasId;
        let CANVAS = $("#" + canvasId);
        let canvasDiv = $("#"+canvasDivId);
        canvasDiv.keydown((e) => this.canvasKeyDown(e));
        canvasDiv.keyup((e) => this.canvasKeyUp(e));
        canvasDiv.mousemove((e) => this.canvasMouseMove(e));
        canvasDiv.mouseup((e) => this.canvasMouseClick(e));
        canvasDiv.focus();

        let CTX = CANVAS.get(0).getContext("2d");

        if (width && height){
            CTX.canvas.width = width;
            CTX.canvas.height = height;
        }

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

        this._internalUpdate(deltaMS);
        if (this._onUserStartFunc) {
            this._onUserUpdate(deltaMS);
        }
        this._internalDraw(CTX);
        if (this._onUserDrawFunc) {
            this._onUserDrawFunc(CTX);
        }
        if (this._drawFps) {
            this.drawFps(CTX, fps);
        }

        this.mouseClicks = [];
        this.btnsClicked = [];
        this._frameCntr++;
        window.requestAnimationFrame((time) => this.gameLoop(CTX, CANVAS));
    };

    _internalUpdate(deltaMS){
        // little box for the mouse
        let setPointer = false;
        let btnClicked = null;
        let mouse = {x:this.mouseX, y:this.mouseY, width:1,height:1};
        for (let i = 0; i < this.buttons.length; i++){
            let b = this.buttons[i];
            if (Utils.testAABB(mouse, b)){
                setPointer = true;
                break;
            }
        }
        if (setPointer){
            $("#" + this.canvasId).css('cursor','pointer')
        }
        else{
            $("#" + this.canvasId).css('cursor','auto')
        }

        // Check for mouse clicks
        for (let i = 0; i < this.mouseClicks.length; i++) {
            let mc = this.mouseClicks[i];
            mouse = {x: mc.x, y: mc.y, width: 1, height: 1};
            for (let k = 0; k < this.buttons.length; k++) {
                let b = this.buttons[k];
                if (Utils.testAABB(mouse, b)) {
                    this.btnsClicked.push(b);
                }
            }
        }
    };

    _internalDraw(CTX){
        for (let i = 0; i < this.buttons.length; i++){
            let b = this.buttons[i];
            this.drawButton(CTX, b);
        }
    }

    drawFps(CTX, fps){
        fps = Math.floor(fps);

        CTX.font = '18px serif';
        CTX.fillStyle = this._fpsColor;

        let txt = 'FPS: ' + fps;
        let txtWidth = CTX.measureText(txt);
        CTX.fillText(txt,this.canvasWidth-txtWidth.width-5, 20);
    };
    drawButton(CTX, btn){
        let prevFill = CTX.fillStyle;
        let txtWidth = CTX.measureText(btn.txt);

        let height = this.getTextHeight(btn.font).height;
        let btnPadding = 5;

        if (btn.img) {
            const image = new Image(60, 45); // Using optional size for image
            image.src = btn.img;
            image.onload = () => {
                this.imgs[image.src+""] = image;
            };
            if (this.imgs[image.src]) {
                CTX.drawImage(this.imgs[image.src], btn.imgSX, btn.imgSY, btn.imgSW, btn.imgSH,
                    btn.x, btn.y, btn.imgSW, btn.imgSH);
            } else {
                CTX.drawImage(image, btn.x, btn.y, btn.width, btn.height);
            }
            CTX.globalAlpha = 0.2;
        }

        CTX.fillStyle = btn.bg;
        CTX.fillRect(btn.x,btn.y,txtWidth.width + 2*btnPadding, height + 2*btnPadding);
        CTX.fillStyle = btn.fg;
        CTX.font = btn.font;
        CTX.fillText(btn.txt,btn.x+btnPadding,btn.y + height);
        CTX.fillStyle = prevFill;
        CTX.globalAlpha = 1.0;
    };

    addButtonToScene(ctx, id, x, y, txt, tag = null, font = '12pt Times', bg = 'lightgray',
                     fg = 'black', img=null, imgSX = 0, imgSY = 0, imgSW = 0, imgSH = 0){
        let btnPadding = 5;
        let height = this.getTextHeight(font).height+ 2*btnPadding;
        let txtWidth = ctx.measureText(txt).width+ 2*btnPadding;
        if (!txt){
            height = imgSH;
            txtWidth = imgSW;
        }
        let btn = {
            id: id,
            x: x,
            y: y,
            txt: txt,
            font: font,
            bg: bg,
            fg: fg,
            width: txtWidth,
            height: height + 10,
            tag: tag,
            img: img,
            imgSX: imgSX,
            imgSY: imgSY,
            imgSW: imgSW,
            imgSH: imgSH
        };
        this.buttons.push(btn);
        return btn;
    }

    getTextHeight(font) {

        return {height: 18};
        var text = $('<span>Hg</span>').css({ fontFamily: font });
        var block = $('<div style="display: inline-block; width: 1px; height: 0px;"></div>');

        var div = $('<div></div>');
        div.append(text, block);

        var body = $('body');
        body.append(div);

        try {

            var result = {};

            block.css({ verticalAlign: 'baseline' });
            result.ascent = block.offset().top - text.offset().top;

            block.css({ verticalAlign: 'bottom' });
            result.height = block.offset().top - text.offset().top;

            result.descent = result.height - result.ascent;

        } finally {
            div.remove();
        }
        return result;
    };

    clearCanvas(CTX, CANVAS){
        CTX.clearRect(0, 0, CANVAS.width(), CANVAS.height());
    };

    canvasMouseClick(e){
        this.mouseClicks.push({x:e.offsetX, y:e.offsetY});
    }

    canvasMouseMove(e){
        this.mouseX = e.offsetX;
        this.mouseY = e.offsetY;
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