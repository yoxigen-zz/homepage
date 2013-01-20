angular.module("Instagram").controller("InstagramController", ["$scope", "instagram", function($scope, instagram){
    var nextPage;

    $scope.isLoggedIn = instagram.loggedIn;
    $scope.login = function(){
        instagram.login().then(function(oauth){
            $scope.isLoggedIn = true;
            console.log("logged in", oauth);
            $scope.loadFeed(instagram.feeds[0]);
        });
    };

    $scope.loadFeed = function(feed){
        instagram.load(feed).then(function(igData){
            $scope.items = igData.items;
            nextPage = igData.paging;
        });
    };

    if (instagram.loggedIn){
        $scope.loadFeed(instagram.feeds[0]);
    }
}]);