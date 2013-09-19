angular.module("Homepage").factory("flickr", ["$q", "$http", function($q, $http){
    var flickrApiUrl = "http://api.flickr.com/services/rest/?jsoncallback=JSON_CALLBACK&format=json",
        apiKey = "9a220a98ef188519fb87b08d310ebdbe";

    function apiMethod(method, params){
        var deferred = $q.defer();

        $http.jsonp(flickrApiUrl, { params: angular.extend(params,
                { api_key: apiKey, method: method }
            )})
            .then(function(result){
                deferred.resolve(convert.photos(result.data.photos.photo));
            }, function(error){
                deferred.reject(error);
            });

        return deferred.promise;
    }

    var feeds = {
        featured: { method: "flickr.interestingness.getList", extras: "media, path_alias, url_sq, url_t, url_l, url_o" }
    };

    var convert = {
        photos: function(flickrPhotos){
            var photos = [];
            angular.forEach(flickrPhotos, function(flickrPhoto){
                photos.push({
                    src: flickrPhoto.url_o || flickrPhoto.url_l
                });
            })

            return photos;
        }
    }

    return {
        images: {
            load: function(feed){
                if (!feed)
                    feed = feeds.featured;
                    return apiMethod(feed.method, feed);

            }
        }
    }
}]);