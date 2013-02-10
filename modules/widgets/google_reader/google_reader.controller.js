angular.module("GoogleReader").controller("GoogleReaderController", ["$scope", "googleReader", function($scope, googleReader){
    $scope.feed = {
        title: "Google Reader",
        icon: "http://www.google.com/reader/ui/favicon.ico",
        link: "http://www.google.com/reader"
    };

    $scope.displayType = "items";

    googleReader.getItems().then(function(readerData){
        $scope.feed.items = readerData.items;
        $scope.$emit("load", { module: $scope.module.name, count: readerData.items.length });
    }, handleError);

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

    $scope.$on("refresh", function(){
        googleReader.refresh({ lastItem: $scope.feed.items[0] }).then(function(readerData){
            if (readerData.items && readerData.items.length){
                $scope.feed.items = readerData.items.concat($scope.feed.items);
                $scope.safeApply();
            }

            $scope.$emit("load", { module: $scope.module.name, count: readerData.items.length });
        }, handleError);
    });

    function handleError(error){
        console.error("Can't get Google Reader items. Error: ", error);
        $scope.$emit("loadError", { module: $scope.module.name, error: error });
    }

    if (googleReader.isAuthorized)
        $scope.currentUser = googleReader.getCurrentUser();
}]);
