angular.module("GoogleFeed", [])
    .factory("rss", ["$http", "$q", "utils", "$rootScope", function($http, $q, utils, $rootScope){
        function loadFeed(feedUrl){
            var deferred = $q.defer();

            $http.get("https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=5&q=" + encodeURIComponent(feedUrl))
                .success(function(response){
                    response.responseData.feed.items = formatItems(response.responseData.feed.entries);
                    delete response.responseData.feed.entries;
                    deferred.resolve(response.responseData.feed);
                })
                .error(function(error){
                    deferred.reject(error);
                });

            return deferred.promise;
        }

        function formatItems(items){
            var formattedItems = [],
                formattedItem;

            for(var i= 0, item; item = items[i]; i++){
                formattedItem = {
                    author: item.author,
                    link: item.link,
                    publishDate: new Date(item.publishedDate),
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
            load: function(feedUrls){
                var feeds = angular.isArray(feedUrls) ? feedUrls : [feedUrls],
                    promises = [];

                angular.forEach(feeds, function(feed){
                    promises.push(loadFeed(feed));
                });

                return $q.all(promises);
            }
        };

        return methods;
    }]);