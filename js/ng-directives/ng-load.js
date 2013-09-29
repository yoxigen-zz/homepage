angular.module("Homepage").directive("ngLoad", ["$parse", function($parse){
    return {
        restrict: "A",
        link: function(scope, element, attrs){
            var loadHandler = $parse(attrs.ngLoad);

            element.on("load", function(event){
                scope.safeApply(function(){
                    loadHandler(scope, {$event: event});
                });
            });
        }
    }
}]);