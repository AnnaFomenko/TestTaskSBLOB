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
        spotify.updateProfile('0TnOYISbd1XYRBk9myaseg','BQAxFfQCZAPJMLkoZyTnv_VM6deiCzasrpRFMfhexwBA7PeE7oDEKjFh0O3EkijxgWMvXl8OqvNsko9FA9fxD9cTYKkv3VvLRfHd_FGFggOVnilecc9PT5je8_XybMVV9BCRazPeKLQsrG5u6fzxQjnGsb3K3W7v5d28eQQi7p1PYqwUFMbnp4FBPBnmK2A84oCwsqHwL0r4_jZOsq3TqNrS9vTTJidCg1FBZ0I2TdpoEVrKcWqNuZmgbMW-AKm-wR55KzbhkvI0fi5NNIjuUpa1fT74-sAdeKTZ22H3GN-Byq-NbCusy0nvSD-A3ntTOwvPSG_86AybTIQHTBm0mw', function(err, id){
            if(err){
                console.log('spotify updateProfile err = '+err.message);
            } else {
                console.log('spotify updateProfile userId='+id);
            }
        });
        spotify.updatePosts('0TnOYISbd1XYRBk9myaseg','BQAwBB-0amFSGxOvV_El97NQnUzYNlSVhTjOBaDIOHD8bBtDUIGS8GZHftxp6RL8NktDqgw2hkHO2umxxjL4sIw1A8dHWx1137iaKDlp9OQ6FWPa3REfYZCADxnzfd8zmklUyeR-JLz26RVup_6zkvDVn4nSkxk4ghbr4ulBMyhnwiYed7yaLzgVFeI43rJMTlgY1wrBKniHZm8mJjyrEiHiEXGLKm4po2bWaR9QIltpqgUtjS-0-wLB2amAQFfXsrm5Mp84CKym_rKdbQR8asIg8iUAOyTOEdxH1AQCxNJqNu8PgJRyaIHiKN57RR9mfcH9VUNftFGBIpMF9V38xA', false, function(err, id){
            if(err){
                console.log('spotify updatePosts err = '+err.message);
            } else {
                console.log('spotify updatePosts userId = '+id);
            }
        });
        spotify.search('lala', spotify.searchFilter.PLAYLIST, 1, 10, 'BQAwBB-0amFSGxOvV_El97NQnUzYNlSVhTjOBaDIOHD8bBtDUIGS8GZHftxp6RL8NktDqgw2hkHO2umxxjL4sIw1A8dHWx1137iaKDlp9OQ6FWPa3REfYZCADxnzfd8zmklUyeR-JLz26RVup_6zkvDVn4nSkxk4ghbr4ulBMyhnwiYed7yaLzgVFeI43rJMTlgY1wrBKniHZm8mJjyrEiHiEXGLKm4po2bWaR9QIltpqgUtjS-0-wLB2amAQFfXsrm5Mp84CKym_rKdbQR8asIg8iUAOyTOEdxH1AQCxNJqNu8PgJRyaIHiKN57RR9mfcH9VUNftFGBIpMF9V38xA', function(err, result){
            if(err){
                console.log('spotify search err = '+err.message);
            } else {
                console.log('spotify search result = '+JSON.stringify(result));
            }
        })

    }
});

module.exports = app;
