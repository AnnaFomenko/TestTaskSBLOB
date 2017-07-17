exports.unicodeEscape = function (str) {
    return str.replace(/[\s\S]/g, function(character) {
        var escape = character.charCodeAt().toString(16),
            longhand = escape.length > 2;
        return '\\' + (longhand ? 'u' : 'x') + ('0000' + escape).slice(longhand ? -4 : -2);
    });
};