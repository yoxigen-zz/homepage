angular.module("Homepage").factory("dataImages", ["facebook", "picasa", "flickr", function(facebook, picasa, flickr){
    return {
        facebook: facebook,
        picasa: picasa,
        flickr: flickr
    };
}]);