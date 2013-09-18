angular.module("Slideshow").controller("SlideshowController", ["$scope", "$timeout", "utils", "imageCache", "dataImages", function ($scope, $timeout, utils, imageCache, dataImages) {
    var defaultImages = ["1", "2", "3"],
        imagesFolder = "modules/background/slideshow/images/",
        currentImageIndex = 0,
        currentImagePosition = 1,
        images,
        playTimeoutPromise;

    utils.images.webpSupported().then(function (supported) {
        var imageExtension = supported ? ".webp" : ".jpg";
        angular.forEach(defaultImages, function (image, index) {
            defaultImages[index] = { src: imagesFolder + image + imageExtension };
        });

        images = defaultImages;
        currentImageIndex = -1;
        advanceImage(1);
    });

    $scope.currentImages = [{}, {}];
    $scope.play = true;
    $scope.toggleMenu = function(){
        $scope.slideshowMenuOpen = !$scope.slideshowMenuOpen;
    };

    $scope.sources = dataImages;

    $scope.selectSource = function(source){
        $scope.currentSource = source;
        source.auth.isLoggedIn().then(function(isLoggedIn){
            $scope.currentSourceIsLoggedIn = isLoggedIn;
            if (isLoggedIn)
                loadSourceItems(source);
        });
    };

    $scope.sourceLogin = function(source){
        source.auth.login().then(function(){
            loadSourceItems(source);
        });
    };

    function loadSourceItems(source){
        source.images.getUserAlbums().then(function(result){
            $scope.currentSourceItems = result.items;
        });
    }

    function advanceImage(direction) {
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

