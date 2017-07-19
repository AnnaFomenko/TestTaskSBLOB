const config = require("../config");
const db = require("./database");
const errors = require("./errors");
const utils = require("./utils");
const request = require("request");
const twit = require("twit");
const moment = require("moment");
const TABLE_NAME_PROFILE = config.get('twitter:table_name_profile');
const TABLE_NAME_POST = config.get('twitter:table_name_post');
const twitter  = new twit({ consumer_key: config.get('twitter:consumer_key')
                          , consumer_secret: config.get('twitter:consumer_secret')
                          , app_only_auth: true});
const POSTS_LIMIT = 50;
//search
const MAX_SEARCH_TWEET_LIMIT = 50;
const MAX_SEARCH_USER_LIMIT = 20;
const FILTER_USER = 'user';
const FILTER_TWEET = 'tweet';

exports.searchFilter = {
    TWEET: FILTER_TWEET,
    USER: FILTER_USER
};

exports.updateProfile = function (options, token, next) {
    options.access_token = token;
    profile(options, next);
};

exports.updatePosts = function (user_id, token, all, next) {
    let max_id = 0;
    posts(user_id, token, all, max_id, next);
};


exports.search = function (q, filter, page, itemsPerPage, tokens, next) {
    let userAuthTwitter = null;
    if(filter === FILTER_USER){
        if(tokens instanceof Object && tokens.token && tokens.token_secret){
            userAuthTwitter  = new twit({ consumer_key: config.get('twitter:consumer_key')
                , consumer_secret: config.get('twitter:consumer_secret')
                , access_token: tokens.token
                , access_token_secret: tokens.token_secret});
        } else {
            return next(errors.invalidToken)
        }
    }
    search(q, filter, page, itemsPerPage, next, userAuthTwitter);
};

//profile
function profile (options, next) {
    twitter.get('users/show', options, function(err, result) {
        if(err){
            if(err.code === 50){
                return deleteData (options, next);
            }
            return next(err);
        }
        if(!result){
            return next(errors.emptyResult);
        }
        addOrUpdateData(options, result, next);
    });
}

//add or update existing user profile
function addOrUpdateData ( options, details, next ) {
    const name = details.name;
    const id_str = details.id_str;
    const id = details.id;
    const screen_name = details.screen_name;

    let lastGetPosts = (details.status) ? details.status.created_at : null;
    if(lastGetPosts){
        lastGetPosts = new Date(lastGetPosts);
    }
    const connection = db.getConnection();
    connection.query(`SELECT id_str from ${TABLE_NAME_PROFILE}  WHERE id_str = ?`, id_str, function(err, result){
        if(err){
            return next(err);
        }
        details = JSON.stringify(details);
        if(result && result.length > 0){
            connection.query(`UPDATE ${TABLE_NAME_PROFILE} SET detail_json = ?, lastGetPosts = ? where id_str = ?;`,[details, lastGetPosts, id_str]
                , function(err){
                      if(err){
                          return next(err);
                      }
                     next(null, options);
                });
        } else {
            connection.query(`INSERT INTO ${TABLE_NAME_PROFILE} ( id_str, id, name, screen_name, detail_json, lastGetPosts ) VALUES (?, ?, ?, ?, ?, ?);`, [ id_str, id, name, screen_name, details, lastGetPosts]
                , function(err){
                if(err){
                    return next(err);
                }
                next(null, options);
            });
        }
    });
}

