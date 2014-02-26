angular.module("ChatApp").controller("RoomCtrl",
["$scope", "$routeParams", "$location", "ChatBackend",
function ($scope, $routeParams, $location, ChatBackend) {
	
	$scope.msgSubmit = function (message) {
		var msg = message;
		$scope.message = "";
		
		ChatBackend.sendMessage(msg);
	};
	$scope.partRoom = function () {
		ChatBackend.partRoom("");
		$location.path("/index");
	};
	$scope.kick = function (username, roomId) {
		ChatBackend.kickUser(username, roomId);
	};
	$scope.ban = function (username, roomId) {
		ChatBackend.banUser(username, roomId);
	};
	
	// Get right room by roomId
	var room = ChatBackend.getRoom($routeParams.roomId);
	var myUsername = ChatBackend.getUsername();
	if (room !== null) {
		$scope.currentRoom = room;
		// Check if user is banned
		var key;
		for (key in room.banned) {
			if (key === myUsername) {
				$location.path("/index");
			}
		}
		for (key in room.ops) {
			if (key === myUsername) {
				$scope.isOp = true;
			}
		}
	}
	else {
		setTimeout(function() {
			var room = ChatBackend.getRoom($routeParams.roomId);
			if (room !== null) {
				$scope.currentRoom = room;
				var key;
				for (key in room.banned) {
					if (key === myUsername) {
						$location.path("/index");
					}
				}
				for (key in room.ops) {
					if (key === myUsername) {
						$scope.isOp = true;
					}
				}
				$scope.$apply();
			}
		}, 1000);
	}
	
	$scope.userList = ChatBackend.getActiveRoomUserList();
	$scope.messages = ChatBackend.getActiveRoomMsg();
	
}]);
