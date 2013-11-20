angular.module("Homepage").factory("instagram", ["OAuth2", "$q", "$http", "Cache", function(OAuth2, $q, $http, Cache){
    // https://cloud.google.com/console#/project/225561981539/apiui/app/WEB/225561981539-vrlluijrg9h9gvq6ghbnnv59rcerkrh8.apps.googleusercontent.com
    var clientId = "e8bfed2280ae46439dcdfc4b956b35d3",
        cache = new Cache({
            id: "instagram",
            hold: true,
            itemsExpireIn: 60 * 5 // cache items expire in 5 minutes
        }),
        igOauth = new OAuth2({
            apiName: "instagram",
            baseUrl: "https://instagram.com/oauth/authorize/",
            redirectUri: "http://yoxigen.github.io/homepage/oauth2.html",
            clientId: clientId,
            scope: "basic likes comments relationships"
        }),
        maxItemsToCache = 40;

    var convert = {
        comments: function(instagramComments){
            var comments = [];
            for (var i= 0, comment; comment = instagramComments[i]; i++){
                comments.push({
                    id: comment.id,
                    time: new Date(comment.created_time * 1000),
                    user: convert.user(comment.from),
                    text: comment.text
                });
            }

            return comments;
        },
        image: function(imageData){
            var image = imageData.images.standard_resolution,
                itemData = {
                    id: imageData.id,
                    thumbnail: convert.thumbnail(imageData.images.low_resolution),
                    url: image.url,
                    width: image.width,
                    height: image.height,
                    ratio: image.height / image.width,
                    link: imageData.link,
                    title: imageData.caption && imageData.caption.text,
                    image: {
                        src: image.url,
                        title: imageData.caption && imageData.caption.text
                    },
                    type: "image",
                    time: new Date(imageData.created_time * 1000),
                    social: {
                        commentsCount: imageData.comments.count,
                        comments: convert.comments(imageData.comments.data),
                        likesCount: imageData.likes.count,
                        like: imageData.user_has_liked,
                        likes: convert.users(imageData.likes.data)
                    },
                    author: convert.user(imageData.user)
                };

            return itemData;
        },
        images: function(instagramData){
            var itemsData = [];
            if (instagramData){
                for(var i=0, item; item = instagramData[i]; i++){
                    itemsData.push(convert.image(item));
                }
            }
            return itemsData;
        },
        user: function(instagramUser){
            return {
                name: instagramUser.full_name,
                id: instagramUser.id,
                avatar: instagramUser.profile_picture,
                username: instagramUser.username,
                website: instagramUser.website,
                source: "instagram",
                url: "http://yoxigen.github.com/yoxview?/instagram/user/" + instagramUser.id
            };
        },
        users: function(users){
            var usersData = [];
            for (var i= 0, user; user = users[i]; i++){
                usersData.push(convert.user(user));
            }

            return usersData;
        },
        tags: function(instagramTags){
            var normalizedTags = [];
            for(var i= 0, tag; tag = instagramTags[i]; i++){
                normalizedTags.push({ name: tag.name, count: tag.media_count });
            }
            return normalizedTags;
        },
        thumbnail: function(photo){
            return {
                src: photo.url,
                width: photo.width,
                height: photo.height,
                ratio: photo.height / photo.width
            };
        }
    };

    var methods = {
        name: "Instagram",
        id: "instagram",
        auth: {
            isLoggedIn: function(){
                return igOauth.isLoggedIn();
            },
            login: function(){
                var deferred = $q.defer();

                methods.auth.isLoggedIn().then(function(isLoggedIn){
                    if (isLoggedIn)
                        deferred.resolve(igOauth.authData);
                    else{
                        igOauth.login().then(function(){
                            deferred.resolve(igOauth.authData);
                        }, function(error){
                            deferred.reject(error);
                        });
                    }
                });

                return deferred.promise;
            },
            logout: function(){
                igOauth.logout();
                igOauth.destroy();
            },
            getCurrentUser: function(){

            }
        },
        images: {
            feeds: [
                { name: "My feed", endpoint: "users/self/feed", id: "feed", cache: true },
                { name: "Images I liked", endpoint: "users/self/media/liked", id: "liked" },
                { name: "My Uploads", endpoint: "users/self/media/recent", id: "recent" },
                { name: "Most popular", endpoint: "media/popular", id: "popular" }
            ],

            load: function(feed, params, forceRefresh){
                var deferred = $q.defer();

                function getRemoteData(){
                    $http.jsonp("https://api.instagram.com/v1/" + feed.endpoint + "?callback=JSON_CALLBACK", {
                        params: angular.extend(params, { access_token: igOauth.oauthData.token, count: 20 }) })
                        .then(function(igData){
                            var normalizedData = {
                                paging: { next_max_id: igData.data.pagination && igData.data.pagination.next_max_id },
                                items: igData.data.data ? convert.images(igData.data.data) : []
                            };

                            deferred.resolve(normalizedData);

                            var cacheData = cache.data[feed.id];

                            if (!cacheData){
                                cache.setItem(feed.id, normalizedData, { hold: true })
                            }
                            else{
                                cacheData.items = params.max_id ? cacheData.items.concat(normalizedData.items) : normalizedData.items.concat(cacheData.items);
                                if (cacheData.items.length > maxItemsToCache){
                                    cacheData.items = cacheData.items.slice(0, maxItemsToCache);
                                    cacheData.paging = { next_max_id: cacheData.items[cacheData.items.length - 1] };
                                }
                                cache.setItem(feed.id, cacheData, { hold: true });
                            }

                        }, function(error){
                            deferred.reject(error);
                        });
                }

                params = params || {};

                if (forceRefresh){
                    cache.removeItem(feed.id);
                    getRemoteData();
                }
                else if (feed.cache && !params.max_id && !params.min_id){
                    cache.getItem(feed.id, { hold: true }).then(function(feedCache){
                        if (feedCache)
                            deferred.resolve(feedCache)
                        else
                            getRemoteData();
                    });
                }
                else
                    getRemoteData();

                return deferred.promise;
            },
            getNewItems: function(feed, lastItemId){
                return methods.images.load(feed, { min_id: lastItemId })
            }
        }
    };

    return methods;
}]);