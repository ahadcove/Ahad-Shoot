//Request for mongoJs
//var mongojs = require("mongojs");
var db = null;//mongojs('localhost:27017/myGame', ['room','user']);


//For file communication with express
var express = require ('express');
var app = express();
var serv = require('http').Server(app);

//If nothing is specified when trying to open up website it goes default to specific folder
app.get('/',function(req, res) {
    res.sendFile(__dirname + '/client/index.html'); //This folder
});
app.use('/client',express.static(__dirname + '/client')); //if specify full client name it will go there ex. mywebsite.com:2000
//by default your computer is localhost domain

serv.listen(process.env.PORT||2000); //This is for when the port is not online
// serv.listen(2000);
console.log("server started");

//socket list to keep track of whos who
var SOCKET_LIST = {};

var colorList = ["red", "green", "blue", "orange", "yellow"];

//var food

//Common class between snake head and tails
var Entity = function(){
    var self = {
        x:Math.random()*400,//Math.floor(Math.random()*(450+10)),
        y:Math.random()*400,
        spdX:0,
        spdY:0, //Start snake going down
        id: "",
    }
    self.update = function() {
        self.updatePosition();
    }
    self.updatePosition= function(){
        self.x += self.spdX;
        self.y+=self.spdY;
    }
//return distance
    self.getDistance = function(pt){
        return Math.sqrt(Math.pow(self.x-pt.x,2) + Math.pow(self.y-pt.y,2));
    }
    return self;
}

//Creating a player defaults to and takes an entiity
var Player = function(id) {
    var self = Entity();
    self.id = id;
    //self.food = 5;
    self.number = "" + Math.floor(10 * Math.random()); //Number to display
    self.color = randColor;
    //Key press: The server does not know if client is pressing a key or not
    self.pressingRight = false;
    self.pressingLeft = false;
    self.pressingUp = false;
    self.pressingDown = false;
    self.pressingAttack = false;
    self.mouseAngle = 0;
    self.maxSpd = 4; //Acceleration
    self.hp = 10;
    self.hpMax=10;
    self.score = 0;
    //calls update spd and super update
    var super_update = self.update;
    self.update = function () {
        self.updateSpd();
        super_update();

        if (self.pressingAttack) {
            self.shootBullet(self.mouseAngle);
        }

    }
    /*  if(self.grow){
     var f = Food();
     f.x = self.x;
     f.y = self.y;
     self.food ++;
     }
     // if(self.hit){
     //   self.food --;
     //}
     */
    self.shootBullet = function(angle){
        var b = Bullet(self.id,angle);
        b.x = self.x;
        b.y = self.y;
    }

    self.updateSpd = function(){
        if(self.pressingRight)
            self.spdX = self.maxSpd;
        else if(self.pressingLeft)
            self.spdX = -self.maxSpd;
        else
            self.spdX = 0;

        if(self.pressingUp)
            self.spdY = -self.maxSpd;
        else if(self.pressingDown)
            self.spdY = self.maxSpd;
        else
            self.spdY = 0;
    }

    self.getInitPack = function(){
        return{
            id:self.id,
            x:self.x,
            y:self.y,
            number:self.number,
            color:self.color,
            hp:self.hp,
            hpMax:self.hpMax,
            score:self.score,
        }
    }
    self.getUpdatePack = function(){
        return{
            id:self.id,
            x:self.x,
            y:self.y,
            hp:self.hp,
            score:self.score,
        }
    }

    Player.list[id] = self;
    initPack.player.push(self.getInitPack());
    return self;
}

        // Changes direction when button is pressed
     /*  self.updateSpd = function () {
            if (self.pressingRight) {
                self.spdY = 0;
                self.spdX = self.maxSpd;
            }
            else if (self.pressingLeft) {
                self.spdY = 0;
                self.spdX = -self.maxSpd;
            }
            // else
            //   self.spdX=0;

            if (self.pressingUp) {
                self.spdX = 0;
                self.spdY = -self.maxSpd;
            }
            else if (self.pressingDown) {
                self.spdX = 0;
                self.spdY = self.maxSpd;
            }
            // else
            //   self.spdY = 0;
        }
        Player.list[id] = self;
        return self;
    }*/


  /*  var Food = function (parent) {
        var self = Entity();
        self.id = Math.random();
        self.spdX = parent.spdX;
        self.spdY = parent.spdY;
        self.parent = parent;
        //self.toRemove = false;
        var super_update = self.update;
        self.update = function () {
            self.updateSpd();
            super_update();

            for (var i in Player.list) {
                var p = Player.list[i];
                if (self.getDistance(p) < 32 && self.parent !== p.id) {
                    //handle collision ex hp--;
                    self.toRemove = true;
                }

            }
        }
        Food.list[self.id] = self;
        return self;
    }*/
   // Food.list = {};


//Only one Static list
    Player.list = {};

//Player creator module/class everything for the player
    Player.onConnect = function (socket) {
        randColor = colorList[Math.floor(Math.random() * ((colorList.length - 1) - 1) + 0)];
        //xpos =Math.floor(Math.random()*(450+10));
        //ypos =Math.floor(Math.random()*(450+10));
        var player = Player(socket.id);
        //always receive id keypress Up: or down
        socket.on('keyPress', function (data) { //automatically emits when player leaves
            if (data.inputId === 'left')
                player.pressingLeft = data.state;
            else if (data.inputId === 'right')
                player.pressingRight = data.state;
            else if (data.inputId === 'up')
                player.pressingUp = data.state;
            else if (data.inputId === 'down')
                player.pressingDown = data.state;
            else if (data.inputId === 'attack')
                player.pressingAttack = data.state;
            else if (data.inputId === 'mouseAngle')
                player.mouseAngle = data.state;
        });

        socket.emit('init',{
            selfId:socket.id, //Show who the player is
            player:Player.getAllInitPack(),
            bullet:Bullet.getAllInitPack(),
        })
    }

    Player.getAllInitPack = function(){
        //This will update the screen to the current play through
        var players = [];
        for(var i in Player.list)
            players.push(Player.list[i].getInitPack());
    return players;
    }


