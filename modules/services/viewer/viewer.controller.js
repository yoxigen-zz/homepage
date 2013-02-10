angular.module("Viewer").controller("ViewerController", ["$scope", function($scope){
    var currentIndex;

    $scope.viewerOpen = false;

    var methods = {
        open: function(data){
            $scope.items = data.items;
            if (data.currentItem !== undefined){
                $scope.currentItem = $scope.items[data.currentItem];
                currentIndex = data.currentItem;
            }
            $scope.viewerOpen = true;
        }
    };

    $scope.$on($scope.service.id, function(e, eventData){
        methods[eventData.method] && methods[eventData.method](eventData.data);
    });

    $scope.prev = function(){
        $scope.selectImage(currentIndex - 1);
    };

    $scope.next = function(){
        $scope.selectImage(currentIndex + 1);
    };

    $scope.selectImage = function(index){
        if (index < 0)
            index = 0;
        else if (index >= $scope.items.length)
            index = $scope.items.length - 1;

        $scope.currentItem = $scope.items[currentIndex = index];
    };
}]);