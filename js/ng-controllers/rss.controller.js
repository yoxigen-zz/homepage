angular.module("Homepage").controller("RssController", function($scope, rss){
    function loadFeeds(){
        rss.load($scope.module.settings.feed).then(function(feeds){
            $scope.feed = feeds[0];
            $scope.moduleStyle = {
                height: (100 / feeds.length) + "%"
            };
        });
    }

    loadFeeds();
});