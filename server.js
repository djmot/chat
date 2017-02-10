'use strict';

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var WebSocketServer = require('ws').Server;
var wsServer = new WebSocketServer({ server: server });

app.use('/public', express.static(process.cwd() + '/public'));
app.use('/build', express.static(process.cwd() + '/public/build'));

app.route('/')
    .get(function (req, res) {
        res.sendFile(process.cwd() + '/public/index.html');
    });
    

/// Messages and user list that clients see
var messages = [];
var users = [];

/// Used to refresh the user list when users log in and out
var updatedUsers = [];
var updater = {
    token: 0,
    count: 0
};


wsServer.on('connection', function connection (ws) {
    function updateUsers () {
        ws.send(JSON.stringify({
            type: 'updateUsers',
            data: users
        }));
    }
    
    function approveName (name) {
        var approved = true;
        var reason = '';
        if (users.length > 50) {
            approved = false;
            reason = 'The chat room is full.';
        }
        if (name.length < 4 || name.length > 20) {
            approved = false;
            reason = 'Name must be between 4 and 20 characters.';
        }
        if (approved) {
            if (! (/^[A-Z0-9]+$/i.test(name)) ) {
                approved = false;
                reason = 'Name must contain only letters and numbers.';
            }
        }
        if (approved) {
            if (users.indexOf(name) > -1) {
                approved = false;
                reason = 'That name is already taken.';
            }
        }
        if (!approved) {
            ws.send(JSON.stringify({
                type: 'badName',
                data: { reason: reason, name: name }
            }));
        } else {
            ws.send(JSON.stringify({
                type: 'addUser',
                data: { name: name }
            }));
        }
    }
    
    function launchRefresh () {
        updatedUsers = [];
        updater.token = (updater.token + 1) % 100;
        var count = 0;
        wsServer.clients.forEach(function (client) {
            if (client.readyState === 1) { count++; }
        });
        updater.count = count;
        wsServer.clients.forEach(function (client) {
            if (client.readyState === 1) { 
                client.send(JSON.stringify({
                    type: 'sendUser',
                    data: { token: updater.token }
                }));
            }
        });
    }
    
    
    ws.on('message', function incoming (msg) {
        try {
            var msgParsed = JSON.parse(msg);
        } catch (e) {
            ws.send(JSON.stringify({ type: 'error', data: 'Couldn\'t parse JSON' }));
            return;
        }
        switch (msgParsed.type) {
            case 'comm':
                console.log(msgParsed.data);
                break;
            case 'newMessage':
                messages.push(msgParsed.data);
                if (messages.length > 20) { messages.splice(0, 1); }
                wsServer.clients.forEach(function (client) {
                    client.send(JSON.stringify({
                        type: 'newMessage',
                        data: msgParsed.data,
                    }));
                });
                break;
            case 'approveName':
                approveName(msgParsed.data);
                break;
            case 'updateUsers':
                updateUsers();
                break;
            case 'sendUser':
                if (updater.token === msgParsed.data.token) {
                    updatedUsers.push(msgParsed.data.user);
                    if (updatedUsers.length === updater.count) {
                        users = updatedUsers.slice();
                        wsServer.clients.forEach(function (client) {
                            client.send(JSON.stringify({
                                type: 'updateUsers',
                                data: users
                            }));
                        });
                    }
                }
                break;
            case 'refresh':
                launchRefresh();
                break;
            default:
                ws.send(JSON.stringify({ type: 'error', data: 'Invalid message type' }));
                break;
        }
    });
    
    ws.on('close', launchRefresh);
});

    
server.listen(process.env.PORT, process.env.IP, function () {
    console.log('Node listening on port: ' + process.env.PORT);
});
    
