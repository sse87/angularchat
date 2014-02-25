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
	var activeRoom = {};
	var activeRoomId = "";
	var activeRoomMsg = [];
	var activeRoomUserList = [];
	return {
		// Variables
		getUsername: function () { return username; },
		getUserList: function () { return userList; },
		getRoomList: function () { return roomList; },
		getActiveRoom: function () { return activeRoom; },
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
					var totalUsers = 0;
					var isThisUserConnected = false;
					for (var key in list[roomId].users) {
						if (list[roomId].users.hasOwnProperty(key)) {
							totalUsers++;
							if (key === username)
								isThisUserConnected = true;
						}
					}
					var room = {
						id:			roomId,
						topic:		list[roomId].topic,
						password:	list[roomId].password,
						users:		list[roomId].users,
						usersCount: totalUsers,
						isConnect:	isThisUserConnected,
						ops:		list[roomId].obs,
						banned:		list[roomId].banned,
						locked:		list[roomId].locked,
						messages:	list[roomId].messageHistory
					};
					tempList.push(room);
					if (activeRoomId === room.id) {
						activeRoom = room;
						activeRoomMsg.length = 0;
						activeRoomMsg.push.apply(activeRoomMsg, room.messages);
						activeRoomUserList.length = 0;
						activeRoomUserList.push.apply(activeRoomUserList, room.users);
					}
				}
				roomList.length = 0;
				roomList.push.apply(roomList, tempList);
			});
			socket.on("updateusers", function (roomId, users, ops) {
				console.log("updateusers: [" + roomId + "," + users + "," + ops + "]");
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
		partRoom: function () {
			if (activeRoomId !== "") {
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
		updateRoomList: function () {
			socket.emit("rooms");
		},
		updateUserList: function () {
			socket.emit("users");
		}
	};
}]);
