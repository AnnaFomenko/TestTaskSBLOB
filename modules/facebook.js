const config = require("../config");
const db = require("./database");
const errors = require("./errors");
const graph = require("fbgraph");
const request = require("request");
const PROFILE = 'profile';
const PAGE = 'page';
const TABLE_NAME_PROFILE = config.get('facebook:table_name_profile');
const TABLE_NAME_POST = config.get('facebook:table_name_post');
const POSTS_LIMIT = 50;

exports.updateProfile = function ( user_id, token, next) {
    profile(user_id, token, next);
};

exports.updatePosts = function ( user_id, token, all, next) {
    let nextUrl = `${config.get("facebook:api_url")}${user_id}/posts?fields=reactions.limit(0).summary(true),comments.limit(0).summary(true),application,full_picture,caption,description,icon,is_hidden,is_published,message_tags,name,object_id,parent_id,permalink_url,picture,privacy,properties,source,status_type,story,story_tags,updated_time,type,shares,link,message,created_time,likes.limit(0).summary(true)&limit=${POSTS_LIMIT}&access_token=${token}`;
    posts(user_id, all, nextUrl, next);
};

//profile
function profile (id, token, next) {
    graph.get(id+'?fields=id,about,cover,currency,devices,birthday,link,locale,picture,meeting_for,middle_name,accounts,session_keys,groups,likes,videos,website,family,work,name_format,political,public_key,photos,favorite_teams,favorite_athletes,last_name,email,first_name,name,gender,is_verified,location,interested_in,hometown,quotes,relationship_status,religion,security_settings,significant_other,sports,timezone,updated_time,verified,languages'
    , { access_token: token}, function(err, result) {
            if (err) {
                if(err.code === 100){
                    return page(id, token, next);
                }
                return next(err.message);
            }
            if(!result){
                return next(errors.emptyResult);
            }
            addOrUpdateData(id, result, next, PROFILE);
    });
};

function page (id, token, next) {
    graph.get(id+'?fields=id,about,cover,birthday,link,picture,website,name,is_verified,location,hometown,fan_count'
        , { access_token: token}, function(err, result) {
        if (err) {
            if(err.code === 100){
                return deleteData (id, next);
            }
            return next(err.message);
        }
        if(!result){
            return next(errors.emptyResult);
        }
        addOrUpdateData( id, result, next, PAGE);
    });
};

//add or update existing user profile or page
function addOrUpdateData (id, details, next, type) {
    const connection = db.getConnection();
    const name = details.name;
    connection.query(`SELECT id from ${TABLE_NAME_PROFILE}  WHERE id = ?`, id, function(err, result){
        if(err){
            return next(err.message)
        }
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
            connection.query(`INSERT INTO ${TABLE_NAME_PROFILE} ( id, type, name, detail_json ) VALUES (?, ?, ?, ?);`, [ id, type, name, details]
                , function(err){
                     if(err){
                         return next(err.message);
                     }
                     next(null, id);
                });
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
        if(result && result.length > 0) {
            connection.query(`DELETE from ${TABLE_NAME_PROFILE} WHERE id = ?`, id
                , function (err) {
                    if(err) {
                        return next(err.message);
                    }
                    next(errors.profileNotExist);
                });
        } else {
            next(errors.profileNotExist);
        }
    });
}

//posts
function posts (user_id, all, nextUrl, next) {
    console.log('facebook posts nextUrl='+nextUrl);
    let postIds = [];
    let existingPostIds = [];
    getNextPosts(nextUrl, function(err, result){
        if (err) {
            return next(err.message);
        }
        if(!result || !result.data) {
            return next(errors.emptyResult);
        }
        if(result.paging){
            nextUrl = result.paging.next;
        } else {
            nextUrl = null;
        }
        let data = result.data;
        if(data.length > 0){
            for(let i = data.length-1; i >=0 ; i--){
                if(postIds.indexOf(data[i].id)!=-1){
                    data.splice(i, 1);
                    continue;
                }
                postIds.push(data[i].id)
            }
        }
        if(postIds.length == 0){
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
                            posts( user_id, all, nextUrl, next )
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
        if(err){
            return callback(err);
        }
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
        textcontent = (posts[i].message) ? encodeURIComponent(posts[i].message.replace(/[':()/!|\/]/iug, "")) : '_';
        if(existingPostIds.indexOf(posts[i].id) != -1){
            updateQuery += `UPDATE ${TABLE_NAME_POST} SET detail_json = '${details}', textcontent = '${textcontent}', user_id = ${user_id}, updated = NOW() where id = '${id}';`;
        } else {
            insertQuery += `INSERT INTO ${TABLE_NAME_POST} ( id, detail_json, textcontent, user_id ) VALUES ('${id}', '${details}', '${textcontent}', ${user_id});`;
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