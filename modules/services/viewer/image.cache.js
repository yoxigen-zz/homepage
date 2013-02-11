angular.module("Viewer").factory("imageCache", ["$q", "$rootScope", function($q, $rootScope){
    var methods = {
        cacheImage: function(imageUrl){
            var deferred = $q.defer(),
                img = new Image();

            img.onload = function(){
                console.log("loaded image: %dx%d", this.width, this.height);
                deferred.resolve({
                    width: this.width,
                    height: this.height
                });
                $rootScope.$apply();
            };

            img.onerror = function(error){
                console.error("can't load: ", error);
                deferred.reject(error);
                $rootScope.$apply();
            };

            img.src = imageUrl;
            if (img.complete){
                deferred.resolve({
                    width: img.width,
                    height: img.height
                });
            }

            return deferred.promise;
        }
    };

    return methods;
}]);