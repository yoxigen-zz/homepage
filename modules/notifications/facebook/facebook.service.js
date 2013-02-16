angular.module("Facebook").factory("facebook", [ "OAuth2", "$q", "$http", function(OAuth2, $q, $http){
    var apiKey = "132603783569142",
        appSecret = "ba840592bd31f05bec737573893f939e",
        graphApiUrl = "https://graph.facebook.com/",
        legacyApiUrl = "https://api.facebook.com/method/",
        fbOauth = new OAuth2({
            apiName: "facebook",
            baseUrl: "http://www.facebook.com/dialog/oauth/",
            redirectUri: "https://apps.facebook.com/yox-homepage",
            clientId: apiKey,
            scope: "manage_notifications"
        }),
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
        return "access_token=" + fbOauth.oauthData.token + "&callback=JSON_CALLBACK";
    }

    function getProfileImage(userId){
        return "http://graph.facebook.com/" + userId + "/picture";
    }

    var methods = {
        get loggedIn(){
            return fbOauth.isLoggedIn;
        },
        login: function(){
            var deferred = $q.defer();

            fbOauth.login().then(function(oauthResult){
                deferred.resolve(fbOauth.oauthData);

                if (oauthResult.isNew){
                    // Get a long-lived token:
                    $http.get(graphApiUrl + "oauth/access_token", {
                        params: {
                            client_id: apiKey,
                            client_secret: appSecret,
                            grant_type: "fb_exchange_token",
                            fb_exchange_token: fbOauth.oauthData.token
                        }
                    }).success(function(data){
                            var responseParams = data.split("&"),
                                responseData = {},
                                paramParts;

                            responseParams.forEach(function(param){
                                paramParts = param.split("=");
                                responseData[paramParts[0]] = paramParts[1];
                            });

                        fbOauth.setOauth({
                            token: responseData.access_token,
                            expires: new Date().valueOf() + parseInt(responseData.expires, 10) * 1000
                        });
                    })
                }
            }, function(error){
                console.error("Can't login to Facebook: ", error);
                deferred.reject(error);
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
                        //link: me.data.link,
                        link: "http://www.facebook.com", // For the current user, the news feed makes more sense than the user's own page.
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
        getNotifications: function(options){
            var deferred = $q.defer(),
                fqlQuery = "SELECT notification_id, created_time, icon_url, object_id, object_type, is_unread, sender_id, title_html, body_html, href FROM notification WHERE recipient_id=me()";

            if (options && options.lastId){
                fqlQuery += " AND notification_id > " + options.lastId;
            }

            FB.fql(fqlQuery).then(
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