
$(document).ready(function(){
    $("#btnSnake").click(function(){
        Snake.init();
    })
});

let Snake = {

    List: class{
        constructor(head) {
            this.head = head;
        }

        getTail(){
            let node = this.head;
            while (node.next){
                node = node.next;
            }
            return node;
        }
    },

    Apple: class{
        constructor(x,y) {
            this.x = x;
            this.y = y;
            this.width = 10;
            this.height = 10;
        }
    },

    Node: class{
        constructor(x,y) {
            this.x = x;
            this.y = y;
            this.next = false;
            this.width = 10;
            this.height = 10;
            this.commandQueue = [];
        }
    },

    state: {
        list: false,
        lost:false,
        apples: [],
        appleSpawnTimer:0,
        dir: {x:0,y:0},
        moveTimer:0
    },
    vel : 10,

    init:function(){
        this.gameLoop = new GameLoop((ms) => this.update(ms),
            () => this.onSetup(), (ctx) => this.draw(ctx),
            true);
        this.gameLoop.init("mycanvas","canvasDiv",600,400);

        this.gameLoop.run();
    },

    onSetup: function() {
        // init the head
        let node = new Snake.Node(150,50);
        this.state.list = new Snake.List(node);
    },

    check:function(dir){
        let w = this.state.list.head.width;
        let h = this.state.list.head.height;
        let newPos = {x: this.state.list.head.x + dir.x, y: this.state.list.head.y + dir.y};

        if (newPos.x < 0) return false;
        if (newPos.x + w > this.gameLoop.canvasWidth) return false;
        if (newPos.y < 0) return false;
        if (newPos.y + h > this.gameLoop.canvasHeight) return false;

        let head = this.state.list.head;

        // If next is to my left i cant go left
        if (dir.x && dir.x > 0 && head.x < head.next.x) return false;
        if (dir.x && dir.x < 0 && head.x > head.next.x) return false;
        if (dir.y && dir.y > 0 && head.y < head.next.y) return false;
        if (dir.y && dir.y < 0 && head.y > head.next.y) return false;

        return true;
    },

    checkAndMove: function(dir){
        if (!this.check(dir)) return false;

        this.executeCommandAndPropagate(this.state.list.head,dir);

        return true;
    },

    executeCommandAndPropagate(node, dir){
        node.x += dir.x;
        node.y += dir.y;
        let next = node.next;
        if (next){
            if (dir.x){
                // Check if we are on the same row
                if (next.y == node.y){
                    // just move him
                    next.commandQueue.push(dir);
                }
                else{
                    // was going up/down and now right/left
                    next.commandQueue.push({x:0, y:node.y - next.y});
                }
            }
            else if (dir.y){
                // Check if we are on the same column
                if (next.x == node.x){
                    // just move him
                    next.commandQueue.push(dir);
                }
                else{
                    // was going left/right and now up/down
                    next.commandQueue.push({x:node.x-next.x,y:0})
                }
            }
        }
    },

    update:function(deltaMs){
        let newDir = false;
        if (this.gameLoop.getKeyPressed(Utils.arrowKeyLeft)) {
            newDir = {x: -1, y:0};
        }
        else if (this.gameLoop.getKeyPressed(Utils.arrowKeyRight)){
            newDir = {x: 1, y:0};
        }
        else if (this.gameLoop.getKeyPressed(Utils.arrowKeyUp)){
            newDir = {x: 0, y:-1};
        }
        else if (this.gameLoop.getKeyPressed(Utils.arrowKeyDown)){
            newDir = {x: 0, y:1};
        }
        if (newDir && this.check(newDir)){
            this.state.dir = newDir;
        }

        this.state.moveTimer += deltaMs;
        if (this.state.moveTimer >= 30) {
            let velDir = {
                x: this.state.dir.x * this.vel,
                y: this.state.dir.y * this.vel
            };
            this.checkAndMove(velDir);

            this.state.moveTimer = 0;
        }

        let node = this.state.list.head.next;
        while (node) {
            if (node.commandQueue.length > 0) {
                let cmd = node.commandQueue.shift();
                this.executeCommandAndPropagate(node, cmd);
            }
            node = node.next;
        }

        // Chek if head touching any part
        let head = this.state.list.head;
        node = this.state.list.head.next;
        while (node) {
            if (Utils.testAABB(head,node)){
                this.state.lost = true;
                break;
            }
            node = node.next;
        }

        let newApples = [];
        for (let i = 0; i < this.state.apples.length; i++){
            let a = this.state.apples[i];
            if (Utils.testAABB(head, a)){
                let newX = 0;
                let newY = 0;
                if (this.state.dir.x){
                    newY = head.y;
                    if (this.state.dir.x < 0){
                        // going left
                        newX = head.x - head.width;
                    }
                    else if (this.state.dir.x > 0){
                        newX = head.x + head.width;
                    }
                }
                else{
                    newX = head.x;
                    if (this.state.dir.y < 0){
                        newY = head.y - head.height;
                    }
                    else{
                        newY = head.y + head.height;
                    }
                }
                let newNode = new this.Node(newX, newY);
                newNode.next = this.state.list.head;
                this.state.list.head = newNode;
            }
            else{
                newApples.push(a);
            }
        }
        this.state.apples = newApples;

        this.state.appleSpawnTimer += deltaMs;
        if (this.state.appleSpawnTimer >= 1500){
            if (this.state.apples.length < 1) {
                this.state.apples.push(new this.Apple(Utils.rand(this.gameLoop.canvasWidth - 20) + 10,
                    Utils.rand(this.gameLoop.canvasHeight - 20) + 10));
            }
            this.state.appleSpawnTimer = 0;
        }
    },

    draw:function(ctx){
        ctx.fillStyle = 'black';
        let prevFill = ctx.fillStyle;

        if (this.state.lost){
            ctx.fillText("You lose!", this.gameLoop.canvasWidth/2, this.gameLoop.canvasHeight/2);
            return;
        }
        else {
            let start = this.state.list.head;
            ctx.fillStyle = 'black';
            let pad = 0;
            do {
                ctx.fillRect(start.x, start.y, start.width, start.height);
                ctx.clearRect(start.x + 2, start.y + 2, start.width - 4, start.height - 4);
            } while ((start = start.next));

            for (let i = 0; i < this.state.apples.length;i++){
                ctx.fillRect(this.state.apples[i].x,this.state.apples[i].y,this.state.apples[i].width,
                    this.state.apples[i].height);
            }
        }
        ctx.fillStyle = prevFill;
    },

};