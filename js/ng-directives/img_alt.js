angular.module("ImageDirectives", []).directive("imgAlt", function(){
    return {
        restrict: "A",
        link: function($scope, element, attrs){
            element[0].addEventListener("error", function(e){
                element[0].src = attrs.imgAlt;
            });
        }
    }
});