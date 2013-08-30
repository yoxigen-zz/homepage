angular.module("HomepageUsers", []).factory("users", ["$q", "parse", function($q, parse){
    var methods = {
        getCurrentUser: function(){
            return parse.getCurrentUser();
        },
        login: function(username, password){
            return parse.login(username, password);
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