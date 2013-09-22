angular.module("Slideshow").controller("SlideshowController", ["$scope", "$timeout", "utils", "imageCache", "dataImages", "defaultImages", "Storage",
    function ($scope, $timeout, utils, imageCache, dataImages, defaultImages, Storage) {
    var currentImageIndex = 0,
        currentImagePosition = 1,
        images,
        playTimeoutPromise,
        storage = new Storage("slideshow"),
        configData,
        loadedLastImage;

    $scope.currentImages = [{}, {}];
        /*
    storage.local.getItem("lastImage").then(function(lastImage){
        if (lastImage){
            loadedLastImage = true;
            $scope.currentImages[currentImagePosition].src = lastImage.src;
            $scope.currentImages[currentImagePosition].active = true;
            $scope.currentImages[currentImagePosition].order = 2;
        }
    });
          */
    storage.cloud.getItem("config").then(function(data){
        configData = data;
        if (configData){
            var data = configData.getData();
            $scope.selectSource(dataImages[data.source]);
            $scope.selectFeed(data.feed, false);
        }
        else
            loadDefaultFeed();
    }, loadDefaultFeed);


    $scope.isPlaying = true;
    $scope.toggleMenu = function(){
        $scope.slideshowMenuOpen = !$scope.slideshowMenuOpen;
    };

    $scope.sources = dataImages;
    $scope.next = function(){
        advanceImage(1);
    };
    $scope.pause = function(){
        $scope.isPlaying = false;
        $timeout.cancel(playTimeoutPromise);
    };

    $scope.play = function(){
        $scope.isPlaying = true;
        $timeout.cancel(playTimeoutPromise);
        $scope.next();
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
        $scope.currentSourceItems = [];

        if (source.auth){
            source.auth.isLoggedIn().then(function(isLoggedIn){
                $scope.currentSourceIsLoggedIn = isLoggedIn;
                if (isLoggedIn){
                    loadSourceItems(source);
                    setCurrentUser();
                }
            });
        }
        else
            loadSourceItems(source);
    };

    $scope.selectFeed = function(feed, saveToCloud){
        showLoader();
        $scope.currentSource.images.load(feed).then(function(data){
            loadImages(data);
            hideLoader();

            $scope.contentsType = feed.type;
        });
        $scope.currentFeed = feed;

        if (saveToCloud !== false)
            saveConfigToCloud();
    };

    $scope.sourceLogin = function(source){
        source.auth.login().then(function(){
            loadSourceItems(source);
            setCurrentUser();
        });
    };

    $scope.sourceLogout = function(){
        if (confirm("Are you sure you wish to log out from " + $scope.currentSource.name + "?")){
            $scope.currentSource.auth.logout();
            $scope.currentUserName = null;
        }
    };

    var currentSourceAlbums,
        albumsSource;

    $scope.getAlbumsForCurrentSource = function(){
        if (!$scope.currentSource.images.getAlbums)
            return false;

        $scope.contentsType = "albums";

        if (albumsSource !== $scope.currentSource || !currentSourceAlbums){
            $scope.currentSource.images.getAlbums().then(function(albums){
                $scope.currentSourceAlbums = albums;
            });
        }
    };

    function setCurrentUser(){
        $scope.currentSource.auth.getCurrentUser().then(function(user){
            $scope.currentUserName = user.name;
        });
    }

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
        $scope.currentFeedImages = images;
        currentImageIndex = -1;
        advanceImage(1);
    }

    function loadSourceItems(source, feed){
        if (!source.images.getAlbums)
            return false;

        if (feed){
            source.images.getAlbums().then(function(result){
                $scope.currentSourceItems = result.items;
                $scope.contentsType = "albums";
            });
        }
        else
            source.images.getAlbums().then(function(albums){
                $scope.currentSourceItems = albums;
                $scope.contentsType = "albums";
            });
    }

    function loadDefaultFeed(){
        $scope.selectSource(dataImages.flickr);
        $scope.selectFeed($scope.currentSource.images.feeds.public[0], false);
    }

    var loaderTimeoutPromise;
    function showLoader(){
        $timeout.cancel(loaderTimeoutPromise);
        loaderTimeoutPromise = $timeout(function(){
            $scope.slideshowImageLoading = true;
        }, 120);
    }

    function hideLoader(){
        $timeout.cancel(loaderTimeoutPromise);
        $scope.slideshowImageLoading = false;
    }

    function setLastImage(image){
        storage.local.setItem("lastImage", image);
    }

    $scope.selectImage = function(imageIndex){
        $timeout.cancel(playTimeoutPromise);

        var prevImage = $scope.currentImages[currentImagePosition];

        currentImagePosition = currentImagePosition ? 0 : 1;
        currentImageIndex = imageIndex;

        $scope.currentImage = images[currentImageIndex];

        showLoader();
        imageCache.cacheImage(images[currentImageIndex].src).then(function(){
            $scope.currentImages[currentImagePosition].src = images[currentImageIndex].src;
            hideLoader();

            $timeout(function(){
                if (prevImage)
                    prevImage.active = false;

                $scope.currentImages[currentImagePosition].active = true;

                $timeout(function(){
                    $scope.currentImages[currentImagePosition].order = 1;
                    $scope.currentImages[currentImagePosition ? 0 : 1].order = 2;
                }, $scope.module.settings.transition * 500);

                setLastImage(images[currentImageIndex]);
            }, 50);

            if ($scope.isPlaying){
                playTimeoutPromise = $timeout(function(){
                    $scope.next();
                }, $scope.module.settings.interval * 1000);
            }
        }, function(error){
            console.error("Can't load image: %s. Error: ", images[currentImageIndex].src, error);
            hideLoader();
            $scope.next();
        });
    }

    function advanceImage(direction) {
        var nextImageIndex = currentImageIndex + direction;

        if (nextImageIndex === images.length)
            nextImageIndex = 0;
        else if (nextImageIndex < 0)
            nextImageIndex = images.length - 1;

        $scope.selectImage(nextImageIndex);
    }
}]);

