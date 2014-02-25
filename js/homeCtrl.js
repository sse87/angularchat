angular.module("ChatApp").controller("HomeCtrl",
["$scope", "$location", "socket", "ChatBackend",
function ($scope, $location, socket, ChatBackend) {
	
	if (ChatBackend.isListening === false) {
		ChatBackend.startListeners();
	}
	
	
	// Functions
	$scope.refreshRoomList = function () {
		ChatBackend.updateRoomList();
	};
	$scope.refreshUserList = function () {
		console.log(ChatBackend.getUserList());
		ChatBackend.updateUserList();
		console.log(ChatBackend.getUserList());
	};
	$scope.joinNewRoom = function (roomId) {
		console.log("joinNewRoom(" + roomId + ");");
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
	
	$scope.userList = ChatBackend.getUserList();
	$scope.roomList = ChatBackend.getRoomList();
	
	// Display username
	$scope.username = ChatBackend.getUsername();
	
	// Call for update of user list
	ChatBackend.updateUserList();
	// Call for update of room list
	ChatBackend.updateRoomList();
}]);
