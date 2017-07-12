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

        facebook.updateProfile('berniesanders','EAACEdEose0cBACqd2kYYy75cES0nN09EXcUzYcYSIIVtGPdCB35SZAgD1aqVMqRtlpleHAzMfV2NaMqiCXmm1xBUpsyhCwAyQrmZAQqKUSCmcDPzzi7RVENj9zh8T0QoFfAuFH1Ifntj5XYgqsRbSrK11IounZAQgSaKCctcHCI4LEA9rHN4AuezAHjpqgZD',  function(err, id){
            if(err){
                console.log('facebook updateProfile err='+err);
            } else {
                console.log('facebook updateProfile userId='+id);
            }
        });
        facebook.updatePosts('901526266540071', 'EAACEdEose0cBAPXQEpIEDafKrLvPCREbQvEX1THz2z0WeZAHoVUVa5Dv7J7pso8A4odYk58Q1NsZCc9AX9m0ZCQ59083aJ3eeZC6KNOsZCxFZCbqEvzQeLzniwTvbGm0XkeUgVN3gTEyPVvrCLz0DczEBcpTbDVgqgjNrwFuK5WdvdTZBZByxs5jPyKNxcBHtH8ZD', false, function(err, id){
            if(err){
                console.log('facebook updatePosts err='+err);
            } else {
                console.log('facebook updatePosts userId='+id);
            }
        });

        twitter.updateProfile({screen_name:'AnnaFomenko4'},'VxfmLdJvZaUpOie5O9ju8sdrn6pVuUf', function(err, options){
            if(err){
                console.log('twitter updateProfile err='+err);
            } else {
                console.log('twitter updateProfile user='+JSON.stringify(options));
            }
        });
        twitter.updatePosts('884356029798023173','VxfmLdJvZaUpOie5O9ju8sdrn6pVuUf', false, function(err, id){
            if(err){
                console.log('twitter updatePosts err='+err);
            } else {
                console.log('twitter updatePosts user='+id);
            }
        });

        youtube.updateProfile({id:'UC_x5XG1OV2P6uZZ5FSM9Ttw'},'AIzaSyC-naga23QqSpzBCdPpx792q4l4Pk5_9Wg', function(err, options){
            if(err){
                console.log('youtube updateProfile err='+err);
            } else {
                console.log('youtube updateProfile user='+JSON.stringify(options));
            }
        });
        youtube.updatePosts('UC_x5XG1OV2P6uZZ5FSM9Ttw', 'AIzaSyC-naga23QqSpzBCdPpx792q4l4Pk5_9Wg', false, function(err, id){
            if(err){
                console.log('youtube updatePosts err='+err);
            } else {
                console.log('youtube updatePosts userId='+id);
            }
        });

        spotify.updateProfile('0TnOYISbd1XYRBk9myaseg','BQBSGQ3hcIKRmHXTelidpMexS7HaQK9LRDTAMWINxk4eUJKEv8s4rd7-LXjTlh7V_id3_4sH7jUWidLKUi7RqVihGkhIGktFbaWsrgPer0gMAhdAr1zG8mxkW6yYyWvN-In_vMX9NvBdVzoTmB9EIKbso_bvUQg', function(err, id){
            if(err){
                console.log('spotify updateProfile err ='+err);
            } else {
                console.log('spotify updateProfile userId='+id);
            }
        });
        spotify.updatePosts('0TnOYISbd1XYRBk9myaseg','BQBSGQ3hcIKRmHXTelidpMexS7HaQK9LRDTAMWINxk4eUJKEv8s4rd7-LXjTlh7V_id3_4sH7jUWidLKUi7RqVihGkhIGktFbaWsrgPer0gMAhdAr1zG8mxkW6yYyWvN-In_vMX9NvBdVzoTmB9EIKbso_bvUQg', false, function(err, id){
            if(err){
                console.log('spotify updatePosts err ='+err);
            } else {
                console.log('spotify updatePosts userId='+id);
            }
        })


    }
});

module.exports = app;
