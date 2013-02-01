angular.module("LinkedIn").factory("linkedin", [ "OAuth1", "$q", "$http", function(OAuth1, $q, $http){
    var linkedinOauth,
        currentUser,
        oauth = new OAuth1({
            consumerKey: "m7g9bvv3ymvi",
            consumerSecret: "cZHJgvuHrNKSYkX1",
            requestTokenUrl: "https://api.linkedin.com/uas/oauth/requestToken",
            accessTokenUrl: "https://api.linkedin.com/uas/oauth/accessToken",
            method: "POST",
            name: "linkedin",
            scope: "w_messages r_basicprofile"
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
        getCurrentUser: function(){
            var deferred = $q.defer();
            if (currentUser)
                deferred.resolve(currentUser);
            else{
                oauth.makeSignedRequest({ url: "https://api.linkedin.com/v1/people/~:(first-name,id,last-name,picture-url)", method: "GET", params: { format: "json" } }).then(function(me){
                    var user = {
                        image: me.pictureUrl,
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
        getNotifications: function(options){
            var deferred = $q.defer();
            oauth.makeSignedRequest({ url: "https://api.linkedin.com/v1/people/~/mailbox", method: "GET", params: { format: "json" } }).then(function(result){
                console.log("RESULT: ", result);
                deferred.resolve({items: [], unreadCount: 0 });
            }, function(error){
                deferred.reject(error);
            });
            return deferred.promise;
        },
        markAsRead: function(notificationIds){
            if (!notificationIds || !notificationIds.length)
                return false;

            FB.method("notifications.markRead", {unread: "0", notification_ids: notificationIds.join(",")});
        }
    };

    return methods;
}]);