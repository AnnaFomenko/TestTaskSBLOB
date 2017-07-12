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
        //facebook.updateProfile(901526266540071,'EAACEdEose0cBAKdyJUgsZCIb677sl7TWbHl5JrIEZBk15l82r6ArHh5DYz3LZCZAC39YidvePW1oD1Av4wx4lyb3epUiAeYQzZBgaRk7fyeQcZAIZARj2AYPyZBYueFb6aJkAEBXZCKa8WNzhio4Dss78jD0Swm2q7c6uPq5BG7LimrGSU9g1TVBJZAnocfELa658ZD',  function(err, id){
            //console.log('facebook err='+err);
            //console.log('facebook idOfSavedProfile='+id);
        //});
        //facebook.updatePosts(901526266540071, 'EAACEdEose0cBAMLYb2D6TQkAsLjhAFlXrvm2rU1YnsAVuLdeoR6ZBAxHzZCGJZB9K1eJYn2PhpkWHftukX500sSxahGF45RBhAuEeh185JhZAkVSQTbw2LAzScAS6qMcuW3cAB9cmiBEwAGRBjdxsi1W38EcZBT78ZA7Qo1YVcPgw49wtWwv6PiNAaZA6TsgfUZD', true, function(err, id){
            //console.log('facebook err='+err);
            //console.log('facebook idOfSavedProfile='+id);
       // });
       // twitter.updateProfile('884356029798023173','VxfmLdJvZaUpOie5O9ju8sdrn6pVuUf', function(err, id){
            //console.log('twitter idOfSavedProfile='+id);
       //});
        //twitter.updatePosts('884356029798023173','VxfmLdJvZaUpOie5O9ju8sdrn6pVuUf', true, function(err, id){
            //console.log('twitter err='+err);
            //console.log('twitter idOfSavedProfile='+id);
        //});
        youtube.updateProfile('UC_x5XG1OV2P6uZZ5FSM9Ttw','AIzaSyC-naga23QqSpzBCdPpx792q4l4Pk5_9Wg', function(err, id){
            console.log('youtube err='+err);
            console.log('youtube idOfSavedProfile='+id);
        });
        youtube.updatePosts('UC_x5XG1OV2P6uZZ5FSM9Ttw', 'AIzaSyC-naga23QqSpzBCdPpx792q4l4Pk5_9Wg', true, function(err, id){
            console.log('youtube err='+err);
            console.log('youtube idOfSavedProfile='+id);
        });
        //spotify.updateProfile('0TnOYISbd1XYRBk9myaseg','BQBSGQ3hcIKRmHXTelidpMexS7HaQK9LRDTAMWINxk4eUJKEv8s4rd7-LXjTlh7V_id3_4sH7jUWidLKUi7RqVihGkhIGktFbaWsrgPer0gMAhdAr1zG8mxkW6yYyWvN-In_vMX9NvBdVzoTmB9EIKbso_bvUQg', function(err, id){
             //console.log('spotify err='+err);
             //console.log('spotify idOfSavedProfile='+id);
        //});
        //spotify.updatePosts('0TnOYISbd1XYRBk9myaseg','BQBSGQ3hcIKRmHXTelidpMexS7HaQK9LRDTAMWINxk4eUJKEv8s4rd7-LXjTlh7V_id3_4sH7jUWidLKUi7RqVihGkhIGktFbaWsrgPer0gMAhdAr1zG8mxkW6yYyWvN-In_vMX9NvBdVzoTmB9EIKbso_bvUQg', false, function(err, id){
            //console.log('spotify err='+err);
            //console.log('spotify idOfSavedProfile='+id);
        //})


    }
});

module.exports = app;
