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

    $scope.$on("modalClose", $scope.closeViewer);

    $scope.selectImage = function(index){
        $timeout.cancel(loadingTimeoutPromise);
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

        $scope.currentItem = item;
        $scope.currentImageUrl = item.thumbnail.src;
        $scope.currentImageWidth = item.width || (item.thumbnail && item.thumbnail.width);

        loadingTimeoutPromise = $timeout(function(){
            $scope.loading = true;
        }, 140);

        imageCache.cacheImage(item.url).then(function(imageData){
            item.width = imageData.width;
            item.height = imageData.height;
            $scope.currentImageUrl = item.url;
            $scope.currentImageWidth = item.width;
            $timeout.cancel(loadingTimeoutPromise);
            $scope.loading = false;
        }, function(){
            $scope.currentItem = { url: null, title: "<i class='icon-warning-sign'></i> Can't load image from <a href='" + item.url + "' target='_blank'>" + item.url + "</a>"};
            $timeout.cancel(loadingTimeoutPromise);
            $scope.loading = false;
        });
    };
}]);