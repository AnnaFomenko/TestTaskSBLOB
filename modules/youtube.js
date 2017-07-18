const config = require("../config");
const db = require("./database");
const request = require("request");
const errors = require("./errors");
const async = require("async");
const TABLE_NAME_PROFILE = config.get('youtube:table_name_profile');
const TABLE_NAME_POST = config.get('youtube:table_name_post');
const TABLE_NAME_SEARCH = config.get('youtube:table_name_search');
const POSTS_LIMIT = 50;

//search
const MAX_SEARCH_LIMIT = 50;
const FILTER_CHANNEL = 'channel';
const FILTER_PLAYLIST = 'playlist';
const FILTER_VIDEO = 'video';

exports.searchFilter = {
    CHANNEL: FILTER_CHANNEL,
    PLAYLIST: FILTER_PLAYLIST,
    VIDEO: FILTER_VIDEO
};


exports.updateProfile = function ( options, token, next) {
    profile(options, token, next);
};

exports.updatePosts = function (user_id, token, all, next) {
    posts(user_id, token, all, null, next);
};

// filter - page or user
exports.search = function (q, filter, page, itemsPerPage, token, next) {
    search(q, filter, page, itemsPerPage, token, next);
};

function getStats(options, token, callback){
    let param = options.id ? options.id : options.forUsername;
    let paramName = options.id ? 'id' : 'forUsername';
    request(`${config.get("youtube:api_url")}channels?part=statistics&${paramName}=${param}&key=${token}`, function(err, result){
        if(err){
            return callback(err);
        }
        let body = null;
        if( result.body ){
            try{
                body = JSON.parse(result.body);
                err = body.error;
                if(!err && body.pageInfo.totalResults === 0){
                    err = new Error(errors.emptyResult);
                }
            } catch(error){
                err = error;
            }
        }
        callback(err, body);
    });
}

function getSnippet(options, token, callback){
    let param = options.id ? options.id : options.forUsername;
    let paramName = options.id ? 'id' : 'forUsername';
    request(`${config.get("youtube:api_url")}channels?part=snippet&${paramName}=${param}&key=${token}`, function(err, result){
        if(err){
            return callback(err);
        }
        let body = null;
        if( result.body ){
            try{
                body = JSON.parse(result.body);
                err = body.error;
                if(!err && body.pageInfo.totalResults === 0){
                    err = new Error(errors.emptyResult);
                }
            } catch(error){
                err = error;
            }

        }
        callback(err, body);
    });
}

function profile (options, token, next) {
    let items = [];
    let id;
    async.parallel([
       function(cb){getStats(options, token, cb)},
       function(cb){getSnippet(options, token, cb)}
    ], function(err, results) {
        if ( err ){
            if(err === errors.emptyResult){
                return deleteData(id, next);
            }
            return next(err);
        }
        if ( !results ){
            return deleteData(id, next);
        }
        for(let i = 0; i<results.length; i++) {
            if(results[i].error){
                return deleteData(id, next);
            }
            items = items.concat(...results[i].items);
        }
        id = items[0].id;
        addOrUpdateData( id, items, next);

    });
}

