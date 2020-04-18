let pixelSize = 30;

class SShape{
    constructor(x,y,color){
        this.x = x;
        this.y = y;
        this.color = color;
        this.internalGrid = initInternalGrid(3,3);

        this.internalGrid[1][0] = 'x';
        this.internalGrid[2][0] = 'x';
        this.internalGrid[1][1] = 'x';
        this.internalGrid[0][1] = 'x';
    }
}

class ZShape{
    constructor(x,y,color){
        this.x = x;
        this.y = y;
        this.color = color;
        this.internalGrid = initInternalGrid(3,3);

        this.internalGrid[0][0] = 'x';
        this.internalGrid[1][0] = 'x';
        this.internalGrid[1][1] = 'x';
        this.internalGrid[2][1] = 'x';
    }
}

class TShape{
    constructor(x,y,color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.internalGrid = initInternalGrid(3,3);

        this.internalGrid[1][0] = 'x';
        this.internalGrid[0][1] = 'x';
        this.internalGrid[1][1] = 'x';
        this.internalGrid[2][1] = 'x';
    }
}

class JShape{
    constructor(x,y,color) {
        this.x = x;
        this.y = y;
        this.color = color;

        this.internalGrid = initInternalGrid(3,3);
        this.internalGrid[2][0] = 'x';
        this.internalGrid[2][1] = 'x';
        this.internalGrid[1][1] = 'x';
        this.internalGrid[0][1] = 'x;'
    }
}

class LShape{
    constructor(x,y,color){
        this.x = x;
        this.y = y;
        this.color = color;

        this.internalGrid = initInternalGrid(3,3);

        this.internalGrid[0][0]='x';
        this.internalGrid[0][1]='x';
        this.internalGrid[1][1] = 'x';
        this.internalGrid[2][1]='x';
    }
}

class Square{
    constructor(x,y,color) {
        this.x = x;
        this.y = y;
        this.color = color;

        this.internalGrid = initInternalGrid(4,3);
        this.internalGrid[1][0] = 'x';
        this.internalGrid[2][0] = 'x';
        this.internalGrid[1][1] = 'x';
        this.internalGrid[2][1] = 'x;'
    }
}

class LongRectangle{

    constructor(x,y,color){
        this.x = x;
        this.y = y;
        this.color = color;

        this.internalGrid = initInternalGrid(4,4);

        this.internalGrid[0][1] = 'x';
        this.internalGrid[1][1] = 'x';
        this.internalGrid[2][1] = 'x';
        this.internalGrid[3][1] = 'x';
    }
}

function drawShape(grid, shape, inSnapGrid = false){
    for (let i = 0; i < shape.internalGrid.length; ++i){
        for (let j = 0; j < shape.internalGrid[i].length; ++j){
            let offsetX = i+shape.x;
            let offsetY = j+shape.y;
            if (getGridVal(grid,offsetX,offsetY)) continue;
            setGridVal(inSnapGrid ? snap : grid, offsetX,offsetY, shape.internalGrid[i][j] ? shape.color : '');
        }
    }
}

function initInternalGrid(w,h){
    let toRet = new Array(w);
    for (let i = 0; i < toRet.length; ++i){
        toRet[i] = new Array(h);
    }
    for (let i = 0; i < toRet.length; ++i){
        for (let j = 0; j < toRet[i].length; ++j){
            toRet[i][j] = "";
        }
    }
    return toRet;
}

function rotate(array) {
    var result = [];
    array.forEach(function (a, i, aa) {
        a.forEach(function (b, j, bb) {
            result[bb.length - j - 1] = result[bb.length - j - 1] || [];
            result[bb.length - j - 1][i] = b;
        });
    });
    return result;
}

