angular.module("Homepage").controller("HomepageController", function($scope, utils){
    $scope.columns = [
        {
            modules: [
                {
                    htmlPath: "partials/google_reader.html",
                    name: "Google Reader",
                    settings: {
                        display: "full"
                    }
                }
            ]
        },
        {},
        {
            modules: [
                {
                    htmlPath: "partials/rss_reader.html",
                    settings: {
                        feed: "http://www.ynet.co.il/Integration/StoryRss2.xml",
                        display: "headlines"
                    }
                },
                {
                    htmlPath: "partials/rss_reader.html",
                    settings: {
                        feed: "http://feeds.wired.com/wired/index",
                        display: "headlines"
                    }
                },
                {
                    htmlPath: "partials/rss_reader.html",
                    settings: {
                        feed: "https://api.twitter.com/1/statuses/user_timeline.rss?screen_name=SeinfeldToday",
                        display: "headlines"
                    }
                }
            ]
        }
    ];
});