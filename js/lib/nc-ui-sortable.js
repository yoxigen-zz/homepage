/*
 jQuery UI Sortable plugin wrapper

 @param [ui-sortable] {object} Options to pass to $.fn.sortable() merged onto ui.config
 */

angular.module('ui.directives').directive('ncUiSortable', [
    'ui.config', function(uiConfig) {
        var options;
        options = {};

        if (uiConfig.sortable != null) {
            angular.extend(options, uiConfig.sortable);
        }

        return {
            require: '?ngModel',
            link: function(scope, element, attrs, ngModel) {
                var onStart, onUpdate, opts, _start, _update, _receive;

                opts = angular.extend({}, options, scope.$eval(attrs.uiOptions));

                if (ngModel != null) {
                    onStart = function(e, ui) {
                        return ui.item.data({
                            'ui-sortable-start': ui.item.index(),
                            'ui-sortable-source': ui.item.closest("[nc-ui-sortable]").data("nc-ui-model")
                        });
                    };
                    onUpdate = function(e, ui) {
                        var startIndex = ui.item.data('ui-sortable-start'),
                            endIndex = ui.item.index(),
                            sourceModel = ui.item.data('ui-sortable-source'),
                            targetModel = ui.item.closest("[nc-ui-sortable]").data("nc-ui-model");

                        if (sourceModel && targetModel){
                            targetModel.splice(endIndex, 0, sourceModel.splice(startIndex, 1)[0]);
                            return scope.$apply();
                        }
                    };

                    _start = opts.start;
                    opts.start = function(e, ui) {
                        onStart(e, ui);
                        if (typeof _start === "function") {
                            _start(e, ui);
                        }
                        return scope.$apply();
                    };

                    _update = opts.update;
                    opts.update = function(e, ui) {
                        onUpdate(e, ui);
                        if (typeof _update === "function") {
                            _update(e, ui);
                        }
                        return scope.$apply();
                    };

                    scope.$watch(attrs.ngModel, function(){
                        element.data("nc-ui-model", ngModel.$modelValue);
                    });
                }
                return element.sortable(opts);
            }
        };
    }
]);