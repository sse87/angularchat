angular.module("ChatApp").controller("LoginCtrl",
["$scope", "$location", "ChatBackend",
function ($scope, $location, ChatBackend) {
	
	$scope.takenUsername = "";
	$scope.selectNick = function (username) {
		$scope.username = username;
	};
	
	$scope.signInClick = function (username) {
		ChatBackend.signIn(username).then(function (available) {
			if (available) {
				$location.path("/index");
			}
			else {
				$scope.takenUsername = username;
			}
		});
	};
	
	$scope.prevUsername = ChatBackend.getUsername();
	
}]);
