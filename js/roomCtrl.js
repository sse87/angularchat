angular.module("ChatApp").controller("RoomCtrl",
["$scope", "$routeParams", "$location", "ChatBackend",
function ($scope, $routeParams, $location, ChatBackend) {
	
	$scope.msgSubmit = function (message) {
		var msg = message;
		$scope.message = "";
		
		ChatBackend.sendMessage(msg);
	};
	$scope.partRoom = function () {
		ChatBackend.partRoom();
		$location.path("/index");
	};
	
	// Get right room by roomId
	var room = ChatBackend.getRoom($routeParams.roomId);
	if (room !== null) {
		$scope.currentRoom = room;
	}
	//$scope.currentRoom = ChatBackend.getActiveRoom();
	$scope.userList = ChatBackend.getActiveRoomUserList();
	$scope.messages = ChatBackend.getActiveRoomMsg();
	
}]);