function kickBack(shape, newInternalGrid, grid){
    for (let x = 0; x < newInternalGrid.length; x++){
        for (let y = 0; y < newInternalGrid[x].length; y++){
            let offsetX = shape.x + x;
            let offsetY = shape.y+y;
            if (offsetX < 0){
                shape.x += -1*offsetX;
                return true;
            }
            if (offsetX+1 > gridWidth){
                shape.x -= x;
                return true;
            }
            if (offsetY+1 > gridHeight){
                shape.y -= y;
                return true;
            }
            if ( getGridVal(grid, offsetX, offsetY) &&
                 newInternalGrid[x][y] &&
                 !shape.internalGrid[x][y]) {
                console.log("HEH")
                return false;
            }
        }
    }
    return true;
    if (shape.x < 0) shape.x = 0;

    // find the right most active cell in the internal grid
    let x = -1;
    let y = -1;
    let found = false;
    for (x = shape.internalGrid.length-1; x >= 0; x--){
        for (y = 0; y < shape.internalGrid[x].length; y++){
            if (shape.internalGrid[x][y]){
                found = true;
                break;
            }
        }
        if (found) break;
    }
    if ((shape.x + x) >= gridWidth) {
        shape.x -= 1;
    }
}

function setGridVal(grid,x,y,val){
    let oneD = x*gridHeight+y;
    grid[oneD]=val;
}

function getGridVal(grid,x,y){
    let oneD = x*gridHeight+y;
    return grid[oneD];
}

function getRandomShape(x,y){
    let rand = Math.floor(Math.random() * Math.floor(7));
    let colors = ['aqua','blue','orange','gray','green','purple','red'];
    let randCol = Math.floor(Math.random() * Math.floor(colors.length));
    let color = colors[randCol];
    switch (rand){
        case 0:
            return new LongRectangle(x,y,color);
        case 1:
            return new JShape(x,y,color);
        case 2:
            return new LShape(x,y,color);
        case 3:
            return new Square(x,y,color);
        case 4:
            return new TShape(x,y,color);
        case 5:
            return new ZShape(x,y,color);
        case 6:
            return new SShape(x,y,color);
    }
}
let arrowUp = 38;
let arrowRight = 39;
let arrowDown = 40;
let arrowLeft = 37;
let grid = {};
let snap = {};
let gridHeight = 0;
let gridWidth = 0;

function initTetris(){
    let CANVAS = $("#mycanvas");
    $("#canvasDiv").keydown(canvasKeyUp);
    $("#canvasDiv").focus();
    CANVAS.mousemove(canvasMouseMove);
    let CTX = CANVAS.get(0).getContext("2d");
    gridHeight = CANVAS.height() / pixelSize;
    gridWidth = CANVAS.width() / pixelSize;
    gridWidth = 300/pixelSize;
    console.log("Initing grid with: " + gridWidth + " x " + gridHeight);
    clearGrid();

    doDraw(CTX, CANVAS);
}

$(document).ready(() =>  {

    $("#btnTetris").click(function(){
      initTetris();
    })
})

function clearGrid(){
    // init the grid
    for (let i = 0; i < gridWidth; i++){
        for (let k = 0; k < gridHeight; k++){
            let oneD = i*gridHeight + k;
            grid[oneD] = "";
        }
    }
}

function printGrid(){
    for (let i = 0; i < gridWidth; i++){
        for (let k = 0; k < gridHeight; k++){
            let oneD = i*gridHeight + k;
            console.log(`Grid ${i},${k} = ${grid[oneD]}`)
        }
    }
}

function canvasMouseMove(e){
    return;
    let x = e.offsetX;
    let y = e.offsetY;
    if (x < 0 || y < 0) return;
    let i = Math.floor(x/pixelSize);
    let k = Math.floor(y/pixelSize);
    let oneD = i*gridHeight+k;
    if (i >= gridWidth || k >= gridHeight) return;
    grid[oneD] = 'h';
}

function canvasKeyUp(e){
    keyboard[e.which] = true;
}

