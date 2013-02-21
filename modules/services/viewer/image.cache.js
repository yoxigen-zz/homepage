angular.module("Viewer").factory("imageCache", ["$q", "$rootScope", function($q, $rootScope){
    var currentCacheDeferred,
        img,
        currentImageUrl;

    var methods = {
        cacheImage: function(imageUrl){
            if (!imageUrl)
                throw new Error("No image URL specified for cacheImage.");

            if (currentCacheDeferred){
                if (imageUrl === currentImageUrl)
                    return currentCacheDeferred.promise;

                currentCacheDeferred.reject();
                img.src = "";
            }

            currentCacheDeferred = $q.defer();
            img = img || new Image();

            img.onload = function(){
                currentCacheDeferred.resolve({
                    width: this.width,
                    height: this.height
                });
                $rootScope.$apply();
            };

            img.onerror = function(error){
                console.error("can't load: ", error);
                currentCacheDeferred.reject(error);
                $rootScope.$apply();
            };

            img.src = currentImageUrl = imageUrl;
            if (img.complete){
                currentCacheDeferred.resolve({
                    width: img.width,
                    height: img.height
                });
            }

            return currentCacheDeferred.promise;
        }
    };

    return methods;
}]);