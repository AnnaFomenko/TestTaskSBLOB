const config = require("../config");
const graph = require("fbgraph");
const PROFILE = 'profile';
const PAGE = 'page';
const TABLE_NAME_PROFILE = config.get('facebook:table_name_profile');
const TABLE_NAME_POST = config.get('facebook:table_name_post');
var connection;
var initialized = false;

exports.init = function (dbconn) {
    connection = dbconn;
    initialized = true;
};

exports.updateProfile = function ( id, token, next) {
    if(!initialized){
        return next();
    }
    graph.setAccessToken(token);
    profile(id, next);

};

function profile (id, next) {
    graph.get(id+'?fields=id,about,cover,currency,devices,birthday,link,locale,picture,meeting_for,middle_name,accounts,session_keys,groups,likes,videos,website,family,work,name_format,political,public_key,photos,favorite_teams,favorite_athletes,last_name,email,first_name,name,gender,is_verified,location,interested_in,hometown,quotes,relationship_status,religion,security_settings,significant_other,sports,timezone,updated_time,verified,languages'
       , function(err, result) {
            if (err || !result) {
                console.log(err,result)
                page(id, next);
            } else {
                addOrUpdateData(id, result, next, PROFILE);
            }
    });
};

function page (id, next) {
    graph.get(id+'?fields=id,about,cover,birthday,link,picture,website,name,is_verified,location,hometown,fan_count'
        , function(err, result) {
        if (err || !result) {
            deleteData (id, next);
        } else {
            addOrUpdateData( id,  result, next, PAGE);
        }
    });
};

//add or update existing user profile or page
function addOrUpdateData (id, details, next, type) {
    var name = details.name;
    connection.query(`SELECT id from ${TABLE_NAME_PROFILE}  WHERE id = ?`, id, function(err, result){
        if(err){
            next()
        } else {
            details = JSON.stringify(details);
            if(result && result.length > 0){
                connection.query(`UPDATE ${TABLE_NAME_PROFILE} SET detail_json = ?, updated = NOW() where id= ?;`,[details, id]
                    , function(err){
                        if(err){
                            return next();
                        }
                        next(id);
                });
            } else {
                connection.query(`INSERT INTO ${TABLE_NAME_PROFILE} ( id, type, name, detail_json ) VALUES (?, ?, ?, ?);`, [ id, type, name, details]
                    , function(err){
                         if(err){
                             return next();
                         }
                         next(id);
                    });
            }
        }
    });
}

//delete user profile or page
function deleteData (id, next) {
    connection.query(`SELECT id from ${TABLE_NAME_PROFILE} WHERE id = ?`, id, function(err, result){
        if(err){
            return next();
        }
        if(result && result.length > 0) {
            connection.query(`DELETE from ${TABLE_NAME_PROFILE} WHERE id = ?`, id
                , function () {
                    next();
                });
        }
    });
}
