var nconf = require('nconf');

nconf.argv()
    .env()
    .file({ file: './configs/config.json' });

module.exports = nconf;
