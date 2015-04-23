(function($) {
    $.Utilities = {
        serializeObject: function(obj) {
            var o = {};
            var a = obj.serializeArray();
            $.each(a, function() {
                if (o[this.name] !== undefined) {
                    if (!o[this.name].push) {
                        o[this.name] = [o[this.name]];
                    }
                    o[this.name].push(this.value || '');
                } else {
                    o[this.name] = this.value || '';
                }
            });
            return o;
        },

        number_format: function( number, decimals, dec_point, thousands_sep ) {
            var n = number, c = isNaN(decimals = Math.abs(decimals)) ? 2 : decimals;
            var d = dec_point == undefined ? "," : dec_point;
            var t = thousands_sep == undefined ? "." : thousands_sep, s = n < 0 ? "-" : "";
            var i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", j = (j = i.length) > 3 ? j % 3 : 0;

            return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
        },

        size_format: function( filesize ) {
            if (filesize >= 1073741824) {
                 filesize = $.Utilities.number_format(filesize / 1073741824, 2, '.', '') + ' GB';
            } else { 
                if (filesize >= 1048576) {
                    filesize = $.Utilities.number_format(filesize / 1048576, 2, '.', '') + ' MB';
                } else { 
                    if (filesize >= 1024) {
                        filesize = $.Utilities.number_format(filesize / 1024, 0) + ' KB';
                    } else {
                        filesize = $.Utilities.number_format(filesize, 0) + ' bytes';
                    }
                }
            }
            return filesize;
        }
    };    
}(jQuery));
