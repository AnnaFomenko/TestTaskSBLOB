var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var index = require('./routes')
var db = require('./modules/database');
var facebook = require('./modules/facebook');
var twitter = require('./modules/twitter');
var spotify = require('./modules/spotify');
var youtube = require('./modules/youtube');
var config = require("./config");



var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



db.init(function(err, connection){
    if(err){
        console.error('INIT db: ' + err.message);
    } else {
        facebook.init(connection);
        twitter.init(connection,{ consumer_key: config.get('twitter:consumer_key')
            , consumer_secret: config.get('twitter:consumer_secret')
            , app_only_auth: true});
        spotify.init(connection);
        youtube.init(connection);

        //test
        facebook.updateProfile(901526266540071,'EAACEdEose0cBAPBqal0U1XRXAfke34IWc81zFbPZC2UYVyDLlwg6wdXwC485ZBL8dZAC7tbqruOfe5NzLC0rJYIl7wuTdQgSri8dflbxIyelcl74TWvg2J3M7TCJpOSBiJahCXvQjMaljI2cNA8gIEtOaxYiwNcgMgNsvFYsRSwZAjkyM2n1Wdq57MpORm4ZD',  function(id){
            console.log('facebook idOfSavedProfile='+id);
        });
        twitter.updateProfile('884356029798023173','VxfmLdJvZaUpOie5O9ju8sdrn6pVuUf', function(id){
            console.log('twitter idOfSavedProfile='+id);
       });
        youtube.updateProfile(950780794386,'AIzaSyC-naga23QqSpzBCdPpx792q4l4Pk5_9Wg', function(id){
            console.log('youtube idOfSavedProfile='+id);
        });
        spotify.updateProfile('0TnOYISbd1XYRBk9myaseg','BQASjMvz2tsDOeTBGF3o-FYO16V9NNLNkSUVR5ZXMEXV6fByNnuqXyQo_NohnJpXPmXhJYR0mpQowczs6e4U_tPkSpTIMObgkbwNNMCZqLXEcr9-rbdp329EwR0IZ54x25Hwpr1Rdc6LT9dfuCJtO8Fsozo_Tvo', function(id){
            console.log('spotify idOfSavedProfile='+id);
        })

    }
});

module.exports = app;
