angular.module("ChatApp").controller("RoomCtrl",
["$scope", "$routeParams", "socket", "ChatBackend",
function ($scope, $routeParams, socket, ChatBackend) {
	
	socket.on("updateusers", function (roomId, users, ops) {
		console.log("updateusers: [" + roomId + "," + users + "," + ops + "]");
	});
	socket.on("updatetopic", function (data) {
		console.log("updatetopic: " + data);
	});
	// "join", room, socket.username
	// "part", room, socket.username
	// "quit", users[socket.username].channels, socket.username
	socket.on("servermessage", function (type, roomId, username) {
		console.log("servermessage: [" + type + "," + roomId + "," + username + "]");
	});
	socket.on("updatechat", function (roomId, messageHistory) {
		console.log("updatechat: [" + roomId + "]");
		if (roomId === $scope.currentRoom.id) {
			$scope.messages = messageHistory;
		}
	});
	
	
	$scope.msgSubmit = function (message) {
		var msg = message;
		$scope.message = "";
		
		ChatBackend.sendMessage($scope.currentRoom.id, msg);
	};
	
	// Get right room by roomId
	var room = ChatBackend.getRoom($routeParams.roomId);
	if (room !== null) {
		$scope.currentRoom = room;
		$scope.messages = room.messages;
	}
	
}]);
