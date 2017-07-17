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

        //facebook.updateProfile('berniesanders','EAACEdEose0cBAKGB7JhJJoOIB5CASDpQ12JL4CAsqw9MkyTZBfnCLB2RiWEN0aTPqZCbnbgykStm796maeIVtpUD0buo4Y5eWnydCjqZB3jyRdFZCIM9F7Vk7fshdwjrkffzPihtfmRJhevbSDZAmCTclkvTHPditubLanvSOcAHF08zsHM1FSOedAWfaER0ZD',  function(err, id){
            //if(err){
               //console.log('facebook updateProfile err='+err);
            //} else {
                //console.log('facebook updateProfile userId='+id);
            //}
        //});
        //facebook.updatePosts('901526266540071', 'EAACEdEose0cBAKGB7JhJJoOIB5CASDpQ12JL4CAsqw9MkyTZBfnCLB2RiWEN0aTPqZCbnbgykStm796maeIVtpUD0buo4Y5eWnydCjqZB3jyRdFZCIM9F7Vk7fshdwjrkffzPihtfmRJhevbSDZAmCTclkvTHPditubLanvSOcAHF08zsHM1FSOedAWfaER0ZD', false, function(err, id){
            //if(err){
                //console.log('facebook updatePosts err='+err);
           // } else {
               // console.log('facebook updatePosts userId='+id);
            //}
        //});

        facebook.search('hot summer', 'page', 5, 'EAACEdEose0cBAGWGJ3rH5QydZAI4weCHAJxTNkWYvZBx0MVoK9BZBZBhe23gF600hSQl5KDTfskBb23IOkTuqQJokHjM3HUUw7RUd7YNXP5XzcZB1sdGm3jCE6pIurRcRCi4aZAi02MZBjkbWFu0Wrb6ghR1b6e0L28cxKJ8KFdZAbwgLAkz2i2FSJl6oYDCE94ZD', function(err, result){
            if(err){
                console.log('facebook search err='+err);
            } else {
                console.log('facebook search results='+JSON.stringify(result));
            }
        });

        twitter.updateProfile({screen_name:'AnnaFomenko4'},'VxfmLdJvZaUpOie5O9ju8sdrn6pVuUf', function(err, options){
            if(err){
                console.log('twitter updateProfile err='+err);
            } else {
                console.log('twitter updateProfile user='+JSON.stringify(options));
            }
        });
        twitter.updatePosts('884356029798023173','VxfmLdJvZaUpOie5O9ju8sdrn6pVuUf', true, function(err, id){
            if(err){
                console.log('twitter updatePosts err='+err);
            } else {
                console.log('twitter updatePosts user='+id);
            }
        });
        twitter.search('twitter', 2, 'VxfmLdJvZaUpOie5O9ju8sdrn6pVuUf', function(err, result){
             if(err){
                console.log('twitter search err='+err);
             } else {
                 console.log('twitter search result='+JSON.stringify(result));
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
        youtube.search('summer', 10, 'AIzaSyC-naga23QqSpzBCdPpx792q4l4Pk5_9Wg', function(err, result){
            if(err){
                console.log('youtube search err='+err);
            } else {
                console.log('youtube search result='+JSON.stringify(result));
            }
        });

        /*spotify.updateProfile('0TnOYISbd1XYRBk9myaseg','BQAUOwdRe0zW-sWqUJqHOwVU9HWA0aHQT7YcHyOWbw2J6VwCpVzLmOdUS43kQnYxYcDq5WQX7Fjt3VdHjfk5uTpclYs9bY2vh3xqn7m4l8zf15z4fVchrNcBcEs0rAJIkY3pEdMTW3rzz4FCkUBrnPFzbh63aUR5xSINWeKFhA7oGbjCUktquVufxaGFCjsvTA8k1OQ8F9WuIgl3-szn03b46oQAJQ8gvM5nxIaULlFOf9C1NKR625yw75Tw9nS6xt483KG2K3gNfT0nu6W7Sdd1gHqLXCFkjn0sYClkrUEy7E5NPBEV2lGr8EBMkx0-RUS7QAfdqSABGCzb8ukr0Q', function(err, id){
            if(err){
                console.log('spotify updateProfile err ='+err);
            } else {
                console.log('spotify updateProfile userId='+id);
            }
        });
        spotify.updatePosts('0TnOYISbd1XYRBk9myaseg','BQAUOwdRe0zW-sWqUJqHOwVU9HWA0aHQT7YcHyOWbw2J6VwCpVzLmOdUS43kQnYxYcDq5WQX7Fjt3VdHjfk5uTpclYs9bY2vh3xqn7m4l8zf15z4fVchrNcBcEs0rAJIkY3pEdMTW3rzz4FCkUBrnPFzbh63aUR5xSINWeKFhA7oGbjCUktquVufxaGFCjsvTA8k1OQ8F9WuIgl3-szn03b46oQAJQ8gvM5nxIaULlFOf9C1NKR625yw75Tw9nS6xt483KG2K3gNfT0nu6W7Sdd1gHqLXCFkjn0sYClkrUEy7E5NPBEV2lGr8EBMkx0-RUS7QAfdqSABGCzb8ukr0Q', false, function(err, id){
            if(err){
                console.log('spotify updatePosts err ='+err);
            } else {
                console.log('spotify updatePosts userId='+id);
            }
        })*/
        spotify.search('lalalala', 10, 'BQAUOwdRe0zW-sWqUJqHOwVU9HWA0aHQT7YcHyOWbw2J6VwCpVzLmOdUS43kQnYxYcDq5WQX7Fjt3VdHjfk5uTpclYs9bY2vh3xqn7m4l8zf15z4fVchrNcBcEs0rAJIkY3pEdMTW3rzz4FCkUBrnPFzbh63aUR5xSINWeKFhA7oGbjCUktquVufxaGFCjsvTA8k1OQ8F9WuIgl3-szn03b46oQAJQ8gvM5nxIaULlFOf9C1NKR625yw75Tw9nS6xt483KG2K3gNfT0nu6W7Sdd1gHqLXCFkjn0sYClkrUEy7E5NPBEV2lGr8EBMkx0-RUS7QAfdqSABGCzb8ukr0Q', function(err, result){
            if(err){
                console.log('spotify search err ='+err);
            } else {
                console.log('spotify search result='+JSON.stringify(result));
            }
        })

    }
});

module.exports = app;
