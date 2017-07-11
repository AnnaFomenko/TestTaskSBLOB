const request = require("request");
const config = require("../config");
const db = require("./database");
const TABLE_NAME_PROFILE = config.get('spotify:table_name_profile');
const TABLE_NAME_POST = config.get('spotify:table_name_post');
const API_URL = config.get('spotify:api_url');

exports.updateProfile = function ( id, token, next ) {
    profile(id, token, next);
};

function profile (id, token, next) {
    request(API_URL + id + '?access_token=' + token , function(err, response, result){
        if (err || !result) {
            deleteData(id, next);
        } else {
            addOrUpdateData(id, result, next);
        }
    });
};

//add or update existing user profile
function addOrUpdateData (id, details, next) {
    details = JSON.parse(details);
    var name = details.name;
    var connection = db.getConnection();
    connection.query(`SELECT id from ${TABLE_NAME_PROFILE}  WHERE id = ?`, id, function(err, result){
        if(err){
            next(err)
        } else {
            details = JSON.stringify(details);
            if(result && result.length > 0){
                connection.query(`UPDATE ${TABLE_NAME_PROFILE} SET detail_json = ?, updated = NOW() where id = ?;`,[details, id]
                    , function(err){
                        if(err){
                            return next();
                        }
                        next(id);
                    });
            } else {
                connection.query(`INSERT INTO ${TABLE_NAME_PROFILE} ( id, name, detail_json ) VALUES (?, ?, ?);`, [ id, name, details]
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
    var connection = db.getConnection();
    connection.query(`SELECT id from ${TABLE_NAME_PROFILE} WHERE id = ?`, id, function(err, result){
        if(err){
            return next(err);
        }
        if(result && result.length > 0){
            connection.query(`DELETE from ${TABLE_NAME_PROFILE} WHERE id = ?`, id
                , function(err, result){
                     if(err){
                         return next(err);
                     }
                     next(id);
                });
        }
    });
}
