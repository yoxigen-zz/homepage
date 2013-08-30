angular.module("Rss").controller("RssController", ["$scope", "rss", function($scope, rss){
    $scope.loadFeed = function(forceRefresh){
        rss.load($scope.module.settings.feed, forceRefresh, { count: $scope.module.settings.count }).then(function(feeds){
            $scope.feed = feeds[0];
            $scope.moduleStyle = {
                height: (100 / feeds.length) + "%"
            };

            $scope.module.name = $scope.feed.title;
            $scope.module.link = $scope.feed.link;

            $scope.$emit("load", { module: $scope.module.name, count: $scope.feed.items.length });
            $scope.items = $scope.feed.items;
            $scope.$broadcast("onItems", { items: $scope.feed.items });
        }, handleError);
    }

    $scope.$on("refresh", function(){ $scope.loadFeed(true); });

    $scope.$on("updateSettings", function(e, data){
        $scope.loadFeed(true);
    });

    function handleError(error){
        console.error("Can't get Google Reader items. Error: ", error);
        $scope.$emit("loadError", { module: $scope.module.name, error: error });
    }

    $scope.loadFeed();
}]);