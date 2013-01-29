angular.module("Rss").controller("RssController", ["$scope", "rss", function($scope, rss){
    $scope.loadFeed = function(){
        rss.load($scope.module.settings.feed).then(function(feeds){
            $scope.feed = feeds[0];
            $scope.moduleStyle = {
                height: (100 / feeds.length) + "%"
            };

            $scope.module.name = $scope.feed.title;
            $scope.module.link = $scope.feed.link;

            $scope.$emit("load", { module: $scope.module.name, count: $scope.feed.items.length });
        }, handleError);
    }

    $scope.$on("refresh", $scope.loadFeed);

    function handleError(error){
        console.error("Can't get Google Reader items. Error: ", error);
        $scope.$emit("loadError", { module: $scope.module.name, error: error });
    }

    $scope.loadFeed();
}]);