//delete user profile
function deleteData (options, next) {
    let param = options.user_id ? options.user_id : options.screen_name;
    let paramName = options.user_id ? 'id_str' : 'screen_name';
    const connection = db.getConnection();
    connection.query(`SELECT id_str from ${TABLE_NAME_PROFILE} WHERE ${paramName} = ?`, param, function(err, result){
        if(err){
            return next(err);
        }
        if(result && result.length > 0){
            connection.query(`DELETE from ${TABLE_NAME_PROFILE} WHERE ${paramName} = ?`,  param, function (err) {
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
function posts (user_id, token, all, max_id, next) {
    let postIds = [];
    let existingPostIds = [];
    getNextPosts(user_id, token, max_id, function(err, result){
        if (err) {
            return next(err);
        }
        if(!result) {
            return next(errors.emptyResult);
        }
        let data = result;
        if(data.length > 0){
            let currentMaxId = data[data.length-1].id_str;
            max_id = (max_id === currentMaxId) ? 0 : currentMaxId;
            if(max_id === 0){
                return next(null, user_id);
            }
            for(let i = data.length-1; i >= 0 ; i--){
                if(postIds.indexOf(data[i].id_str) !== -1){
                    data.splice(i, 1);
                    continue;
                }
                postIds.push(data[i].id_str);
            }
        }
        if(postIds.length === 0){
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
                        return next(err);
                    }
                    if( all || existingPostIds.length < data.length){
                        if(max_id > 0) {
                            posts( user_id, token, all, max_id, next )
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

function getNextPosts(user_id, token, max_id, callback){
    let params = { user_id: user_id };
    params.include_rts = 1;
    params.count = POSTS_LIMIT;
    params.access_token = token;
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
    user_id = connection.escape(user_id);
    for(let i = 0; i < posts.length; i++){
        id = posts[i].id;
        id_str = posts[i].id_str;
        details =  connection.escape(JSON.stringify(posts[i]));
        textcontent = connection.escape(posts[i].text);
        if(existingPostIds.indexOf(id_str) !== -1){
            updateQuery += `UPDATE ${TABLE_NAME_POST} SET detail_json = ${details}, textcontent = ${textcontent}, user_id = ${user_id} where id_str = '${id_str}';`;
        } else {
            insertQuery += `INSERT INTO ${TABLE_NAME_POST} ( id_str, id, detail_json, textcontent, user_id ) VALUES ('${id_str}', ${id}, ${details}, ${textcontent}, ${user_id});`;
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

//search
function search (q, filter, page, itemsPerPage, next, userAuthTwitter) {
    if((itemsPerPage > MAX_SEARCH_TWEET_LIMIT && filter === FILTER_TWEET) || ((itemsPerPage > MAX_SEARCH_USER_LIMIT && filter === FILTER_USER))  || itemsPerPage <= 0){
        return next(errors.itemsPerPage);
    }
    switch(filter){
        case FILTER_USER:
            searchByUsers(q, page, itemsPerPage, next, userAuthTwitter);
            break;
        case FILTER_TWEET:
            let itemsCount = 0;
            let commonResult = [];
            let searchResults = [];
            searchByTweets(q, page, itemsPerPage, next, null, itemsCount, commonResult, searchResults);
            break;
        default:
            next(errors.invalidSearchFilter);
   }
}

function searchByTweets (q, page, itemsPerPage, next, nextResult, itemsCount, commonResult, searchResults) {
    getOnePage(q, nextResult, function(err, result, nextResult){
        if(err){
            return next(err);
        }
        itemsCount += MAX_SEARCH_TWEET_LIMIT;
        if(result && result.statuses){
            commonResult = [].concat(...commonResult).concat(...result.statuses);
        }
        let count = (page + 1)*itemsPerPage;
        let startIndex = 0;
        let endIndex = 0;
        if(itemsCount >= count){
            startIndex = page*itemsPerPage;
            endIndex = count;
            if(commonResult.length < startIndex){
                searchResults = commonResult.slice(0, commonResult.length);
            } else if(commonResult.length < endIndex){
                searchResults = commonResult.slice(startIndex, commonResult.length);
            } else if(commonResult.length > endIndex){
                searchResults = commonResult.slice(startIndex, endIndex);
            }
            next(null, searchResults);
        } else if(nextResult) {
            searchByTweets (q, page, itemsPerPage, next, nextResult, itemsCount, commonResult, searchResults);
        } else {
            if(commonResult.length/itemsPerPage > page){
                startIndex = itemsPerPage*page + commonResult.length%itemsPerPage;
                searchResults = commonResult.slice(startIndex, commonResult.length);
            }
            next(null, searchResults);
        }
    });
}

function getOnePage (q, nextResult, callback) {
    let existingStatusIds = [];
    let params = {q: q, count: MAX_SEARCH_TWEET_LIMIT, result_type:'mixed', include_entities:0};
    if(nextResult){
        nextResult = utils.parseQuery(nextResult);
        params.max_id = nextResult.max_id;
    }
    twitter.get('search/tweets', params, function(err, result) {
        if(err){
            return callback(err);
        }
        if(!result){
            return callback(errors.emptyResult);
        }
        nextResult = (result.search_metadata && result.search_metadata.next_results) ? result.search_metadata.next_results : null;
        let statusIds = [];
        for(let i = result.statuses.length-1; i >= 0 ; i--){
            if(statusIds.indexOf(result.statuses[i].id_str) !== -1){
                result.statuses.splice(i, 1);
                continue;
            }
            statusIds.push(result.statuses[i].id_str);
        }
        callback(null, result, nextResult);
        if(statusIds.length>0){
            checkExistingItems(FILTER_TWEET, statusIds, function(err, results){
                if(err){
                    return console.error(err);
                }
                if(results && results.length>0) {
                    for (let i = 0; i < results.length; i++) {
                        existingStatusIds.push(results[i].id_str);
                    }
                }
                addSearchItems(FILTER_TWEET , result.statuses, existingStatusIds, function(err){
                    if(err){
                        console.error(err);
                    }
                })
            });
        }
    });
}

function searchByUsers (q, page, itemsPerPage, next, userAuthTwitter) {
    let existingItemsIds = [];
    let searchResults = [];
    userAuthTwitter.get('users/search', { q: q, count: itemsPerPage, page: page }, function(err, result) {
        if(err){
            return next(err);
        }
        if(!result){
            return next(errors.emptyResult);
        }
        if(result.length > itemsPerPage){
            searchResults = result.slice(0, result[itemsPerPage]);
        } else {
            searchResults = result.slice(0, result.length);
        }
        next(null, searchResults);
        let itemsIds = [];
        for(let i = result.length-1; i >= 0 ; i--){
            if(itemsIds.indexOf(result[i].id_str) !== -1){
                result.splice(i, 1);
                continue;
            }
            itemsIds.push(result[i].id_str);
        }
        if(itemsIds.length>0){
            checkExistingItems(FILTER_USER, itemsIds, function(err, results){
                if(err){
                    return console.error(err);
                }
                if(results && results.length>0) {
                    for (let i = 0; i < results.length; i++) {
                        existingItemsIds.push(results[i].id_str);
                    }
                }
                addSearchItems(FILTER_USER, result, existingItemsIds, function(err){
                    if(err){
                        console.error(err);
                    }
                })
            });
        }
    });
}

function checkExistingItems (filter, itemsIds, callback) {
    const connection = db.getConnection();
    switch (filter){
        case FILTER_TWEET:
            checkExistingPosts(itemsIds, callback);
            break;
        case FILTER_USER:
            connection.query(`SELECT id_str from ${TABLE_NAME_PROFILE} WHERE id_str in ( ${'\''+ itemsIds.join('\',\'')+'\''});`,
                function(err, result){
                    callback(err, result);
                });
            break;
    }
}

//add search items
function addSearchItems (filter, items, existingItemsIds, callback) {
    const connection = db.getConnection();
    let updateQuery = '';
    let insertQuery = '';
    let details;
    let id, id_str;
    let textcontent;
    let user_id = 0;
    let name, screen_name;
    let lastGetPosts;
    for(let i = 0; i < items.length; i++){
        id = items[i].id;
        id_str = items[i].id_str;
        details = connection.escape(JSON.stringify(items[i]));
        if(filter === FILTER_USER) {
            lastGetPosts = (items[i].status) ? items[i].status.created_at : null;
            lastGetPosts = moment(new Date(lastGetPosts)).format('YYYY-MM-DD HH:mm:ss');
            name = connection.escape(items[i].name);
            screen_name = connection.escape(items[i].screen_name);
            if (existingItemsIds.indexOf(id_str) !== -1) {
                updateQuery += `UPDATE ${TABLE_NAME_PROFILE} SET name = ${name}, screen_name = ${screen_name}, lastGetPosts = '${lastGetPosts}' where id_str = '${id_str}';`;
            } else {
                insertQuery += `INSERT INTO ${TABLE_NAME_PROFILE} ( id_str, id, name, screen_name, detail_json, lastGetPosts) VALUES ('${id_str}', ${id}, ${name}, ${screen_name}, ${details}, '${lastGetPosts}');`;
            }
        }
        if(filter === FILTER_TWEET) {
            textcontent = (items[i].text) ? connection.escape(items[i].text) : null;
            user_id = (items[i].user) ? items[i].user.id_str : 0;
            if (existingItemsIds.indexOf(id_str) !== -1) {
                updateQuery += `UPDATE ${TABLE_NAME_POST} SET textcontent = ${textcontent} where id_str = '${id_str}';`;
            } else {
                insertQuery += `INSERT INTO ${TABLE_NAME_POST} ( id_str, id, detail_json, textcontent, user_id ) VALUES ('${id_str}', ${id}, ${details}, ${textcontent}, ${user_id});`;
            }
        }
    }
    connection.query(updateQuery+insertQuery, callback);
}