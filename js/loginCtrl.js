angular.module("ChatApp").controller("LoginCtrl",
["$scope", "$location", "ChatBackend",
function ($scope, $location, ChatBackend) {
	
	$scope.signInClick = function (username) {
		ChatBackend.signIn(username).then(function (available) {
			if (available) {
				console.log("username " + username + " is available!");
				ChatBackend.username = username;
				$location.path("/index");
			}
			else {
				console.log("username " + username + " is NOT available!");
			}
		});
	};
	
	$scope.prevUsername = ChatBackend.username;
	
}]);
