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
            feed = new google.feeds.Feed(feedUrl),
            loadOptions = angular.extend({}, defaultOptions, options);

        feed.setNumEntries(loadOptions.count);

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
                        console.error("Feed load error: ", result);
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
                text: fixUrls(item),
                summary: item.summary,
                isRead: false,
                direction: utils.strings.getDirection(item.content)
            };

            var imageUrls = item.content.match(/([^\"']+(?:png|gif|jpg|jpeg))/ig);
            if (imageUrls){
                for(var imageIndex= 0, imgSrc; (imgSrc = imageUrls[imageIndex]) && !formattedItem.image; imageIndex++){
                    if (/^[\/\\]/.test(imgSrc)){
                        imgSrc = utils.url.getDomain(item.link) + imgSrc;
                    }

                    formattedItem.image = {
                        src: imgSrc
                    }
                }
            }

            formattedItems.push(formattedItem);
        }

        return formattedItems;
    }

    function fixUrls(item){
        var itemText = item.content.replace(/([^\"']+(?:png|gif|jpg|jpeg))/ig, function(link){
            if (/^[\/\\]/.test(link)){
                link = utils.url.getDomain(item.link) + link;
            }
            return link;
        });

        return itemText;
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