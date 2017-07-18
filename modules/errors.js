module.exports = {
    profileNotExist: new Error('Profile is not exist'),
    emptyResult: new Error('Result is empty'),
    invalidSearchFilter: new Error('Invalid search filter'),
    itemsPerPage: new Error('Number of items per page is bigger MAX_SEARCH_LIMIT for current platform'),
    invalidToken: new Error('Invalid token'),
};