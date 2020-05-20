$(document).ready(function(){
    $("#btnYout").click(function(){
        $("#mycanvas").hide();
        $('#canvasDiv').append("<div style='margin-left:2em' id='youtDiv'></div>");
        var youtDiv = $('#youtDiv');

        youtDiv.append("<div id='tarneebSetupDiv'>" + 
        "<label>Name</label>" +
        "<input style='margin-left:5px;margin-right:5px' id='nameTxt'/>" +
        "<button id='ytEnterBtn'>Enter</button>" +
        "</div>");

        $('#ytEnterBtn').click(function(){
            var name = $('#nameTxt').val();
            if (!name){
                alert("Enter a name");
                return;
            }
            youtDiv.empty();
            /*
            youtDiv.append("<label>Join or Create a room</label><input style='margin-left:5px;margin-right:5px' id='searchTxt'/>" +
            "<button id='searchEnterBtn'>Search</button>");*/
            YoutProcessor.init(name, youtDiv);

        })
    })
});

var player;
function onYouTubeIframeAPIReady() {
    console.log("Youtube iframe API JS loaded");
    /*
    player = new YT.Player('player', {
        height: '390',
        width: '640',
        videoId: '',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });*/
}

var prevPlayerState = -1;
var playerPrevTime = -1;
var monitor = false;
function monitorVideoTime(){
    if (!player) return;
    if (Math.abs(player.getCurrentTime() - playerPrevTime)>2){
        console.log("big seek done");
        wsConn.invoke("SeekToAsync", ytProce.token, ytProce.activeRoom.id, player.getCurrentTime());
    }

    playerPrevTime = player.getCurrentTime();
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
    console.log("Youtube iframe API READY");
    if (!monitor){
        monitor = setInterval(monitorVideoTime, 100);
    }
    wsConn.invoke("ReadyForVideo",ytProce.token,ytProce.activeRoom.id,ytProce.activeRoom.currentVideoId);
}

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
var done = false;
function onPlayerStateChange(event) {
    console.log("Player state changed to: " + event.data);
    if (event.data == YT.PlayerState.PLAYING && prevPlayerState != YT.PlayerState.PLAYING){
        // send a play request
        wsConn.invoke("PlayVideo", ytProce.token, ytProce.activeRoom.id);
    }
    else if (event.data == YT.PlayerState.PAUSED && prevPlayerState != YT.PlayerState.PAUSED){
        wsConn.invoke("StopVideo", ytProce.token, ytProce.activeRoom.id);
    }
    if (prevPlayerState == 3 && event.data != 3){
        wsConn.invoke("ReadyForVideo",ytProce.token,ytProce.activeRoom.id,ytProce.activeRoom.currentVideoId);
    }
    if (false && event.data == YT.PlayerState.PLAYING && !done) {
        setTimeout(stopVideo, 6000);
        done = true;
    }
    prevPlayerState = event.data;
}

function stopVideo() {
    player.stopVideo();
    player.cuePlaylist({listType:'search',
        list:'david blaine',
        index:0,
        startSeconds:0});
}

