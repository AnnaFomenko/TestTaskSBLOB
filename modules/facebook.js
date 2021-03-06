const config = require("../config");
const db = require("./database");
const errors = require("./errors");
const graph = require("fbgraph");
const request = require("request");
const PROFILE = 'profile';
const PAGE = 'page';
const GROUP = 'group';
const PAGE_FIELDS = 'id,about,cover,birthday,link,picture,website,name,is_verified,location,hometown,fan_count';
const USER_FIELDS = 'id,about,cover,currency,devices,birthday,link,locale,picture,meeting_for,middle_name,accounts,groups,likes,videos,website,family,work,name_format,political,photos,favorite_teams,favorite_athletes,last_name,email,first_name,name,gender,is_verified,location,interested_in,hometown,quotes,relationship_status,religion,security_settings,significant_other,sports,timezone,updated_time,verified,languages';
const GROUP_FIELDS = 'id,cover,description,email,icon,member_request_count,name,owner,privacy,parent,updated_time';
const TABLE_NAME_PROFILE = config.get('facebook:table_name_profile');
const TABLE_NAME_POST = config.get('facebook:table_name_post');
const POSTS_LIMIT = 50;

//search
const MAX_SEARCH_LIMIT = 100;
const FILTER_PAGE = 'page';
const FILTER_USER = 'user';
const FILTER_GROUP = 'group';

exports.searchFilter = {
    PAGE: FILTER_PAGE,
    USER: FILTER_USER,
    GROUP: FILTER_GROUP
};

//inits
graph.setVersion('2.9');

exports.updateProfile = function ( user_id, token, next) {
    profile(user_id, token, next);
};

exports.updatePosts = function ( user_id, token, all, next) {
    let nextUrl = `${config.get("facebook:api_url")}/${user_id}/posts?fields=reactions.limit(0).summary(true),comments.limit(0).summary(true),application,full_picture,caption,description,icon,is_hidden,is_published,message_tags,name,object_id,parent_id,permalink_url,picture,privacy,properties,source,status_type,story,story_tags,updated_time,type,shares,link,message,created_time,likes.limit(0).summary(true)&limit=${POSTS_LIMIT}&access_token=${token}`;
    posts(user_id, all, nextUrl, next);
};

exports.search = function (q, filter, page, itemsPerPage, token, next) {
    search(q, filter, page, itemsPerPage, token, next);
};

//profile
function profile (id, token, next) {
    let fields = `${USER_FIELDS},public_key,session_keys`;
    graph.get(`${id}?fields=${fields}`
    , {access_token: token}, function(err, result) {
            if (err) {
                if(err.code === 100 || err.code === 110){
                    return page(id, token, next);
                }
                return next(err);
            }
            if(!result){
                return next(errors.emptyResult);
            }
            addOrUpdateData(id, result, next, PROFILE);
    });
}

function page (id, token, next) {
    graph.get(`${id}?fields=${PAGE_FIELDS}`
        , { access_token: token}, function(err, result) {
        if (err) {
            if(err.code === 100){
                return deleteData (id, next);
            }
            return next(err);
        }
        if(!result){
            return next(errors.emptyResult);
        }
        addOrUpdateData( id, result, next, PAGE);
    });
}

//add or update existing user profile or page
function addOrUpdateData (id, details, next, type) {
    const connection = db.getConnection();
    const name = details.name;
    const user = id;
    id = details.id;
    connection.query(`SELECT id from ${TABLE_NAME_PROFILE}  WHERE id = ?`, id, function(err, result){
        if(err){
            return next(err)
        }
        details = JSON.stringify(details);
        if(result && result.length > 0){
            connection.query(`UPDATE ${TABLE_NAME_PROFILE} SET detail_json = ? where id = ?;`,[details, id]
                , function(err){
                    if(err){
                        return next(err);
                    }
                    next(null, user);
            });
        } else {
            connection.query(`INSERT INTO ${TABLE_NAME_PROFILE} ( id, type, name, detail_json ) VALUES (?, ?, ?, ?);`, [ id, type, name, details]
                , function(err){
                     if(err){
                         return next(err);
                     }
                     next(null, user);
                });
        }
    });
}

