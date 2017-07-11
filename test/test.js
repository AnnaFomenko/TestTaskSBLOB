var assert = require('assert');
var chai  = require("chai");
var request = require("request");
var facebook = require('../modules/facebook');
var config = require("../config");
var graph = require("fbgraph");

describe('Facebook', function() {
    before(function (done) {
        done()
    });
    describe('login to facebook', function() {
        var url = "http://localhost:3000/auth/facebook";
        var authUrl = graph.getOauthUrl({
            "client_id": config.get("facebook:client_id"),
            "redirect_uri":  config.get("facebook:redirect_uri"),
            "scope":['email', 'user_friends', 'user_posts', 'user_photos']
        });

        it("redirect to facebook", function(done) {
            request(url, function(error, response, body) {
                chai.expect(response.statusCode).to.equal(200);
                chai.expect('Location', authUrl);
                done();
            });
        });
    });

    var access_token='EAAb5py6eK2oBAJuJ6YZA3Lk6q0DZCr3VWc8Pgrk3QZBJw7vIeJW1bUXGu2OOTifgrAwWyaqQDeIGvfbKGhbg4lAAoU71qO20rYnuFy95GvhfkHCZBFe5ffjWMtRbOyrPYKNHq4rHUn5OJrj1sadfd40tSM9gcfAoqLmcWN5f5QZDZD'

    describe('update user profile', function() {
        var url = "http://localhost:3000/update?access_token="+access_token;
        it("successfull update user profile", function(done) {
            request(url, function(error, response, body) {
                var objbody = JSON.parse(response.body);
                chai.expect(response.statusCode).to.equal(200);
                chai.expect(objbody).have.property('result');
                chai.expect(objbody.result).to.equal('User profile was updated successfully');
                done();
            });
        });
    });

    describe('update user profile without access_token', function() {
        var url = "http://localhost:3000/update";
        it("unsuccessfull update user profile", function(done) {
            request(url, function(error, response, body) {
                var objbody = JSON.parse(response.body);
                chai.expect(response.statusCode).to.equal(400);
                chai.expect(objbody).have.property('error');
                chai.expect(objbody.error).to.equal('access_token is not provided');
                done();
            });
        });
    });

    describe('delete user profile', function() {
        var url = "http://localhost:3000/delete?access_token="+access_token;
        it("successfull delete user profile", function(done) {
            request(url, function(error, response, body) {
                var objbody = JSON.parse(response.body);
                chai.expect(response.statusCode).to.equal(200);
                chai.expect(objbody).have.property('result');
                chai.expect(objbody.result).to.equal('User profile was deleted successfully');
                done();
            });
        });
    });
    describe('delete user profile without access_token', function() {
        var url = "http://localhost:3000/delete";
        it("unsuccessfull delete user profile", function(done) {
            request(url, function(error, response, body) {
                var objbody = JSON.parse(response.body);
                chai.expect(objbody).have.property('error');
                chai.expect(objbody.error).to.equal('access_token is not provided');
                chai.expect(response.statusCode).to.equal(400);
                done();
            });
        });
    });
});