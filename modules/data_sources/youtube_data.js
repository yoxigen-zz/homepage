angular.module("Homepage").factory("youtube", [ "GoogleOAuth2", "$q", "$http", "$rootScope", "utils", "Cache", function(GoogleOAuth2, $q, $http, $rootScope, utils, Cache){
    var apiKey = "225561981539-vrlluijrg9h9gvq6ghbnnv59rcerkrh8.apps.googleusercontent.com",
        apiUrl = "https://www.googleapis.com/youtube/v3/",
        cache = new Cache({
            id: "youtube",
            hold: true,
            itemsExpireIn: 60 * 10 // cache items expire in 5 minutes
        }),
        ytOauth = new GoogleOAuth2({
            apiName: "youtube",
            scope: "https://www.googleapis.com/auth/youtube.readonly"
        });

    var convert = {
        activity: function(activity){
            var video = activity.snippet,
                contentDetails = activity.contentDetails[activity.snippet.type],
                videoId = contentDetails.videoId || contentDetails.resourceId.videoId;

            return convert.video(angular.extend(activity.snippet, { id: videoId }));
        },
        video: function(video){
            return {
                id: video.id,
                author: {
                    name: video.channelTitle,
                    link: "http://youtube.com/user/" + video.channelId
                },
                link: "http://youtube.com/watch?v=" + video.id,
                publishDate: video.publishedAt,
                title: video.title,
                text: video.description,
                direction: utils.strings.getDirection(video.description),
                thumbnails: {
                    small: { src: video.thumbnails.default.url },
                    medium: { src: video.thumbnails.medium.url },
                    large: { src: video.thumbnails.high.url }
                }
            }
        }
    };

    function convertItems(items, convertor){
        var convertedItems = [];

        angular.forEach(items, function(item){
            convertedItems.push(convertor(item));
        });

        return convertedItems;
    }

    function callApi(endpoint, requiresAuth, params){
        var deferred = $q.defer();

        if (requiresAuth){
            public.auth.isLoggedIn().then(function(isLoggedIn){
                if (isLoggedIn)
                    doApiCall();
                else
                    deferred.reject("Can't call YouTube API " + endpoint + ", the user must be logged in.");
            });
        }
        else
            doApiCall();

        function doApiCall(){
            $http.jsonp(apiUrl + endpoint, {
                params: angular.extend({ callback: "JSON_CALLBACK", key: apiKey, access_token: ytOauth.oauthData.token }, params)
            }).then(function(result){
                deferred.resolve(result.data);
            }, deferred.reject);
        }

        return deferred.promise;
    }

    var public = {
        name: "YouTube",
        id: "youtube",
        auth: {
            isLoggedIn: function(){
                return ytOauth.isLoggedIn();
            },
            login: function(){
                var deferred = $q.defer();

                public.auth.isLoggedIn().then(function(isLoggedIn){
                    if (isLoggedIn)
                        deferred.resolve(ytOauth.oauthData);
                    else{
                        ytOauth.login().then(function(){
                            deferred.resolve(ytOauth.oauthData);
                        }, function(error){
                            deferred.reject(error);
                        });
                    }
                });

                return deferred.promise;
            },
            logout: function(){
                ytOauth.logout();
            }
        },
        notifications: {
            getNotifications: function(options, forceRefresh){
                var deferred = $q.defer();

                if (options === true || options === false){
                    forceRefresh = options;
                    options = null;
                }

                cache.getItem("activities").then(function(cachedData){
                    if (cachedData && !forceRefresh)
                        deferred.resolve(cachedData);
                    else{
                        callApi("activities", true, { part: "snippet,contentDetails", home: true, maxResults: 20 }).then(function(activities){
                            var result = {
                                paging: {
                                    nextPageToken: activities.nextPageToken,
                                    pageSize: activities.pageInfo.resultsPerPage,
                                    totalResults: activities.pageInfo.totalResults
                                },
                                notifications: convertItems(activities.items, convert.activity)
                            };

                            cache.setItem("activities", result);

                            deferred.resolve(result);
                        }, deferred.reject);
                    }
                });

                return deferred.promise;
            }
        }
    };

    return public;
}]);