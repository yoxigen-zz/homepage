angular.module("Slideshow").controller("SlideshowController", ["$scope", "$timeout", "utils", "imageCache", "dataImages", "defaultImages", "Storage",
    function ($scope, $timeout, utils, imageCache, dataImages, defaultImages, Storage) {
    var currentImageIndex = 0,
        currentImagePosition = 1,
        images,
        playTimeoutPromise,
        storage = new Storage("slideshow"),
        configData;

    storage.cloud.getItem("config").then(function(data){
        configData = data;
        if (configData){
            var data = configData.getData();
            $scope.selectSource(dataImages[data.source]);
            $scope.selectAlbum(data.feed, false);
        }
        else
            loadDefaultFeed();
    }, loadDefaultFeed);

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

    $scope.imageClick = function(){
        if ($scope.slideshowMenuOpen)
            $scope.toggleMenu();
        else
            $scope.next();
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

    $scope.selectAlbum = function(album, saveToCloud){
        $scope.currentSource.images.load(album).then(loadImages);
        $scope.currentFeed = album;

        if (saveToCloud !== false)
            saveConfigToCloud();
    };

    $scope.sourceLogin = function(source){
        source.auth.login().then(function(){
            loadSourceItems(source);
        });
    };

    function saveConfigToCloud(){
        if (configData){
            configData.set("source", utils.objects.removeAngularHashKey($scope.currentSource.id));
            configData.set("feed", utils.objects.removeAngularHashKey($scope.currentFeed));
            configData.save();
        }
        else{
            storage.cloud.setItem("config", {
                source: utils.objects.removeAngularHashKey($scope.currentSource.id),
                feed: utils.objects.removeAngularHashKey($scope.currentFeed)
            }).then(function(data){
                configData = data;
            });
        }
    }

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

    function loadDefaultFeed(){
        var slideshowSource = dataImages.flickr;
        slideshowSource.images.load().then(loadImages);
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

        $scope.slideshowImageLoading = true;
        imageCache.cacheImage(images[currentImageIndex].src).then(function(){
            $scope.currentImages[currentImagePosition].src = images[currentImageIndex].src;
            $scope.slideshowImageLoading = false;

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
            $scope.slideshowImageLoading = false;
            advanceImage(direction);
        });
    }
}]);

