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
