const config = require("../config");
const twit = require("twit");
const TABLE_NAME_PROFILE = config.get('twitter:table_name_profile');
const TABLE_NAME_POST = config.get('twitter:table_name_post');
var connection;
var twitter;
var initialized = false;


exports.init = function (dbconn, config) {
    connection = dbconn;
    twitter = new twit(config);
    initialized = true;
};

exports.updateProfile = function (id, token, next) {
    if(!initialized){
        return next();
    }
    twitter.setAuth(token);
    profile(id, next);
};

function profile (id, next) {
    twitter.get('users/show', { user_id: id }, function(err, details) {
        if (err || !details) {
            deleteData(id, next);
        } else {
            addOrUpdateData(id, details, next);
        }
    });
};

//add or update existing user profile
function addOrUpdateData ( id, details, next) {
    var name = details.name;
    var screen_name = details.screen_name;
    var lastGetPosts = (details.status) ? details.status.created_at : null;
    if(lastGetPosts){
        lastGetPosts = new Date(lastGetPosts);
    }
    connection.query(`SELECT id_str from ${TABLE_NAME_PROFILE}  WHERE id_str = ?`, id.toString(), function(err, result){
        if(err){
            return next();
        }
        details = JSON.stringify(details);
        if(result && result.length > 0){
            connection.query(`UPDATE ${TABLE_NAME_PROFILE} SET detail_json = ?, lastGetPosts = ?, updated = NOW() where id_str = ?;`,[details, lastGetPosts, id.toString()]
                , function(err){
                      if(err){
                          console.log(err);
                          return next();
                      }
                     next(id)
                });
        } else {
            connection.query(`INSERT INTO ${TABLE_NAME_PROFILE} ( id_str, id, name, screen_name, detail_json, lastGetPosts ) VALUES (?, ?, ?, ?, ?, ?);`, [ id.toString(), id, name, screen_name, details, lastGetPosts]
                , function(err, result){
                if(err){
                    return next();
                }
                next(id)
            });
        }
    });
}

//delete user profile
function deleteData (id, next) {
    connection.query(`SELECT id_str from ${TABLE_NAME_PROFILE} WHERE id_str = ?`, id, function(err, result){
        if(err){
            return next();
        }
        if(result && result.length > 0){
            connection.query(`DELETE from ${TABLE_NAME_PROFILE} WHERE id_str = ?`,  id, function(){
                next();
            });
        }
    });
}