//delete user profile or page
function deleteData (id, next) {
    const connection = db.getConnection();
    connection.query(`SELECT id from ${TABLE_NAME_PROFILE} WHERE id = ?`, id, function(err, result){
        if(err){
            return next(err);
        }
        if(result && result.length > 0) {
            connection.query(`DELETE from ${TABLE_NAME_PROFILE} WHERE id = ?`, id
                , function (err) {
                    if(err) {
                        return next(err);
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
    let postIds = [];
    let existingPostIds = [];
    getNextPosts(nextUrl, function(err, result){
        if (err) {
            return next(err);
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
                if(postIds.indexOf(data[i].id) !== -1){
                    data.splice(i, 1);
                    continue;
                }
                postIds.push(data[i].id)
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
                        return next(err);
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
}

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
        id = parseInt(posts[i].id);
        details = connection.escape(JSON.stringify(posts[i]));
        textcontent = connection.escape(posts[i].message);
        if(existingPostIds.indexOf(id) !== -1){
            updateQuery += `UPDATE ${TABLE_NAME_POST} SET detail_json = ${details}, textcontent = ${textcontent}, user_id = ${user_id} where id = '${id}';`;
        } else {
            insertQuery += `INSERT INTO ${TABLE_NAME_POST} ( id, detail_json, textcontent, user_id ) VALUES ('${id}', ${details}, ${textcontent}, ${user_id});`;
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

//search
function search (q, filter, page, itemsPerPage, token, next) {
    if(itemsPerPage > MAX_SEARCH_LIMIT || itemsPerPage <= 0){
        return next(errors.itemsPerPage);
    }
    if(filter !== FILTER_USER && filter !== FILTER_GROUP && filter !== FILTER_PAGE){
        return next(errors.invalidSearchFilter);
    }
    let existingItemsIds = [];
    let searchResults = [];
    let offset = page*itemsPerPage;
    let params = { access_token: token, type: filter, limit:MAX_SEARCH_LIMIT, q: q, offset: offset};
    //probably we want add fields
    switch(filter){
        case FILTER_PAGE:
            params.fields = PAGE_FIELDS;
            break;
        case FILTER_USER:
            params.fields = USER_FIELDS;
            break;
        case FILTER_GROUP:
            params.fields = GROUP_FIELDS;
            break;
    }
    graph.get('search'
        , params, function(err, result) {
            if (err) {
                return next(err);
            }
            if(!result || !result.data){
                return next(errors.emptyResult);
            }
            if(result.data.length > itemsPerPage){
                searchResults = result.data.slice(0, itemsPerPage);
            } else {
                searchResults = result.data.slice(0, result.data.length);
            }
            next(null, searchResults);
            let itemsIds = [];
            for(let i = result.data.length-1; i >= 0 ; i--){
                if(itemsIds.indexOf(result.data[i].id) !== -1){
                    result.data.splice(i, 1);
                    continue;
                }
                itemsIds.push(result.data[i].id);
            }
            if(itemsIds.length>0){
                checkExistingItems(filter, itemsIds, function(err, results){
                    if(err){
                        return console.error(err);
                    }
                    if(results && results.length>0) {
                        for (let i = 0; i < results.length; i++) {
                            existingItemsIds.push(results[i].id);
                        }
                    }
                    addSearchItems (filter, result.data, existingItemsIds, function(err){
                        if(err){
                            //TODO use logger
                            console.error(err);
                        }
                    })
                });
            }
        });
}

function checkExistingItems(filter, itemsIds, callback){
    const connection = db.getConnection();
    connection.query(`SELECT id from ${TABLE_NAME_PROFILE} WHERE id in ( ${'\''+ itemsIds.join('\',\'')+'\''});`,
        function(err, result){
            callback(err, result);
        });
}

//add search items
function addSearchItems (filter, items, existingItemsIds, callback) {
    const connection = db.getConnection();
    let updateQuery = '';
    let insertQuery = '';
    let details;
    let id;
    let type;
    let name;
    switch(filter){
        case FILTER_PAGE:
            type = PAGE;
            break;
        case FILTER_USER:
            type = PROFILE;
            break;
        case FILTER_GROUP:
            type = GROUP;
            break;
    }
    for(let i = 0; i < items.length; i++){
        id = parseInt(items[i].id);
        name = connection.escape(items[i].name);
        details = connection.escape(JSON.stringify(items[i]));
        if(existingItemsIds.indexOf(id) !== -1) {
            updateQuery += `UPDATE ${TABLE_NAME_PROFILE} SET name = ${name} where id = '${id}';`;
        } else {
            insertQuery += `INSERT INTO ${TABLE_NAME_PROFILE} (  id, type, name, detail_json  ) VALUES ('${id}', '${type}', ${name}, ${details});`;
        }
    }
    connection.query(updateQuery+insertQuery, callback);
}