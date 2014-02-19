angular.module("ChatApp", ["ng", "ngRoute"])
.config(function ($routeProvider) {
	
	$routeProvider.when("/login", {
		templateUrl: "/view/login.html",
		controller: "LoginCtrl"
	}).when("/index", {
		templateUrl: "/view/roomList.html",
		controller: "HomeCtrl"
	}).when("/room/:roomId", {
		templateUrl: "/view/room.html",
		controller: "RoomCtrl",
		resolve: {
			this: function ($q, socket, ChatBackend) {
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
		updateRoomList: function () {
			socket.emit("rooms");
		},
		updateUserList: function () {
			socket.emit("users");
		}
	};
}]);





// ############################################################### //
// ######################### Controllers ######################### //
// ############################################################### //


angular.module("ChatApp").controller("LoginCtrl",
["$scope", "$location", "ChatBackend",
function ($scope, $location, ChatBackend) {
	
	$scope.signInClick = function (username) {
		ChatBackend.signIn(username).then(function (available) {
			if (available) {
				console.log("username " + username + " is available!");
				ChatBackend.username = username;
				$location.path("/index");
			}
			else {
				console.log("username " + username + " is NOT available!");
			}
		});
	};
	
	$scope.prevUsername = ChatBackend.username;
	
}]);


angular.module("ChatApp").controller("HomeCtrl",
["$scope", "$location", "socket", "ChatBackend",
function ($scope, $location, socket, ChatBackend) {
	
	// Redirect to login if username is missing
	if (ChatBackend.username === "") {
		$location.path("/login");
		return;
	}
	
	// On events
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
		$scope.roomList = ChatBackend.roomList;
	});
	socket.on("userlist", function (list) {
		console.log(list);//Array of strings
		// Reset user list
		ChatBackend.roomList = [];
		// Build it up and push it
		for (var i = 0; i < list.length; i++) {
			var user = { name: list[i] };
			ChatBackend.userList.push(user);
		}
		$scope.userList = ChatBackend.userList;
	});
	
	// Functions
	$scope.joinNewRoom = function (roomId) {
		if (ChatBackend.joinRoom(roomId)) {
			$location.path("/room/" + roomId)
		}
		else {
			console.log("ERROR: joinRoom:false");
		}
	};
	
	// Update logic for room list
	if (ChatBackend.roomList.length === 0) ChatBackend.updateRoomList();
	else $scope.roomList = ChatBackend.roomList;
	
	// Update logic for user list
	if (ChatBackend.userList.length === 0) ChatBackend.updateUserList();
	else $scope.userList = ChatBackend.userList;
	
	// Display username
	$scope.username = ChatBackend.username;
	
}]);


angular.module("ChatApp").controller("RoomCtrl",
["$scope", "$location", "$routeParams", "socket", "ChatBackend",
function ($scope, $location, $routeParams, socket, ChatBackend) {
	
	// Redirect to login if username is missing
	if (ChatBackend.username === "") {
		$location.path("/login");
		return;
	}
	
	socket.on("updateusers", function (data) {
		console.log("updateusers: " + data);
	});
	socket.on("updatetopic", function (data) {
		console.log("updatetopic: " + data);
	});
	socket.on("servermessage", function (data) {
		console.log("servermessage: " + data);
	});
	socket.on("updatechat", function (data) {
		console.log("updatechat: " + data);
	});
	
	
	// Get right room by roomId
	var room = ChatBackend.getRoom($routeParams.roomId);
	if (room !== null) {
		$scope.currentRoom = room;
	}
	
}]);


angular.module("ChatApp").controller("AboutCtrl",
["$scope",
function ($scope) {
	
	
	
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




