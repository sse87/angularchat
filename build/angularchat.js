angular.module("ChatApp", ["ng", "ngRoute"])
.config(["$routeProvider", function ($routeProvider) {
	
	$routeProvider.when("/login", {
		templateUrl: "/view/login.html",
		controller: "LoginCtrl"
	}).when("/index", {
		templateUrl: "/view/roomList.html",
		controller: "HomeCtrl",
		resolve: {
			this: function ($location, ChatBackend) {
				// Redirect to login if username is missing
				if (ChatBackend.getUsername() === "") {
					$location.path("/login");
					return;
				}
			}
		}
	}).when("/room/:roomId", {
		templateUrl: "/view/room.html",
		controller: "RoomCtrl",
		resolve: {
			this: function ($location, ChatBackend) {
				// Redirect to login if username is missing
				if (ChatBackend.getUsername() === "") {
					$location.path("/login");
					return;
				}
			}
		}
	}).when("/about", {
		templateUrl: "/view/about.html",
		controller: "AboutCtrl"
	}).otherwise({ redirectTo: "/login" });
}]);



// Constants
//angular.module("ChatApp").constant("BACKEND_URL", "http://localhost:8123");



// Factory to share the socket methods
angular.module("ChatApp").factory("socket",
["$rootScope",
function ($rootScope) {
	var socket = io.connect("http://localhost:8123");
	return {
		on: function (eventName, callback) {
			socket.on(eventName, function () {  
				var args = arguments;
				$rootScope.$apply(function () {
					callback.apply(socket, args);
				});
			});
		},
		emit: function (eventName, data, callback) {
			socket.emit(eventName, data, function () {
				var args = arguments;
				$rootScope.$apply(function () {
					if (callback) {
						callback.apply(socket, args);
					}
				});
			});
		}
	};
}]);



