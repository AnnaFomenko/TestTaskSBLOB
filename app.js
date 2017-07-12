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
        //test

        facebook.updateProfile(901526266540071,'EAACEdEose0cBALCl9wb2lcA92YWG3ANOxL4H17R4TRW157gCvqEobYUuJVPd3gktino0qNL4UaP0UEicS7He796IweQ9bf0N8bPMebfTliztPpZBdDLjY66i69YSa4UbLC67ZCkZCs0DDHTlTVPmD8yZCQwk5AqiC5FKPZBiQAO4G5ZAwV9gfiZAejm9q9RFloZD',  function(err, id){
            console.log('facebook updateProfile err='+err);
            console.log('facebook updateProfile userId='+id);
        });
        facebook.updatePosts(901526266540071, 'EAACEdEose0cBALCl9wb2lcA92YWG3ANOxL4H17R4TRW157gCvqEobYUuJVPd3gktino0qNL4UaP0UEicS7He796IweQ9bf0N8bPMebfTliztPpZBdDLjY66i69YSa4UbLC67ZCkZCs0DDHTlTVPmD8yZCQwk5AqiC5FKPZBiQAO4G5ZAwV9gfiZAejm9q9RFloZD', false, function(err, id){
            console.log('facebook updatePosts err='+err);
            console.log('facebook updatePosts userId='+id);
        });

        twitter.updateProfile({screen_name:'AnnaFomenko4'},'VxfmLdJvZaUpOie5O9ju8sdrn6pVuUf', function(err, options){
            console.log('twitter updateProfile err='+err);
            console.log('twitter updateProfile user='+JSON.stringify(options));
        });
        twitter.updatePosts({user_id:'884356029798023173'},'VxfmLdJvZaUpOie5O9ju8sdrn6pVuUf', false, function(err, options){
            console.log('twitter updatePosts err='+err);
            console.log('twitter updatePosts user='+JSON.stringify(options));
        });

        youtube.updateProfile('UC_x5XG1OV2P6uZZ5FSM9Ttw','AIzaSyC-naga23QqSpzBCdPpx792q4l4Pk5_9Wg', function(err, options){
            console.log('youtube updateProfile err='+err);
            console.log('youtube updateProfile user='+JSON.stringify(options));
        });
        youtube.updatePosts('UC_x5XG1OV2P6uZZ5FSM9Ttw', 'AIzaSyC-naga23QqSpzBCdPpx792q4l4Pk5_9Wg', false, function(err, options){
            console.log('youtube updatePosts err='+err);
            console.log('youtube updatePosts user='+JSON.stringify(options));
        });

        spotify.updateProfile('0TnOYISbd1XYRBk9myaseg','BQBSGQ3hcIKRmHXTelidpMexS7HaQK9LRDTAMWINxk4eUJKEv8s4rd7-LXjTlh7V_id3_4sH7jUWidLKUi7RqVihGkhIGktFbaWsrgPer0gMAhdAr1zG8mxkW6yYyWvN-In_vMX9NvBdVzoTmB9EIKbso_bvUQg', function(err, id){
            console.log('spotify updateProfile err ='+err);
            console.log('spotify updateProfile userId ='+id);
        });
        spotify.updatePosts('0TnOYISbd1XYRBk9myaseg','BQBSGQ3hcIKRmHXTelidpMexS7HaQK9LRDTAMWINxk4eUJKEv8s4rd7-LXjTlh7V_id3_4sH7jUWidLKUi7RqVihGkhIGktFbaWsrgPer0gMAhdAr1zG8mxkW6yYyWvN-In_vMX9NvBdVzoTmB9EIKbso_bvUQg', false, function(err, id){
            console.log('spotify updatePosts err ='+err);
            console.log('spotify updatePosts userId='+id);
        })


    }
});

module.exports = app;
