angular.module("Rss").controller("RssController", ["$scope", "rss", function($scope, rss){
    $scope.loadFeed = function(forceRefresh){
        rss.load($scope.module.settings.feed || $scope.module.settings.feeds, forceRefresh, { count: $scope.module.settings.count }).then(function(feeds){
            var items = getAllItems(feeds);

            if(isSameItems(items)){
                $scope.$emit("load", { module: $scope.module.name, count: 0 });
                return;
            }

            $scope.feeds = feeds;
            $scope.feed = feeds[0];
            $scope.items = items;

            $scope.moduleStyle = {
                height: (100 / feeds.length) + "%"
            };

            if ($scope.module.settings.title){
                $scope.module.name = $scope.module.settings.title;
                $scope.module.icon = "img/rss_16x16.png";
            }
            else{
                $scope.module.name = feeds[0].title;
                if (feeds.length > 1)
                    $scope.module.name += " + " + (feeds.length - 1) + " more";
            }
            $scope.module.link = !$scope.module.settings.title && $scope.feeds.length === 1 ? $scope.feed.link : null;

            $scope.$emit("load", { module: $scope.module.name, count: items.length });
            $scope.$broadcast("onItems", { items: $scope.items });
        }, handleError);
    };

    $scope.$on("refresh", function(){ $scope.loadFeed(true); });

    $scope.$on("updateSettings", function(e, data){
        $scope.loadFeed(true);
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
        console.error("Can't get Google Reader items. Error: ", error);
        $scope.$emit("loadError", { module: $scope.module.name, error: error });
    }

    $scope.loadFeed();
}]);