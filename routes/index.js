var express = require('express');
var router = express.Router();
var facebook = require('../modules/facebook');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Login To Facebook'})
});

router.get('/auth/facebook', function(req, res, next) {
    facebook.auth(req, res, next);
});

router.get('/update', function(req, res, next) {
    facebook.updateprofile(req, res, next);
});

router.get('/delete', function(req, res, next) {
    facebook.deleteprofile(req, res, next);
});

module.exports = router;
