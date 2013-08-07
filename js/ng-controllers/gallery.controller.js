angular.module("Homepage").controller("GalleryController", ["$scope", "imageCache", "$timeout", function($scope, imageCache, $timeout){
    $scope.currentItem = $scope.items[0];

    $scope.selectItem = function(item){
        $scope.currentItem = item;
    };

    $scope.openItem = function(item){
        $scope.callService("viewer", "open", {
            items: $scope.items,
            currentItem: $scope.items.indexOf($scope.currentItem)
        });
    };
}]);