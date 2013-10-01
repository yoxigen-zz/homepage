angular.module("Homepage").directive("scrollDetect", function($timeout){
    return {
        restrict: "A",
        link: function($scope, element, attrs){
            var el = element[0],
                timeoutPromise;

            el.addEventListener("scroll", setScrollClass);
            $scope.$on("load", setScrollClass);
            $scope.$on("updateScroll", setScrollClass);

            function setScrollClass(){
                $timeout.cancel(timeoutPromise);
                timeoutPromise = $timeout(function(){
                    if (isMaxScroll()){
                        el.classList.add("max-scroll");
                        el.classList.remove("scroll");
                    }
                    else{
                        el.classList.add("scroll");
                        el.classList.remove("max-scroll");
                    }
                }, 70)
            }

            function isMaxScroll(){
                if  (el.clientHeight === el.scrollHeight)
                    return true;

                if (el.scrollHeight - el.scrollTop === el.clientHeight)
                    return true;

                return false;
            }
        }
    }
});