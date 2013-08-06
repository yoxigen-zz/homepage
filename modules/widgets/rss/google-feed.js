angular.module("GoogleFeed", [])
    .factory("rss", ["$http", "$q", "utils", "Cache", "$rootScope", function($http, $q, utils, Cache, $rootScope){
    var cache = new Cache({
            id: "rss",
            itemsExpireIn: 60 * 5 // cache items expire in 5 minutes
        }),
        defaultOptions = {
            count: 5
        };

    function loadFeed(feedUrl, forceRefresh, options){
        var deferred = $q.defer(),
            feed = new google.feeds.Feed(feedUrl);

        function getRemoteData(){
            feed.load(function(result) {
                $rootScope.safeApply(function(){
                    if (!result.error) {
                        result.feed.items = formatItems(result.feed.entries)
                        delete result.feed.entries;
                        deferred.resolve(result.feed);
                        cache.setItem(feedUrl, result.feed);
                    }
                    else{
                        deferred.reject({ error: result.error })
                        console.error(result);
                    }
                });
            });
        }

        if (forceRefresh){
            cache.removeItem(feedUrl);
            getRemoteData();
        }
        else{
            cache.getItem(feedUrl).then(function(cachedData){
                if (cachedData)
                    deferred.resolve(cachedData);
                else
                    getRemoteData();
            });
        }

        return deferred.promise;
    }

    function formatItems(items){
        var formattedItems = [],
            formattedItem;

        for(var i= 0, item; item = items[i]; i++){
            formattedItem = {
                author: item.author,
                link: item.link,
                publishDate: item.publishedDate,
                title: item.title,
                text: utils.strings.stripHtml(item.content),
                summary: utils.strings.stripHtml(item.content),
                isRead: false,
                direction: utils.strings.getDirection(item.content)
            };

            var temp = document.createElement("div"),
                images;

            temp.innerHTML = item.content;
            images = temp.querySelectorAll("img");
            for(var imageIndex= 0, img; (img = images[imageIndex]) && !formattedItem.image; imageIndex++){
                if (img && /\.(png|jpg)$/.test(img.src))
                    formattedItem.image = {
                        src: img.src,
                        title: img.title
                    };
            }


            formattedItems.push(formattedItem);
        };

        return formattedItems;
    }

    var methods = {
        load: function(feedUrls, forceRefresh, options){
            var feeds = angular.isArray(feedUrls) ? feedUrls : [feedUrls],
                promises = [];

            angular.forEach(feeds, function(feed){
                promises.push(loadFeed(feed, forceRefresh, options));
            });

            return $q.all(promises);
        }
    };

    return methods;
}]);