angular.module("Utils", []).value("utils", {
    strings: {
        getDirection: function(str){
            return this.isRtl(str) ? "rtl" : "ltr"
        },
        isRtl: function(str){
            return /[\u0591-\u07FF\uFB1D-\uFDFF\uFE70-\uFEFC]/.test(str);
        },
        /**
         * Removes HTML tags from the string.
         * @param str
         * @return {*}
         */
        stripHtml: function(str){
            var temp = document.createElement("div");
            temp.innerHTML = str;
            return temp.innerText;
        },
        /**
         * Shortens the string to the specified length, then trims the end, so words aren't cut in the middle.
         * @param str
         * @param length
         */
        trim: function(str, length, suffix){
            if (str.length <= length)
                return str;

            return str.slice(0, length).replace(/[\s\.:,!\?\(\)]+[^\s\.:,!\?\(\)]*$/, suffix || "")

        }
    }
});