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

    var convert = {
        album: function(fbAlbum){
            return {
                id: fbAlbum.object_id,
                name: fbAlbum.name,
                imageCount: fbAlbum.photo_count,
                description: fbAlbum.description,
                link: fbAlbum.link,
                type: "album"
            };
        },
        albums: function(fbAlbums){
            var albums = [];
            angular.forEach(fbPhotos, function(fbPhoto){
                albums.push(convert.album(fbPhoto));
            });

            return albums;
        },
        photo: function(fbPhoto){
            return {
                src: fbPhoto.images[0].source,
                width: fbPhoto.images[0].width,
                height: fbPhoto.images[0].height,
                title: fbPhoto.name,
                link: fbPhoto.link,
                date: new Date(fbPhoto)
            }
        },
        photos: function(fbPhotos){
            var photos = [];
            angular.forEach(fbPhotos, function(fbPhoto){
                photos.push(convert.photo(fbPhoto));
            });

            return photos;
        }
    };

    var feedMethods = {
        album: function(feed, options){
            var deferred = $q.defer();

            options = options || {};
            options.limit = 100;
            fbApi("/" + feed.id + "/photos", options).then(function(response){
                deferred.resolve(convert.photos(response.data));
            }, deferred.reject);

            return deferred.promise;
        }
    };

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
        name: "Facebook",
        id: "facebook",
        auth: {
            isLoggedIn: function(){
                var deferred = $q.defer();

                FB.getLoginStatus(function(response) {
                    setTimeout(function(){
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
        images: {
            getAlbums: function(userId){
                var deferred = $q.defer();

                fbFql({
                    albums: "SELECT aid, object_id, cover_object_id, name, photo_count, can_upload, type, created, owner, link FROM album WHERE owner = " + (userId || "me()"),
                    photos: "SELECT object_id, images FROM photo WHERE object_id in (SELECT cover_object_id FROM #albums)"
                }).then(function(response){
                    var albums = response[0].fql_result_set,
                        photos = response[1].fql_result_set;

                    function findPhoto(photoObjectId){
                        for(var j= 0, photo; photo = photos[j]; j++){
                            if (photo.object_id === photoObjectId){
                                return photos.splice(j, 1)[0];
                            }
                        }

                        return null;
                    }

                    var albumsData = [],
                        albumData,
                        thumbnail;

                    for(var i= 0, album; album = albums[i]; i++){
                        albumData = convert.album(album);
                        thumbnail = findPhoto(album.cover_object_id).images[5];

                        albumData.thumbnail = {
                            src: thumbnail.source,
                            width: thumbnail.width,
                            height: thumbnail.height
                        }
                        albumsData.push(albumData);
                    }

                    deferred.resolve(albumsData);
                }, deferred.reject);

                return deferred.promise;
            },
            load: function(feed){
                return feedMethods[feed.type](feed);
            }
        },
        notifications: {
            getNotifications: function(options){
                var deferred = $q.defer(),
                    fqlQuery = "SELECT notification_id, created_time, icon_url, object_id, object_type, is_unread, sender_id, title_html, body_html, href FROM notification WHERE recipient_id=me()";

                if (options && options.lastId){
                    fqlQuery += " AND notification_id > " + options.lastId;
                }

                fbFql({
                    notifications: fqlQuery,
                    photos: "SELECT src_small, src_small_height, src_small_width, object_id FROM photo WHERE object_id IN (SELECT object_id FROM #notifications WHERE object_type = 'photo')"
                }).then(function(response){
                    var fbNotifications = response[0].fql_result_set,
                        fbPhotos = response[1].fql_result_set,
                        i, photo;

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
                                avatar: getProfileImage(fbNotification.sender_id),
                                date: Number(fbNotification.created_time) * 1000
                            };

                            if (notification.unread)
                                notifications.unreadCount++;

                            if (fbNotification.object_type === "photo"){
                                for(i=0; photo = fbPhotos[i]; i++){
                                    if (photo.object_id === fbNotification.object_id){
                                        notification.image = {
                                            src: photo.src_small,
                                            width: photo.src_small_width,
                                            height: photo.src_small_height
                                        }
                                    }
                                }
                            }
                            notifications.items.push(notification);
                        });

                        deferred.resolve(notifications);
                }, deferred.reject);


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