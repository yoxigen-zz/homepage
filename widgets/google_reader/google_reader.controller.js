angular.module("GoogleReader").controller("GoogleReaderController", ["$scope", "$timeout", "googleReader", function($scope, $timeout, googleReader){
    var refreshRate = 300,
        timeoutPromise;

    $scope.feed = {
        title: "Google Reader",
        icon: "http://www.google.com/reader/ui/favicon.ico",
        link: "http://www.google.com/reader"
    };

    $scope.displayType = "items";

    googleReader.getItems().then(function(readerData){
        $scope.feed.items = readerData.items;
        timeoutPromise = $timeout($scope.refresh, refreshRate * 1000);
    });

    $scope.setCurrentItem = function(item){
        $scope.currentItem = item === $scope.currentItem ? null : item;
        if (!item.isRead)
            googleReader.markAsRead(item);
    };

    $scope.getItemStyle = function(item){
        return {
            "text-align": item && item.direction === "rtl" ? "right" : "left"
        }
    };

    $scope.login = function(){
        if (!googleReader.isAuthorized){
            googleReader.login().then(function(auth){
                $scope.currentUser = googleReader.getCurrentUser();
            });
        }
    };

    $scope.refresh = function(){
        if ($scope.refreshing)
            return false;

        $scope.loading = true;
        $timeout.cancel(timeoutPromise);

        googleReader.refresh({ lastItem: $scope.feed.items[0] }).then(function(readerData){
            if (readerData.items && readerData.items.length){
                $scope.feed.items = readerData.items.concat($scope.feed.items);
                $scope.safeApply();
            }

            $scope.loading = false;
            timeoutPromise = $timeout($scope.refresh, refreshRate * 1000);
        });
    };

    if (googleReader.isAuthorized)
        $scope.currentUser = googleReader.getCurrentUser();
}]);
