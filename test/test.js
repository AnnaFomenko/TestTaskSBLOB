const chai  = require("chai");
const data = require('./testdata.json');
const facebook = require('../modules/facebook');
const twitter = require('../modules/twitter');
const spotify = require('../modules/spotify');
const youtube = require('../modules/youtube');
const db = require('../modules/database');
const errors = require('../modules/errors');

before(function (done) {
    db.init(function (err, connection) {
        if (err) {
            console.error('INIT db: ' + err.message);
        } else {
            done();
        }

    });
});
describe('Facebook Module', function() {
    describe('updateProfile', function() {
        it("by page", function(done) {
            facebook.updateProfile(data.facebook.page, data.facebook.token,  function(err, id){
                if(err){
                    chai.expect(err).to.have.property('message');
                } else {
                    chai.expect(id).to.equal(data.facebook.page);
                }
                done();
            });
        });
        it("by user_id", function(done) {
            facebook.updateProfile(data.facebook.user_id, data.facebook.token,  function(err, id){
                if(err){
                    chai.expect(err).to.have.property('message');
                } else {
                    chai.expect(id).to.equal(data.facebook.user_id);
                }
                done();
            });
        });
    });
    describe('updatePosts', function() {
        it("all is true", function(done) {
            this.timeout(15000);
            facebook.updatePosts(data.facebook.user_id, data.facebook.token, true,  function(err, id){
                if(err){
                    chai.expect(err).to.have.property('message');
                } else {
                    chai.expect(id).to.equal(data.facebook.user_id);
                }
                done();
            });
        });
        it("all is false", function(done) {
            facebook.updatePosts(data.facebook.user_id, data.facebook.token, false, function(err, id){
                if(err){
                    chai.expect(err).to.have.property('message');
                } else {
                    chai.expect(id).to.equal(data.facebook.user_id);
                }
                done();
            });
        });
    });
    describe('search', function() {
        it("by page", function(done) {
            facebook.search('hot summer', facebook.searchFilter.PAGE , 0,  10, data.facebook.token,  function(err, result){
                if(err){
                    chai.expect(err).to.have.property('message');
                } else {
                    chai.expect(result).to.be.an('array');
                }
                done();
            });
        });
        it("by user", function(done) {
            facebook.search('batman', facebook.searchFilter.USER , 3,  5, data.facebook.token, function(err, result){
                if(err){
                    chai.expect(err).to.have.property('message');
                } else {
                    chai.expect(result).to.be.an('array');
                }
                done();
            });
        });
        it("by group", function(done) {
            facebook.search('programmers', facebook.searchFilter.GROUP , 10,  15, data.facebook.token, function(err, result){
                if(err){
                    chai.expect(err).to.have.property('message');
                } else {
                    chai.expect(result).to.be.an('array')//.that.is.not.empty;
                }
                done();
            });
        });
        it("test itemsPerPage less or equal 0", function(done) {
            facebook.search('hot summer', facebook.searchFilter.PAGE , 10,  0, data.facebook.token,  function(err, result){
                chai.expect(err).to.have.property('message');
                chai.expect(err).to.equal(errors.itemsPerPage);
                done();
            });
        });
        it("test search invalid filter", function(done) {
            facebook.search('hot summer', 'filter' , 10,  10,  data.facebook.token,  function(err, result){
                chai.expect(err).to.have.property('message');
                chai.expect(err).to.equal(errors.invalidSearchFilter);
                done();
            });
        });
        it("test invalid access_token", function(done) {
            facebook.search('hot summer', facebook.searchFilter.PAGE, 10,  10,  'mock token',  function(err, result){
                chai.expect(err).to.have.property('message');
                chai.expect(err).to.have.property('code');
                chai.expect(err.code).to.equal(190);
                done();
            });
        });
    });
});

