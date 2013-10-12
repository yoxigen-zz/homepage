'use strict';

angular.module("Homepage").directive("dropdown", ["$timeout", function(){
    return {
        restrict: "A",
        link: function(scope, element, attrs) {
            var disableClickOutside,
                isOpen;

            function onClickOutside(e){
                if (disableClickOutside)
                    return;

                isOpen = false;
                var isInDropdown = false,
                    dropdown = $(e.target).closest("[dropdown]");
                if (dropdown.length && dropdown[0] === element[0])
                    isInDropdown = true;
                else if (e.target === element[0])
                    isInDropdown = true;

                if (!isInDropdown){
                    $(window).off("mousedown", onClickOutside);
                    element.removeClass("dropdown-open");
                }
            }

            element.on("mousedown", function(e){
                if (isOpen)
                    return;

                isOpen = true;
                disableClickOutside = true;
                setTimeout(function(){
                    disableClickOutside = false;
                }, 50);

                element.addClass("dropdown-open");

                $(window).on("mousedown", onClickOutside);
            });
        }
    };
}]);