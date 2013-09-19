angular.module("Slideshow").controller("SlideshowController", ["$scope", "$timeout", "utils", "imageCache", "dataImages", "defaultImages", function ($scope, $timeout, utils, imageCache, dataImages, defaultImages) {
    var currentImageIndex = 0,
        currentImagePosition = 1,
        images,
        playTimeoutPromise;

    var slideshowSource = dataImages.flickr;
    slideshowSource.images.load().then(loadImages);

    $scope.currentImages = [{}, {}];
    $scope.play = true;
    $scope.toggleMenu = function(){
        $scope.slideshowMenuOpen = !$scope.slideshowMenuOpen;
    };

    $scope.sources = dataImages;
    $scope.next = function(){
        advanceImage(1);
    };
    $scope.prev = function(){
        advanceImage(-1);
    };

    $scope.selectSource = function(source){
        $scope.currentSource = source;
        if (source.auth){
            source.auth.isLoggedIn().then(function(isLoggedIn){
                $scope.currentSourceIsLoggedIn = isLoggedIn;
                if (isLoggedIn)
                    loadSourceItems(source);
            });
        }
        else
            loadSourceItems(source);
    };

    $scope.selectAlbum = function(album){
        $scope.currentSource.images.load(album).then(loadImages);
    };

    $scope.sourceLogin = function(source){
        source.auth.login().then(function(){
            loadSourceItems(source);
        });
    };

    function loadImages(imagesData){
        images = utils.arrays.shuffle(imagesData);
        currentImageIndex = -1;
        advanceImage(1);
    }

    function loadSourceItems(source, feed){
        if (feed){
            source.images.getAlbums().then(function(result){
                $scope.currentSourceItems = result.items;
            });
        }
        else
            source.images.getAlbums().then(function(albums){
                $scope.currentSourceItems = albums;
            });
    }

    function advanceImage(direction) {
        $timeout.cancel(playTimeoutPromise);

        var prevImage = $scope.currentImages[currentImagePosition];

        currentImagePosition = currentImagePosition ? 0 : 1;
        currentImageIndex += direction;
        if (currentImageIndex === images.length)
            currentImageIndex = 0;
        else if (currentImageIndex < 0)
            currentImageIndex = images.length - 1;

        imageCache.cacheImage(images[currentImageIndex].src).then(function(){
            $scope.currentImages[currentImagePosition].src = images[currentImageIndex].src;

            $timeout(function(){
                if (prevImage)
                    prevImage.active = false;

                $scope.currentImages[currentImagePosition].active = true;

                $timeout(function(){
                    $scope.currentImages[currentImagePosition].order = 1;
                    $scope.currentImages[currentImagePosition ? 0 : 1].order = 2;
                }, $scope.module.settings.transition * 500);
            }, 50);

            if ($scope.play){
                playTimeoutPromise = $timeout(function(){
                    advanceImage(direction);
                }, $scope.module.settings.interval * 1000);
            }
        }, function(error){
            console.error("Can't load image: %s. Error: ", images[currentImageIndex].src, error);
            advanceImage(direction);
        });
    }
}]);

