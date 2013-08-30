angular.module("Homepage").controller("UserMenuController", ["$scope", "users", function($scope, users){
    $scope.logout = function(){
        if (confirm("Are you sure you wish to logout from Homepage?")){
            users.logout();
            $scope.$emit("userLogout");
        }
    };

    $scope.login = function(){
        $scope.callService("login", "open", { newUser: false });
    };

    $scope.signUp = function(){
        $scope.callService("login", "open", { newUser: true });
    };
}]);