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
        privateFeeds: [],
        publicFeeds: [
            { name: "Featured Photos", method: "flickr.interestingness.getList", extras: "path_alias, url_sq, url_t, url_l, url_o, owner_name" }
        ]
    };

    var convert = {
        photos: function(flickrPhotos){
            var photos = [];
            angular.forEach(flickrPhotos, function(flickrPhoto){console.log(flickrPhoto)
                photos.push({
                    title: flickrPhoto.title,
                    src: flickrPhoto.url_o || flickrPhoto.url_l,
                    width: Number(flickrPhoto.width_o || flickrPhoto.width_l),
                    height: Number(flickrPhoto.height_o || flickrPhoto.width_l),
                    thumbnail: {
                        src: flickrPhoto.url_sq,
                        width: Number(flickrPhoto.width_sq),
                        height: Number(flickrPhoto.height_sq)
                    },
                    author: {
                        name: flickrPhoto.owner_name,
                        link: "http://flickr.com/photos/" + (flickrPhoto.pathalias || flickrPhoto.owner)
                    }
                });
            })

            return photos;
        }
    }

    return {
        name: "Flickr",
        id: "flickr",
        images: {
            getFeeds: function(){
                return feeds;
            },
            load: function(feed){
                if (!feed)
                    feed = feeds.featured;
                    return apiMethod(feed.method, feed);

            }
        }
    }
}]);