// Factory that is shared between controllers
angular.module("ChatApp").factory("ChatBackend",
["$q", "socket",
function ($q, socket) {
	var username = "";
	var userList = [];
	var roomList = [];
	var activeRoomId = "";
	var activeRoomMsg = [];
	var activeRoomUserList = [];
	return {
		// Variables
		getUsername: function () { return username; },
		getUserList: function () { return userList; },
		getRoomList: function () { return roomList; },
		getActiveRoomId: function () { return activeRoomId; },
		getActiveRoomMsg: function () { return activeRoomMsg; },
		getActiveRoomUserList: function () { return activeRoomUserList; },
		// Functions
		isListening: false,
		startListeners: function () {
			this.isListening = true;
			
			socket.on("userlist", function (list) {
				console.log(list);//Array of strings
				// Build it up and push it
				var tempList = [];
				for (var i = 0; i < list.length; i++) {
					var user = { name: list[i] };
					tempList.push(user);
				}
				userList.length = 0;
				userList.push.apply(userList, tempList);
			});
			socket.on("roomlist", function (list) {
				console.log(list);//Object
				// Build it up and push it
				var tempList = [];
				for (var roomId in list) {
					var isThisUserConnected = false;
					var tempUserList = [];
					for (var user in list[roomId].users) {
						tempUserList.push(user);
						if (user === username)
							isThisUserConnected = true;
					}
					var isThisUserOp = false;
					var tempOpList = [];
					for (var op in list[roomId].ops) {
						tempOpList.push(op);
						if (op === username)
							isThisUserOp = true;
					}
					var room = {
						id:			roomId,
						topic:		list[roomId].topic,
						password:	list[roomId].password,
						users:		tempUserList,
						usersCount: tempUserList.length,
						isConnect:	isThisUserConnected,
						ops:		tempOpList,
						opsCount:	tempOpList.length,
						isOp:		isThisUserOp,
						banned:		list[roomId].banned,
						locked:		list[roomId].locked,
						messages:	list[roomId].messageHistory
					};
					tempList.push(room);
					if (activeRoomId === room.id) {
						activeRoomMsg.length = 0;
						activeRoomMsg.push.apply(activeRoomMsg, room.messages);
						activeRoomUserList.length = 0;
						activeRoomUserList.push.apply(activeRoomUserList, room.ops);
						activeRoomUserList.push.apply(activeRoomUserList, room.users);
					}
				}
				roomList.length = 0;
				roomList.push.apply(roomList, tempList);
			});
			socket.on("updateusers", function (roomId, users, ops) {
				if (roomId === activeRoomId) {
					var tempList = [], key;
					for (key in ops) {
						tempList.push(key);
					}
					for (key in users) {
						tempList.push(key);
					}
					activeRoomUserList.length = 0;
					activeRoomUserList.push.apply(activeRoomUserList, tempList);
				}
				// console.log("updateusers: " + roomId);
				// console.log(users);
				// console.log(ops);
			});
			socket.on("updatetopic", function (room, topic, username) {
				console.log("updatetopic: [" + room + "," + topic + "," + username + "]");
			});
			// "join", room, socket.username
			// "part", room, socket.username
			// "quit", users[socket.username].channels, socket.username
			socket.on("servermessage", function (type, roomId, username) {
				console.log("servermessage: [" + type + "," + roomId + "," + username + "]");
			});
			socket.on("updatechat", function (roomId, messageHistory) {
				console.log("updatechat: [" + roomId + "]");
				if (roomId === activeRoomId) {
					activeRoomMsg.length = 0;
					activeRoomMsg.push.apply(activeRoomMsg, messageHistory);
				}
			});
			
		},
		signIn: function (name) {
			var deferred = $q.defer();
			socket.emit("adduser", name, function (available) {
				if (available) username = name;
				deferred.resolve(available);
			});
			return deferred.promise;
		},
		joinRoom: function (roomId) {
			if (roomId !== "") {
				// Replace all spaces with plus, the str.replace(" ","") only replace one case.
				// But 'str.replace(/ /g, "_")' and 'str.replace(/\s/g, "_")' also works.
				roomId = roomId.split(" ").join("_");
				
				var deferred = $q.defer();
				socket.emit("joinroom", { room: roomId }, function (success) {
					if (success) {
						activeRoomId = roomId;
						socket.emit("rooms");
					}
					deferred.resolve(success);
				});
				return deferred.promise;
			}
		},
		getRoom: function (roomId) {
			var roomIndex = -1;
			for (var i = 0; i < roomList.length; i++) {
				if (roomId === roomList[i].id) {
					roomIndex = i;
				}
			}
			if (roomIndex === -1)
				return null;
			return roomList[roomIndex];
		},
		partRoom: function (roomId) {
			if (roomId !== "") {
				socket.emit("partroom", roomId);
			}
			else if (activeRoomId !== "") {
				socket.emit("partroom", activeRoomId);
			}
		},
		disconnect: function () {
			socket.emit("disconnect");
		},
		sendMessage: function (message) {
			if (activeRoomId !== "" && message !== "") {
				if (message.length > 200) { 
					message = message.substr(0,200);
				}
				
				// Sending message to the room
				socket.emit("sendmsg", { roomName: activeRoomId, msg: message });
			}
		},
		kickUser: function (name, roomId) {
			console.log("kickUser(" + name + ", " + roomId + ")");
			if (name !== "" && roomId !== "") {
				var deferred = $q.defer();
				socket.emit("kick", { user: name, room: roomId }, function (success) {
					console.log("kick?: " + success);
					if (success) {
						// 
					}
					deferred.resolve(success);
				});
				return deferred.promise;
			}
		},
		banUser: function (name, roomId) {
			console.log("banUser(" + name + ", " + roomId + ")");
			if (name !== "" && roomId !== "") {
				var deferred = $q.defer();
				socket.emit("ban", { user: name, room: roomId }, function (success) {
					console.log("ban?: " + success);
					if (success) {
						// 
					}
					deferred.resolve(success);
				});
				return deferred.promise;
			}
		},
		updateRoomList: function () {
			socket.emit("rooms");
		},
		updateUserList: function () {
			socket.emit("users");
		}
	};
}]);

