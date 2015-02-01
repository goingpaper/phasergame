var ready = false;
var myId=0;
var eurecaServer;

var players;
var dead=false;
var player;
var cursors;
var emitt;
var pointer;
var wizards;
var drawer;
var platforms;
var playerw;
//this function will handle client communication with the server
var eurecaClientSetup = function() {
    //create an instance of eureca.io client
    var eurecaClient = new Eureca.Client();
    
    eurecaClient.ready(function (proxy) {        
        eurecaServer = proxy;
        
        
        //we temporary put create function here so we make sure to launch the game once the client is ready
    });

    eurecaClient.exports.setId = function(id) 
    {
        //create() is moved here to make sure nothing is created before uniq id assignation
        myId = id;
        console.log("id: "+myId);
        create();
        eurecaServer.handshake(myId);
        ready = true;
    }  
    eurecaClient.exports.kill = function(id)
	{	
		if (players[id]) {
			players[id].kill();
			console.log('killing ', id, players[id]);
		}
	}	
	
	eurecaClient.exports.spawnEnemy = function(i, x, y)
	{
		
		if (i == myId) return; //this is me
		
		console.log('SPAWN');
		console.log(x+" : "+y);
		var character = new Character(game,x,y,i);
		players[i] = character;
	}
    eurecaClient.exports.updateState = function(id, state)
    {
    	//console.log(state);
        if (players[id])  {
            players[id].cursor = state;

            players[id].sprite.x = state.x;
            players[id].sprite.y = state.y;
            //players[id].sprite.angle = state.angle;
            //players[id].turret.rotation = state.rot;
            //players[id].update();
        }
    }     
}

Character = function(game,x,y,id){

	this.cursor = {
		left:false,
		right:false,
		up:false,
		down:false,
		alive:true		
	}

	this.inputs = {
		left:false,
		right:false,
		up:false,
		down:false
	}
	this.alive = true;
	this.ready = 1;
	this.downcycles = 30;
	this.currentcycle = 0;
	this.sprite = game.add.sprite(0, 0, 'wizard');
	game.physics.arcade.enable(this.sprite);
	//this.sprite.body.velocity.x=10;
	this.sprite.id = id;
	this.sprite.body.gravity.y = 400;
	this.sprite.x = x;
	this.sprite.y = y;
	this.sprite.body.collideWorldBounds = true;
	this.balls = game.add.group();
	this.balls.enableBody = true;

}

Character.prototype.fire = function(){
	if(this.ready!=1){
		return;
	}
	var x = this.sprite.body.x;
	var y = this.sprite.body.y;
	var current = this.balls.create(x,y,'star');
	current.body.velocity.x = this.sprite.body.velocity.x *1.2;
	current.body.bounce.y = 1;
	current.body.bounce.x = 0.5;
	current.body.gravity.y = 300;
	current.lifespan = 2000;
	this.ready=0;
}

Character.prototype.update = function(){
	//var pos = (this.sprite.body.x,this.sprite.body.y)
	//drawer.drawRect(pos[0],pos[1]-50,100,100);
	//game.physics.arcade.collide(players,this.balls);
	//console.log(this.alive);
	if(this.sprite.alive==false){
		//console.log(this.alive);
		delete players[this.sprite.id];
		this.sprite.kill();
	}
	if(this.currentcycle==this.downcycles){
		this.currentcycle = 0;
		this.ready = 1;
		this.fire();
	}
	this.currentcycle++;
	//this.sprite.body.velocity.x=0;
	//console.log(this.cursor.left+" : "+this.input.left+"\n");
	//console.log(this.cursor.left == this.input.left + "\n");
	//console.log(this.cursor);
	//console.log(this.input);
	//console.log(this.cursor.left+" : "+this.input.left+"\n");
	//console.log(this.cursor.left+" : "+this.input.left+"\n");
	//console.log(this.cursor.alive+" : "+this.alive+"\n");
	var inputChanged = (
		this.cursor.left != this.inputs.left ||
		this.cursor.right != this.inputs.right ||
		this.cursor.up != this.inputs.up ||
		this.cursor.down != this.inputs.down ||
		this.cursor.alive != this.alive
	);

	
	if (inputChanged)
	{
		//Handle input change here
		//send new values to the server		
		//console.log(this.sprite.id+" : "+ myId);
		if (this.sprite.id == myId)
		{
			// send latest valid state to the server
			this.inputs.x = this.sprite.x;
			this.inputs.y = this.sprite.y;
			this.inputs.alive = this.alive;
			this.inputs.ingame = true;
			eurecaServer.handleKeys(this.inputs);

			
		}
	}

	//cursor value is now updated by eurecaClient.exports.updateState method
	///BUG WITH CURSORS
	
    if (this.cursor.left)
    {
        this.sprite.body.x -= 5;
    }
    if (this.cursor.right)
    {
        this.sprite.body.x  += 5;
    }	
    if (this.cursor.up)
    {
        this.sprite.body.y -= 5;
    }
    if (this.cursor.down)
    {
        this.sprite.body.y  += 5;
    }
}
Character.prototype.kill = function() {
	this.alive = false;
	//players[this.sprite.id] = null;
	delete players[this.sprite.id];
	this.sprite.kill();
}
function spawnPlayer(){

}

