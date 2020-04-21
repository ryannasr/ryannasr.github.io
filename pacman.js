
$(document).ready(function(){
    $("#btnPacman").click(function(){
        Pacman.init();
    })
});

let Pacman = {

    Wall: class{
        constructor(x,y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }
        draw(ctx){
            let prevFill = ctx.fillStyle;
            ctx.fillStyle = 'blue';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = prevFill;
        }
    },

    Coin: class{
      constructor(x,y) {
          this.x = x;
          this.y = y;
          this.width = 5;
          this.height = 5;
      }
      draw(ctx){
          let prevFill = ctx.fillStyle;
          ctx.fillStyle = 'yellow';
          ctx.fillRect(this.x, this.y, this.width, this.height);
          ctx.fillStyle = prevFill;
      }
    },

    gameLoop: false,
    state: {
        pacManAngle: 40,
        pacManAngleDir:0,
        pacManVel: 4,
        mouthDir: 1,
        mouthVel: 3,
        x: 100,
        y: 75,
        radius: 18
    },
    coins: [],
    walls: [],

    init:function(){
        this.gameLoop = new GameLoop((ms) => this.update(ms),
            () => this.onSetup(), (ctx) => this.draw(ctx),
            false, 'white');
        this.gameLoop.init("mycanvas","canvasDiv");
        this.gameLoop.run();
    },

    onSetup: function() {
        for (let i = 0; i < 10; i++) {
            this.coins.push(new this.Coin(40, (20 * i)));
        }

        let wallThickness = 6;
        let wallMargin = 3;

        // top wall
        this.walls.push(new this.Wall(wallMargin, wallMargin, this.gameLoop.canvasWidth - wallMargin * 2, wallThickness));
        // left wall
        this.walls.push(new this.Wall(wallMargin, wallMargin, wallThickness, this.gameLoop.canvasHeight - wallMargin * 2));
        // right wall
        this.walls.push(new this.Wall(this.gameLoop.canvasWidth - wallMargin * 2, wallMargin, wallThickness, this.gameLoop.canvasHeight - wallMargin * 2));
        // bottom wall
        this.walls.push(new this.Wall(wallMargin, this.gameLoop.canvasHeight - wallMargin * 2, this.gameLoop.canvasWidth - wallMargin * 2, wallThickness));

        this.walls.push(new this.Wall(this.state.x - this.state.radius - wallMargin, 0, wallMargin, this.gameLoop.canvasHeight-wallMargin));
        this.walls.push(new this.Wall(this.state.x + this.state.radius + wallMargin, 0, wallMargin, this.gameLoop.canvasHeight-150));
    },

    checkAndMove: function(dir){
        let newPos = {x: this.state.x + dir.x, y: this.state.y + dir.y};
        let pacManRect = this.getPacmanRect(newPos);

        // Check for any wall collision
        for (let i = 0; i < this.walls.length; i ++){
            if (Utils.testAABB(pacManRect, this.walls[i])) return false;
        }
        this.state.x = newPos.x;
        this.state.y = newPos.y;
        return true;
    },

    update:function(deltaMs){
        if (this.gameLoop.getKeyPressed(Utils.arrowKeyLeft)) {
            this.state.pacManAngleDir = 0;
            this.checkAndMove({x: -this.state.pacManVel, y: 0});
        }
        else if (this.gameLoop.getKeyPressed(Utils.arrowKeyRight)){
            this.state.pacManAngleDir = 180;
            this.checkAndMove({x: this.state.pacManVel, y: 0});
        }
        else if (this.gameLoop.getKeyPressed(Utils.arrowKeyUp)){
            this.state.pacManAngleDir = 90;
            this.checkAndMove({x: 0, y: -this.state.pacManVel});
        }
        else if (this.gameLoop.getKeyPressed(Utils.arrowKeyDown)){
            this.state.pacManAngleDir = 270;
            this.checkAndMove({x: 0, y: this.state.pacManVel});
        }
        if (this.state.pacManAngle >= 85){
            this.state.mouthDir = -1;
        }
        else if (this.state.pacManAngle <= 40){
            this.state.mouthDir = 1;
        }
        this.state.pacManAngle += (this.state.mouthDir*this.state.mouthVel);

        let pacManRect = this.getPacmanRect();
        let newCoins = [];
        for (let i = 0; i < this.coins.length; i++){
            if (!Utils.testAABB(pacManRect, this.coins[i])){
                newCoins.push(this.coins[i]);
            }
        }
        this.coins = newCoins;
    },

    draw:function(ctx){
        // black backgorund
        ctx.fillStyle = 'black';
        ctx.fillRect(0,0,this.gameLoop.canvasWidth, this.gameLoop.canvasHeight);

        ctx.fillStyle = 'yellow';

        ctx.translate(this.state.x, this.state.y);
        ctx.rotate(this.state.pacManAngleDir * Math.PI / 180);
        ctx.translate(-this.state.x, -this.state.y);

        ctx.beginPath();
        let startingAngleRad = (270 - this.state.pacManAngle)*(Math.PI/180);
        let endingAngleRad = (90 + this.state.pacManAngle)*(Math.PI/180);
        ctx.arc(this.state.x, this.state.y, this.state.radius, startingAngleRad, endingAngleRad);
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.beginPath();
        let topPoint = { x: (this.state.radius*Math.cos(startingAngleRad)) + this.state.x,
            y: (this.state.radius*Math.sin(startingAngleRad)) + this.state.y }
        ctx.moveTo(topPoint.x-1,topPoint.y);
        let bottomPoint = { x: (this.state.radius*Math.cos(endingAngleRad)) + this.state.x,
            y: (this.state.radius*Math.sin(endingAngleRad)) + this.state.y }
        ctx.lineTo(this.state.x + (this.state.radius/4),this.state.y);
        ctx.lineTo(bottomPoint.x-1,bottomPoint.y);
        ctx.fill();

        ctx.setTransform(1, 0, 0, 1, 0, 0);

        for (let i = 0; i < this.coins.length; i++){
            this.coins[i].draw(ctx);
        }
        for (let i = 0; i < this.walls.length; i++){
            this.walls[i].draw(ctx);
        }

        ctx.fillStyle = 'white';
        let pacManRect = this.getPacmanRect();
        //ctx.fillRect(pacManRect.x, pacManRect.y, pacManRect.width, pacManRect.height);

        ctx.fillText(`${pacManRect.x},${pacManRect.y} @ ${pacManRect.width},${pacManRect.height}`,
            this.gameLoop.canvasWidth-200, 200);
    },
    getPacmanRect: function(newPos = false){

        let x = this.state.x;
        let y = this.state.y;
        if (newPos){
            x = newPos.x;
            y = newPos.y;
        }
        return {x: x - this.state.radius,y:y - this.state.radius,
            width: this.state.radius*2, height:this.state.radius*2};


        let offset = deeper ? - 4 : 2;
        let pacManRect = {x : this.state.x-this.state.radius, y: this.state.y-5, width: this.state.radius, height: 10};
        // Rotate x and y with the angle
        let angleRad = (this.state.pacManAngleDir) * (Math.PI/180);
        let h = Math.abs(this.state.radius * Math.sin(angleRad)) + Math.abs(10 * Math.cos(angleRad)) + offset;
        let w = Math.abs(this.state.radius * Math.cos(angleRad)) + Math.abs(10 * Math.sin(angleRad)) + offset;
        pacManRect.x = this.state.x + h*Math.sin(angleRad)/2;
        pacManRect.y = this.state.y+ h*Math.cos(angleRad)/2;
        pacManRect.width = w*-Math.cos(angleRad) + h*-Math.sin(angleRad);
        pacManRect.height = h*-Math.cos(angleRad) + h*-Math.sin(angleRad);

        // normalize
        if (pacManRect.width < 0){
            pacManRect.x += pacManRect.width;
            pacManRect.width *= -1;
        }
        if (pacManRect.height < 0){
            pacManRect.y += pacManRect.height;
            pacManRect.height *= -1;
        }

        return pacManRect;
    }
}