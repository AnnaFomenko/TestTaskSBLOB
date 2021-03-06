const mysql = require("mysql");
const config = require("../config");
var connection;

exports.init = function (callback) {
    const createDataBaseQuery = `CREATE DATABASE IF NOT EXISTS ${config.get('mysql:db')} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`;
    const useDataBaseQuery = `USE ${config.get('mysql:db')}; SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;`;
    const createFBUsersTableQuery = `CREATE TABLE IF NOT EXISTS ${config.get('facebook:table_name_profile')} (id BIGINT UNSIGNED, PRIMARY KEY(id), type VARCHAR(8) NOT NULL, name VARCHAR(255) NOT NULL,  detail_json LONGBLOB, updated TIMESTAMP default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP );`;
    const createTwitUsersTableQuery = `CREATE TABLE IF NOT EXISTS ${config.get('twitter:table_name_profile')} (id_str VARCHAR(155), PRIMARY KEY(id_str),id BIGINT UNSIGNED, name VARCHAR(255) NOT NULL, screen_name VARCHAR(255) NOT NULL, detail_json LONGBLOB, updated TIMESTAMP default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP, lastGetPosts DATETIME);`;
    const createYoutubeUsersTableQuery = `CREATE TABLE IF NOT EXISTS ${config.get('youtube:table_name_profile')} (id VARCHAR(155), PRIMARY KEY(id), detail_json LONGBLOB, updated TIMESTAMP default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP );`;
    const createSpotifyUsersTableQuery = `CREATE TABLE IF NOT EXISTS ${config.get('spotify:table_name_profile')} (id VARCHAR(155), PRIMARY KEY(id), name VARCHAR(255) NOT NULL, detail_json LONGBLOB, updated TIMESTAMP default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP );`;

    const createFBPostsTableQuery = `CREATE TABLE IF NOT EXISTS ${config.get('facebook:table_name_post')} (id VARCHAR(155), PRIMARY KEY(id), user_id VARCHAR(155),  textcontent TEXT, detail_json LONGBLOB, updated TIMESTAMP default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP);`;
    const createTwitPostsTableQuery = `CREATE TABLE IF NOT EXISTS ${config.get('twitter:table_name_post')} (id_str VARCHAR(155), PRIMARY KEY(id_str), id BIGINT UNSIGNED, user_id VARCHAR(155), textcontent TEXT, detail_json LONGBLOB, updated TIMESTAMP default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP);`;
    const createYoutubePostsTableQuery = `CREATE TABLE IF NOT EXISTS ${config.get('youtube:table_name_post')} (id VARCHAR(155), PRIMARY KEY(id), user_id VARCHAR(155),  textcontent TEXT, detail_json LONGBLOB, updated TIMESTAMP default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP, type VARCHAR(16));`;
    const createSpotifyPostsTableQuery = `CREATE TABLE IF NOT EXISTS ${config.get('spotify:table_name_post')} (id VARCHAR(155), PRIMARY KEY(id), textcontent TEXT, detail_json LONGBLOB, updated TIMESTAMP default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP, type VARCHAR(16));`;
    const createSpotifyAlbumsArtists = `CREATE TABLE IF NOT EXISTS ${config.get('spotify:table_name_link')}  (user_id VARCHAR(155) NOT NULL, album_id VARCHAR(155) NOT NULL, PRIMARY KEY(user_id, album_id));`;
    const tables = [
        createFBUsersTableQuery,
        createTwitUsersTableQuery,
        createYoutubeUsersTableQuery,
        createSpotifyUsersTableQuery,
        createFBPostsTableQuery,
        createTwitPostsTableQuery,
        createYoutubePostsTableQuery,
        createSpotifyPostsTableQuery,
        createSpotifyAlbumsArtists
    ];
    const migrations = [`ALTER TABLE ${config.get('facebook:table_name_profile')} MODIFY id BIGINT UNSIGNED;`, `ALTER TABLE ${config.get('youtube:table_name_profile')} MODIFY id VARCHAR(155);`, `ALTER TABLE ${config.get('youtube:table_name_post')} MODIFY id VARCHAR(155);`, `ALTER TABLE ${config.get('youtube:table_name_post')} MODIFY user_id VARCHAR(155);`];
    migrations.push(`ALTER TABLE ${config.get('spotify:table_name_post')} MODIFY user_id VARCHAR(155);`);
    migrations.push(`ALTER DATABASE ${config.get('mysql:db')} CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;`);
    migrations.push(`ALTER TABLE ${config.get('facebook:table_name_post')} CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    migrations.push(`ALTER TABLE ${config.get('twitter:table_name_post')} CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    migrations.push(`ALTER TABLE ${config.get('youtube:table_name_post')} CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    migrations.push(`ALTER TABLE ${config.get('spotify:table_name_post')} CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    migrations.push(`ALTER TABLE ${config.get('facebook:table_name_profile')} CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    migrations.push(`ALTER TABLE ${config.get('twitter:table_name_profile')} CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    migrations.push(`ALTER TABLE ${config.get('youtube:table_name_profile')} CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    migrations.push(`ALTER TABLE ${config.get('spotify:table_name_profile')} CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    migrations.push(`DROP TABLE IF EXISTS fbsearch;`);
    migrations.push(`DROP TABLE IF EXISTS twittersearch;`);
    migrations.push(`DROP TABLE IF EXISTS spotifysearch;`);
    migrations.push(`DROP TABLE IF EXISTS youtubesearch;`);
   // migrations.push(`ALTER TABLE ${config.get('spotify:table_name_post')} ADD COLUMN type VARCHAR(16);`);
   // migrations.push(`ALTER TABLE ${config.get('youtube:table_name_post')} ADD COLUMN type VARCHAR(16);`);
    //mysql connection
    dataBaseConnect(function () {
        connection.query(createDataBaseQuery, function (err) {
            if (err) {
                console.error(err.message)
            } else {
                connection.query(useDataBaseQuery, function (err) {
                    if(err){
                        return callback(err);
                    }
                    connection.query(tables.join(""), function (err) {
                        if (err) {
                            console.error(err)
                        } else {
                            connection.query(migrations.join(""), function (err) {
                                if(err) {
                                    console.error('INIT DB ERROR = ' + err);
                                }
                                console.log('db is ready');
                            });
                        }
                    });

                    callback(err, connection);
                });

            }
        });
    });
};

exports.getConnection = function () {
    if(connection){
        return connection;
    }
    dataBaseConnect();
};

//connect to database
function dataBaseConnect(callback) {
    connection = mysql.createConnection(config.get("mysql"));
    connection.connect(function (err) {
        if (err) {
            setTimeout(dataBaseConnect, 2000);
        } else if (callback) {
            callback();
        }
    });
    connection.on('error', function (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            dataBaseConnect();
        } else {
            throw err;
        }
    });
}
