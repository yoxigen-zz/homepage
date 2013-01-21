angular.module("GoogleReader").controller("GoogleReaderController", ["$scope", "googleReader", function($scope, googleReader){
    $scope.feed = {
        title: "Google Reader",
        icon: "http://www.google.com/reader/ui/favicon.ico",
        link: "http://www.google.com/reader"
    };

    $scope.displayType = "items";

    googleReader.getItems().then(function(readerData){
        $scope.feed.items = readerData.items;
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

    if (googleReader.isAuthorized)
        $scope.currentUser = googleReader.getCurrentUser();
}]);