var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: eurecaClientSetup, update: update ,render: render });

//var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });
function preload() {
	game.load.image('sky', 'assets/sky.png');
    game.load.image('ground', 'assets/platform.png');
    game.load.image('star', 'assets/star.png');
    game.load.image('wizard', 'assets/darkwing_crazy.png');
    game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
    ;;
}

/*function explode(pointer){
	emitt.x = pointer.x;
	emitt.y = pointer.y;
	//emitt.explode(50000,50);
	playerw.fire();
	/*var current = wizards.create(800-64,Math.random()*600-120,'wizard');
	current.body.velocity.x = -Math.random()*5-50;
	current.body.bounce.y = 1;
	current.body.bounce.x = 0.5;
	current.body.gravity.y = 300;
	current.body.collideWorldBounds = true;*/
//}

function create() {
	game.physics.startSystem(Phaser.Physics.ARCADE);

	cursors = game.input.keyboard.createCursorKeys();
	
	game.add.sprite(0, 0, 'sky');

	

	platforms = game.add.group();
	wizards = game.add.group();
	wizards.enableBody = true;
	platforms.enableBody = true;

	var ground = platforms.create(0, game.world.height - 64, 'ground');
	ground.scale.setTo(2, 2);
	ground.body.immovable = true;
	//drawer = game.add.graphics();
	//drawer.beginFill(0xFF3300);
    //drawer.lineStyle(10, 0xffd900, 1);
    players = {};
	playerw = new Character(game);
	playerw.sprite.id = myId;
	players[myId] = playerw;
	//console.log(playerw);

	//player = game.add.sprite(0, 0, 'star');
	//game.physics.arcade.enable(player);
	//player.body.bounce.y = 0.2;
    //player.body.gravity.y = 400;
    //player.body.collideWorldBounds = true;

	//emitt = new Phaser.Particles.Arcade.Emitter(game, 200, 200, 20);
	//emitt.makeParticles('star',1,1000,false,false);

	pointer = game.input.activePointer;
	


	//game.input.mouse.mouseDownCallback = explode;
	//game.input.keyboard.onDownCallback = function()

}


function update() {
	if (!ready) return;
	//console.log("updated")
	//console.log(playerw);
	//console.log("update");
	//game.physics.arcade.collide(player, platforms);
	//game.physics.arcade.collide(player, wizards);
	//game.physics.arcade.collide(wizards, platforms);
	if(dead){
		for (var c in players){
			players[c].kill();
		}
		return;
	}
	game.physics.arcade.collide(playerw.balls, platforms);

	
	game.physics.arcade.collide(players, platforms);
	if(typeof players[myId] === "undefined"){return;}
	players[myId].inputs.left = cursors.left.isDown;
	//console.log(playerw.input.left+" : "+cursors.left.isDown);
	players[myId].inputs.right = cursors.right.isDown;
	players[myId].inputs.up = cursors.up.isDown;
	players[myId].inputs.down = cursors.down.isDown;
	//playerw.update();

	 for (var i in players)
    {
		if (!players[i] || (typeof players[i] === "undefined")) {continue;}
		game.physics.arcade.collide(platforms,players[i].sprite);
		players[i].update();
		//console.log(players[i] + " : "+ typeof players[i] === "undefined");
		if(typeof players[i] === "undefined"){console.log("passed");continue;}
		game.physics.arcade.collide(players[i].balls, players[i].sprite);
		game.physics.arcade.collide(players[i].balls, players);
		for (var j in players){
			if (!players[j]) continue;
			if (i==j) continue;
			game.physics.arcade.overlap(players[i].sprite,players[j].balls,collision,null,this);
		}
		/*var curTank = players[i].tank;
		for (var j in players)
		{
			if (!players[j]) continue;
			if (j!=i) 
			{
			
				var targetTank = players[j].tank;
				
				//game.physics.arcade.overlap(curBullets, targetTank, bulletHitPlayer, null, this);
			
			}
			if (players[j].alive)
			{
				players[j].update();
			}			
		}*/
    }
	//game.physics.arcade.collide(player, emitt);
	//game.physics.arcade.overlap(player, emitt,collision,null, this);
	
	//playerw.sprite.body.velocity.x = 0;

	/*if (cursors.left.isDown)
    {
        //  Move to the left
        //player.body.velocity.x = -150;
        playerw.sprite.body.velocity.x = -150;
        playerw.facing = -1;

       // player.animations.play('left');
    }
    if (cursors.right.isDown)
    {
        //  Move to the right
        //player.body.velocity.x = 150;
        playerw.sprite.body.velocity.x = 150;
        playerw.facing = 1;

        //player.animations.play('right');
    }
    if(cursors.down.isDown)
    {
        //  Stand still

        //player.body.velocity.y = 150;
        playerw.sprite.body.velocity.y = 150;

       // player.frame = 4;
    }
    
    //  Allow the player to jump if they are touching the ground.
    if (cursors.up.isDown)
    {
        //player.body.velocity.y = -150;
        playerw.sprite.body.velocity.y = -150;
    }*/
    
}
function collision(player,particle){
	player.alive = false;
	dead = myId==player.id ? true : false;
	//console.log(player);
	//console.log("particle: "+particle);
	//player.kill();
}
function render () {}