angular.module("Instagram").controller("InstagramController", ["$scope", "instagram", "$timeout", function($scope, instagram, $timeout){
    var nextPage,
        refreshRate = 300,
        timeoutPromise;

    $scope.currentFeed = instagram.feeds[0];

    $scope.isLoggedIn = instagram.loggedIn;
    $scope.login = function(){
        instagram.login().then(function(oauth){
            $scope.isLoggedIn = true;
            $scope.loadFeed($scope.currentFeed);
            getItems();
        });
    };

    $scope.loadFeed = function(feed){
        instagram.load(feed).then(function(igData){
            $scope.items = igData.items;
            nextPage = igData.paging;
        });
    };

    $scope.refresh = function(){
        if ($scope.refreshing)
            return false;

        $timeout.cancel(timeoutPromise);
        $scope.refreshing = true;
        instagram.getNewItems($scope.currentFeed, $scope.items[0].id).then(function(igData){
            $scope.items = igData.items.concat($scope.items);
            $scope.refreshing = false;
            timeoutPromise = $timeout($scope.refresh, refreshRate * 1000);
        });
    };

    function getItems(){
        $scope.loadFeed($scope.currentFeed);
        timeoutPromise = $timeout($scope.refresh, refreshRate * 1000);
    }
    if (instagram.loggedIn){
        getItems();
    }
}]);