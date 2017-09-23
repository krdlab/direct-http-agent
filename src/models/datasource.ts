import mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const MONGODB_HOST = process.env.NODE_MONGODB_HOST || 'localhost';
mongoose.connect(`mongodb://${MONGODB_HOST}/direct`, console.error);