//spotify
describe('Spotify Module', function() {
    describe('updateProfile', function() {
        it("by user_id", function(done) {
            spotify.updateProfile(data.spotify.user_id, data.spotify.token,  function(err, id){
                if(err){
                    chai.expect(err).to.have.property('message');
                } else {
                    chai.expect(id).to.equal(data.spotify.user_id);
                }
                done();
            });
        });
    });
    describe('updatePosts', function() {
        it("all is true", function(done) {
            this.timeout(15000);
            spotify.updatePosts(data.spotify.user_id, data.spotify.token, true,  function(err, id){
                if(err){
                    chai.expect(err).to.have.property('message');
                } else {
                    chai.expect(id).to.equal(data.spotify.user_id);
                }
                done();
            });
        });
        it("all is false", function(done) {
            spotify.updatePosts(data.spotify.user_id, data.spotify.token, false, function(err, id){
                if(err){
                    chai.expect(err).to.have.property('message');
                } else {
                    chai.expect(id).to.equal(data.spotify.user_id);
                }
                done();
            });
        });
    });
    describe('search', function() {
        it("by playlist", function(done) {
            spotify.search('hot summer', spotify.searchFilter.PLAYLIST , 0,  10, data.spotify.token,  function(err, result){
                if(err){
                    chai.expect(err).to.have.property('message');
                } else {
                    chai.expect(result).to.be.an('array');
                }
                done();
            });
        });
        it("by artist", function(done) {
            facebook.search('batman', spotify.searchFilter.ARTIST , 3,  5, data.spotify.token, function(err, result){
                if(err){
                    chai.expect(err).to.have.property('message');
                } else {
                    chai.expect(result).to.be.an('array');
                }
                done();
            });
        });
        it("by track", function(done) {
            spotify.search('programmers', spotify.searchFilter.TRACK , 10,  15, data.spotify.token, function(err, result){
                if(err){
                    chai.expect(err).to.have.property('message');
                } else {
                    chai.expect(result).to.be.an('array')//.that.is.not.empty;
                }
                done();
            });
        });
        it("test itemsPerPage less or equal 0", function(done) {
            spotify.search('hot summer', spotify.searchFilter.PLAYLIST , 10,  0, data.spotify.token,  function(err, result){
                chai.expect(err).to.have.property('message');
                chai.expect(err).to.equal(errors.itemsPerPage);
                done();
            });
        });
        it("test search invalid filter", function(done) {
            spotify.search('hot summer', 'filter' , 10,  10,  data.spotify.token,  function(err, result){
                chai.expect(err).to.have.property('message');
                chai.expect(err).to.equal(errors.invalidSearchFilter);
                done();
            });
        });
        it("test invalid access_token", function(done) {
            spotify.search('hot summer', spotify.searchFilter.ARTIST, 10,  10,  'mock token',  function(err, result){
                chai.expect(err).to.have.property('message');
                chai.expect(err.message).to.equal('Invalid access token');
                done();
            });
        });
    });
});

//twiitter
describe('Twitter Module', function() {
    describe('updateProfile', function() {
        it("by screen_name", function(done) {
            twitter.updateProfile({screen_name:data.twitter.screen_name}, null,  function(err, result){
                if(err){
                    chai.expect(err).to.have.property('message');
                } else {
                    chai.expect(result).to.have.property('screen_name');
                    chai.expect(result.screen_name).to.equal(data.twitter.screen_name);
                }
                done();
            });
        });
        it("by user_id", function(done) {
            twitter.updateProfile({user_id:data.twitter.user_id}, null,  function(err, result){
                if(err){
                    chai.expect(err).to.have.property('message');
                } else {
                    chai.expect(result).to.have.property('user_id');
                    chai.expect(result.user_id).to.equal(data.twitter.user_id);
                }
                done();
            });
        });
    });
    describe('updatePosts', function() {
        it("all is true", function(done) {
            this.timeout(15000);
            twitter.updatePosts(data.twitter.user_id, data.twitter.token, true,  function(err, id){
                if(err){
                    chai.expect(err).to.have.property('message');
                } else {
                    chai.expect(id).to.equal(data.twitter.user_id);
                }
                done();
            });
        });
        it("all is false", function(done) {
            twitter.updatePosts(data.twitter.user_id, data.twitter.token, false, function(err, id){
                if(err){
                    chai.expect(err).to.have.property('message');
                } else {
                    chai.expect(id).to.equal(data.twitter.user_id);
                }
                done();
            });
        });
    });
    describe('search', function() {
        it("by playlist", function(done) {
            twitter.search('hot summer', twitter.searchFilter.TWEET , 0,  10, data.twitter.token,  function(err, result){
                if(err){
                    chai.expect(err).to.have.property('message');
                } else {
                    chai.expect(result).to.be.an('array');
                }
                done();
            });
        });
        it("by artist", function(done) {
            twitter.search('batman', twitter.searchFilter.USER , 3,  5, {token:data.twitter.token, secret_token:data.twitter.secret_token}, function(err, result){
                if(err){
                    chai.expect(err).to.have.property('message');
                } else {
                    chai.expect(result).to.be.an('array');
                }
                done();
            });
        });
        it("test itemsPerPage less or equal 0", function(done) {
            twitter.search('hot summer', twitter.searchFilter.TWEET , 10,  0, null,  function(err, result){
                chai.expect(err).to.have.property('message');
                chai.expect(err).to.equal(errors.itemsPerPage);
                done();
            });
        });
        it("test search invalid filter", function(done) {
            twitter.search('hot summer', 'filter' , 10,  10,  null,  function(err, result){
                chai.expect(err).to.have.property('message');
                chai.expect(err).to.equal(errors.invalidSearchFilter);
                done();
            });
        });
        it("test invalid access_token", function(done) {
            twitter.search('hot summer', twitter.searchFilter.USER, 10,  10,  'mock token',  function(err, result){
                chai.expect(err).to.have.property('message');
                chai.expect(err.message).to.equal('Invalid token');
                done();
            });
        });
    });
});