wsConn = null;
ytProce = null;
let YoutProcessor = {

    init:async function(name, youtCanvas){
        youtCanvas.append('<div id="drawDiv"></div>')
        youtCanvas.append('<div id="player"></div>')
        youtCanvas.append('<div class="row" id="searchResults"></div>')
        this.drawDiv = $('#drawDiv');
        var tag = document.createElement('script');

        let loc = (window.location.href.substr(0,12));
        let signalRHostname = (loc.indexOf('loca') != -1) ? 'https://localhost:5001' :
            'https://tarneebdev.azurewebsites.net';

        this.gameLoop = new GameLoop((ms) => this.update(ms),
        () => this.onSetup(), (ctx) => this.draw(ctx),
        true);
        this.gameLoop.init("mycanvas", "canvasDiv");

        this.conn = await SignalRLib.openHubConnection(signalRHostname, "videoHub");
        let resp = await this.conn.invoke("Authenticate", name);
        this.token = resp.token;
        this.myid = resp.id;
        this.activeRoom = null;

        this.conn.on('PlayerJoinRoom', (p) => this.onPlayerJoinRoomLobby(p));
        this.conn.on('PlayerDisconnected', (r) => this.onPlayerDisconnected(r));
        this.conn.on('OnNewSearchQuery', (r) => this.onNewSearchQuery(r));
        this.conn.on('QueueVideo', (r) => this.onQueueVideo(r));
        this.conn.on('StartPlayVideo', (r) => this.onStartPlayVideo(r));
        this.conn.on('StopPlayVideo', (r) => this.onStopPlayVideo(r));
        this.conn.on('SeekVideoTo', (r) => this.onSeekVideoTo(r));
        this.conn.on('VideoReadyStateChanged', (r) => this.onVideoReadyStateChanged(r));

        this.roomUpdaterMs = 0;
        this.drawUpdaterMs = 0;
        this.uiState = 'main';
        this.rooms = [];

        this.gameLoop.run();

        var me = this;
        $(document).ready(function(){
            $(document).on("click", ".vid-play-btn", function(){
                console.log($(this).attr('id'));
                var videoid = $(this).attr('id');
                me.conn.invoke('QueueVideo', me.token, me.activeRoom.id, videoid);
            });
        })

        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        wsConn = this.conn;
        ytProce = this;
    },
    onBtnCreateRoomClick: function(){
        console.log("HELLOO");
    },
    update: async function (deltaMs) {
        this.drawUpdaterMs += deltaMs;
        if (this.uiState == 'main') {
            this.roomUpdaterMs += deltaMs;
            if (this.roomUpdaterMs > 500){
                this.roomUpdaterMs = 0;
                this.rooms = await this.conn.invoke("GetRooms", this.token);
            }
        }
    },
    drawState:{firstPassRoomLobby: true},
    draw:function(ctx){
        if (this.drawUpdaterMs > 1000){
            if (this.uiState == 'main'){
                this.drawDiv.empty();

                this.drawDiv.append("<label>Join or Create a room</label><br/>");
                for (var i = 0; i < this.rooms.length; i++){
                    this.drawDiv.append(`<div>Room ${this.rooms[i].name}` + 
                    `<button class='btn btn-light btn-join-room' id='${this.rooms[i].id}'>Join</button></div>`)
                }
                this.drawDiv.append("<button id='btn-create-room' class='btn btn-dark btn-create-room'>Create</button>");
                $('#btn-create-room').on('click',async () => {
                    await this.conn.invoke("CreateRoom", this.token, "RayanRoom");
                });
                var conn = this.conn;
                var me = this;
                $('.btn-join-room').on('click', async function(){
                    me.activeRoom = await conn.invoke("JoinRoom", me.token, $(this).attr('id'))

                    me.uiState = 'roomLobby';
                    me.drawState.firstPassRoomLobby = true;
                });
            }
            else if (this.uiState == 'roomLobby'){
                if (!this.drawState.firstPassRoomLobby) return;
                this.drawDiv.empty();
                this.drawDiv.append(`<h4>Joined room ${this.activeRoom.name}</h4>`)
                this.drawDiv.append('<div id="div-player-status"></div>');
                this.drawDiv.append("<label>Search</label><input style='margin-left:5px;margin-right:5px' id='searchTxt'/>" +
                "<button class='btn btn-success' id='searchEnterBtn'>Search</button>");
                this.drawState.firstPassRoomLobby = false;
                this.updatePlayerDivState();

                $('#searchEnterBtn').click(async () => {
                    console.log("Search is: " + $('#searchTxt').val());
                    var searchTxt = $('#searchTxt').val();
                    await this.conn.invoke('SubmitSearchQuery', this.token, this.activeRoom.id, searchTxt);
                })
            }
            this.drawUpdaterMs = 0;
        }
    },
    updatePlayerDivState:function(){
        $('#div-player-status').empty();
        for (var i = 0; i < this.activeRoom.watchers.length; i++){
            var w = this.activeRoom.watchers[i];
            $('#div-player-status').append(`<label>${w.name}` + (w.isVideoReady ? ' (READY)' : ' (NOT READY)') + `</label>`);
        }
    },
    onStartPlayVideo: function(){
        if (!player) return;
        console.log("PLAY REQUEST");
        player.playVideo();
    },
    onSeekVideoTo:function(to){
        if (!player) return;
        console.log("Seek to request: " + to);
        player.seekTo(to, true);
        player.playVideo();
        setTimeout(() => {
            player.pauseVideo();
        },20)
    },
    onStopPlayVideo:function(){
        if (!player) return;
        console.log("STOP REQUEST");
        player.pauseVideo();
    },
    onSetup: async function () {
        this.rooms = await this.conn.invoke("GetRooms", this.token);
        console.log(this.rooms);
    },
    onPlayerJoinRoomLobby: function(room) {
        console.log("Player joined:!");
        console.log(room);
        this.activeRoom = room;
        this.updatePlayerDivState();
    },
    onPlayerDisconnected:function(room){
        console.log("Player disconnected");
        this.activeRoom = room;
        this.updatePlayerDivState();
    },
    onVideoReadyStateChanged:function(room){
        this.activeRoom = room;
        this.updatePlayerDivState();
    },
    onQueueVideo:function(videoId){
        if (!player){
            player = new YT.Player('player', {
                height: '390',
                width: '640',
                videoId: videoId,
                playerVars: { 'autoplay': 0, 'controls': 1 },
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': onPlayerStateChange
                }
            });
        }
        else{
            //player.stopVideo();
            player.cueVideoById(videoId,0);
        }
    },
    onNewSearchQuery:function(query){
        console.log("Search query" + query);
        $.ajax({
            url:  `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q=${query}&key=AIzaSyBuczyO4ZWs5rXXry3YzahvUgoAVptrHU4`,
            contentType: "application/json",
            dataType: 'json',
            success: function(result){
                console.log(result);

                $("#searchResults").empty();
                for (var i =0 ; i < result.items.length; i++){
                    var item = result.items[i];

                    if (item.id.kind == 'youtube#channel') continue;

                    var id = item.id.videoId;
                    var desc = item.snippet.description;
                    var channelTitle = item.snippet.channelTitle;
                    var thumnailImg = item.snippet.thumbnails['default'].url;
                    var title = item.snippet.title;

                    var srItem = {
                        id: id,
                        description: desc,
                        channelTitle: channelTitle,
                        thumnailImg: thumnailImg,
                        title:title
                    }
                    //console.log(srItem);
                    
                    var srDiv =`<div class="card col-4"><p>Channel: ${srItem.channelTitle}<br/>Title: ${srItem.title}<br/>
                                <small>Description: ${srItem.description}</small><br/>
                                <img src=${srItem.thumnailImg}/><br/>
                                <button class='vid-play-btn' id='${srItem.id}'>Play</button>`;
                    $("#searchResults").append(srDiv);
                }
            }
        })
    },
}