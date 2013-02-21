angular.module("Homepage").directive("toggleKeys", function(){
    return {
        restrict: "A",
        scope: false,
        link: function($scope, element, attrs){
            var keysMap,
                PRESETS = {
                    escape: "27",
                    enter: "13",
                    left: "37",
                    right: "39"
                };

            function onKeyDown(e){
                var handler = $scope.$eval(keysMap[String(e.keyCode)]);
                if (handler){
                    $scope.$apply(function(){
                        handler.call($scope, e);
                    });
                }
            }

            attrs.$observe("toggleKeys", function(val) {
                keysMap = angular.fromJson(val);
                var presetKey;
                for(var key in keysMap){
                    if (presetKey = PRESETS[key])
                        keysMap[presetKey] = keysMap[key];
                }
            });

            $scope.$watch(attrs.toggleKeysEnabled, function(enabled){
                if (enabled)
                    window.addEventListener("keydown", onKeyDown)
                else
                    window.removeEventListener("keydown", onKeyDown);
            });
        }
    }
});