//What happens when player leaves
    Player.onDisconnect = function (socket) {
        delete Player.list[socket.id];
        removePack.player.push(socket.id);
    }

    Player.update = function () {
        //MULTIPLE PLAYERS
        var pack = [];
        for (var i in Player.list) { //emit through every socket in socket list
            var player = Player.list[i];
            player.update();
            pack.push(player.getUpdatePack());
        }
        return pack;
    }

   /* Food.update = function () {
        //MULTIPLE PLAYERS
        var pack = [];
        for (var i in Food.list) { //emit through every socket in socket list
            var food = Food.list[i];
            food.update();
            if (food.toRemove)
                delete Food.list[i]
            pack.push({
                x: food.x,
                y: food.y,
                number: food.parent.number
            });
        }
        return pack;
    }*/

var Bullet = function (parent, angle) {
        var self = Entity();
        self.id = Math.random();
        self.spdX = Math.cos(angle / 180 * Math.PI) * 10;
        self.spdY = Math.sin(angle / 180 * Math.PI) * 10;
        self.parent = parent;
        //self.color =parent.color;
        self.timer = 0;
        self.toRemove = false;
        var super_update = self.update;
        self.update = function () {
            if (self.timer++ > 100)
                self.toRemove = true;
            super_update();

            for (var i in Player.list) {
                var p = Player.list[i];
                if (self.getDistance(p) < 32 && self.parent !== p.id) {{
                p.hp -=1;
                    if(p.hp<=0){
                        var shooter = Player.list[self.parent];
                        if(shooter) // This checks to make sure the shooter is still online. Cant award pionts to someone unexistent
                        shooter.score += 1;
                        p.hp = p.hpMax;
                        p.x = Math.random()*500;
                        p.y = Math.random()*500;
                    }
                        self.toRemove = true;
                    }
                }
            }
        }

        self.getInitPack = function(){
            return{
                id:self.id,
                x:self.x,
                y:self.y,
                //color:self.color,
            };
        }
        self.getUpdatePack = function(){
            return{
                id:self.id,
                x:self.x,
                y:self.y,
            };
        }

        Bullet.list[self.id] = self;
        initPack.bullet.push(self.getInitPack());
        return self;
    }

    Bullet.list = {};

    Bullet.update = function () {
        var pack = [];
        for (var i in Bullet.list) {
            var bullet = Bullet.list[i];
            bullet.update();
            if (bullet.toRemove) {
                delete Bullet.list[i];
                removePack.bullet.push(bullet.id);
            }else
                pack.push(bullet.getUpdatePack());
        }
        return pack;
    }

    Bullet.getAllInitPack = function() {
    var bullets = [];
    for (var i in Bullet.list)
        bullets.push(Bullet.list[i].getInitPack());
return bullets;
}

var isValidRoom = function (data, cb) { // we need to call back because the query call will return a value whe we need a number
    return cb(true);
    /*db.room.find({number: data.room}, function (err, res) {//query databese with function starting with error and result
            if (res.length > 0) //|| if (res[0])
                cb(true);
            else
                cb(false);
        });
        *///cb(ROOMS[data.room]===data.room);
        //return ROOMS.num[data.room] === data.room;
    }

var addUser = function (data, cb) {
   return cb();
       /* db.user.insert({number: data.room, player: data.user}, function (err) {
            cb();
        });*/
    }

var io = require('socket.io')(serv, {});
//whenever a player connection this function is called
io.sockets.on('connection', function (socket) { //whenever there is a connection this function is called
        socket.id = Math.random(); //The random of id of person 1
        SOCKET_LIST[socket.id] = socket; // add the player to the list

        socket.on('join', function (data) { //If join is successful player is creatd
            isValidRoom(data, function (res) {
                if (res) {
                    addUser(data, function () {
                        Player.onConnect(socket);
                        socket.emit('joinResponse', {success: true});
                    })
                } else
                    socket.emit('joinResponse', {success: false});
            });
        });

        /*socket.on('addUser', function(data){
         addUser(data);
         });*/

        //when a player leaves this will tell it what to do
        socket.on('disconnect', function () { //automatically emits when player leaves
            delete SOCKET_LIST[socket.id];
            Player.onDisconnect(socket);
        });

        socket.on('sendMsgToServer', function (data) {
            var playerName = ("" + socket.id).slice(2, 7);
            for (var i in SOCKET_LIST) {
                SOCKET_LIST[i].emit('addToChat', playerName + ': ' + data);
            }
        });
    });
// make a loop so every frame is updated by sending position

var initPack = {player:[],bullet:[]};
var removePack = {player:[],bullet:[]};



setInterval(function(){
    var pack = {
        player:Player.update(),
        bullet:Bullet.update(),
    }

    for(var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
        socket.emit('init',initPack);
        socket.emit('update',pack);
        socket.emit('remove',removePack);
    }

    //set it to empty after updating every frame
    initPack.player = [];
    initPack.bullet = [];
    removePack.player = [];
    removePack.bullet = [];
},1000/25);

/*
setInterval(function(){
    var pack = {
        player:Player.update(),
        bullet:Bullet.update(),
    }

    for(var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
        socket.emit('newPositions',pack);
    }
},1000/25);*/
