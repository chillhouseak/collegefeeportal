const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    // We use a fixed key so we only ever have ONE settings document in the database
    key: { type: String, default: 'global_settings' },
    isExamFormOpen: { type: Boolean, default: false } // Defaults to locked!
});

module.exports = mongoose.model('Settings', settingsSchema);