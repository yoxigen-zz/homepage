angular.module("Instagram").factory("instagram", ["oauth", "$q", "$http", "corsHttp", function(oauth, $q, $http, corsHttp){
    var igOauth,
        clientId = "e8bfed2280ae46439dcdfc4b956b35d3";

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
                    originalId: imageData.id,
                    thumbnail: convert.thumbnail(imageData.images.low_resolution),
                    url: image.url,
                    width: image.width,
                    height: image.height,
                    ratio: image.height / image.width,
                    link: imageData.link,
                    title: imageData.caption ? imageData.caption.text : null,
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
                source: "instagram"
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
        feeds: [
            { name: "My feed", endpoint: "users/self/feed", id: "feed" },
            { name: "Images I liked", endpoint: "users/self/media/liked", id: "liked" },
            { name: "My Uploads", endpoint: "users/self/media/recent", id: "recent" },
            { name: "Most popular", endpoint: "media/popular", id: "popular" }
        ],
        get loggedIn(){
            igOauth = oauth.getOauth("instagram");
            return !!igOauth;
        },
        login: function(){
            var deferred = $q.defer();

            if (igOauth)
                deferred.resolve(igOauth);
            else{
                oauth.login("instagram", {
                    baseUrl: "https://instagram.com/oauth/authorize/",
                    redirectUri: "https://github.com/yoxigen/homepage",
                    clientId: clientId,
                    scope: "basic likes comments relationships"
                }).then(function(oauthResult){
                    igOauth = oauthResult;
                    deferred.resolve(igOauth);
                });
            }

            return deferred.promise;
        },
        logout: function(){

        },
        getCurrentUser: function(){

        },
        load: function(feed, params){
            var deferred = $q.defer();

            $http.jsonp("https://api.instagram.com/v1/" + feed.endpoint + "?callback=JSON_CALLBACK", { params: angular.extend({ access_token: igOauth.token, count: 20 }, params) })
                .then(function(igData){
                    deferred.resolve({
                        paging: { next_max_id: igData.data.pagination.next_max_id },
                        items: convert.images(igData.data.data)
                    });
                }, function(error){
                    deferred.reject(error);
                });

            return deferred.promise;
        }
    };

    return methods;
}]);