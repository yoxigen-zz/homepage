angular.module("PrettyDate", []).filter('prettyDate', function () {
    return function (date, isShort) {
        if (!date)
            return "";

        if (String(date) === date)
            date = new Date(date);

        var diff = (((new Date()).getTime() - date.getTime()) / 1000),
            day_diff = Math.floor(diff / 86400);

        var units = {
            long: {
                now: "just now",
                minute: "1 minute ago",
                minutes: " minutes ago",
                hour: "1 hour ago",
                hours: " hours ago",
                yesterday: "Yesterday",
                days: " days ago",
                weeks: " weeks ago",
                month: "1 month ago",
                months: " months ago",
                years: " years ago"
            },
            short: {
                now: "< 1m",
                minute: "1m",
                minutes: "m",
                hour: "1h",
                hours: "h",
                yesterday: "1d",
                days: "d",
                weeks: "w",
                month: "1M",
                months: "M",
                years: "y"
            }
        };

        var unitsToUse = isShort ? units.short : units.long;

        if ( isNaN(day_diff) || day_diff < 0)
            return;

        return (day_diff == 0 && (
            diff < 60 && unitsToUse.now ||
                diff < 120 && unitsToUse.minute ||
                diff < 3600 && Math.floor( diff / 60 ) + unitsToUse.minutes ||
                diff < 7200 && unitsToUse.hour ||
                diff < 86400 && Math.floor( diff / 3600 ) + unitsToUse.hours) ||
            day_diff == 1 && unitsToUse.yesterday ||
            day_diff < 7 && day_diff + unitsToUse.days ||
            day_diff < 31 && Math.ceil( day_diff / 7 ) + unitsToUse.weeks ||
            day_diff < 62 && unitsToUse.month ||
            day_diff < 365 && Math.floor(day_diff / 30.416) + unitsToUse.months ||
            Math.floor(day_diff / 365) + unitsToUse.years);
    };
});