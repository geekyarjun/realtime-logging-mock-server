const express = require('express');
const path = require('path');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const cors = require('cors');
const passport = require('passport');
const httpStatus = require('http-status');
const config = require('./config/config');
const morgan = require('./config/morgan');
const { jwtStrategy } = require('./config/passport');
const { authLimiter } = require('./middlewares/rateLimiter');
const routes = require('./routes/v1');
const { errorConverter, errorHandler } = require('./middlewares/error');
const ApiError = require('./utils/ApiError');

const app = express();

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());
app.use(mongoSanitize());

// gzip compression
app.use(compression());

// enable cors
app.use(cors());
app.options('*', cors());

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
  app.use('/v1/auth', authLimiter);
}

// set the folder to server static files
// app.use(express.static(path.join(__dirname, 'public')));
console.log('IN server');
app.get('/', function (req, res) {
  console.log('req.ip', req.ip);
  console.log('req.socket.localAddressAA', req.socket.localAddress);
  console.log('req.socket.remoteAddress', req.socket.remoteAddress);
  console.log('req.connection.remoteAddress', req.connection.remoteAddress);
  console.log('request.headers["x-forwarded-for"]', req.headers['x-forwarded-for']);
  console.log('in /index.html', path.join(__dirname + '/index.html'));
  // res.render('index.html');
  res.send(
    `Hello world from node, req.ip: ${req.ip}, req.socket.localAddress: ${req.socket.localAddress}, req.socket.remoteAddress: ${req.socket.remoteAddress}, request.headers["x-forwarded-for"]: ${req.headers['x-forwarded-for']}`
  );
  // res.render(path.join(__dirname + '/index.html'));
});
// v1 api routes
// app.use('/v1', routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

module.exports = app;
