const request = require("request");
const config = require("../config");
const db = require("./database");
const errors = require("./errors");
const TABLE_NAME_PROFILE = config.get('spotify:table_name_profile');
const TABLE_NAME_POST = config.get('spotify:table_name_post');
const POSTS_LIMIT = 50;

exports.updateProfile = function ( id, token, next ) {
    profile(id, token, next);
};

exports.updatePosts = function ( user_id, token, all, next) {
    let nextUrl = `${config.get("spotify:api_url")}${user_id}/albums?limit=${POSTS_LIMIT}&access_token=${token}`;
    posts(user_id, token, all, nextUrl, next);
};

function profile (id, token, next) {
    request(config.get('spotify:api_url') + id + '?access_token=' + token , function(err, result){
        let body = null;
        if( result.body ){
            try{
                body = JSON.parse(result.body);
                err = body.error;
            } catch(error){
                err = error;
            }
        }
        if (err) {
            if(err.message === 'invalid id'){
                deleteData(id, next);
            }
            return next(err.message);
        }
        if(!body){
            return next(errors.emptyResult);
        }
        addOrUpdateData(id, body, next);
    });
};

//add or update existing user profile
function addOrUpdateData (id, details, next) {
    const name = details.name;
    const connection = db.getConnection();
    connection.query(`SELECT id from ${TABLE_NAME_PROFILE}  WHERE id = ?`, id, function(err, result){
        if(err){
            next(err)
        } else {
            details = JSON.stringify(details);
            if(result && result.length > 0){
                connection.query(`UPDATE ${TABLE_NAME_PROFILE} SET detail_json = ?, updated = NOW() where id = ?;`,[details, id]
                    , function(err){
                        if(err){
                            return next(err.message);
                        }
                        next(null, id);
                    });
            } else {
                connection.query(`INSERT INTO ${TABLE_NAME_PROFILE} ( id, name, detail_json ) VALUES (?, ?, ?);`, [ id, name, details]
                    , function(err){
                    if(err){
                        return next(err.message);
                    }
                    next(null, id);
                });
            }
        }
    });
}

//delete user profile or page
function deleteData (id, next) {
    const connection = db.getConnection();
    connection.query(`SELECT id from ${TABLE_NAME_PROFILE} WHERE id = ?`, id, function(err, result){
        if(err){
            return next(err.message);
        }
        if(result && result.length > 0){
            connection.query(`DELETE from ${TABLE_NAME_PROFILE} WHERE id = ?`, id
                , function(err){
                     if(err){
                         return next(err.message);
                     }
                     next(null, id);
                });
        }
    });
}

//posts
function posts (user_id, token,  all, nextUrl, next) {
    console.log('spotify posts nextUrl='+nextUrl);
    let postIds = [];
    let existingPostIds = [];
    getNextPosts(nextUrl, function(err, result){
        if (err) {
            return next(err.message);
        }
        if(!result || !result.items) {
            return next(errors.emptyResult);
        }
        if(result.next){
            nextUrl = `${result.next}&access_token=${token}`;
        } else {
            nextUrl = null;
        }
        let data = result.items;
        if(data.length > 0){
            for(let i = data.length-1; i >=0 ; i--){
                if(postIds.indexOf(data[i].id) !== -1){
                    data.splice(i, 1);
                    continue;
                }
                postIds.push(data[i].id);
            }
        }
        if(postIds.length === 0){
            return next(null, user_id);
        }
        checkExistingPosts(postIds, function(err, results){
            if(results && results.length>0){
                for(let i = 0; i < results.length; i++){
                    existingPostIds.push(results[i].id);
                }
            }
            addOrUpdatePosts( user_id, data, existingPostIds
                , function(err){
                    if(err){
                        return next(err.message);
                    }
                    if( all || existingPostIds.length < data.length){
                        if(nextUrl) {
                            posts( user_id, token, all, nextUrl, next )
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

function getNextPosts(nextUrl, callback){
    request(nextUrl, function(err, result){
        let body = null;
        if( result.body ){
            try{
                body = JSON.parse(result.body);
                err = body.error;
            } catch(error){
                err = error;
            }
        }
        callback(err, body);
    });
}

//add or update posts
function addOrUpdatePosts (user_id, posts, existingPostIds, callback) {
    const connection = db.getConnection();
    let updateQuery = '';
    let insertQuery = '';
    let details;
    let textcontent='';
    let id;
    for(let i = 0; i < posts.length; i++){
        id = posts[i].id;
        details = JSON.stringify(posts[i]);
        details = details.replace(/'/g, '`');
        //TODO write util functions
        textcontent = (posts[i].name) ? encodeURIComponent(posts[i].name.replace(/[':()/!|\/]/iug, "")) : '';
        if(existingPostIds.indexOf(posts[i].id) != -1){
            updateQuery += `UPDATE ${TABLE_NAME_POST} SET detail_json = '${details}', textcontent = '${textcontent}', user_id = '${user_id}', updated = NOW() where id = '${id}';`;
        } else {
            insertQuery += `INSERT INTO ${TABLE_NAME_POST} ( id, detail_json, textcontent, user_id ) VALUES ('${id}', '${details}', '${textcontent}', '${user_id}');`;
        }
    }
    connection.query(updateQuery+insertQuery, callback);
}

function checkExistingPosts(postIds, callback){
    const connection = db.getConnection();
    connection.query(`SELECT id from ${TABLE_NAME_POST}  WHERE id in ( ${'\''+ postIds.join('\',\'')+'\''} )`,
        function(err, result){
            callback(err, result);
        });
}