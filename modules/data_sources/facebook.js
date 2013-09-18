angular.module("Homepage").factory("facebook", [ "OAuth2", "$q", "$http", "$rootScope", function(OAuth2, $q, $http, $rootScope){
    var apiKey = "132603783569142",
        appSecret = "ba840592bd31f05bec737573893f939e",
        graphApiUrl = "https://graph.facebook.com/",
        legacyApiUrl = "https://api.facebook.com/method/",
        fbOauth = new OAuth2({
            apiName: "facebook",
            baseUrl: "http://www.facebook.com/dialog/oauth/",
            redirectUri: "http://yoxigen.github.io/homepage/oauth2.html",
            clientId: apiKey,
            scope: "manage_notifications,user_photos,friends_photos",
            tokenValidation: function(auth){
                var deferred = $q.defer();

                $http.get("https://graph.facebook.com/oauth/access_token?callback=JSON_CALLBACK", {
                    params: {
                        client_id: apiKey,
                        client_secret: appSecret,
                        grant_type: "fb_exchange_token",
                        fb_exchange_token: auth.token
                    }}).then(function(result){
                        if (result.data.error)
                            deferred.reject(result.data.error);
                        else
                            deferred.resolve(result.data);
                    },
                    function(error){
                        deferred.reject(error);
                    });

                return deferred.promise;
            }
        }),
        currentUser;

    function fbFql(query){
        var deferred = $q.defer(),
            params = angular.isObject(query)
                ? { method: 'fql.multiquery', queries: query }
                : { method: 'fql.query', query: query };

        FB.api(params, function(data) {
                $rootScope.$apply(function(){
                    deferred.resolve(data);
                });
            }
        );

        return deferred.promise;
    }

    function fbApi(path, options){
        var deferred = $q.defer();

        options = options || {};

        FB.api(path, options.method || "get", options.params || {}, function(response) {
            $rootScope.$apply(function(){
                if (!response || response.error)
                    deferred.reject(response && response.error)
                else
                    deferred.resolve(response);
            });
        });

        return deferred.promise;
    }

    function getFbUrlCommons(){
        return "access_token=" + fbOauth.oauthData.token + "&callback=JSON_CALLBACK";
    }

    function getProfileImage(userId){
        return "http://graph.facebook.com/" + userId + "/picture";
    }

    var methods = {
        auth: {
            isLoggedIn: function(){
                var deferred = $q.defer();

                FB.getLoginStatus(function(response) {
                    $rootScope.$apply(function(){
                        if (response.status === 'connected') {
                            deferred.resolve(true);
                        } else if (response.status === 'not_authorized') {
                            deferred.resolve(false, response.status)
                        } else {
                            deferred.resolve(false);
                        }
                    });
                });

                return deferred.promise;
            },
            login: function(){
                var deferred = $q.defer();

                FB.login(function(response) {
                    $rootScope.$apply(function(){
                        if (response.authResponse) {
                            deferred.resolve(response.authResponse);
                        } else {
                            deferred.reject('User cancelled login or did not fully authorize.');
                        }
                    });
                }, { scope: fbOauth.scope });

                return deferred.promise;
            },
            logout: function(){
                currentUser = null;
                FB.logout();
            },
            getCurrentUser: function(){
                var deferred = $q.defer();
                if (currentUser)
                    deferred.resolve(currentUser);
                else{
                    fbApi("/me").then(function(response){
                        var user = {
                            id: response.id,
                            name: response.name,
                            //link: me.data.link,
                            link: "http://www.facebook.com", // For the current user, the news feed makes more sense than the user's own page.
                            locale: response.locale,
                            image: getProfileImage(response.id)
                        };

                        deferred.resolve(user);
                        currentUser = user;
                    }, deferred.reject);
                }

                return deferred.promise;
            }
        },
        notifications: {
            getNotifications: function(options){
                var deferred = $q.defer(),
                    fqlQuery = "SELECT notification_id, created_time, icon_url, object_id, object_type, is_unread, sender_id, title_html, body_html, href FROM notification WHERE recipient_id=me()";

                if (options && options.lastId){
                    fqlQuery += " AND notification_id > " + options.lastId;
                }

                fbFql(fqlQuery).then(
                    function(fbNotifications){
                        var notifications = { items: [], unreadCount: 0 };
                        angular.forEach(fbNotifications, function(fbNotification){
                            var tempDiv = document.createElement("div");
                            tempDiv.innerHTML = fbNotification.title_html;

                            var htmlLinks = tempDiv.querySelectorAll("a[href]");
                            angular.forEach(htmlLinks, function(link){
                                link.setAttribute("target", "_blank");
                            });

                            var notification = {
                                id: fbNotification.notification_id,
                                icon: fbNotification.icon_url,
                                unread: fbNotification.is_unread === "1",
                                link: fbNotification.href,
                                html: tempDiv.innerHTML,
                                from: fbNotification.sender_id,
                                image: getProfileImage(fbNotification.sender_id),
                                date: Number(fbNotification.created_time) * 1000
                            };

                            if (notification.unread)
                                notifications.unreadCount++;

                            notifications.items.push(notification);
                        });

                        deferred.resolve(notifications);
                    },
                    function(error){
                        deferred.reject(error);
                    }
                );

                fbFql({
                    notifications: fqlQuery,
                    photos: "SELECT src_small, src_small_height, src_small_width, object_id FROM photo WHERE object_id IN (SELECT object_id FROM #notifications WHERE object_type = 'photo')"
                }).then(function(response){
                        console.log("RES: ", response);
                    }, function(error){ console.error(error); });


                return deferred.promise;
            },
            markAsRead: function(notificationIds){
                if (!notificationIds || !notificationIds.length)
                    return false;

                FB.method("notifications.markRead", {unread: "0", notification_ids: notificationIds.join(",")});
            }
        }
    };

    return methods;
}]);