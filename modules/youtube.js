const config = require("../config");
const db = require("./database");
const request = require("request");
const async = require("async");
const TABLE_NAME_PROFILE = config.get('youtube:table_name_profile');
const TABLE_NAME_POST = config.get('youtube:table_name_post');
const API_URL = config.get('youtube:api_url');

exports.updateProfile = function ( id, token, next) {
    profile(id, token, next);
};

function getStats(id, token, cb){
    request(API_URL + '?part=statistics&id='+id+'&key='+token, function(err, response, body){
        cb(err, body);
    });
}

function getSnippet(id, token, cb){
    request(API_URL + '?part=snippet&id='+id+'&key='+token, function(err, response, body){
        cb(err, body);
    });
}

function profile (id, token, callback) {
    var items = [];
    async.parallel([
       function(cb){getStats(id, token, cb)},
       function(cb){getSnippet(id, token, cb)}
    ], function(err, results) {
        if ( err || !results || results.length<1 ) {
            return deleteData(id, callback);
        }
        for(var i = 0; i<results.length; i++) {
            results[i] = JSON.parse(results[i]);
            if(results[i].error){
                return deleteData(id, callback);
            }
            items = items.concat(...results[i].items);
        }
        addOrUpdateData( id, items, callback);

    });
};

//add or update existing user profile
function addOrUpdateData ( id, details, next) {
    var connection = db.getConnection();
    connection.query(`SELECT id from ${TABLE_NAME_PROFILE}  WHERE id = ?`, id, function(err, result){
        if(err){
            return next()
        }
        details = JSON.stringify(details);
        if(result && result.length > 0){
            connection.query(`UPDATE ${TABLE_NAME_PROFILE} SET detail_json = ?, updated = NOW() where id= ?;`,[details, id], function(err){
                if(err){
                    return next();
                }
                next(id);
            });
        } else {
            connection.query(`INSERT INTO ${TABLE_NAME_PROFILE} ( id, detail_json ) VALUES (?, ?);`, [ id, details], function(err){
                if(err){
                    return next();
                }
                next(id);
            });
        }
    });
}

//delete user profile or page
function deleteData (id, next) {
    var connection = db.getConnection();
    connection.query(`SELECT id from ${TABLE_NAME_PROFILE} WHERE id = ?`, id, function(err, result){
        if(err){
            return next();
        }
        if(result && result.length > 0){
            connection.query(`DELETE from ${TABLE_NAME_PROFILE} WHERE id = ?`,  id
                , function(){
                    next();
                });
        }
    });
}
