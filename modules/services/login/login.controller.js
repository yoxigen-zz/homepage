angular.module("Login").controller("LoginController", ["$scope", "users", function($scope, users){
    $scope.loginOpen = false;
    $scope.newUser = true;

    var methods = {
        open: function(options){
            $scope.loginUser = {};
            $scope.loginOpen = true;
            $scope.loginError = null;
            $scope.newUser = options.newUser;
            $scope.focusUsername = true;

            users.getLastUser().then(function(username){
                $scope.loginUser.username = username;
            });
        }
    };

    $scope.$on($scope.service.type, function(e, eventData){
        methods[eventData.method] && methods[eventData.method](eventData.data);
    });

    $scope.$on("modalClose", $scope.closeViewer);

    $scope.closeViewer = function(){
        $scope.loginUser = {};
        $scope.loginOpen = false;
    };

    $scope.signIn = function(){
        if ($scope.newUser){
            $scope.loginUser.email = $scope.loginUser.username;

            users.signUp($scope.loginUser).then(function(user){
                onLogin(user);
            }, function(error){
                $scope.loginError = error.message;
            });
        }
        else{
            users.login($scope.loginUser.username, $scope.loginUser.password).then(function(user){
                onLogin(user);
            }, function(error){
                $scope.loginError = error.message;
            });
        }

    };

    function onLogin(user){
        $scope.loginOpen = false;
        $scope.loginError = null;
        $scope.$emit("userLogin", { user: user });
    }

}]);