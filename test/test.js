const chai  = require("chai");
const data = require('./testdata.json');
const facebook = require('../modules/facebook');
const twitter = require('../modules/twitter');
const spotify = require('../modules/spotify');
const youtube = require('../modules/youtube');
const db = require('../modules/database');
const errors = require('../modules/errors');

describe('Facebook Module', function() {
    before(function (done) {
        db.init(function (err, connection) {
            if (err) {
                console.error('INIT db: ' + err.message);
            } else {
                done();
            }

        });
    });
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