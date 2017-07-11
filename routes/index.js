var express = require('express');
var router = express.Router();
var facebook = require('../modules/facebook');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Welcome'})
});


module.exports = router;
