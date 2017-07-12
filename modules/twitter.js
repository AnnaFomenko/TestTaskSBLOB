const config = require("../config");
const db = require("./database");
const errors = require("./errors");
const request = require("request");
const twit = require("twit");
const TABLE_NAME_PROFILE = config.get('twitter:table_name_profile');
const TABLE_NAME_POST = config.get('twitter:table_name_post');
const twitter  = new twit({ consumer_key: config.get('twitter:consumer_key')
                          , consumer_secret: config.get('twitter:consumer_secret')
                          , app_only_auth: true});
const POSTS_LIMIT = 50;

exports.updateProfile = function (id, token, next) {
    twitter.setAuth(token);
    profile(id, next);
};

exports.updatePosts = function ( user_id, token, all, next) {
    let max_id = 0;
    twitter.setAuth(token);
    posts(user_id, all, max_id, next);
};

//profile
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
    const name = details.name;
    const screen_name = details.screen_name;
    let lastGetPosts = (details.status) ? details.status.created_at : null;
    if(lastGetPosts){
        lastGetPosts = new Date(lastGetPosts);
    }
    const connection = db.getConnection();
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
    const connection = db.getConnection();
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

//posts
function posts (user_id, all, max_id, next) {
    console.log('post::'+max_id);
    let postIds = [];
    let existingPostIds = [];
    getNextPosts(user_id, max_id, function(err, result){
        if (err) {
            return next(err.message);
        }
        if(!result) {
            return next(errors.emptyResult);
        }
        let data = result;
        if(data.length > 0){
            let currentMaxId = data[data.length-1].id_str;
            let locId = parseInt(currentMaxId.substr(currentMaxId.length-2, 2))-1;
            currentMaxId = currentMaxId.substr(0,currentMaxId.length-2)+locId.toString();
            max_id = (max_id === currentMaxId) ? 0 : currentMaxId;
            for(let i = data.length-1; i >= 0 ; i--){
                if(postIds.indexOf(data[i].id_str) != -1){
                    data.splice(i, 1);
                    continue;
                }
                postIds.push(data[i].id_str);
            }
        }
        if(postIds.length == 0){
            return next(null, user_id);
        }
        checkExistingPosts(postIds, function(err, results){
            if(results && results.length>0){
                for(let i = 0; i < results.length; i++){
                    existingPostIds.push(results[i].id_str);
                }
            }
            addOrUpdatePosts( user_id, data, existingPostIds
                , function(err, result){
                    if(err){
                        return next(err.message);
                    }
                    if( all || existingPostIds.length < data.length){
                        if(max_id > 0) {
                            posts( user_id, all, max_id, next )
                        } else {
                            next(null, user_id);
                        }
                    } else {
                        next(null, user_id);
                    }
                });
        });

    });
};

function getNextPosts(user_id, max_id, callback){
    let params = { user_id: user_id, include_rts:1, count:POSTS_LIMIT };
    if(max_id > 0){
        params.max_id = max_id;
    }
    twitter.get('statuses/user_timeline', params, callback);
}

//add or update posts
function addOrUpdatePosts (user_id, posts, existingPostIds, callback) {
    const connection = db.getConnection();
    let updateQuery = '';
    let insertQuery = '';
    let details;
    let textcontent = '';
    let id, id_str;
    for(let i = 0; i < posts.length; i++){
        id = posts[i].id;
        id_str = posts[i].id_str;
        details = JSON.stringify(posts[i]);
        details = details.replace(/'/g, '`');
        textcontent = (posts[i].text) ? encodeURIComponent(posts[i].text.replace(/\(/iu,"")) : '_';
        if(existingPostIds.indexOf(id_str) != -1){
            updateQuery += `UPDATE ${TABLE_NAME_POST} SET detail_json = '${details}', textcontent = '${textcontent}', user_id = ${user_id}, updated = NOW() where id_str = '${id_str}';`;
        } else {
            insertQuery += `INSERT INTO ${TABLE_NAME_POST} ( id_str, id, detail_json, textcontent, user_id ) VALUES ('${id_str}', '${id}', '${details}', '${textcontent}', ${user_id});`;
        }
    }
    connection.query(updateQuery+insertQuery, callback);
}

function checkExistingPosts(postIds, callback){
    const connection = db.getConnection();
    connection.query(`SELECT id_str from ${TABLE_NAME_POST}  WHERE id_str in ( ${'\''+ postIds.join('\',\'')+'\''} )`,
        function(err, result){
            callback(err, result);
        });
}