//add or update existing user profile
function addOrUpdateData ( id, details, next) {
    const connection = db.getConnection();
    connection.query(`SELECT id from ${TABLE_NAME_PROFILE}  WHERE id = ?`, id, function(err, result){
        if(err){
            return next(err)
        }
        details = JSON.stringify(details);
        if(result && result.length > 0){
            connection.query(`UPDATE ${TABLE_NAME_PROFILE} SET detail_json = ?, updated = NOW() where id = ?;`,[details, id], function(err){
                if(err){
                    return next(err);
                }
                next(null, id);
            });
        } else {
            connection.query(`INSERT INTO ${TABLE_NAME_PROFILE} ( id, detail_json ) VALUES (?, ?);`, [ id, details], function(err){
                if(err){
                    return next(err);
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
            return next(err);
        }
        if(result && result.length > 0){
            connection.query(`DELETE from ${TABLE_NAME_PROFILE} WHERE id = ?`,  id
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
function posts (user_id, token, all, nextPageToken, next) {
    console.log('youtube posts nextUrl='+nextPageToken);
    //playlistId is always the userId.replace('UC', 'UU')
    let playlistId = user_id.replace('UC', 'UU');
    let postIds = [];
    let existingPostIds = [];
    let nextUrl = `${config.get("youtube:api_url")}playlistItems?part=snippet%2CcontentDetails&maxResults=${POSTS_LIMIT}&playlistId=${playlistId}&key=${token}`;
    if(nextPageToken){
         nextUrl += `&pageToken=${nextPageToken}`;
    }
    getNextPosts(nextUrl, function(err, result){
        if (err) {
            return next(err);
        }
        if(!result || !result.items) {
            return next(errors.emptyResult);
        }
        if(result.nextPageToken){
            nextPageToken = result.nextPageToken;
        } else {
            nextPageToken = null;
        }
        let data = result.items;
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
                        if(nextPageToken) {
                            posts( user_id, token, all, nextPageToken, next )
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
    let details = '';
    let textcontent='';
    let id;
    for(let i = 0; i < posts.length; i++){
        id = posts[i].id;
        details = connection.escape(JSON.stringify(posts[i]));
        textcontent = connection.escape(posts[i].title);
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
function search(q, filter, page, itemsPerPage, token, next){
    if(itemsPerPage > MAX_SEARCH_LIMIT || itemsPerPage <= 0){
        return next(errors.itemsPerPage);
    }
    if(filter !== FILTER_PLAYLIST && filter !== FILTER_CHANNEL && filter !== FILTER_VIDEO){
        return next(errors.invalidSearchFilter);
    }
    let itemsCount = 0;
    let commonResult = [];
    let searchResults = [];
    recSearch(q, page, itemsPerPage, next, null, itemsCount, commonResult, searchResults, filter, token);
}

function recSearch (q, page, itemsPerPage, next, nextResult, itemsCount, commonResult, searchResults, filter, token) {
    getOnePage(q, nextResult, filter, token, function(err, result, nextResult){
        if(err){
            return next(err);
        }
        itemsCount += MAX_SEARCH_LIMIT;
        if(result && result.items){
            commonResult = [].concat(...commonResult).concat(...result.items);
        }
        let count = (page + 1)*itemsPerPage;
        let startIndex = 0;
        let endIndex = 0;
        if(itemsCount >= count){
            startIndex = page*itemsPerPage;
            endIndex = count;
            if(commonResult.length < startIndex){
                searchResults = commonResult;
            } else if(commonResult.length < endIndex){
                searchResults = commonResult.slice(startIndex, commonResult.length);
            } else if(commonResult.length >= endIndex){
                searchResults = commonResult.slice(startIndex, endIndex);
            }
            console.log(commonResult.length, searchResults.length)
            next(null, searchResults);
        } else if(nextResult) {
            recSearch (q, page, itemsPerPage, next, nextResult, itemsCount, commonResult, searchResults, filter);
        } else {
            if(commonResult.length/itemsPerPage > page){
                startIndex = itemsPerPage*page + commonResult.length%itemsPerPage;
                searchResults = commonResult.slice(startIndex, commonResult.length);
            }
            console.log(commonResult.length, searchResults.length)
            next(null, searchResults);
        }
    });
}

function getOnePage (q, nextResult, filter, token, callback) {
    let existingItemsIds = [];
    let pageToken = '';
    if(nextResult){
        pageToken = nextResult;
    }
    request(`${config.get("youtube:api_url")}search?part=snippet&q=${q}&key=${token}&maxResults=${MAX_SEARCH_LIMIT}&pageToken=${pageToken}&type=${filter}`, function(err, result){
        if(err){
            return callback(err);
        }
        let body = null;
        if( result.body ){
            try{
                body = JSON.parse(result.body);
                err = body.error;
                if(!err && body.pageInfo && body.pageInfo.totalResults === 0){
                    err = errors.emptyResult;
                }
                if(err){
                    return callback(err);
                }
            } catch(error){
                return callback(error);
            }
        } else {
            return callback(errors.emptyResult);
        }
        let itemsIds = [];
        let locId;
        for(let i = body.items.length-1; i >= 0 ; i--){
            switch(filter) {
                case FILTER_PLAYLIST:
                    locId = body.items[i].id.playlistId;
                    break;
                case FILTER_VIDEO:
                    locId = body.items[i].id.videoId;
                    break;
                case FILTER_CHANNEL:
                    locId = body.items[i].id.channelId;
                    break;
            }
            if(itemsIds.indexOf(locId) !== -1){
                body.items.splice(i, 1);
                continue;
            }
            itemsIds.push(locId);
        }
        nextResult = body.nextPageToken;
        callback(null, body, nextResult);
        if(itemsIds.length>0){
            checkExistingItems(q, filter, itemsIds, function(err, results){
                if(err){
                    return console.error(err);
                }
                if(results && results.length>0) {
                    for (let i = 0; i < results.length; i++) {
                        existingItemsIds.push(results[i].item_id);
                    }
                }
                addSearchItems (q, filter, body.items, existingItemsIds, function(err){
                    if(err){
                        console.error(err);
                    }
                })
            });
        }
    });
}

//
function checkExistingItems(q, filter, itemsIds, callback){
    const connection = db.getConnection();
    connection.query(`SELECT item_id from ${TABLE_NAME_SEARCH} WHERE item_id in ( ${'\''+ itemsIds.join('\',\'')+'\''}) and query = ? and filter = ?;`, [q, filter],
        function(err, result){
            callback(err, result);
        });
}

//add search items
function addSearchItems (q, filter, items, existingStatusIds, callback) {
    const connection = db.getConnection();
    let updateQuery = '';
    let insertQuery = '';
    let details;
    let id;
    q = connection.escape(q);
    let filterEscaped = connection.escape(filter);
    for(let i = 0; i < items.length; i++){
        switch(filter) {
            case FILTER_PLAYLIST:
                id = items[i].id.playlistId;
                break;
            case FILTER_VIDEO:
                id = items[i].id.videoId;
                break;
            case FILTER_CHANNEL:
                id = items[i].id.channelId;
                break;
        }
        details = connection.escape(JSON.stringify(items[i]));
        if(existingStatusIds.indexOf(id) !== -1){
            updateQuery += `UPDATE ${TABLE_NAME_SEARCH} SET search_result = ${details} where item_id = '${id}' and query = ${q} and filter = ${filterEscaped};`;
        } else {
            insertQuery += `INSERT INTO ${TABLE_NAME_SEARCH} ( item_id, search_result, query, filter ) VALUES ('${id}', ${details}, ${q}, ${filterEscaped});`;
        }
    }
    connection.query(updateQuery+insertQuery, callback);
}