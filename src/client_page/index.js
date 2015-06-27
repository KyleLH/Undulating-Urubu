// =============================================================================
// Game State
var config;
var mines;
var players = {};
var playerScores = {};
var playerNames = [];
var scoreElems = [];
var bombs;
var time;
var lastTime;
var gameCanvas;
var scoreHolder;
var shipsImg; 
var testData = {};
var myBarChart;

var shipCols =  3; 
var shipRows = 20;
var numShips = shipCols * shipRows;
var shipSide = 24;
var scale = 1;
var init = false;
var ctx;
var circle = new ProgressBar.Circle('#loader', {
    color: '#FCB03C',
    strokeWidth: 3.5,
    trailWidth: 1.5,
    duration: 3000,
    easing: 'easeInQuart',
    fontSize: "70px",
    text: {
        value: '0'
    },
    step: function(state, bar) {
        bar.setText((bar.value() * 100).toFixed(0));
    }
});

// =============================================================================
// Helper functions

function trunc(num, place) {
    return Math.round(num*Math.pow(10, place)) / Math.pow(10,place);
}

function rotate(x,y,theta) {
    var xp = Math.cos(theta) * x - Math.sin(theta) * y;
    var yp = Math.sin(theta) * x + Math.cos(theta) * y;
    return { "x" : xp , "y" : yp };
}

// =============================================================================
// Game Functions

function createScoreCard(index, name) {
    var div  = document.createElement("div");
    div.classList.add("scorecard");
    
    var ship = document.createElement("div");
    ship.classList.add("shipicon");
    var shipX = (index % shipCols) * shipSide;
    var shipY = (Math.floor(index / shipCols) % shipRows) * shipSide;
    ship.style.backgroundPosition = shipX + "px -" + shipY + "px";
    div.appendChild(ship);
    
    var indexElem = document.createElement("span");
    indexElem.classList.add("shipindex");
    indexElem.textContent = index < 10 ? "0" + index : index;
    div.appendChild(indexElem);
    
    var nameElem = document.createElement("span");
    nameElem.classList.add("shipname");
    nameElem.textContent = name;
    div.appendChild(nameElem);
    
    var scoreElem = document.createElement("span");
    scoreElem.classList.add("shipscore");
    div.appendChild(scoreElem);

    var mineElem = document.createElement("span");
    mineElem.classList.add("shipmines");
    div.appendChild(mineElem);

    return div;
}
    

function loadPlayers(players_data) {
    var len = players_data.length;
    for (var i = 0; i < len; i++) {
        var player = players_data[i];
        var name = player.name;

        var currentPlayer = players[name];
        if (currentPlayer === undefined) {
            currentPlayer = {};
            currentPlayer.lastTick = {};
        }
        else {
            currentPlayer.lastTick = {
                x  : currentPlayer.x,
                y  : currentPlayer.y,
                vx : currentPlayer.vx,
                vy : currentPlayer.vy
            };
        }        
        for (var prop in player) {
            currentPlayer[prop] = player[prop];
        }
        currentPlayer.index = i;
        players[name] = currentPlayer;
        if (playerScores[name] === undefined) {
            playerNames.push(name);
            playerScores[name] = {};
            scoreElems[i] = createScoreCard(i, name);
            scoreHolder.appendChild(scoreElems[i]);
        }
        playerScores[name].score = currentPlayer.score === undefined ? 0 : currentPlayer.score;
        playerScores[name].mines = 0;
    }
}

function loadMines(mine_data) {
    if (mines === undefined) {
        mines = mine_data;
    }
    else {
        // Mines don't move (or do they?)
        for (var i = 0; i < mine_data.length; i++) {
            var owner = mine_data[i].owner;
            mines[i].owner = owner;
            // load mines after players
            if (owner !== "none" && playerScores[owner]) {
                playerScores[owner].mines ++;
            }
        }
    }
}

function loadBombs(bomb_data) {
    bombs = bomb_data;
}
// =============================================================================
// DOM and State Functions

function loadUI () {
    time    =  0;
    // if (Math.round( * config.mapWidth) !== 500) {
        // gameCanvas.width = Math.round( * config.mapWidth);
    // }
    
    gameCanvas.width  = config.mapWidth*scale;
    gameCanvas.height = config.mapHeight*scale;
}