//youtube
describe('Youtube Module', function() {
    describe('updateProfile', function() {
        it("by username", function(done) {
            youtube.updateProfile({forUsername:data.youtube.forUsername}, data.youtube.token,  function(err, result){
                if(err){
                    chai.expect(err).to.have.property('message');
                } else {
                    chai.expect(result).to.equal(data.youtube.user_id);
                }
                done();
            });
        });
        it("by user_id", function(done) {
            youtube.updateProfile({id:data.youtube.user_id}, data.youtube.token,  function(err, result){
                if(err){
                    chai.expect(err).to.have.property('message');
                } else {
                    chai.expect(result).to.equal(data.youtube.user_id);
                }
                done();
            });
        });
    });
    describe('updatePosts', function() {
        it("all is true", function(done) {
            this.timeout(25000);
            youtube.updatePosts(data.youtube.user_id, data.youtube.token, true,  function(err, id){
                if(err){
                    chai.expect(err).to.have.property('message');
                } else {
                    chai.expect(id).to.equal(data.youtube.user_id);
                }
                done();
            });
        });
        it("all is false", function(done) {
            youtube.updatePosts(data.youtube.user_id, data.youtube.token, false, function(err, id){
                if(err){
                    chai.expect(err).to.have.property('message');
                } else {
                    chai.expect(id).to.equal(data.youtube.user_id);
                }
                done();
            });
        });
    });
    describe('search', function() {
        this.timeout(25000);
        it("by playlist", function(done) {
            youtube.search('hot summer', youtube.searchFilter.PLAYLIST , 0,  10, data.youtube.token,  function(err, result){
                if(err){
                    chai.expect(err).to.have.property('message');
                } else {
                    chai.expect(result).to.be.an('array');
                }
                done();
            });
        });
        it("by artist", function(done) {
            youtube.search('batman', youtube.searchFilter.CHANNEL , 3,  5, data.youtube.token, function(err, result){
                if(err){
                    chai.expect(err).to.have.property('message');
                } else {
                    chai.expect(result).to.be.an('array');
                }
                done();
            });
        });
        it("by video", function(done) {
            youtube.search('batman', youtube.searchFilter.VIDEO , 3,  5, data.youtube.token, function(err, result){
                if(err){
                    chai.expect(err).to.have.property('message');
                } else {
                    chai.expect(result).to.be.an('array');
                }
                done();
            });
        });
        it("test itemsPerPage less or equal 0", function(done) {
            youtube.search('hot summer', youtube.searchFilter.CHANNEL , 10,  0, null,  function(err, result){
                chai.expect(err).to.have.property('message');
                chai.expect(err).to.equal(errors.itemsPerPage);
                done();
            });
        });
        it("test search invalid filter", function(done) {
            twitter.search('hot summer', 'filter' , 10,  10,  null,  function(err, result){
                chai.expect(err).to.have.property('message');
                chai.expect(err).to.equal(errors.invalidSearchFilter);
                done();
            });
        });
        it("test invalid access_token", function(done) {
            youtube.search('hot summer', youtube.searchFilter.VIDEO, 10,  10,  'mock token',  function(err, result){
                chai.expect(err).to.have.property('message');
                chai.expect(err.message).to.equal('Invalid token');
                done();
            });
        });
    });
});