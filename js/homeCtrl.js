angular.module("ChatApp").controller("HomeCtrl",
["$scope", "$location", "ChatBackend",
function ($scope, $location, ChatBackend) {
	
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
			setTimeout(function() {
				$location.path("/room/" + roomId);
				$scope.$apply();
			}, 250);
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
