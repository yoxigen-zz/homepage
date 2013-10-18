 angular.module("GoogleFeed", [])
    .factory("rss", ["$http", "$q", "utils", "Cache", "$rootScope", function($http, $q, utils, Cache, $rootScope){
    var cache = new Cache({
            id: "rss",
            itemsExpireIn: 60 * 5 // cache items expire in 5 minutes
        }),
        defaultOptions = {
            count: 5
        },
        imgRegExp = /<img [^>]+>/ig,
        srcRegExp = /([^\"']+(?:png|gif|jpg|jpeg))/i;

    function loadFeed(feedUrl, forceRefresh, options){
        var deferred = $q.defer(),
            feed = new google.feeds.Feed(feedUrl),
            loadOptions = angular.extend({}, defaultOptions, options);

        feed.setNumEntries(loadOptions.count);

        function getRemoteData(){
            if (navigator.onLine === false){
                deferred.reject("Can't load feed - not online.");
                return deferred.promise;
            }

            feed.load(function(result) {
                $rootScope.safeApply(function(){
                    if (!result.error) {
                        result.feed.items = formatItems(result.feed.entries)
                        delete result.feed.entries;
                        result.feed.url = result.feed.feedUrl;

                        deferred.resolve(result.feed);
                        cache.setItem(feedUrl, result.feed);
                    }
                    else{
                        deferred.reject({ error: result.error, feed: feedUrl })
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

            var images = item.content.match(imgRegExp),
                imgSrc;

            if (images){
                for(var imageIndex= 0, image; image = images[imageIndex]; imageIndex++){
                    imgSrc = image.match(srcRegExp);

                    if (imgSrc){
                        imgSrc = imgSrc[1];

                        if (/^[\/\\]/.test(imgSrc))
                            imgSrc = utils.url.getDomain(item.link) + imgSrc;

                        image = image.replace(srcRegExp, "");
                        var imgElementWrapper = document.createElement("span");
                        imgElementWrapper.innerHTML = image;
                        var imgElement = imgElementWrapper.firstElementChild;

                        formattedItem.image = {
                            src: imgSrc,
                            title: imgElement.getAttribute("title")
                        };

                        break;
                    }
                }

                formattedItem.text = formattedItem.text.replace(imgRegExp, function(img){
                    var fixedImg = img.replace(/width\s?=\s?[\"']\d+[\"']/i, "");
                    fixedImg = fixedImg.replace(/height\s?=\s?[\"']\d+[\"']/i, "");
                    return fixedImg;
                });
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

        itemText = itemText.replace(/<a\s[^>]+/ig, function(link){
            var targetExists;
            var fixedLink = link.replace(/\starget\s?=\s?['"]([^'"]+)/i, function(){ targetExists = true; return " target='_blank'"; })
            if (!targetExists)
                fixedLink += " target='_blank'";

            return fixedLink;
        });

        return itemText;
    }

    /**
     * Since the Google Feed API returns feed items from RSS feeds, some feeds might be duplicate.
     * This function returns only unique feeds.
     * @param feeds
     */
    function getUniqueFeeds(feeds){
        var found = {},
            uniqueFeeds = [];

        angular.forEach(feeds, function(feed){
            if (!found[feed.url]){
                uniqueFeeds.push(feed);
                found[feed.url] = true;
            }
        });

        return uniqueFeeds;
    }

    var methods = {
        load: function(feedUrls, forceRefresh, options){
            var feeds = angular.isArray(feedUrls) ? feedUrls : [feedUrls],
                promises = [];

            angular.forEach(feeds, function(feed){
                var feedUrl = angular.isObject(feed) ? feed.url : feed;
                promises.push(loadFeed(feedUrl, forceRefresh, options));
            });

            return $q.all(promises);
        },
        search: function(query){
            var deferred = $q.defer();

            google.feeds.findFeeds(query, function(result){
                $rootScope.$apply(function(){
                    if (result.error)
                        deferred.reject(result.error);
                    else
                        deferred.resolve(getUniqueFeeds(result.entries));
                });
            });

            return deferred.promise;
        }
    };

    return methods;
}]);