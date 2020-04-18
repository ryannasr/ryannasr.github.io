

$(document).ready(function(){
    $("#btnSpace").click(function(){
        SpaceGame.init();
    })
});

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

let SpaceGame = {

    PlayerShip: class {
        constructor(x,y) {
            this.x = x;
            this.y = y;
            this.width = 50;
            this.height = 20;
            this.dmg = 0;
            this.dead = false;
        };
        draw(ctx){
            ctx.fillRect(this.x, this.y, this.width,this.height);
            if (this.dmg > 0){
                let midX = this.x + this.width/2 - this.dmg;
                let midY = this.y + this.height/2 - this.dmg;
                ctx.clearRect(midX, midY, 2*this.dmg, 2*this.dmg);
            }
        };
        damage(){
            this.dmg ++;
        };
        update(){
            if (this.dmg > this.height){
                this.dead = true;
            }
        }
    },

    EnemyShip: class{
        constructor(x,y) {
            this.x = x;
            this.y = y;
            this.width = 50;
            this.height = 20;
            this.dmg = 0;
            this.dead = false;
        };
        draw(ctx){
            let prevFill = ctx.fillStyle;
            ctx.fillStyle = this.dead ? 'purple' : 'red';
            ctx.fillRect(this.x, this.y, this.width,this.height);
            if (this.dmg > 0 && !this.dead){
                let midX = this.x + this.width/2 - this.dmg;
                let midY = this.y + this.height/2 - this.dmg;
                ctx.clearRect(midX, midY, 2*this.dmg, 2*this.dmg);
            }
            ctx.fillStyle = prevFill;
        };
        update(){
            if (this.dmg > this.height){
                this.dead = true;
            }
        };
        damage(){
            this.dmg ++;
        };
    },

    Bullet: class{
        constructor(x,y,velPerS,fromEnemy = false){
            this.x = x;
            this.y = y;
            this.velPerMs = velPerS/1000;
            this.width = 2;
            this.height = 6;
            this.y = y - this.height;
            this.fromEnemy = fromEnemy;
        };
        update(deltaTMs){
            this.y -= this.velPerMs * deltaTMs;
        };
        draw(ctx){
            let prevFill = ctx.fillStyle;
            if (this.fromEnemy) ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            if (this.fromEnemy) ctx.fillStyle = prevFill;
        }
    },

    _internalVar: {
        t1: 0,
        canvasHeight:0,
        canvasWidth:0,
        keyboard: {},
        playerShip: {},
        playerVel: 20,
        enemyVel: 15,
        bullets: [],
        enemies: [],
        aiUpdateCntrMs: 0,
        kbUpdatecntrMs: 0,
        bulletVel:500
    },

    stopGameLoop: false,
    init: function(){
        let CANVAS = $("#mycanvas");
        $("#canvasDiv").keydown((e) => SpaceGame.canvasKeyDown(e));
        $("#canvasDiv").keyup((e) => SpaceGame.canvasKeyUp(e));
        $("#canvasDiv").focus();

        let CTX = CANVAS.get(0).getContext("2d");
        this._internalVar.canvasHeight = CANVAS.height();
        this._internalVar.canvasWidth = CANVAS.width();

        console.log("Initing grid with: " + this._internalVar.canvasWidth + " x " + this._internalVar.canvasHeight);
        this.gameLoop(CTX, CANVAS);
    },

    canvasKeyUp: function(e){
      this._internalVar.keyboard[e.which] = false;
    },

    canvasKeyDown: function(e){
        this._internalVar.keyboard[e.which] = true;
    },

    gameLoop: async function (CTX, CANVAS) {
        let frameCntr = 0;
        let started = performance.now();
        this._internalVar.playerShip =
            new this.PlayerShip(this._internalVar.canvasWidth/2,this._internalVar.canvasHeight-50);

        // add enemies
        this._internalVar.enemies.push(new this.EnemyShip(30, 30));
        this._internalVar.enemies.push(new this.EnemyShip(200, 30));
        this._internalVar.enemies.push(new this.EnemyShip(300, 30));
        this._internalVar.enemies.push(new this.EnemyShip(400, 30));
        this._internalVar.enemies.push(new this.EnemyShip(500, 30));
        this._internalVar.enemies.push(new this.EnemyShip(600, 30));
        this._internalVar.enemies.push(new this.EnemyShip(700, 30));
        this._internalVar.enemies.push(new this.EnemyShip(800, 30));

        while (!SpaceGame.stopGameLoop) {
            let t2 = performance.now();
            let deltaMS = t2 - this._internalVar.t1;
            this._internalVar.t1 = t2;
            let msPassed = t2 - started;
            if (msPassed > 5000){
                started = t2;
                frameCntr = 0;
            }

            this.clearCanvas(CTX, CANVAS);
            let fps = frameCntr/(msPassed/1000);

            this.update(deltaMS);
            this.draw(CTX,fps);

            frameCntr++;
            //this._internalVar.keyboard = {};
            await Utils.sleep(10);
        }
    },

    update: function(deltaMs){
        if (this._internalVar.playerShip.dead) return;

        this._internalVar.playerShip.update();

        // Keyboard runs @ 60ms
        this._internalVar.kbUpdatecntrMs += deltaMs;
        if (this._internalVar.kbUpdatecntrMs >= 40) {
            this.handleKeyboard();
            this._internalVar.kbUpdatecntrMs = 0;
        }
        for (let i =0; i < this._internalVar.bullets.length; i++){
            this._internalVar.bullets[i].update(deltaMs);
        }

        // Check collision
        let newBullets = [];
        for (let i = 0; i < this._internalVar.bullets.length; i++){
            let b = this._internalVar.bullets[i];

            if (b.fromEnemy){
                let playerDmg = false;
                if (Utils.testAABB(b, this._internalVar.playerShip)){
                    playerDmg = true;
                    this._internalVar.playerShip.damage();

                }
                if (!playerDmg && b.y < this._internalVar.canvasHeight){
                    newBullets.push(b);
                }
            }
            else {
                let enemyCol = false;
                // Check if bullet colliding with any enemy
                for (let k = 0; k < this._internalVar.enemies.length; k++){
                    let enem = this._internalVar.enemies[k];
                    if (Utils.testAABB(enem, b)){
                        enem.damage();
                        enemyCol = true;
                    }
                }

                if (!enemyCol && this._internalVar.bullets[i].y > 0){
                    newBullets.push(b)
                }
            }
        }
        this._internalVar.bullets = newBullets;

        this._internalVar.aiUpdateCntrMs += deltaMs;

        // AI updates every 60ms
        if (this._internalVar.aiUpdateCntrMs >= 60) {
            this.aiUpdate();
            this._internalVar.aiUpdateCntrMs = 0;
        }
    },

    aiUpdate(){
        let enemyVel = this._internalVar.enemyVel;
        for (let i = 0; i < this._internalVar.enemies.length; i++) {
            let e = this._internalVar.enemies[i];
            e.update();
            if (e.dead) continue;

            let dirRand = Utils.rand(4);

            let cloneArray = this._internalVar.enemies.slice();
            cloneArray.splice(i,1);
            let dir = {};
            switch (dirRand){
                case 0:
                    dir = {x:-enemyVel, y:0};
                    break;
                case 1:
                    dir ={x:enemyVel, y:0};
                    break;
                case 2:
                    dir = {x:0,y:enemyVel};
                    break;
                case 3:
                    dir = {x:0,y:-enemyVel};
                    break;
            }
            this.checkAndMove(e, dir, cloneArray);

            let fire = Utils.rand(10);
            if (fire == 1){
                this._internalVar.bullets.push(
                    new this.Bullet(e.x + e.width/2,
                        e.y + e.height, -this._internalVar.bulletVel, true));
            }
        }
    },

    draw: function(CTX,fps){
        if (this._internalVar.playerShip.dead){
            CTX.fillText("YOU ARE DEAD!!!", this._internalVar.canvasWidth/2, this._internalVar.canvasHeight/2);
            return;
        }

        for (let i = 0; i < this._internalVar.bullets.length; i++){
            this._internalVar.bullets[i].draw(CTX);
        }
        for (let i =0; i < this._internalVar.enemies.length;i++){
            this._internalVar.enemies[i].draw(CTX);
        }
        this._internalVar.playerShip.draw(CTX);
        this.drawFps(CTX, fps);
    },

    clearCanvas: function(CTX, CANVAS){
        CTX.clearRect(0, 0, CANVAS.width(), CANVAS.height());
    },

    checkAndMove(obj, dir, checkWith = []){
      let newPos = {x:obj.x + dir.x, y: obj.y + dir.y};
      let canMove = true;
      if (newPos.x < 0) canMove = false;
      if (newPos.y < 0) canMove = false;
      if (newPos.x + obj.width > this._internalVar.canvasWidth) canMove = false;
      if (newPos.y + obj.height > this._internalVar.canvasHeight) canMove = false;
      let wallOnly = true;
      newPos.width = obj.width;
      newPos.height = obj.height;

      for (let i = 0; i < checkWith.length; i++){
          let c = checkWith[i];
          if (Utils.testAABB(newPos, c)){
              canMove = false;
              wallOnly = false;
          }
      }

      if (canMove){
          obj.x += dir.x;
          obj.y += dir.y;
      }
      else if (wallOnly){
          if (dir.x < 0){
              // was going left, snap to left side
              obj.x = 0;
          }
          else if (dir.x > 0){
              // was going right, snap to right side
              obj.x = this._internalVar.canvasWidth - obj.width;
          }
          else if (dir.y < 0){
              // was going up, snap to top
              obj.y = 0;
          }
          else if (dir.y > 0){
              // going down, snap to bottom
              obj.y = this._internalVar.canvasHeight - obj.height;
          }
      }
    },

    handleKeyboard: function(){
        let vel = this._internalVar.playerVel;
        if (this._internalVar.keyboard[Utils.arrowKeyDown]){
            this.checkAndMove(this._internalVar.playerShip, {x:0,y:vel}, this._internalVar.enemies);
        }
        if (this._internalVar.keyboard[Utils.arrowKeyLeft]){
            this.checkAndMove(this._internalVar.playerShip, {x:-vel,y:0}, this._internalVar.enemies);
        }
        if (this._internalVar.keyboard[Utils.arrowKeyRight]){
            this.checkAndMove(this._internalVar.playerShip, {x:vel,y:0}, this._internalVar.enemies);
        }
        if (this._internalVar.keyboard[Utils.arrowKeyUp]){
            this.checkAndMove(this._internalVar.playerShip, {x:0,y:-vel}, this._internalVar.enemies);
        }
        if (this._internalVar.keyboard[Utils.spaceKey]){
            console.log("firing");
            this._internalVar.bullets.push(
                new this.Bullet(this._internalVar.playerShip.x + this._internalVar.playerShip.width/2,
                                this._internalVar.playerShip.y, this._internalVar.bulletVel));
        }
    },

    drawFps: function(CTX, fps){
        fps = Math.floor(fps);

        CTX.font = '18px serif';
        CTX.fillStyle = 'black';

        let txt = 'FPS: ' + fps;
        let txtWidth = CTX.measureText(txt);
        CTX.fillText(txt,this._internalVar.canvasWidth-txtWidth.width-5, 20);

        txt = 'Bullets: ' + this._internalVar.bullets.length;
        let bulletTxt = CTX.measureText(txt);
        CTX.fillText(txt,this._internalVar.canvasWidth-bulletTxt.width-5,40);

        txt = 'Damage: ' + this._internalVar.playerShip.dmg;
        let dmgTxt = CTX.measureText(txt);
        CTX.fillText(txt,this._internalVar.canvasWidth-dmgTxt.width-5,60);
    }
}