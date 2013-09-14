angular.module("Homepage").factory("dataImages", ["facebook", "instagram", function(facebook, instagram){
    return {
        facebook: facebook,
        instagram: instagram
    };
}]);