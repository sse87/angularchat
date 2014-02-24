angular.module("ChatApp").controller("RoomCtrl",
["$scope", "$location", "$routeParams", "socket", "ChatBackend",
function ($scope, $location, $routeParams, socket, ChatBackend) {
	
	socket.on("updateusers", function (data) {
		console.log("updateusers: " + data);
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
		$scope.messages = messageHistory;
	});
	
	
	$scope.msgSubmit = function (message) {
		var msg = message;
		$scope.message = "";
		
		ChatBackend.sendMessage($scope.currentRoom.id, message);
	};
	
	// Get right room by roomId
	var room = ChatBackend.getRoom($routeParams.roomId);
	if (room !== null) {
		$scope.currentRoom = room;
		$scope.messages = room.messages
	}
	
}]);