function canMove(shape,grid,dir){
    for (let x = 0; x < shape.internalGrid.length; x++){
        for (let y = 0; y < shape.internalGrid[x].length; y++){
            if (!shape.internalGrid[x][y]) continue;
            if (x+dir.x >= 0 &&
                y+dir.y >= 0 &&
                x+dir.x < shape.internalGrid.length &&
                y+dir.y < shape.internalGrid[x+dir.x].length) {
                if (shape.internalGrid[x + dir.x][y + dir.y]) {
                    continue
                };
            }
            let offsetX = shape.x+x+dir.x;
            let offsetY = shape.y+y+dir.y;
            if (getGridVal(grid,offsetX,offsetY)) {
                //console.log(`Got stopped @ ${x},${y} offset ${offsetX},${offsetY} = ${getGridVal(grid,offsetX,offsetY)}`);
                return false;
            }
            if (offsetY >= gridHeight) return false;
            if (offsetX >= gridWidth) return false;
            if (offsetY < 0) return false;
            if (offsetX < 0) return false;
        }
    }
    return true;
}

function canMoveLeft(shape, grid){
    return canMove(shape,grid,{x:-1,y:0});
}

function canMoveUp(shape, grid){
    return canMove(shape,grid,{x:0,y:-1});
}

function canMoveDown(shape, grid){
    return canMove(shape,grid,{x:0,y:1});
}

function canMoveRight(shape, grid){
    return canMove(shape,grid,{x:1,y:0});
}

function copyInternalGrid(shape){
    let toRet = new Array(shape.internalGrid.length);
    for (let i = 0; i < shape.internalGrid.length; i++){
        toRet[i] = new Array(shape.internalGrid[i].length);
        for (let k = 0; k < shape.internalGrid[i].length; k++){
            toRet[i][k] = shape.internalGrid[i][k];
        }
    }
    return toRet;
}

function copyShape(shape){
    let toRet = new LongRectangle(shape.x,shape.y,shape.color);
    toRet.internalGrid = shape.internalGrid;
    return toRet;
}

let keyboard = {};
let shapes = [];
let activeShape = getRandomShape(gridWidth/2,0);
let t1 = 0;
let shapeVelocity = 1;
let stopGameLoop = false;
let nextShape = getRandomShape(gridWidth/2,0);
let projectionShape = false;
let score = 0;
let stored = false;

