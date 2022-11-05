var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const SessionSchema = new Schema({_id: String}, { strict: false });
const Session = mongoose.model('Sessions', SessionSchema, 'Sessions');

module.exports = Session