function onBodyLoad() {
	ctx = $("#testChart").get(0).getContext("2d");
    gameCanvas = document.getElementById("game-field");
    scoreHolder = document.getElementById("scoreboardholder");
    shipsImg = document.getElementById("shipsImg");
}

function drawMines(context) {
    for (var m in mines) {
        var mine = mines[m];
    	if (!init) {
    		mine.x *= scale;
    		mine.y *= scale;
    	}
        var mineX = mine.x;
        var mineY = mine.y;
        context.save();
        context.fillStyle = "#c82124";
        context.strokeStyle = "#c82124";
        context.shadowColor   = "rgba(0,0,0,0.2)";
        context.shadowOffsetX = 0.2;
        context.shadowOffsetY = 0.2;
        context.shadowBlur    = 1;
        context.beginPath();
        if (mine.owner === "none") {
        	context.arc(mineX, mineY, config.captureRadius, 0, 2*Math.PI, false);
        } else {
	        context.arc(mineX, mineY, 2.5*config.captureRadius, 0, 2*Math.PI, false);
        }
        context.lineWidth = 1;
        context.stroke();
        if (mine.owner !== "none") {
            var text = players[mine.owner].index < 10 ? "0" + players[mine.owner].index : "" + players[mine.owner].index;
            context.font = "16px Roboto";
            context.fillText(text, mineX - 1.8*config.captureRadius, mineY + config.captureRadius + 1);
        }
        context.closePath();
        context.restore();
    }
}

function drawShip(context, shipNum, x, y, vAngle) {
	x *= scale;
	y *= scale
    context.save();
    context.translate(x,y);
    context.rotate(vAngle + (Math.PI/2));
    shipNum = shipNum % numShips;
    var shipX = (shipNum % shipCols) * shipSide;
    var shipY = (Math.floor(shipNum / shipCols) % shipRows) * shipSide;
    context.drawImage(shipsImg, shipX, shipY, shipSide, shipSide, -(shipSide/2), -(shipSide/2), shipSide, shipSide);
    context.restore();
}

function drawPlayers(context) {
    for (var p in players) {
        var player = players[p];
        if (!init) {
        	player.x *= scale;
        	player.y *= scale;
        }
        var playerX = player.x;
        var playerY = player.y;
        var vMag = Math.sqrt(player.vx*player.vx + player.vy*player.vy);
        var vAngle = player.vx == 0 ? 0 : Math.atan(player.vy/player.vx);
        if (player.vx < 0) { vAngle = vAngle + Math.PI; }
        
        context.beginPath();
        drawShip(context, player.index, playerX, playerY, vAngle);
        context.stroke();
        context.closePath();
    }
}

function drawBombs(context) {
    for (var b in bombs) {
        var bomb = bombs[b];
        if (!init) {
        	bomb.x *= scale;
        	bomb.y *= scale;
        }
        var bx = bomb.x;
        var by = bomb.y;
        var bf = bomb.fuse;
        var bd = bomb.delay;
        context.save()
        context.beginPath();

        if (bf <= 3) {
            var grd=context.createRadialGradient(bx,by,1,bx,by,config.bombExplosionRadius);
            grd.addColorStop(0,"red");
            grd.addColorStop(1,"white");
            var path = new Path2D();
            path.arc(bx,by,config.bombExplosionRadius, 0, 2*Math.PI, false);

            context.fillStyle = grd;
            context.fill(path);
        }
        else {
            var red = 255 - Math.ceil(255 * (bf / bd));
            context.strokeStyle = "rgb(" + red + ",0,0)";
            context.lineWidth = 3;
            context.moveTo(bx-5, by-5);
            context.lineTo(bx+5, by+5);
            context.moveTo(bx-5, by+5);
            context.lineTo(bx+5, by-5);
            context.stroke();
        }
        context.closePath();
        context.restore();
    }
}

function drawField() {
    var context = gameCanvas.getContext('2d');
    context.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    drawMines(context);
    drawPlayers(context);
    drawBombs(context);
}

function clearField() {
    var context = gameCanvas.getContext('2d');
    context.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
}

