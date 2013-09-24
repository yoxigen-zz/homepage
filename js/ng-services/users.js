angular.module("HomepageUsers", ["Storage"]).factory("users", ["$q", "parse", "Storage", function($q, parse, Storage){
    var usersStorage = new Storage("users");

    var methods = {
        facebookLogin: function(){
            return parse.facebookLogin();
        },
        getCurrentUser: function(){
            return parse.getCurrentUser();
        },
        getLastUser: function(){
            return usersStorage.local.getItem("lastLogin");
        },
        login: function(username, password){
            var deferred = $q.defer();

            parse.login(username, password).then(function(user){
                usersStorage.local.setItem("lastLogin", user.attributes.username);
                deferred.resolve(user);
            }, deferred.reject);

            return deferred.promise;
        },
        logout: function(){
            return parse.logout();
        },
        signUp: function(userDetails){
            return parse.signUp(userDetails);
        }
    };

    return methods;
}]);