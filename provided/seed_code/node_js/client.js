// INCLUDES
var net = require('net');

// COMMANDLINE ARGS
if (process.argv.length < 6) {
    console.log("usage: client host_name port user_name password");
    return
}

// CONSTANTS
var HOST = process.argv[2];
var PORT = process.argv[3];
var USER_NAME = process.argv[4] + "";
var PASSWORD = process.argv[5] + "";
var FRAME_RATE = 20;
var UPDATE_INTERVAL = Math.floor(1 / FRAME_RATE * 1000);

// HELPER FUNCTIONS
function shutDown() {
    clearInterval(intervalToken);
    client.end();
}

function handleFrame() {
    client.write('STATUS\n');
    client.write('ACCELERATE 3.14 1\n');
    // TODO
}

function handleStatus(x, y, dx, dy) {
    // TODO
}

function handleMines(tokens, i, count) {
    // TODO
}

function handlePlayers(tokens, i, count) {
    // TODO
}

function handleBombs(tokens, i, count) {
    // TODO
}

// CLIENT
var client = net.connect({port: PORT, host: HOST},
    function () {
        console.log("connected to the server!");
        client.write(USER_NAME + ' ' + PASSWORD + '\n');
        intervalToken = setInterval(handleFrame, UPDATE_INTERVAL);
    }
);

client.on('data', function (data) {
    var strData = data.toString();
    var tokens = strData.split(' ');
    console.log(strData);  // for testing only
    for (var i = 0, len = tokens.length; i < len; ++i) {
        var token = tokens[i];
        switch (token) {
        case "STATUS_OUT":
            handleStatus(tokens[++i], tokens[++i], tokens[++i], tokens[++i]);
            break;
        case "MINES":
            var num_mines = parseInt(tokens[++i], 10);
            handleMines(tokens, i + 1, num_mines);
            i += 3 * num_mines;
            break;
        case "PLAYERS":
            var num_players = parseInt(tokens[++i], 10);
            handlePlayers(tokens, i + 1, num_players);
            i += 4 * num_players;
            break;
        case "ACCELERATE_OUT":
            ++i;  // increment past 'DONE'
            break;
        case "BRAKE_OUT":
            ++i;  // increment past 'DONE'
            break;
        case "BOMBS":
            var num_bombs = tokens[++i];
            handleBombs(tokens, i + 1, num_bombs);
            i += 2 * num_bombs;
            break;
        case "":
        case "\n":
        case "\r\n":
            // extra space, do nothing
            break;
        default:
            console.error("unknown message type: '" + token + "'");
        }
    }
});

client.on('end', function () {
    console.log('disconnected from the server');
    shutDown();
});

process.on('uncaughtException', function (err) {
    console.log(err);
});
