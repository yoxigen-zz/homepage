angular.module("Homepage").factory("dataImages", ["facebook", "instagram", "picasa", "flickr", function(facebook, instagram, picasa, flickr){
    return {
        facebook: facebook,
        instagram: instagram,
        picasa: picasa,
        flickr: flickr
    };
}]);