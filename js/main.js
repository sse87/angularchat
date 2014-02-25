angular.module("ChatApp", ["ng", "ngRoute"])
.config(function ($routeProvider) {
	
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
});



// Constants
angular.module("ChatApp").constant("BACKEND_URL", "http://localhost:8123");



// Factory to share the socket methods
angular.module("ChatApp").factory("socket",
["$rootScope", "BACKEND_URL",
function ($rootScope, BACKEND_URL) {
	var socket = io.connect(BACKEND_URL);
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
	return {
		// Variables
		getUsername: function () { return username; },
		getUserList: function () { return userList; },
		getRoomList: function () { return roomList; },
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
				}
				roomList.length = 0;
				roomList.push.apply(roomList, tempList);
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
				socket.emit("joinroom", { room: roomId }, function (data) {
					deferred.resolve(data);
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
		sendMessage: function (roomId, message) {
			if (roomId !== "" && message !== "") {
				if (message.length > 200) { 
					message = message.substr(0,200);
				}
				
				// Sending message to the room
				console.log("emit(sendmsg: { roomName: [" + roomId + "], msg: [" + message + "] });");
				socket.emit("sendmsg", { roomName: roomId, msg: message });
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

/*

Client commands
	adduser
	rooms (roomlist)
	joinroom (updateusers, updatetopic, servermessage:join, updatechat)
	sendmsg (updatechat)
	privatemsg (recv_privatemsg)
	partroom (updateusers, servermessage:part)
	disconnect (updateusers, servermessage:quit)
	kick (kicked, updateusers)
	ban (banned, updateusers)
	users (userlist)
	
Server commands
	roomlist
	updateusers
	updatetopic
	servermessage[join, part, quit]
	updatechat
	recv_privatemsg
	kicked
	banned
	userlist

*/




