'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var SQLite = require('sqlite3').verbose();
var Bot = require('slackbots');
//var CronJob = require('cron').CronJob;
//var jobs = [];

/**
 * Constructor function. It accepts a settings object which should contain the following keys:
 *      token : the API token of the bot (mandatory)
 *      name : the name of the bot (will default to "turtlesbot")
 *      dbPath : the path to access the database (will default to "data/onepiecebot.db")
 *
 * @param {object} settings
 * @constructor
 *
 */
var TurtlesBot = function Constructor(settings) {
    this.settings = settings;
    this.settings.name = this.settings.name || 'turtlesbot';
    this.dbPath = settings.dbPath || path.resolve(__dirname, '..', 'data', 'onepiecebot.db');

    this.user = null;
    this.db = null;
};

// inherits methods and properties from the Bot constructor
util.inherits(TurtlesBot, Bot);

/**
 * Run the bot
 * @public
 */
TurtlesBot.prototype.run = function () {
    TurtlesBot.super_.call(this, this.settings);

    this.on('start', this._onStart);
    this.on('message', this._onMessage);
};

/**
 * On Start callback, called when the bot connects to the Slack server and access the channel
 */
TurtlesBot.prototype._onStart = function () {
    this._loadBotUser();
    this._connectDb();
    this._loadCron();
};

/**
 * On message callback, called when a message (of any type) is detected with the real time messaging API
 * @param {object} message
 */
TurtlesBot.prototype._onMessage = function (message) {
    if (this._isChatMessage(message) &&
        this._isChannelConversation(message) &&
		this._isFunction(message) &&
        !this._isFromTurtlesBot(message)
    ) {
        this._handleMessage(message);
    }
};

/**
 * Replyes to a message with a random Joke
 * @param {object} originalMessage
 * @private
 */
TurtlesBot.prototype._handleMessage = function (originalMessage) {
    var self = this;
	var channel = self._getChannelById(originalMessage.channel);
};


/**
 * Loads the user object representing the bot
 * @private
 */
TurtlesBot.prototype._loadBotUser = function () {
    var self = this;
    this.user = this.users.filter(function (user) {
        return user.name === self.name;
    })[0];
};

/**
 * Open connection to the db
 * @private
 */
TurtlesBot.prototype._connectDb = function () {
    if (!fs.existsSync(this.dbPath)) {
        console.error('Database path ' + '"' + this.dbPath + '" does not exists or it\'s not readable.');
        process.exit(1);
    }

    this.db = new SQLite.Database(this.dbPath);
};

/**
 * Check if the first time the bot is run. It's used to send a welcome message into the channel
 * @private
 */
TurtlesBot.prototype._loadCron = function () {
    var self = this;
    var outgoingMsg = "Loaded :";
	self._welcomeMessage();
	self.db.each("SELECT cron, message, one_piece_digit FROM message_event ORDER BY id", function(err, row) {
		outgoingMsg += " cron[ " + row.cron;
		outgoingMsg += "] message \"" + row.message;
		outgoingMsg += "\" users [";
		var digits = row.one_piece_digit.split(",");
		for (var i = 0; i < digits.length; i++) {
			self.db.each("SELECT name FROM users WHERE one_piece_tc_digit = " + digits[i], function(err, row) {
				outgoingMsg += row.name;
			});
	    }
		outgoingMsg += "]";
		this.postMessageToChannel(this.channels[0].name, outgoingMsg, {as_user: true});
		
//		var job = new CronJob(row.cron, function() {
//			this.postMessageToChannel(this.channels[0].name, outgoingMsg, {as_user: true});
//		}, null, true, 'Europe/Brussels');
//		job.start();
//		jobs.push(job);
	});
/**    self.db.get('SELECT val FROM info WHERE name = "lastrun" LIMIT 1', function (err, record) {
        if (err) {
            return console.error('DATABASE ERROR:', err);
        }

        var currentTime = (new Date()).toJSON();

        // this is a first run
        if (!record) {
            self._welcomeMessage();
            return self.db.run('INSERT INTO info(name, val) VALUES("lastrun", ?)', currentTime);
        }

        // updates with new last running time
        self.db.run('UPDATE info SET val = ? WHERE name = "lastrun"', currentTime);
    });*/
};

/**
 * Sends a welcome message in the channel
 * @private
 */
TurtlesBot.prototype._welcomeMessage = function () {
    this.postMessageToChannel(this.channels[0].name, 'Coucou',
        {as_user: true});
};

/**
 * Util function to check if a given real time message object represents a chat message
 * @param {object} message
 * @returns {boolean}
 * @private
 */
TurtlesBot.prototype._isChatMessage = function (message) {
    return message.type === 'message' && Boolean(message.text);
};

/**
 * Util function to check if a given real time message object is directed to a channel
 * @param {object} message
 * @returns {boolean}
 * @private
 */
TurtlesBot.prototype._isChannelConversation = function (message) {
    return typeof message.channel === 'string' &&
        message.channel[0] === 'C'
        ;
};

/**
 * Util function to check if a given real time message is mentioning Chuck Norris or the turtlesbot
 * @param {object} message
 * @returns {boolean}
 * @private
 */
TurtlesBot.prototype._isFunction = function (message) {
	var x = false;

	var functions = ["!next turtle"];
	
	for (var i = 0; i < functions.length; i++) { 
		if(message.text.toLowerCase().indexOf(functions[i]) === 0) {
			return true;
		}
	}
    return false;
};

/**
 * Util function to check if a given real time message has ben sent by the turtlesbot
 * @param {object} message
 * @returns {boolean}
 * @private
 */
TurtlesBot.prototype._isFromTurtlesBot = function (message) {
    return message.user === this.user.id;
};

/**
 * Util function to get the name of a channel given its id
 * @param {string} channelId
 * @returns {Object}
 * @private
 */
TurtlesBot.prototype._getChannelById = function (channelId) {
    return this.channels.filter(function (item) {
        return item.id === channelId;
    })[0];
};

module.exports = TurtlesBot;
