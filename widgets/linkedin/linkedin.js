angular.module("LinkedIn").factory("linkedin", [ "OAuth1", "$q", "$http", function(OAuth1, $q, $http){
    var linkedinOauth,
        currentUser,
        oauth = new OAuth1({
            consumerKey: "m7g9bvv3ymvi",
            url: "https://api.linkedin.com/uas/oauth/requestToken",
            accessTokenUrl: "https://api.linkedin.com/uas/oauth/accessToken",
            key: "cZHJgvuHrNKSYkX1&",
            method: "POST",
            name: "linkedin"
        });

    var methods = {
        get loggedIn(){
            return !!oauth.oauthData;
        },
        login: function(){
            var deferred = $q.defer();

            oauth.login().then(function(authData){
                console.log("AUTH: ", authData);
                deferred.resolve();
            });

            return deferred.promise;
        },
        logout: function(){
            currentUser = null;
            oauth.logout("linkedin");
        },
        getCurrentUser: function(){  console.log("get user");
            var deferred = $q.defer();
            if (currentUser)
                deferred.resolve(currentUser);
            else{
                oauth.makeSignedRequest({ url: "https://api.linkedin.com/v1/people/~", method: "GET", params: { format: "json" } }).then(function(me){
                    console.log("LINKEEDIN USER: ", me)

                    var user = {
                        name: me.firstName + " " + me.lastName,
                        link: "http://www.linkedin.com" // For the current user, the news feed makes more sense than the user's own page.
                    };

                    deferred.resolve(user);
                    currentUser = user;
                }, function(error){
                    deferred.reject(error);
                });
            }

            return deferred.promise;
        },
        getNotifications: function(options){                 console.log("get not");
            return oauth.makeSignedRequest({ url: "https://api.linkedin.com/v1/people/~", method: "GET", params: { format: "json" } });
        },
        markAsRead: function(notificationIds){
            if (!notificationIds || !notificationIds.length)
                return false;

            FB.method("notifications.markRead", {unread: "0", notification_ids: notificationIds.join(",")});
        }
    };

    return methods;
}]);