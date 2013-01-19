angular.module("Notifications").factory("facebook", [ "oauth", "$q", "$http", "corsHttp", function(oauth, $q, $http, corsHttp){
    var apiKey = "132603783569142",
        appSecret = "ba840592bd31f05bec737573893f939e",
        graphApiUrl = "https://graph.facebook.com/",
        legacyApiUrl = "https://api.facebook.com/method/",
        fbOauth,
        currentUser;

    var FB = {
        api: function(object, params){
            var paramsQuery = [];
            if (params){
                for(var key in params){
                    paramsQuery.push([key, encodeURIComponent(params[key])].join("="));
                }
            }
            return $http.jsonp(graphApiUrl + object + "?" + getFbUrlCommons() + (paramsQuery.length ? "&" + paramsQuery.join("&") : ""));
        },
        fql: function(query){
            return $http.jsonp(graphApiUrl + "fql?q=" + encodeURIComponent(query) + "&" + getFbUrlCommons());
        },
        method: function(method, params){
            var paramsQuery = [];
            if (params){
                for(var key in params){
                    paramsQuery.push([key, encodeURIComponent(params[key])].join("="));
                }
            }
            return $http.jsonp(legacyApiUrl + method + "?" + getFbUrlCommons() + (paramsQuery.length ? "&" + paramsQuery.join("&") : ""));
        }
    };

    function getFbUrlCommons(){
        return "access_token=" + fbOauth.token + "&callback=JSON_CALLBACK";
    }

    function getProfileImage(userId){
        return "http://graph.facebook.com/" + userId + "/picture";
    }

    var methods = {
        get loggedIn(){
            fbOauth = oauth.getOauth("facebook");
            return !!fbOauth;
        },
        login: function(){
            var deferred = $q.defer();

            oauth.login("facebook", {
                baseUrl: "http://www.facebook.com/dialog/oauth/",
                redirectUri: "https://apps.facebook.com/yox-homepage",
                clientId: apiKey,
                scope: "manage_notifications"
            }).then(function(oauthResult){
                fbOauth = oauthResult.oauth;
                deferred.resolve(fbOauth);

                if (oauthResult.isNew){
                    // Get a long-lived token:
                    corsHttp.get({
                        url: graphApiUrl + "oauth/access_token",
                        params: {
                            client_id: apiKey,
                            client_secret: appSecret,
                            grant_type: "fb_exchange_token",
                            fb_exchange_token: fbOauth.token
                        },
                        parseResponse: true,
                        success: function(data){
                            fbOauth = {
                                token: data.access_token,
                                expires: new Date().valueOf() + parseInt(data.expires, 10) * 1000
                            };

                            oauth.setOauth("facebook", fbOauth);
                        }
                    });
                }
            }, function(error){
                console.error("Can't login to Facebook: ", error);
            });

            return deferred.promise;
        },
        logout: function(){
            currentUser = null;
            oauth.logout("facebook");
        },
        getCurrentUser: function(){
            var deferred = $q.defer();
            if (currentUser)
                deferred.resolve(currentUser);
            else{
                FB.api("me").then(function(me){
                    var user = {
                        id: me.data.id,
                        name: me.data.name,
                        link: me.data.link,
                        locale: me.data.locale,
                        image: getProfileImage(me.data.id)
                    };

                    deferred.resolve(user);
                    currentUser = user;
                }, function(error){
                    deferred.reject(error);
                });
            }

            return deferred.promise;
        },
        getNotifications: function(){
            var deferred = $q.defer();
            FB.fql("SELECT notification_id, created_time, icon_url, object_id, object_type, is_unread, sender_id, title_html, body_html, href FROM notification WHERE recipient_id=me()").then(
                function(response){
                    var notifications = { items: [], unreadCount: 0 };
                    angular.forEach(response.data.data, function(fbNotification){
                        var tempDiv = document.createElement("div");
                        tempDiv.innerHTML = fbNotification.title_html;

                        var htmlLinks = tempDiv.querySelectorAll("a[href]");
                        angular.forEach(htmlLinks, function(link){
                            link.setAttribute("target", "_blank");
                        });

                        notifications.items.push({
                            id: fbNotification.notification_id,
                            icon: fbNotification.icon_url,
                            unread: !!fbNotification.is_unread,
                            link: fbNotification.href,
                            html: tempDiv.innerHTML,
                            from: fbNotification.sender_id,
                            image: getProfileImage(fbNotification.sender_id),
                            date: new Date(fbNotification.created_time * 1000)
                        });

                        if (fbNotification.is_unread)
                            notifications.unreadCount++;
                    });

                    deferred.resolve(notifications);
                },
                function(error){
                    deferred.reject(error);
                }
            )

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