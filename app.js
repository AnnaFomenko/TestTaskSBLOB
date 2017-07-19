const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const index = require('./routes');
const db = require('./modules/database');
const facebook = require('./modules/facebook');
const twitter = require('./modules/twitter');
const spotify = require('./modules/spotify');
const youtube = require('./modules/youtube');
const config = require("./config");



const app = express();
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

       facebook.updateProfile('berniesanders','EAACEdEose0cBAD6Gwi5X56g0KTos3ZATcsRZCHYH8vHZAu8I8AeIUYJ9j6jVzpyKAkJYogSfR9Pm4zZBoopsYzreZAbmIbC4ZAMSeBzrXn6l2Fbni9F1KlPh2KTSMsGTWpo2PZBV6m4a6RvNeMuxRf2ZAD2aC2BVzLZByAEoZCYP8ssBMjwHAu8zhQ0RcNbSyFrbcZD',  function(err, id){
            if(err){
               console.log('facebook updateProfile err = '+err.message);
            } else {
                console.log('facebook updateProfile userId = '+id);
            }
        });
        facebook.updatePosts('901526266540071', 'EAACEdEose0cBAD6Gwi5X56g0KTos3ZATcsRZCHYH8vHZAu8I8AeIUYJ9j6jVzpyKAkJYogSfR9Pm4zZBoopsYzreZAbmIbC4ZAMSeBzrXn6l2Fbni9F1KlPh2KTSMsGTWpo2PZBV6m4a6RvNeMuxRf2ZAD2aC2BVzLZByAEoZCYP8ssBMjwHAu8zhQ0RcNbSyFrbcZD', false, function(err, id){
            if(err){
               console.log('facebook updatePosts err = '+err.message);
            } else {
                console.log('facebook updatePosts userId = '+id);
            }
        });

        facebook.search('hot summer', facebook.searchFilter.USER , 3,  10, 'EAACEdEose0cBAD6Gwi5X56g0KTos3ZATcsRZCHYH8vHZAu8I8AeIUYJ9j6jVzpyKAkJYogSfR9Pm4zZBoopsYzreZAbmIbC4ZAMSeBzrXn6l2Fbni9F1KlPh2KTSMsGTWpo2PZBV6m4a6RvNeMuxRf2ZAD2aC2BVzLZByAEoZCYP8ssBMjwHAu8zhQ0RcNbSyFrbcZD', function(err, result){
            if(err){
                console.log('facebook search err = '+err.message);
            } else {
                console.log('facebook search results = '+JSON.stringify(result));
            }
        });

        twitter.updateProfile({user_id:'3399477436'}, null, function(err, options){
            if(err){
                console.log('twitter updateProfile err = '+err.message);
            } else {
                console.log('twitter updateProfile user = '+JSON.stringify(options));
            }
        });
       twitter.updatePosts('884356029798023173', null, true, function(err, id){
            if(err){
                console.log('twitter updatePosts err = '+err.message);
            } else {
                console.log('twitter updatePosts user = '+id);
            }
        });
        twitter.search('summer', twitter.searchFilter.TWEET , 3,  5, {token:'884356029798023173-VxfmLdJvZaUpOie5O9ju8sdrn6pVuUf', token_secret:'XdeSQgs1UwBjy2bGgUftR4xBewhqnhfUOKD31lJA1ePci'}, function(err, result){
             if(err){
                console.log('twitter search err = '+err);
             } else {
                 console.log('twitter search result = '+JSON.stringify(result));
             }
        });
        youtube.updateProfile({id:'UC_x5XG1OV2P6uZZ5FSM9Ttw'},'AIzaSyC-naga23QqSpzBCdPpx792q4l4Pk5_9Wg', function(err, options){
            if(err){
                console.log('youtube updateProfile err = '+err.message);
            } else {
                console.log('youtube updateProfile user = '+JSON.stringify(options));
            }
        });
        youtube.updatePosts('UC_x5XG1OV2P6uZZ5FSM9Ttw', 'AIzaSyC-naga23QqSpzBCdPpx792q4l4Pk5_9Wg', false, function(err, id){
            if(err){
                console.log('youtube updatePosts err = '+err.message);
            } else {
                console.log('youtube updatePosts userId = '+id);
            }
        });
        youtube.search('winter', youtube.searchFilter.PLAYLIST, 3, 10, 'AIzaSyC-naga23QqSpzBCdPpx792q4l4Pk5_9Wg', function(err, result){
            if(err){
                console.log('youtube search err = '+err.message);
            } else {
                console.log('youtube search result = '+JSON.stringify(result));
            }
        });
        spotify.updateProfile('0TnOYISbd1XYRBk9myaseg','BQBbLsvfwpL65vtxdWKLFQ4QHJi-mVXc_Vwra8WjHupQiaSIpkFdw0Ckrsv1t6V56g0kernRZKuEwy89KyF5_Ds6wch1LQHwBR3C4IwDvDJD2WqMlKZFrXPiTT06wpujxJBguJ14xX6SKQKAH0Ye7lM1P9hvoKVqOnzZWZgy6hzPU8X6q1Xy3p37B-XUoaC9LATon39N2meoAdgPoZCrI4erPBpHqDJRtwwIzepMrKkXxcjWvEU2-p45tL1DEoTx030C5NNHKZnMq5T0iUBDEDQBBrpyyVIq9GkusknjXrV52WF-agt0D8XCB1HicdF668x1qZ3R_tVRRZKMY6MREQ', function(err, id){
            if(err){
                console.log('spotify updateProfile err = '+err.message);
            } else {
                console.log('spotify updateProfile userId='+id);
            }
        });
        spotify.updatePosts('0TnOYISbd1XYRBk9myaseg','BQB5H-WqhJT345TrIlbEeeSpQ3IGRTZ56SC3trIETTgp5QinlQTkht6uXXY70jpO2Yly0R9br-rmYKwWuh54RqEKlXI4kJ6K3qyksLEJf8byLRL1TkONkgo2M5Ehxt88MJd0Wi0b1r5s0OFjBQwwxNY-O0XBh5xC_73OBIwG2xWFkTLnB8AjyX5Csf5Sk2aKhUZGYDocZvuq4otRUN9lrGJ0Gy67lBj7wl6Fx-484BT0Zr7UJGWjmy_Ca1a5s-Ffk43b1IcZJ4CSitn3bTi911p72_x_t-0l8FtKlQ4yNd3989iLA0rmVp91g_tsPPKbYjAPHmjVGk4PeoCNLozLEA', false, function(err, id){
            if(err){
                console.log('spotify updatePosts err = '+err.message);
            } else {
                console.log('spotify updatePosts userId = '+id);
            }
        });
        spotify.search('lalalala', spotify.searchFilter.PLAYLIST, 1, 10, 'BQB685pRKgfszf3S2Qwn2N8IsvEQRo1jdd7Imrkvs8ybjlCknybOFatZ9x4-KwykTjkPpmA2u7ZZxt4qW41GosnUjdAobkHko5D1FW0P2VcbpGIseD7oBwMNeSNTPmIE__2OgW3jD6r8rtXEvLms_umNOAE1CNx_4RjkwcZ8neJJAymQxNqc0nKh2jlHoj2p6mOYRpdp6B2CowyQI-ExLXqadgF7BX8yooMlj7dMgPIw-aiscHdwSYuTzmoHK8pfuvvoZ5Lggc9h4YEDDFIQjELLqI3ltaUBUizWAu0phxCQdi0C6zIhD8G2oa6jKmbvG9khz-TenhQKrw0Wva2AcQ', function(err, result){
            if(err){
                console.log('spotify search err = '+err.message);
            } else {
                console.log('spotify search result = '+JSON.stringify(result));
            }
        })

    }
});

module.exports = app;
