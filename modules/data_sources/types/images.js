angular.module("Homepage").factory("dataImages", ["facebook", "instagram", "picasa", function(facebook, instagram, picasa){
    return {
        facebook: facebook,
        instagram: instagram,
        picasa: picasa
    };
}]);