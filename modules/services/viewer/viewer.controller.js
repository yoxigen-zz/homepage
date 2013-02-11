angular.module("Viewer").controller("ViewerController", ["$scope", "imageCache", "$timeout", function($scope, imageCache, $timeout){
    var currentIndex,
        loadingTimeoutPromise;

    $scope.viewerOpen = false;

    var methods = {
        open: function(data){
            $scope.items = data.items;
            if (data.currentItem !== undefined)
                $scope.selectImage(data.currentItem);

            $scope.viewerOpen = true;
        }
    };

    $scope.$on($scope.service.id, function(e, eventData){
        methods[eventData.method] && methods[eventData.method](eventData.data);
    });

    $scope.prev = function(event){
        event.stopPropagation();
        $scope.selectImage(currentIndex - 1);
    };

    $scope.next = function(event){
        event.stopPropagation();
        $scope.selectImage(currentIndex + 1);
    };

    $scope.closeViewer = function(){
        currentIndex = null;
        $timeout.cancel(loadingTimeoutPromise);
        $scope.viewerOpen = false;
        $scope.currentItem = null;
    };

    $scope.selectImage = function(index){
        $scope.currentItemIsFirst = $scope.currentItemIsLast = false;

        if (index <= 0){
            index = 0;
            $scope.currentItemIsFirst = true;
        }
        else if (index >= $scope.items.length - 1){
            index = $scope.items.length - 1;
            $scope.currentItemIsLast = true;
        }

        var item = $scope.items[currentIndex = index];
        $timeout.cancel(loadingTimeoutPromise);
        loadingTimeoutPromise = $timeout(function(){
            $scope.loading = true;
        }, 140);

        imageCache.cacheImage(item.url).then(function(imageData){
            item.width = imageData.width;
            item.height = imageData.height;
            $scope.currentItem = item;
            $timeout.cancel(loadingTimeoutPromise);
            $scope.loading = false;
        })
    };
}]);