function updatePlayerScores() {
    for (var i = 0; i < playerNames.length; i++) {
        var card = scoreElems[i].childNodes[scoreElems[i].childNodes.length-2];
        var mines = scoreElems[i].lastChild;
        if (card) {
            card.textContent = playerScores[playerNames[i]].score;
        }
        if (mines) {
        	mines.textContent = playerScores[playerNames[i]].mines;
        }
    }
}

// =============================================================================
// SocketIO

// Here, we connect to the socket for communicating with out nodeJs server,
// running on the localhost
var socket = io.connect('http://localhost:8080');

// This line sets up a handler for when the server sends the config information
socket.on('config', function (data) {
	circle.animate(
	    1,
	    {
	        easing: "easeInOutExpo"
	    },
	    function () {
	    	console.log("testing");
	        $('.splash').animate({opacity: 0}, function () {
	            $(this).hide();
	            $('.content').animate({opacity: 1, duration: 4000});
	        });
	    }
    );
    if (config !== undefined) { return; }
    config = data.config;
    window.onresize = function () {
		$("#sidebar").css("width", parseFloat($("body").css("width")) - parseFloat($("#game-field").css("width")) - 6);
    };

    setTimeout(function () {
		$("#sidebar").css("width", parseFloat($("body").css("width")) - parseFloat($("#game-field").css("width")) - 6)
		.css("height", parseFloat($("#game-field").css("height")));
    }, 1);

    // $("body").css("min-width", parseFloat($("#sidebar").css("min-width"))+parseFloat($("#game-field").css("height")));L
    scale = window.innerHeight / (config.mapWidth+6);
    loadUI();
    socket.emit("StartFrames", {});
});

// This line sets up a handler for when the server sends a frame
socket.on('frame', function (data) {
    lastTime = time;
    time = data.ticks;
    loadPlayers(data.players);
	if (!init) {
		testData = {
			labels: playerNames.slice(0).sort(),
			datasets: [
				{
					label: "Points!",
		            fillColor: "rgba(220,220,220,0.5)",
		            strokeColor: "rgba(220,220,220,0.8)",
		            highlightFill: "rgba(220,220,220,0.75)",
		            highlightStroke: "rgba(220,220,220,1)",
		            data: Object.keys(playerScores).map(function (el) {
			        	playerScores[el].name = el;
			        	return playerScores[el];
			        }).sort(nameSort).map(function (el) {
						return el.score;
					})	
				}
			]
		}
		myBarChart = new Chart(ctx).Bar(testData, {
			showTooltips: false,
			ShowHorizontalLines: true
		});
		setInterval(updateChart, 3000);
		updateChart();
	}
    loadMines(data.mines);
    loadBombs(data.bombs);
    drawField();
    updatePlayerScores();
    init = true;
});

socket.on('resetgame', function () {
	init = false;
    mines = undefined;
    players = {};
    playerScores = {};
    playerNames = [];
    while (scoreHolder.firstChild) {
        scoreHolder.removeChild(scoreHolder.firstChild);
    }
    clearField();
});

function nameSort(a,b) {
	if (a.name < b.name) {
		return -1;
	}
	if (a.name > b.name) {
		return 1;
	}
	return 0;
}

function scoreSort(a,b) {
	if (a.name < b.name) {
		return -1;
	}
	if (a.name > b.name) {
		return 1
	}
	return 0;
}

function updateChart() {
	testData = {
		labels: playerNames.slice(0).sort(),
		datasets: [
			{
				label: "Points!",
	            fillColor: "rgba(220,220,220,0.5)",
	            strokeColor: "rgba(220,220,220,0.8)",
	            highlightFill: "rgba(220,220,220,0.75)",
	            highlightStroke: "rgba(220,220,220,1)",
	            data: Object.keys(playerScores).map(function (el) {
		        	playerScores[el].name = el;
		        	return playerScores[el];
		        }).sort(nameSort).map(function (el) {
					return el.score;
				})	
			}
		]
	};
	myBarChart.datasets[0].bars.forEach(function(el) {
		// fillColor
		if (!init) {
			var r = Math.floor(Math.random() * 255),
				g = Math.floor(Math.random() * 255),
				b = Math.floor(Math.random() * 255);
			el.fillColor = "rgba("+r+","+g+","+b+",0.7)";
		}
		el.value = playerScores[el.label].score;
	});
	myBarChart.update();

}


