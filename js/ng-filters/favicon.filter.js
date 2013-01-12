angular.module("FavIcon", []).filter('favicon', function () {
    return function (url) {
        return url ? url.match(/^(https?:\/\/(?:www\.)?[^\/]+)/)[0] + "/favicon.ico" : "";
    };
});