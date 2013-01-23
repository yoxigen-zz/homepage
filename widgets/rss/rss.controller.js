angular.module("Homepage").controller("RssController", ["$scope", "rss", "$timeout", function($scope, rss, $timeout){
    var refreshRate = 300,
        timeoutPromise;

    $scope.loadFeed = function(){
        $scope.loading = true;
        $timeout.cancel(timeoutPromise);

        rss.load($scope.module.settings.feed).then(function(feeds){
            $scope.feed = feeds[0];
            $scope.moduleStyle = {
                height: (100 / feeds.length) + "%"
            };

            $scope.loading = false;
            timeoutPromise = $timeout($scope.loadFeed, refreshRate * 1000);
        }, function(error){
            $scope.loading = false;
        });
    }

    $scope.loadFeed();
}]);