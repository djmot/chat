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
			ReactDOM.render(<Main user={response.data.name} />, $('#root')[0]);
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


var Main = React.createClass({
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
			<div id="main">
				<div id="left">
					<Chat messages={this.state.messages} />
					<Input storeMessage={this._postMessage} user={this.props.user} />
				</div>
				<UserList users={this.state.users} />
			</div>
		);
	}
});


var Chat = React.createClass({
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
				<div className="message-box">
					<p><span className="user-span">{message.user}</span>: <span className="message-span">{message.message}</span></p>
				</div>
			);
		}
		return (
			<div id="chat">
				{messages}
			</div>
		);
	}
});


var Input = React.createClass({
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
			<div id="input">
				<div className="input-group">
					<input id="input-text" type="text" className="form-control" onKeyUp={this._textKeyUp} />
					<span className="input-group-btn">
						<button type="button" className="btn btn-primary" onClick={this._sendClick}>Send</button>
					</span>
				</div>
			</div>
		);
	}
});


var UserList = React.createClass({
	render: function () {
		var users = [];
		for (var i = 0; i < this.props.users.length; i++) {
			users.push( <p className="userlist-p">{this.props.users[i]}</p> );
		}
		return (
			<div id="userlist">
				<p><span>{this.props.users.length}</span> online now:</p>
				{users}
			</div>
		);
	}
});