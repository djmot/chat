(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*global React, ReactDOM, $*/
'use strict';

$('#modal').modal('show');
	
var ws = new WebSocket('wss:' + window.location.origin.slice(8));
function incomingPreLogin (event) {
	var response = JSON.parse(event.data);
	switch (response.type) {
		case 'error':
			console.log('Error: ' + response.data);
			break;
		case 'badName':
			$('#username-error-text').html(response.data.reason);
			break;
		case 'addUser':
			ReactDOM.render(React.createElement(Main, {user: response.data.name}), $('#root')[0]);
			$('#modal').modal('hide');
			break;
		default: 
			console.log('Invalid response type: ' + response.type);
			break;
	}
}
ws.onmessage = incomingPreLogin;
$('#username-button').on('click', function () {
	ws.send(JSON.stringify({
		type: 'approveName',
		data: $('#username-input').val()
	}));
});


var Main = React.createClass({displayName: "Main",
	getInitialState: function () {
		var main = this;
		function incoming (event) {
			var response = JSON.parse(event.data);
			switch (response.type) {
				case 'error':
					console.log('Error: ' + response.data);
					break;
				case 'updateMessages':
					var newMessages = response.data.slice();
					main.setState({ messages: newMessages });
					break;
				case 'updateUsers':
					var newUsers = response.data.slice();
					main.setState({ users: newUsers });
					break;
				case 'newMessage':
					main._storeMessage(response.data);
					break;
				case 'sendUser':
					ws.send(JSON.stringify({
						type: 'sendUser',
						data: { user: main.props.user, token: response.data.token }
					}));
					break;
				default: 
					console.log('Invalid response type: ' + response.type);
					break;
			}
		}
		ws.onmessage = incoming;
		ws.send(JSON.stringify({
			type: 'refresh'
		}));
		
		return { 
			messages: [], 
			users: []
		};
	},
	
	_storeMessage: function (message) {
		var messages = this.state.messages.slice();
		messages.push(message);
		if (messages.length > 20) { messages.splice(0, 1); }
		this.setState({ messages: messages });
	},
	
	_postMessage: function (message) {
		ws.send(JSON.stringify({ type: 'newMessage', data: message }));
	},
	
	render: function () {
		return (
			React.createElement("div", {id: "main"}, 
				React.createElement("div", {id: "left"}, 
					React.createElement(Chat, {messages: this.state.messages}), 
					React.createElement(Input, {storeMessage: this._postMessage, user: this.props.user})
				), 
				React.createElement(UserList, {users: this.state.users})
			)
		);
	}
});


var Chat = React.createClass({displayName: "Chat",
	_scrollDown: function () {
		var chat = $('#chat')[0];
		chat.scrollTop = chat.scrollHeight - chat.clientHeight;
	},
	
	componentDidMount: function () {
		this._scrollDown();
	},
	componentDidUpdate: function () {
		this._scrollDown();
	},
	
	render: function () {
		var messages = [];
		var message;
		for (var i = 0; i < this.props.messages.length; i++) {
			message = this.props.messages[i];
			messages.push(
				React.createElement("div", {className: "message-box"}, 
					React.createElement("p", null, React.createElement("span", {className: "user-span"}, message.user), ": ", React.createElement("span", {className: "message-span"}, message.message))
				)
			);
		}
		return (
			React.createElement("div", {id: "chat"}, 
				messages
			)
		);
	}
});


var Input = React.createClass({displayName: "Input",
	_sendMessage: function () {
		this.props.storeMessage({
			user: this.props.user,
			message: $('#input-text').val()
		});
		this._clearText();
	},
	_clearText: function () { $('#input-text').val(''); },
	
	_textKeyUp: function (e) {
		if (e.keyCode === 13) { this._sendMessage(); }
	},
	_sendClick: function () { this._sendMessage(); },
	
	render: function () {
		return (
			React.createElement("div", {id: "input"}, 
				React.createElement("div", {className: "input-group"}, 
					React.createElement("input", {id: "input-text", type: "text", className: "form-control", onKeyUp: this._textKeyUp}), 
					React.createElement("span", {className: "input-group-btn"}, 
						React.createElement("button", {type: "button", className: "btn btn-primary", onClick: this._sendClick}, "Send")
					)
				)
			)
		);
	}
});


var UserList = React.createClass({displayName: "UserList",
	render: function () {
		var users = [];
		for (var i = 0; i < this.props.users.length; i++) {
			users.push( React.createElement("p", {className: "userlist-p"}, this.props.users[i]) );
		}
		return (
			React.createElement("div", {id: "userlist"}, 
				React.createElement("p", null, React.createElement("span", null, this.props.users.length), " online now:"), 
				users
			)
		);
	}
});

},{}]},{},[1]);
