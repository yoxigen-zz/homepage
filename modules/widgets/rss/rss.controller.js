angular.module("Rss").controller("RssController", ["$scope", "rss", function($scope, rss){
    var defaultRssIconUrl = "img/rss_16x16.png";

    $scope.rssFeeds = {};

    $scope.loadFeeds = function(forceRefresh){
        rss.load($scope.module.settings.feed || $scope.module.settings.feeds, forceRefresh, { count: $scope.module.settings.count }).then(function(feeds){
            var items = getAllItems(feeds);

            if(isSameItems(items)){
                $scope.$emit("load", { module: $scope.module, count: 0 });
                return;
            }

            $scope.feeds = feeds;
            $scope.items = items;

            $scope.moduleStyle = {
                height: (100 / feeds.length) + "%"
            };

            if ($scope.module.settings.title){
                $scope.module.name = $scope.module.settings.title;
                $scope.module.icon = defaultRssIconUrl;
            }
            else{
                if (!feeds.length){
                    $scope.module.name = "RSS";
                    $scope.module.icon = defaultRssIconUrl;
                }
                else
                    $scope.module.name = feeds[0].title;

                if (feeds.length > 1){
                    $scope.module.name += " + " + (feeds.length - 1) + " more";
                    $scope.module.icon = defaultRssIconUrl;
                }
            }
            $scope.module.link = !$scope.module.settings.title && $scope.feeds.length === 1 ? $scope.feeds[0].link : null;

            $scope.$emit("load", { module: $scope.module, count: items.length });
            $scope.$broadcast("onItems", { items: $scope.items });
        }, handleError);
    };

    function onSearchFeeds(feeds){
        $scope.feedSearchResults = feeds;
        $scope.hiddenIcons = {};

        if (!feeds || !feeds.length)
            $scope.noResultsFound = true;

        $scope.rssSearching = false;
    }

    function onSearchFeedsError(error){
        console.error("Error searching for feeds: ", error);
        $scope.noResultsFound = true;
        $scope.rssSearching = false;
    }

    $scope.feedSearch = function(query){
        $scope.feedSearchResults = null;
        if (query){
            $scope.rssSearching = true;
            if (/^https?:\/\//i.test(query)){
                rss.load(query).then(onSearchFeeds, onSearchFeedsError);
            }
            else{
                rss.search(query).then(onSearchFeeds, onSearchFeedsError);
            }
        }
    };

    function getFeed(feed){
        var foundFeed;
        for(var i= 0, settingsFeed; (settingsFeed = $scope.module.settings.feeds[i]) && !foundFeed; i++){
            if ((angular.isObject(settingsFeed) && settingsFeed.url === feed.url) || (feed.url === settingsFeed)){
                foundFeed = settingsFeed;
            }
        }

        if (foundFeed)
            return foundFeed;

        return null;
    }

    $scope.addOrRemoveFeed = function(feed){
        if ($scope.rssFeeds[feed.url]){
            delete $scope.rssFeeds[feed.url];
            $scope.module.settings.feeds.splice($scope.module.settings.feeds.indexOf(getFeed(feed)), 1);
        }
        else{
            $scope.rssFeeds[feed.url] = true;
            if (!$scope.module.settings.feeds)
                $scope.module.settings.feeds = [];

            $scope.module.settings.feeds.push(feed);
        }

        $scope.settings.onUpdate($scope.module.settings.feeds);
    };

    $scope.hideIcon = function(feed){
        $scope.hiddenIcons[feed.link] = true;
    };

    $scope.$on("refresh", function(){ $scope.loadFeeds(true); });
    $scope.$on("addFeeds", function(){
        $scope.addFeeds = true;
    });

    $scope.onAddInputChange = function(value){
        if (!value){
            $scope.feedSearchResults = null;
            $scope.noResultsFound = false;
        }
    };

    $scope.closeAddFeeds = function(){
        $scope.addFeeds = false;
        $scope.feedSearchResults = null;
        $scope.noResultsFound = false;
        $scope.rssSearchValue = null;
    };

    $scope.$on("updateSettings", function(e, data){
        $scope.loadFeeds(true);
    });

    function isSameItems(newItems){
        if (!$scope.items)
            return false;

        if (newItems.length !== $scope.items.length)
            return false;

        for(var i=0; i < newItems.length; i++){
            if (newItems[i].link !== $scope.items[i].link)
                return false;
        }

        return true;
    }

    function getAllItems(feeds){
        var items = [];

        angular.forEach(feeds, function(feed){
            items = items.concat(feed.items);
        });

        items.sort(function(a, b){
            var dateA = new Date(a.publishDate),
                dateB = new Date(b.publishDate);

            if (dateA === dateB)
                return 0;

            if (dateA < dateB)
                return 1;

            return -1;
        });

        return items;
    }

    function handleError(error){
        console.error("Can't get RSS items. Error: ", error);
        $scope.$emit("loadError", { module: $scope.module.name, error: error });
    }

    if ($scope.module.settings.feed || ($scope.module.settings.feeds && $scope.module.settings.feeds.length)){
        $scope.loadFeeds();
        if ($scope.module.settings.feeds){
            angular.forEach($scope.module.settings.feeds, function(feed){
                $scope.rssFeeds[angular.isObject(feed) ? feed.title : feed] = true;
            });
        }
    }
    else{
        $scope.module.icon = defaultRssIconUrl;
        $scope.addFeeds = true;
    }
}]);