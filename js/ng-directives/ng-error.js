angular.module("Homepage").directive("ngError", ["$parse", function($parse){
    return {
        restrict: "A",
        link: function(scope, element, attrs){
            var errorHandler = $parse(attrs.ngError);

            element.on("error", function(event){
                scope.$apply(function(){
                    errorHandler(scope, {$event: event});
                });
            });
        }
    }
}]);