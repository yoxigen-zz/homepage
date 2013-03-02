angular.module("YahooMailNotifications").factory("yahoo_mail_notifications", ["$q", "$http", "utils", function($q, $http, utils){
    var currentUser;

    var methods = {
        get loggedIn(){
            return true;
        },
        login: function(){
            var deferred = $q.defer();

            deferred.resolve({});

            return deferred.promise;
        },
        logout: function(){
            currentUser = null;
        },
        getCurrentUser: function(){
            var deferred = $q.defer();

            return deferred.promise;
        },
        getNotifications: function(options){
            var deferred = $q.defer();

            return deferred.promise;
        },
        markAsRead: function(notificationIds){
            if (!notificationIds || !notificationIds.length)
                return false;

            //FB.method("notifications.markRead", {unread: "0", notification_ids: notificationIds.join(",")});
        }
    };

    return methods;
}]);