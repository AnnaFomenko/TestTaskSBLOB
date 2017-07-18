const request = require("request");
const config = require("../config");
const db = require("./database");
const errors = require("./errors");
const TABLE_NAME_PROFILE = config.get('spotify:table_name_profile');
const TABLE_NAME_POST = config.get('spotify:table_name_post');
const TABLE_NAME_SEARCH = config.get('spotify:table_name_search');
const LIMIT = 50;

exports.updateProfile = function ( id, token, next ) {
    profile(id, token, next);
};

exports.updatePosts = function ( user_id, token, all, next) {
    let nextUrl = `${config.get("spotify:api_url")}artists/${user_id}/albums?limit=${LIMIT}&access_token=${token}`;
    posts(user_id, token, all, nextUrl, next);
};

exports.search = function (q, page, token, next) {
    search(q, page, token, next);
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
            return next(err.message);
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
            insertQuery += `INSERT INTO ${TABLE_NAME_POST} ( id, detail_json, textcontent, user_id ) VALUES ('${id}', ${details}, ${textcontent}, '${user_id}');`;
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
function search (q, page, token, next) {
    let offset = page*LIMIT;
    request(`${config.get('spotify:api_url')}search?q=${q}&access_token=${token}&limit=${LIMIT}&offset=${offset}&type=track,artist` , function(err, result){
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
            return next(err.message);
        }
        if(!body){
            return next(errors.emptyResult);
        }
        next(null, body);
        let itemsIds = [];
        let foundTracks = false;
        let foundArtists = false;
        if(result.artists && result.artists.items && result.artists.items.length>0) {
            foundArtists = true;
            for (let i = result.artists.items.length - 1; i >= 0; i--) {
                if (itemsIds.indexOf(result.artists.items[i].id) !== -1) {
                    result.artists.items.splice(i, 1);
                    continue;
                }
                itemsIds.push(result.artists.items[i].id);
            }
        }
        if(result.tracks && result.tracks.items && result.tracks.items.length>0) {
            foundTracks = true;
            for (let i = result.tracks.items.length - 1; i >= 0; i--) {
                if (itemsIds.indexOf(result.tracks.items[i].id) !== -1) {
                    result.tracks.items.splice(i, 1);
                    continue;
                }
                itemsIds.push(result.tracks.items[i].id);
            }
        }
        if(itemsIds.length>0){
            checkExistingItems(q, itemsIds, function(err, results){
                if(err){
                    return console.error(err);
                }
                if(results && results.length>0) {
                    for (let i = 0; i < results.length; i++) {
                        existingItemsIds.push(results[i].item_id);
                    }
                }
                let items = [];
                if(foundArtists){
                    addSearchItems (q, result.artists.items, existingItemsIds, function(err){
                        if(err){
                            console.error(err);
                        }
                    })
                }
                if(foundTracks){
                    addSearchItems (q, result.tracks.items, existingItemsIds, function(err){
                        if(err){
                            console.error(err);
                        }
                    })
                }
            });
        }
    });
}

function checkExistingItems(q, itemsIds, callback){
    const connection = db.getConnection();
    connection.query(`SELECT item_id from ${TABLE_NAME_SEARCH} WHERE item_id in ( ${'\''+ itemsIds.join('\',\'')+'\''}) and query = '${q}' and filter = '${filter}';`,
        function(err, result){
            callback(err, result);
        });
}

//add search items
function addSearchItems (q, items, existingStatusIds, callback) {
    const connection = db.getConnection();
    let updateQuery = '';
    let insertQuery = '';
    let details;
    let id;
    q = connection.escape(q);
    for(let i = 0; i < items.length; i++){
        id = items[i].id;
        console.log(items[i].id)
        details = connection.escape(JSON.stringify(items[i]));
        if(existingStatusIds.indexOf(id) !== -1){
            updateQuery += `UPDATE ${TABLE_NAME_SEARCH} SET search_result = ${details} where item_id = '${id}' and query = ${q};`;
        } else {
            insertQuery += `INSERT INTO ${TABLE_NAME_SEARCH} ( item_id, search_result, query ) VALUES ('${id}', ${details}, ${q});`;
        }
    }
    connection.query(updateQuery+insertQuery, callback);
}