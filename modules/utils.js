exports.unicodeEscape = function (str) {
    return str.replace(/[\s\S]/g, function(character) {
        let escape = character.charCodeAt().toString(16),
            longhand = escape.length > 2;
        return '\\' + (longhand ? 'u' : 'x') + ('0000' + escape).slice(longhand ? -4 : -2);
    });
};

exports.parseQuery = function (qstr) {
    let query = {};
    let a = (qstr[0] === '?' ? qstr.substr(1) : qstr).split('&');
    for (let i = 0; i < a.length; i++) {
        let b = a[i].split('=');
        query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
    }
    return query;
};