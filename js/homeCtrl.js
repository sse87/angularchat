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
