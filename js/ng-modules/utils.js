angular.module("Utils", []).value("utils", {
    strings: {
        getDirection: function(str){
            return this.isRtl(str) ? "rtl" : "ltr"
        },
        getRandomString: function(length, chars){
            if (!length || Number(length) !== length)
                throw new Error("Invalid length for utils.strings.getRandomString: ", length, ".");

            var availableChars = chars || "abcdefghijklmnopqrstuvwxyz0123456789",
                str = [];

            for( var i=0; i < length; i++)
                str.push(availableChars.charAt(Math.floor(Math.random() * availableChars.length)));

            return str.join("");
        },
        isRtl: function(str){
            return /[\u0591-\u07FF\uFB1D-\uFDFF\uFE70-\uFEFC]/.test(str);
        },
        /**
         * Recognizes URLs in a string and creates <A> elements around them.
         * @param str
         * @param target
         */
        makeLinks: function(str, target){

        },
        /**
         * Removes HTML tags from the string.
         * @param str
         * @return {*}
         */
        stripHtml: function(str){
            var temp = document.createElement("div");
            temp.innerHTML = str;
            return temp.innerText.replace(/\"/g, "&quot;");
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