angular.module("ChatApp").controller("AboutCtrl",
["$scope",
function ($scope) {
	
	
}]);

angular.module("ChatApp").controller("HomeCtrl",
["$scope", "$location", "ChatBackend",
function ($scope, $location, ChatBackend) {
	
	if (ChatBackend.isListening === false) {
		ChatBackend.startListeners();
	}
	
	
	// Functions
	$scope.refreshRoomList = function () {
		ChatBackend.updateRoomList();
	};
	$scope.refreshUserList = function () {
		ChatBackend.updateUserList();
	};
	$scope.joinNewRoom = function (roomId) {
		// Replace all spaces with plus, the str.replace(" ","") only replace one case.
		// But 'str.replace(/ /g, "_")' and 'str.replace(/\s/g, "_")' also works.
		roomId = roomId.split(" ").join("_");
		if (ChatBackend.joinRoom(roomId)) {
			$location.path("/room/" + roomId);
		}
		else {
			console.log("ERROR: joinRoom:false");
		}
	};
	$scope.partRoom = function (roomId) {
		ChatBackend.partRoom(roomId);
		ChatBackend.updateRoomList();
	};
	
	$scope.userList = ChatBackend.getUserList();
	$scope.roomList = ChatBackend.getRoomList();
	
	// Display username
	$scope.username = ChatBackend.getUsername();
	
	// Call for update of user list
	ChatBackend.updateUserList();
	// Call for update of room list
	ChatBackend.updateRoomList();
}]);

angular.module("ChatApp").controller("LoginCtrl",
["$scope", "$location", "ChatBackend",
function ($scope, $location, ChatBackend) {
	
	$scope.takenUsername = "";
	$scope.selectNick = function (username) {
		$scope.username = username;
	};
	
	$scope.signInClick = function (username) {
		ChatBackend.signIn(username).then(function (available) {
			if (available) {
				$location.path("/index");
			}
			else {
				$scope.takenUsername = username;
			}
		});
	};
	
	$scope.prevUsername = ChatBackend.getUsername();
	
}]);

angular.module("ChatApp").controller("RoomCtrl",
["$scope", "$routeParams", "$location", "ChatBackend",
function ($scope, $routeParams, $location, ChatBackend) {
	
	$scope.msgSubmit = function (message) {
		var msg = message;
		$scope.message = "";
		
		ChatBackend.sendMessage(msg);
	};
	$scope.partRoom = function () {
		ChatBackend.partRoom("");
		$location.path("/index");
	};
	$scope.kick = function (username, roomId) {
		ChatBackend.kickUser(username, roomId);
	};
	$scope.ban = function (username, roomId) {
		ChatBackend.banUser(username, roomId);
	};
	
	// Get right room by roomId
	var room = ChatBackend.getRoom($routeParams.roomId);
	var myUsername = ChatBackend.getUsername();
	if (room !== null) {
		$scope.currentRoom = room;
		// Check if user is banned
		var key;
		for (key in room.banned) {
			if (key === myUsername) {
				$location.path("/index");
			}
		}
		for (key in room.ops) {
			if (key === myUsername) {
				$scope.isOp = true;
			}
		}
	}
	else {
		setTimeout(function() {
			var room = ChatBackend.getRoom($routeParams.roomId);
			if (room !== null) {
				$scope.currentRoom = room;
				var key;
				for (key in room.banned) {
					if (key === myUsername) {
						$location.path("/index");
					}
				}
				for (key in room.ops) {
					if (key === myUsername) {
						$scope.isOp = true;
					}
				}
				$scope.$apply();
			}
		}, 1000);
	}
	
	$scope.userList = ChatBackend.getActiveRoomUserList();
	$scope.messages = ChatBackend.getActiveRoomMsg();
	
}]);