async function doDraw(ctx, canvas) {
    let it = 0;
    let cntr = 0;
    while (!stopGameLoop) {
        ctx.fillStyle = 'white'
        it++;
        let t2 = performance.now();
        let deltaMS = t2 - t1;
        t1 = t2;
        cntr += deltaMS;
        ctx.clearRect(0, 0, canvas.width(), canvas.height());

        if (!activeShape){
            activeShape = nextShape;
            nextShape = getRandomShape(gridWidth/2,0);
        }

        let shouldMoveActiveDown = (cntr >= 1000);
        let didSwapStored = false;
        if (cntr >= 1000) cntr = 0;
        if (activeShape) {
            // handle keyboard
            if (keyboard[arrowDown]) {
                shouldMoveActiveDown = true;
            }
            else if (keyboard[arrowUp]) {
                if (activeShape.constructor.name != 'Square') {
                    let initialInternalGrid = copyInternalGrid(activeShape);
                    let newInternalGrid = rotate(activeShape.internalGrid);
                    let applyIt = true;
                    if (!kickBack(activeShape, newInternalGrid, grid)){
                        activeShape.internalGrid = newInternalGrid;
                        if (canMoveUp(activeShape,grid)){
                            activeShape.y -= 1;
                        }
                        else if (canMoveRight(activeShape,grid)){
                            activeShape.x += 1;
                        }
                        else if (canMoveDown(activeShape,grid)){
                            activeShape.y += 1;
                        }
                        else if (canMoveRight(activeShape,grid)){
                            activeShape.x -= 1;
                        }
                        else{
                            applyIt = false;
                        }
                    }
                    activeShape.internalGrid = applyIt ? newInternalGrid : initialInternalGrid;
                }
                shouldMoveActiveDown = false
            }
            else if (keyboard[arrowRight] && canMoveRight(activeShape,grid)) {
                activeShape.x += 1;
                shouldMoveActiveDown = false
            }
            else if (keyboard[arrowLeft] && canMoveLeft(activeShape,grid)) {
                activeShape.x -= 1;
                shouldMoveActiveDown = false
            }
            else if (keyboard[32] && projectionShape){ // space
                activeShape.x = projectionShape.x;
                activeShape.y = projectionShape.y;
                shapes.push(activeShape);
                activeShape = false;
            }
            else if (keyboard[83]) { // stored
                let activeTemp = copyShape(activeShape);
                let newActive = false;
                let hadStored = true;
                if (stored){
                    newActive = stored;
                }
                else {
                    hadStored = false;
                    newActive = nextShape;
                }

                // Can we do it?
                let initialInternalGrid = copyInternalGrid(activeShape);
                let newInternalGrid = newActive.internalGrid;
                let applyIt = true;
                if (!kickBack(activeShape, newInternalGrid, grid)){
                    activeShape.internalGrid = newInternalGrid;
                    if (canMoveUp(activeShape,grid)){
                        activeShape.y -= 1;
                    }
                    else if (canMoveRight(activeShape,grid)){
                        activeShape.x += 1;
                    }
                    else if (canMoveDown(activeShape,grid)){
                        activeShape.y += 1;
                    }
                    else if (canMoveRight(activeShape,grid)){
                        activeShape.x -= 1;
                    }
                    else{
                        applyIt = false;
                    }
                }

                if (applyIt) {
                    didSwapStored = true;
                    stored = activeTemp;
                    if (!hadStored) {
                        nextShape = getRandomShape(gridWidth / 2, 0);
                    }
                    activeShape = newActive;
                }
                else{
                    activeShape.internalGrid = initialInternalGrid;
                }
            }
        }

        if (activeShape){
            if (shouldMoveActiveDown && !didSwapStored) {
                if (!canMoveDown(activeShape,grid)){
                    //console.log("Canot move down setting!" + `${activeShape.x},${activeShape.y}`)
                    shapes.push(activeShape);
                    activeShape = false;
                }
                else {
                    activeShape.y += shapeVelocity;
                }
            }
        }

        clearGrid();
        for (let i = 0; i < gridWidth; i++){
            for (let k = 0; k < gridHeight; k++){
                if (getGridVal(snap,i,k)){
                    setGridVal(grid,i,k,getGridVal(snap,i,k));
                }
            }
        }

        for (let i = 0; i < shapes.length; i++){
            drawShape(grid, shapes[i],true);
        }
        shapes = [];

        // Check for wins
        for (i = gridHeight-1; i >= 0; i--){
            let winRow = true;
            for (k = 0; k < gridWidth; k++){
                if (!getGridVal(grid,k,i)){
                    winRow = false;
                    break;
                }
            }
            if (winRow){
                console.log("WINRAW");
                score += 100;
                for (k = 0; k < gridWidth; k++){
                    setGridVal(snap,k,i,'');
                }
                // bring everything down
                for (i2 = i; i2 > 0; i2--){
                    for (k = 0; k < gridWidth; k++){
                        setGridVal(snap,k,i2,getGridVal(snap,k,i2-1));
                    }
                }
                break;
            }
        }

        if (activeShape) {
            projectionShape = new LongRectangle(0, 0, activeShape.color);
            projectionShape.x = activeShape.x;
            projectionShape.y = activeShape.y;
            projectionShape.internalGrid = activeShape.internalGrid;
            while (canMoveDown(projectionShape, grid)) {
                projectionShape.y += 1;
            }
        }

        if (activeShape) {
            drawShape(grid, activeShape);
        }
        for (i = 0; i < gridWidth; i++){
            for (k = 0; k < gridHeight; k++){
                let x = i * pixelSize;
                let y = k * pixelSize;
                ctx.fillRect(x,y,pixelSize, pixelSize);
                if (!getGridVal(grid,i,k)){
                    let offset = 1;
                    ctx.clearRect(x+offset, y+offset, pixelSize - 2*offset, pixelSize - 2*offset);
                }
                else{
                    let offset = 1;
                    ctx.fillStyle = getGridVal(grid,i,k);
                    ctx.fillRect(x+offset, y+offset, pixelSize - 2*offset, pixelSize - 2*offset);
                }
                ctx.fillStyle = 'white';

            }
        }

        // We draw the projection shape
        if (projectionShape){
            for (let i = 0; i < projectionShape.internalGrid.length; i++){
                for (let k = 0; k < projectionShape.internalGrid[i].length; k++){
                    let doDraw = true;
                    // any intersection
                    if (activeShape) {
                        let px = projectionShape.x + i;
                        let py = projectionShape.y + k;
                        for (let ai = 0; ai < activeShape.internalGrid.length; ai++) {
                            for (let ak = 0; ak < activeShape.internalGrid[ai].length; ak++) {
                                if (!activeShape.internalGrid[ai][ak])continue;
                                let aix = activeShape.x + ai;
                                let aiy = activeShape.y + ak;
                                if (aix == px && aiy == py) {
                                    doDraw = false;
                                    break;
                                }
                            }
                            if (!doDraw) break;
                        }
                    }
                    if (!doDraw) continue;

                    ctx.fillStyle = 'white';
                    if (!projectionShape.internalGrid[i][k]) continue;
                    let x = (projectionShape.x + i) * pixelSize;
                    let y = (projectionShape.y + k) * pixelSize;
                    let offset = 1;
                    ctx.fillRect(x, y, pixelSize, pixelSize);
                    ctx.fillStyle = projectionShape.color;
                    ctx.fillRect(x+offset, y+offset, pixelSize - 2*offset, pixelSize - 2*offset);
                    offset = 2;
                    ctx.clearRect(x+offset, y+offset,
                       pixelSize - 2*offset, pixelSize -2*offset);
                }
            }
        }
        ctx.fillStyle = 'white';
        // Draw our next shape
        if (nextShape){
            let offsetX = 250 + ((300)/2);
            let offsetY = 50;
            ctx.font = '48px serif';
            ctx.fillStyle = 'black';
            ctx.fillText("Next",offsetX, offsetY);
            ctx.fillText("Score: " + score, offsetX-50, 550);
            offsetY = 100;
            drawOnCanvas(ctx,nextShape,offsetX,offsetY);
            offsetY = 300;
            ctx.fillStyle = 'black';
            ctx.fillText("Stored",offsetX, 250);

            if (stored){
                drawOnCanvas(ctx,stored,offsetX,offsetY);
            }
        }
        ctx.fillStyle = 'black';
        ctx.font = '38px serif';
        ctx.fillText("Instructions",600, 50);
        ctx.font = '18px serif';
        ctx.fillText("Arrow keys to move around",600, 80);
        ctx.fillText("Space to force drop",600, 100);
        ctx.fillText("'s' key to swap between stored shapes",600, 120);

        // draw the border
        ctx.beginPath();
        ctx.moveTo(gridWidth*pixelSize,0);
        ctx.lineTo(gridWidth*pixelSize,gridHeight*pixelSize);
        ctx.stroke();
        ctx.fillStyle = 'white';
        keyboard = {};
        await sleep(10);
    }
}

function drawOnCanvas(ctx,nextShape, offsetX, offsetY){
    ctx.fillStyle = 'white';
    for (let i = 0; i < nextShape.internalGrid.length; i++){
        for (let k = 0; k < nextShape.internalGrid[i].length; k++){
            if (!nextShape.internalGrid[i][k]) continue;
            let x = (offsetX) + i*pixelSize;
            let y = (offsetY) + k*pixelSize;
            ctx.fillRect(x, y, pixelSize, pixelSize);
            ctx.fillStyle = nextShape.color;
            ctx.fillRect(x+1, y+1, pixelSize - 2, pixelSize - 2);
            ctx.fillStyle = 'white';
        }
    }
}

function queueShape(x,y){
    activeShape = getRandomShape(x,y);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}