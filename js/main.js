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
		controller: "RoomCtrl"
	}).when("/about", {
		templateUrl: "/view/about.html",
		controller: "AboutCtrl"
	}).otherwise({ redirectTo: "/login" })
});



// Constants
angular.module("ChatApp").constant("BACKEND_URL", "http://localhost:8123");



// Factory to share the socket methods
angular.module("ChatApp").factory('socket',
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
			})
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
		users: [],
		rooms: [],
		// Functions
		signIn: function (username) {
			var deferred = $q.defer();
			socket.emit("adduser", username, function (available) {
				deferred.resolve(available);
			});
			return deferred.promise;
		},
		getRoom: function (roomId) {
			var roomIndex = -1;
			for (var i = 0; i < this.rooms.length; i++) {
				if (roomId === this.rooms[i].id) {
					roomIndex = i;
				}
			}
			if (roomIndex === -1)
				return null;
			return this.rooms[roomIndex];
		}
	};
}]);



// ############################################################### //
// ######################### Controllers ######################### //
// ############################################################### //


angular.module("ChatApp").controller("LoginCtrl",
["$scope", "$location", "socket", "ChatBackend",
function ($scope, $location, socket, ChatBackend) {
	
	$scope.signInClick = function () {
		ChatBackend.signIn($scope.username).then(function (available){
			if (available) {
				console.log("username " + $scope.username + " is available!");
				ChatBackend.username = $scope.username;
				$location.path("/index");
			}
			else {
				console.log("username " + $scope.username + " is NOT available!");
			}
		});
	};
	
	$scope.prevUsername = ChatBackend.username;
	
}]);


angular.module("ChatApp").controller("HomeCtrl",
["$scope", "socket", "ChatBackend",
function ($scope, socket, ChatBackend){
	
	console.log()
	
	socket.on('roomlist', function (roomlist) {
		console.log(roomlist);
		// Reset room list
		ChatBackend.rooms = [];
		// Build it up and push it
		for (var roomId in roomlist) {
			var room = {
				id:			roomId,
				topic:		roomlist[roomId].topic,
				password:	roomlist[roomId].password,
				users:		roomlist[roomId].users,
				ops:		roomlist[roomId].obs,
				banned:		roomlist[roomId].banned,
				locked:		roomlist[roomId].locked,
				messages:	roomlist[roomId].messageHistory
			};
			ChatBackend.rooms.push(room);
		}
		$scope.rooms = ChatBackend.rooms;
	});
	
	
	$scope.updateRoomList = function () {
		console.log('emit rooms');
		socket.emit('rooms');
	};
	
	if (ChatBackend.rooms.length === 0) {
		$scope.updateRoomList();
	}
	else {
		$scope.rooms = ChatBackend.rooms;
	}
	
}]);


angular.module("ChatApp").controller("RoomCtrl",
["$scope", "$routeParams", "ChatBackend",
function ($scope, $routeParams, ChatBackend){
	
	// Get right room by roomId
	$scope.currentRoom = ChatBackend.getRoom($routeParams.roomId);
	
}]);


angular.module("ChatApp").controller("AboutCtrl",
["$scope",
function ($scope){
	
	
	
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




