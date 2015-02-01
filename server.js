var express = require('express')
  , app = express(app)
  , server = require('http').createServer(app);

 
// serve static files from the current directory


var EurecaServer = require('eureca.io').EurecaServer;
 
//create an instance of EurecaServer
//var eurecaServer = new EurecaServer();
var eurecaServer = new EurecaServer({allow:['setId', 'spawnEnemy', 'kill', 'updateState']});
var clients = {};
//attach eureca.io to our http server
eurecaServer.attach(server);

//detect client connection
//

//detect client connection
eurecaServer.onConnect(function (conn) {    
    console.log('New Client id=%s ', conn.id, conn.remoteAddress);
	
	//the getClient method provide a proxy allowing us to call remote client functions
    var remote = eurecaServer.getClient(conn.id);    
	
	//register the client
	clients[conn.id] = {id:conn.id, remote:remote}
	
	//here we call setId (defined in the client side)
	remote.setId(conn.id);	
});

//detect client disconnection
eurecaServer.onDisconnect(function (conn) {    
    console.log('Client disconnected ', conn.id);
	
	var removeId = clients[conn.id].id;
	
	delete clients[conn.id];
	
	for (var c in clients)
	{
		var remote = clients[c].remote;
		
		//here we call kill() method defined in the client side
		remote.kill(conn.id);
	}	
});

eurecaServer.exports.handshake = function(id)
{
	for (var c in clients)
	{
		var remote = clients[c].remote;
		if (id==c){

			for (var cc in clients)
			{
				if(c==cc){}
				else{
					//console.log(clients[cc].laststate);
					//send latest known position
					var x = clients[cc].laststate ? clients[cc].laststate.x:  0;
					var y = clients[cc].laststate ? clients[cc].laststate.y:  0;
					console.log(cc+" , "+x+" : "+y);
					remote.spawnEnemy(clients[cc].id, x, y);
				}		
			}
		}
		else{
			var x = clients[id].laststate ? clients[id].laststate.x:  0;
			var y = clients[id].laststate ? clients[id].laststate.y:  0;
			remote.spawnEnemy(id,x,y);
		}
	}
}
eurecaServer.exports.handleKeys = function (keys) {
    var conn = this.connection;
    var updatedClient = clients[conn.id];
    
    for (var c in clients)
    {
        var remote = clients[c].remote;
       // if(keys.alive==false){
        //	remote.kill(conn.id);}
        remote.updateState(updatedClient.id, keys);
        //console.log(clients[c].laststate);
        //keep last known state so we can send it to new connected clients
        
    }
    clients[conn.id].laststate = keys;
}

app.use(express.static(__dirname));
app.get('/', function(req, res){
  res.render('game.html');
});

server.listen(8000);