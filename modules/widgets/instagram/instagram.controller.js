angular.module("Instagram").controller("InstagramController", ["$scope", "instagram", function($scope, instagram){
    var nextPage;

    $scope.currentFeed = instagram.feeds[0];
    $scope.isLoggedIn = true;

    instagram.isLoggedIn().then(function(isLoggedIn){
        $scope.isLoggedIn = isLoggedIn;
        if (isLoggedIn)
            getItems();
    });

    $scope.login = function(){
        instagram.login().then(function(oauth){
            $scope.isLoggedIn = true;
            getItems();
        });
    };

    $scope.loadFeed = function(feed){
        instagram.load(feed).then(function(igData){
            $scope.items = igData.items;
            nextPage = igData.paging;
            $scope.$emit("load", { module: $scope.module.name, count: igData.items.length });
        }, handleError);
    };

    $scope.selectItem = function(item, index){
        $scope.callService("viewer", "open", {
            items: $scope.items,
            currentItem: index
        });
    };

    $scope.$on("refresh", function(){
        instagram.getNewItems($scope.currentFeed, $scope.items[0].id).then(function(igData){
            $scope.items = igData.items.concat($scope.items);
            $scope.$emit("load", { module: $scope.module.name, count: igData.items.length });
        }, handleError);
    });

    $scope.$on("logout", function(){
        instagram.logout();
        $scope.isLoggedIn = false;
        $scope.items = null;
    });

    function handleError(error){
        console.error("Can't get Instagram items. Error: ", error);
        $scope.$emit("loadError", { module: $scope.module.name, error: error });
    }

    function getItems(){
        $scope.loadFeed($scope.currentFeed);
    }
}]);