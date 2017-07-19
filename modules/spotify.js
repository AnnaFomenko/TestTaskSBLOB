const request = require("request");
const config = require("../config");
const db = require("./database");
const errors = require("./errors");
const TABLE_NAME_PROFILE = config.get('spotify:table_name_profile');
const TABLE_NAME_POST = config.get('spotify:table_name_post');
const POSTS_LIMIT = 50;
const ALBUM = 'album';
const PLAYLIST = 'playlist';
const TRACK = 'track';
//search
const MAX_SEARCH_LIMIT = 50;
const FILTER_ARTIST = 'artist';
const FILTER_PLAYLIST = 'playlist';
const FILTER_TRACK = 'track';

exports.searchFilter = {
    ARTIST: FILTER_ARTIST,
    PLAYLIST: FILTER_PLAYLIST,
    TRACK: FILTER_TRACK
};

exports.updateProfile = function ( id, token, next ) {
    profile(id, token, next);
};

exports.updatePosts = function ( user_id, token, all, next) {
    let nextUrl = `${config.get("spotify:api_url")}artists/${user_id}/albums?limit=${POSTS_LIMIT}&access_token=${token}`;
    posts(user_id, token, all, nextUrl, next);
};

exports.search = function (q, filter, page, itemsPerPage, token, next) {
    search(q, filter, page, itemsPerPage, token, next);
};

function profile (id, token, next) {
    request(`${config.get('spotify:api_url')}artists/${id}?access_token=${token}` , function(err, result){
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
            return next(err);
        }
        if(!body){
            return next(errors.emptyResult);
        }
        addOrUpdateData(id, body, next);
    });
}

//add or update existing user profile
function addOrUpdateData (id, details, next) {
    const name = details.name;
    const connection = db.getConnection();
    connection.query(`SELECT id from ${TABLE_NAME_PROFILE}  WHERE id = ?`, id, function(err, result){
        if(err){
            next(err)
        } else {
            details = connection.escape(JSON.stringify(details));
            if(result && result.length > 0){
                connection.query(`UPDATE ${TABLE_NAME_PROFILE} SET detail_json = ? where id = ?;`,[details, id]
                    , function(err){
                        if(err){
                            return next(err);
                        }
                        next(null, id);
                    });
            } else {
                connection.query(`INSERT INTO ${TABLE_NAME_PROFILE} ( id, name, detail_json ) VALUES (?, ?, ?);`, [ id, name, details]
                    , function(err){
                    if(err){
                        return next(err);
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
            return next(err);
        }
        if(result && result.length > 0){
            connection.query(`DELETE from ${TABLE_NAME_PROFILE} WHERE id = ?`, id
                , function(err){
                     if(err){
                         return next(err);
                     }
                     next(null, id);
                });
        }
    });
}

//posts
function posts (user_id, token,  all, nextUrl, next) {
    let postIds = [];
    let existingPostIds = [];
    getNextPosts(nextUrl, function(err, result){
        if (err) {
            return next(err);
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
                        return next(err);
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
}

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
        details = connection.escape(JSON.stringify(posts[i]));
        textcontent = connection.escape(posts[i].name);
        if(existingPostIds.indexOf(posts[i].id) !== -1){
            updateQuery += `UPDATE ${TABLE_NAME_POST} SET detail_json = ${details}, textcontent = ${textcontent}, user_id = '${user_id}' where id = '${id}';`;
        } else {
            insertQuery += `INSERT INTO ${TABLE_NAME_POST} ( id, detail_json, textcontent, user_id, type ) VALUES ('${id}', ${details}, ${textcontent}, '${user_id}', ${ALBUM});`;
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
    if(filter !== FILTER_TRACK && filter !== FILTER_PLAYLIST && filter !== FILTER_ARTIST){
        return next(errors.invalidSearchFilter);
    }
    let searchResults = [];
    let existingItemsIds = [];
    let offset = page*itemsPerPage;
    request(`${config.get('spotify:api_url')}search?q=${q}&access_token=${token}&limit=${MAX_SEARCH_LIMIT}&offset=${offset}&type=${filter}` , function(err, result){
        let body = null;
        if(result && result.body ){
            try{
                body = JSON.parse(result.body);
                err = body.error;
            } catch(error){
                err = error;
            }
        }
        if (err) {
            return next(err);
        }
        if(!body){
            return next(errors.emptyResult);
        }
        let itemsIds = [];
        let found;
        switch(filter){
            case FILTER_ARTIST:
                found = body.artists;
                break;
            case FILTER_PLAYLIST:
                found = body.playlists;
                break;
            case FILTER_TRACK:
                found = body.tracks;
                break;
        }
        if(found && found.items) {
            if (found.items.length > itemsPerPage) {
                searchResults = found.items.slice(0, itemsPerPage);
            } else {
                searchResults = found.items.slice(0, body.length);
            }
        }
        next(null, searchResults);
        if(found && found.items && found.items.length>0) {
            for (let i = found.items.length - 1; i >= 0; i--) {
                if (itemsIds.indexOf(found.items[i].id) !== -1) {
                    found.items.splice(i, 1);
                    continue;
                }
                itemsIds.push(found.items[i].id);
            }
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
                addSearchItems(filter, found.items, existingItemsIds, function(err){
                    if(err){
                        console.error(err);
                    }
                })
            });
        }
    });
}

function checkExistingItems(filter, itemsIds, callback){
    const connection = db.getConnection();
    if(filter === FILTER_ARTIST) {
        connection.query(`SELECT item_id from ${TABLE_NAME_PROFILE} WHERE id in ( ${'\'' + itemsIds.join('\',\'') + '\''});`,
            function (err, result) {
                callback(err, result);
            });
    } else {
        checkExistingPosts(itemsIds, callback);
    }
}

//add search items
function addSearchItems (filter, items, existingItemsIds, callback) {
    const connection = db.getConnection();
    let updateQuery = '';
    let insertQuery = '';
    let details;
    let id, type, name;
    let textcontent;
    let user_id = 0;
    for(let i = 0; i < items.length; i++){
        switch(filter){
            case FILTER_PLAYLIST:
                type = PLAYLIST;
                break;
            case FILTER_TRACK:
                type = TRACK;
                break;
        }
        id = items[i].id;
        name = connection.escape(items[i].name);
        details = connection.escape(JSON.stringify(items[i]));
        textcontent = (items[i].name) ? connection.escape(items[i].name) : null;
        if(existingItemsIds.indexOf(id) !== -1){
            if(filter === FILTER_ARTIST){
                updateQuery += `UPDATE ${TABLE_NAME_PROFILE} SET detail_json = ${details} where id = '${id}';`;
            } else {
                updateQuery += `UPDATE ${TABLE_NAME_POST} SET detail_json = ${details}, textcontent = ${textcontent} where id = '${id}';`;
            }

        } else {
            if(filter === FILTER_ARTIST){
                insertQuery += `INSERT INTO ${TABLE_NAME_PROFILE} (id, name, detail_json) VALUES ('${id}', ${name}, ${details});`;
            } else {
                user_id = (items[i].owner) ? connection.escape(items[i].owner.id) : 0;
                insertQuery += `INSERT INTO ${TABLE_NAME_POST} ( id, detail_json, textcontent, user_id, type ) VALUES ('${id}', ${details}, ${textcontent}, ${user_id}, '${type}');`;
            }
        }
    }
    connection.query(updateQuery+insertQuery, callback);
}