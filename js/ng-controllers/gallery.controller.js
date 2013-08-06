angular.module("Homepage").controller("GalleryController", ["$scope", "imageCache", "$timeout", function($scope, imageCache, $timeout){
    $scope.currentItem = $scope.items[0];

    $scope.selectItem = function(item){
        $scope.currentItem = item;
    }
}]);