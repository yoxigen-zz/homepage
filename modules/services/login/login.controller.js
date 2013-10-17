angular.module("Login").controller("LoginController", ["$scope", "users", function($scope, users){
    $scope.loginOpen = false;
    $scope.newUser = true;
    $scope.confirmPassword = "";

    var methods = {
        open: function(options){
            $scope.loginUser = {};
            $scope.loginOpen = true;
            $scope.loginError = null;
            $scope.newUser = options.newUser;
            $scope.focusUsername = true;

            $scope.$emit("showLogin");
            users.getLastUser().then(function(username){
                $scope.loginUser.username = username;
            });
        }
    };

    $scope.$on($scope.service.type, function(e, eventData){
        methods[eventData.method] && methods[eventData.method](eventData.data);
    });

    $scope.$on("modalClose", function(){
        $scope.closeViewer();
    });

    $scope.closeViewer = function(){
        $scope.loginUser = {};
        $scope.loginOpen = false;

        $scope.$emit("hideLogin");
    };

    $scope.toggleNewUser = function(){
        $scope.newUser = !$scope.newUser;
    };

    $scope.signIn = function(){
        if (!$scope.loginUser || !$scope.loginUser.username || !$scope.loginUser.password){
            $scope.loginError = "Please enter email adress and password.";
            return;
        }

        if (!users.validateUsername($scope.loginUser.username)){
            $scope.loginError = "Invalid email address.";
            return;
        }

        if ($scope.newUser){
            if (!$scope.loginUser.confirmPassword){
                $scope.loginError = "Please confirm password.";
                return;
            }

            if ($scope.loginUser.confirmPassword !== $scope.loginUser.password){
                $scope.loginError = "Passwords don't match.";
                return;
            }

            $scope.loginUser.email = $scope.loginUser.username;
            var newUser = {
                email: $scope.loginUser.username,
                username: $scope.loginUser.username,
                password: $scope.loginUser.password
            };

            users.signUp(newUser).then(function(user){
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

    $scope.facebookLogin = function(){
        users.facebookLogin().then(function(user){
            onLogin(user);
        }, function(error){
            $scope.loginError = error.message;
        });
    };

    function onLogin(user){
        $scope.loginOpen = false;
        $scope.loginError = null;
        $scope.$emit("userLogin", { user: user });
    }

}]);