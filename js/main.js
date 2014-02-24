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
				if (ChatBackend.username === "") {
					$location.path("/login");
					return;
				}
			}
		}
	}).when("/room/:roomId", {
		templateUrl: "/view/room.html",
		controller: "RoomCtrl",
		resolve: {
			this: function ($q, $location, socket, ChatBackend) {
				// Redirect to login if username is missing
				if (ChatBackend.username === "") {
					$location.path("/login");
					return;
				}
				
				var deferred = $q.defer();
				
				socket.on("roomlist", function (list) {
					console.log(list);//Object
					// Reset room list
					ChatBackend.roomList = [];
					// Build it up and push it
					for (var roomId in list) {
						var room = {
							id:			roomId,
							topic:		list[roomId].topic,
							password:	list[roomId].password,
							users:		list[roomId].users,
							ops:		list[roomId].obs,
							banned:		list[roomId].banned,
							locked:		list[roomId].locked,
							messages:	list[roomId].messageHistory
						};
						ChatBackend.roomList.push(room);
					}
					deferred.resolve();
				});
				socket.emit("rooms");
				
				return deferred.promise;
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
	return {
		// Variables
		username: "",
		userList: [],
		roomList: [],
		// Functions
		signIn: function (username) {
			var deferred = $q.defer();
			socket.emit("adduser", username, function (available) {
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
			for (var i = 0; i < this.roomList.length; i++) {
				if (roomId === this.roomList[i].id) {
					roomIndex = i;
				}
			}
			if (roomIndex === -1)
				return null;
			return this.roomList[roomIndex];
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




