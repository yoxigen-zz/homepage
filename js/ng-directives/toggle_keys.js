angular.module("Homepage").directive("toggleKeys", function(){
    return {
        restrict: "A",
        scope: false,
        link: function($scope, element, attrs){
            var keysMap;

            function onEscape(e){
                var handler = $scope.$eval(keysMap[String(e.keyCode)]);
                if (handler){
                    $scope.$apply(function(){
                        handler.call($scope, e);
                    });
                }
            }

            attrs.$observe("toggleKeys", function(val) {
                keysMap = angular.fromJson(val);
            });

            $scope.$watch(attrs.toggleKeysEnabled, function(enabled){
                if (enabled)
                    window.addEventListener("keydown", onEscape)
                else
                    window.removeEventListener("keydown", onEscape);
            });
        }
    }
});