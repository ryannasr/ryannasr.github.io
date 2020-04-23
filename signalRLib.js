$(document).ready(function(){
    if (!signalR){
        throw "Missing signalR cannot load!";
    }
});

let SignalRLib = {

    openHubConnection: async function (host, endpoint) {
        let connection = new signalR.HubConnectionBuilder().withUrl(host + "/" + endpoint).build();
        await connection.start();

        return connection;
    }
}