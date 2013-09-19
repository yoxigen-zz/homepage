angular.module("Slideshow").factory("defaultImages", ["$q", "utils", function($q, utils){
    var defaultImages = ["1", "2", "3"],
        imagesFolder = "modules/background/slideshow/images/",
        images;

    return {
        images: {
            load: function(){
                var deferred = $q.defer();

                if (images)
                    deferred.resolve(images);
                else{
                    utils.images.webpSupported().then(function (supported) {
                        var imageExtension = supported ? ".webp" : ".jpg";
                        angular.forEach(defaultImages, function (image, index) {
                            defaultImages[index] = { src: imagesFolder + image + imageExtension };
                        });

                        images = defaultImages
                        deferred.resolve(images);
                    });
                }
                return deferred.promise;
            }
        }
    }
}]);
