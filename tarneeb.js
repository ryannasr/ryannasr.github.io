$(document).ready(function(){
    $("#btnTarneeb").click(function(){
        let debug = true;

        if (debug){
            Tarneeb.init("rayan" + Utils.rand(10));
            return;
        }

        $("#canvasDiv").prepend("<div id='tarneebSetupDiv'><label>Enter your name:</label>" +
            "<input style='margin-left:5px;margin-right:5px' id='nameTxt'/>" +
            "<button id='tarneebEnterBtn'>Enter game</button>" +
            "</div>")
        $("#mycanvas").hide();
        $("#nameTxt").focus();
        $("#tarneebEnterBtn").click(function(){
            let name = $("#nameTxt").val();
            if (!name){
                alert("Name is required");
                return;
            }
            $("#tarneebSetupDiv").hide();
            $("#mycanvas").show();
            Tarneeb.init(name);
        })

    })
});

let Tarneeb = {

    token: "",
    rooms: [],
    uiState: 'main',
    conn: null,
    roomUpdaterMs: 0,
    activeRoom: null,
    lobbyRdyCountdown: 5,
    lobbyCountdownTimer: 0,

    init: async function (name) {
        this.gameLoop = new GameLoop((ms) => this.update(ms),
            () => this.onSetup(), (ctx) => this.draw(ctx),
            true);
        this.gameLoop.init("mycanvas", "canvasDiv");

        this.conn = await SignalRLib.openHubConnection("https://localhost:5001", "gameHub");
        let resp = await this.conn.invoke("Authenticate", name);
        this.token = resp.token;
        this.myid = resp.id;
        if (this.token) {
            console.log("Authenticated for: " + name + " my id: " + this.myid);
        } else {
            alert("Could not auth!!");
        }

        this.conn.on('PlayerJoinRoom', (p) => this.onPlayerJoinRoomLobby(p));
        this.conn.on('PlayerReadyStateChange', (r) => this.onPlayerReadyStateChange(r));
        this.conn.on('PlayersTeamChange', (r) => this.onPlayersTeamChange(r));
        this.conn.on('PlayerDisconnected', (r) => this.onPlayerDisconnected(r));
        this.conn.on('RoomStateChange', (r) => this.onRoomStateChanged(r));
        this.conn.on('CardsUpdated', (c) => this.onCardsUpdated(c));
        this.gameLoop.run();
    },

    onCardsUpdated: function(cards){
        console.log("Got my cards");
        console.log(cards);
        this.mycards = cards.cards;
    },

    onRoomStateChanged:function(room){
      console.log("Room state changed to: " + room.state);
      console.log(room);
      this.activeRoom = room;
    },

    onPlayerDisconnected:function(room){
        console.log("Player disconnected");
        this.activeRoom = room;
    },

    onPlayersTeamChange:function(room){
        console.log("Players team changed");
        this.activeRoom = room;
    },

    onPlayerReadyStateChange: function(room){
      console.log("Player ready state changed");
      this.activeRoom = room;
    },

    onPlayerJoinRoomLobby: function(room) {
        console.log("Player joined:!");
        console.log(room);
        this.activeRoom = room;
    },
    onSetup: async function () {
        this.rooms = await this.conn.invoke("GetRooms", this.token);
        console.log(this.rooms);
    },

    update: async function (deltaMs) {
        if (this.uiState == 'main') {
            this.roomUpdaterMs += deltaMs;
            if (this.roomUpdaterMs > 500){
                this.roomUpdaterMs = 0;
                this.rooms = await this.conn.invoke("GetRooms", this.token);
            }
        }
        else if (this.uiState == 'roomLobby'){
            if (this.activeRoom.state == 'StartCountdown'){
                this.uiState = 'roomLobbyCountdown';
                this.lobbyRdyCountdown = 5;
            }
            else if (this.activeRoom.state == 'InGame'){
                this.uiState = 'inGame';
            }
        }
        else if (this.uiState == 'roomLobbyCountdown'){
            if (this.activeRoom.state != 'StartCountdown') {
                this.uiState = 'roomLobby';
                return;
            }
            this.lobbyCountdownTimer += deltaMs;
            if (this.lobbyCountdownTimer >= 1000){
                this.lobbyCountdownTimer = 0;
                this.lobbyRdyCountdown--;
            }
        }
        else if (this.uiState == 'inGame'){

        }

        for (let i = 0; i < this.gameLoop.btnsClicked.length; i++) {
            let b = this.gameLoop.btnsClicked[i];
            console.log(b.id);
            if (b.id == 'BtnCreateRoom') {
                await this.conn.invoke("CreateRoom", this.token, "RayanRoom");
            }
            else if (b.id == 'BtnJoin'){
                console.log("Joining: " + b.tag);
                let room = await this.conn.invoke("JoinRoom", this.token, b.tag);
                this.activeRoom = room;
                console.log("Room joined!");
                this.uiState = 'roomLobby';
            }
            else if (b.id == 'BtnReadyUp'){
                console.log("Readying up");
                await this.conn.invoke("ReadyUp", this.token, this.activeRoom.id);
            }
            else if (b.id == 'BtnUnready'){
                console.log("Unreadying");
                await this.conn.invoke("Unready", this.token, this.activeRoom.id);
            }
            else if (b.id == 'TeamUp'){
                console.log("Teaming up with: " + b.tag);
                await this.conn.invoke("TeamUp", this.token, this.activeRoom.id, b.tag);
            }
            else if (b.id == 'Bet'){
                console.log("Betting: " + b.tag);
                await this.conn.invoke("PlaceBet", this.token, this.activeRoom.id, this.myid, b.tag);
            }
            else if (b.id == 'PickTarneeb'){
                console.log("Tarneebing: " + b.tag);
                await this.conn.invoke("PickTarneeb", this.token, this.activeRoom.id, this.myid, b.tag);
            }
            else if (b.id == 'PickCard'){
                console.log("Picked card: " + b.tag.suit + ' of ' + b.tag.rank);
                await this.conn.invoke("PlayCard", this.token, this.activeRoom.id, this.myid, b.tag.rankE, b.tag.suitE);
            }
        }
    },

    draw:function(ctx){
        if (this.uiState == 'main'){
            this.gameLoop.buttons = [];

            let startingY = 50;
            let startingX = this.gameLoop.canvasWidth/2;
            ctx.fillText("Rooms:", startingX, startingY);
            for (let i = 0; i < this.rooms.length; i++){
                startingY += 50;
                let txt = "Room " + this.rooms[i].name;
                let txtSize = ctx.measureText(txt);
                ctx.fillText(txt, startingX, startingY);
                this.gameLoop.addButtonToScene(ctx, "BtnJoin",
                    txtSize.width + startingX + 5, startingY, "Join", this.rooms[i].id);
            }
            startingY += 100;
            this.gameLoop.addButtonToScene(ctx, 'BtnCreateRoom',this.gameLoop.canvasWidth/2 - 100, 30,"Create Room");
        }
        else if (this.uiState == 'inGame'){
            this.gameLoop.buttons = [];
            let activeRound = this.activeRoom.game.activeRound;
            let pBet = activeRound.playerBets[this.myid];
            let betTxt = activeRound.highestBet.Key ? 'Highest Bet: ' + activeRound.highestBet.Value +
                " by " + activeRound.highestBet.Key : 'No bets';
            ctx.fillText("In Game: " + this.activeRoom.name + " (" + this.activeRoom.state + ")" +
                " (" + activeRound.statusStr + ")", 10, 20);
            if (activeRound.statusStr == 'Playing'){
                ctx.fillText("Tarneeb: " + activeRound.tarneeb, 10, 60);
            }

            // team scores
            let y = 80;
            for (let prop in this.activeRoom.game.teams){
                let ts = this.activeRoom.game.teams[prop];
                let isBetter = '';
                if (activeRound && activeRound.teamScores){
                    let tsRound = activeRound.teamScores[prop];
                    isBetter = "(" + tsRound.score;
                    isBetter += tsRound.bet ? " (bet: " + tsRound.bet + ")" : ')';
                }

                ctx.fillText(prop + ": " + ts.score + isBetter, 10, y);
                y+= 20;
            }

            ctx.fillText(betTxt, 10, 40);
            let myplayer = null;
            let teammate = null;
            for (let i = 0; i < this.activeRoom.players.length; i++){
                let p = this.activeRoom.players[i];
                if (p.id == this.myid){
                    myplayer = p;
                    break;
                }
            }
            for (let i = 0; i < this.activeRoom.players.length; i++){
                let p = this.activeRoom.players[i];
                if (p.teamId == myplayer.teamId){
                    teammate = p;
                    break;
                }
            }

            // he is at the bottom
            let isCurrentPlayer = activeRound.currentSeatPlay == myplayer.seatCount ? ' (*)' : '';
            ctx.fillText("Player '" + myplayer.name + "' (" + myplayer.seatCount + ")" + isCurrentPlayer + " ("+
                " (" + (!pBet ? 'No bet' : pBet) + ")",
                this.gameLoop.canvasWidth/2, this.gameLoop.canvasHeight-20);
            let nextSeat = myplayer.seatCount + 1;

            // draw my cards
            let btnX = 20;
            let btnY = this.gameLoop.canvasHeight-100;
            if (this.mycards){
                let cardTxt = '';
                for (let i = 0; i < this.mycards.length; i++){
                    let c = this.mycards[i];
                    let btnTxt = c.suit[0] + '.' + c.rank;
                    let btn = this.gameLoop.addButtonToScene(ctx, "PickCard", btnX,
                        btnY,btnTxt, c);
                    btnX = btn.x + btn.width + 20;
                }
            }

            // draw table cards
            let subround = activeRound.activeSubRound;
            if (subround){
                let tablecards = subround.tableCards;
                let y= (this.gameLoop.canvasHeight/2)-30;
                for (let i = 0; i < tablecards.length; i++){
                    let c = tablecards[i];
                    ctx.fillText(c.card.rank + " of " + c.card.suit, (this.gameLoop.canvasWidth/2)-30,y);
                    y += 30;
                }
            }

            if (activeRound.statusStr == 'Betting' && isCurrentPlayer){
                // Show bets
                let btn = this.gameLoop.addButtonToScene(ctx, "Bet", (this.gameLoop.canvasWidth/2),
                    this.gameLoop.canvasHeight-60,"Bet 7", 7);
                this.gameLoop.addButtonToScene(ctx, "Bet", btn.x + btn.width + 20,
                    this.gameLoop.canvasHeight-60,"Pass", 0);
            }
            if (activeRound.statusStr == 'PickTarneeb' && isCurrentPlayer){
                let btn = this.gameLoop.addButtonToScene(ctx, "PickTarneeb", (this.gameLoop.canvasWidth/2),
                    this.gameLoop.canvasHeight-60,"Diamonds", 0);
                btn = this.gameLoop.addButtonToScene(ctx, "PickTarneeb", btn.x + btn.width + 20,
                    this.gameLoop.canvasHeight-60,"Hearts", 1);
                btn = this.gameLoop.addButtonToScene(ctx, "PickTarneeb", btn.x + btn.width + 20,
                    this.gameLoop.canvasHeight-60,"Spades", 2);
                btn = this.gameLoop.addButtonToScene(ctx, "PickTarneeb", btn.x + btn.width + 20,
                    this.gameLoop.canvasHeight-60,"Clubs", 3);
            }

            if (myplayer.seatCount == 3) nextSeat = 0;
            // left player
            let x = 30;
            y = (this.gameLoop.canvasHeight/2)+50;
            ctx.translate(x,y);
            ctx.rotate(-90*Math.PI/180);
            ctx.translate(-x,-y);
            let player = this.activeRoom.players.find(q => q.seatCount == nextSeat);
            isCurrentPlayer = activeRound.currentSeatPlay == player.seatCount ? ' (*)' : '';
            pBet = activeRound.playerBets[player.id];
            ctx.fillText("Player '" + player.name + "' (" + player.seatCount + ")" + isCurrentPlayer +
                " (" + (!pBet ? 'No bet' : pBet) + ")",
                30, (this.gameLoop.canvasHeight/2)+50);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            // top player
            nextSeat = (nextSeat == 3) ? 0 : nextSeat+1;
            player = this.activeRoom.players.find(q => q.seatCount == nextSeat);
            pBet = activeRound.playerBets[player.id];
            isCurrentPlayer = activeRound.currentSeatPlay == player.seatCount ? ' (*)' : '';
            ctx.fillText("Player '" + player.name + "' (" + player.seatCount + ")" + isCurrentPlayer +
                " (" + (!pBet ? 'No bet' : pBet) + ")",
                this.gameLoop.canvasWidth/2, 30);
            // right player
            nextSeat = (nextSeat == 3) ? 0 : nextSeat+1;
            player = this.activeRoom.players.find(q => q.seatCount == nextSeat);
            pBet = activeRound.playerBets[player.id];
            x = this.gameLoop.canvasWidth - 30;
            y = (this.gameLoop.canvasHeight/2)- 50;
            ctx.translate(x,y);
            ctx.rotate(90*Math.PI/180);
            ctx.translate(-x,-y);
            isCurrentPlayer = activeRound.currentSeatPlay == player.seatCount ? ' (*)' : '';
            ctx.fillText("Player '" + player.name + "' (" + player.seatCount + ")" + isCurrentPlayer+
                " (" + (!pBet ? 'No bet' : pBet) + ")",
                this.gameLoop.canvasWidth - 30, (this.gameLoop.canvasHeight/2)-50);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
        else if (this.uiState == 'roomLobby' || this.uiState == 'roomLobbyCountdown'){
            this.gameLoop.buttons = [];
            ctx.fillText("In Room Lobby: " + this.activeRoom.name + " (" + this.activeRoom.state + ")"
                , 10, 20);

            let y = 60;
            let myplayer = null;
            for (let i = 0; i < this.activeRoom.players.length; i++){
                let p = this.activeRoom.players[i];
                if (p.id == this.myid){
                    myplayer = p;
                    break;
                }
            }
            for (let i = 0; i < this.activeRoom.players.length; i++){
                let p =this.activeRoom.players[i];
                if (p.id == this.myid){
                    ctx.fillStyle = 'red';
                }
                let txt = "Player '" + p.name + "' (" + (p.isReady ? 'Ready' : 'Not Ready') + ")" + " (" +
                    p.teamId + ")";
                ctx.fillText(txt, 10, y);
                ctx.fillStyle = 'black'

                let txtSize = ctx.measureText(txt);
                if (p.id == this.myid){
                    let btnId = p.isReady ? 'BtnUnready' : 'BtnReadyUp';
                    let btnTxt = p.isReady ? 'Unready' : 'ReadyUp';
                    this.gameLoop.addButtonToScene(ctx, btnId, 20+txtSize.width,y-20,btnTxt);
                    txtSize += ctx.measureText(btnTxt);
                }
                else if (p.teamId != myplayer.teamId || (!p.teamId || !myplayer.teamId)){
                    this.gameLoop.addButtonToScene(ctx, "TeamUp", 20+txtSize.width,y-20,"TeamUp",p.id);
                }

                y+=20;
            }

            if (this.uiState == 'roomLobbyCountdown'){
                ctx.fillText("Game will start in " + this.lobbyRdyCountdown +
                    " seconds, unready to cancel the countdown!",
                    this.gameLoop.canvasWidth/2, this.gameLoop.canvasHeight/2);
            }
        }
    },

};

