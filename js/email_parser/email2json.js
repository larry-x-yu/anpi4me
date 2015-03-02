var fs = require('fs');
var bunyan = require('bunyan');
var ical2json = require("ical2json");

var logger = bunyan.createLogger({
    name: 'email_parser',
    streams: [{
        stream: process.stdout,
        level: "debug"
    }]
});

module.exports = {
    email2Json: function(message) {
        if (!message) {
            logger.debug("Error opening file: " + err);
            return;
        }

        beginIndex = -1;
        endIndex = -1;
        ics = "";
        icalJson = null;

        //logger.debug("Message:\n" + message);

        beginIndex = message.indexOf("BEGIN:VCALENDAR");

        if (beginIndex != -1) {
            endIndex = message.indexOf("END:VCALENDAR");
            if (endIndex == -1) {
                logger.debug("Unable to find 'END:VCALENDAR'; Proceed to Base64 check");
            } else {
                endIndex += 'END:VCALENDAR'.length;
            }

            if (beginIndex != -1 && endIndex != -1) {
                ics = message.substring(beginIndex, endIndex + 1);
            }
        } else {
            // Calendar event from iphone, mac-os
            logger.debug("Search for encoded ics...");
            var marker1 = "Content-Disposition: attachment; filename=.*\.ics";
            var index = message.search(marker1);
            if (index != -1) {
                index = message.indexOf(".ics");
                beginIndex = index + 4;
                endIndex = message.indexOf('------=_Part_', beginIndex + 1);
            } else {
                logger.debug("Unable to find Base64 encoded ics");
            }

            if (beginIndex != -1 && endIndex != -1) {
                logger.debug("Decode ics...");
                ics = message.substring(beginIndex, endIndex).trim();

                //logger.debug("ics base64:\n" + ics);
                ics = new Buffer(ics, 'base64').toString("ascii");;
            } else {
                logger.debug("No valid ics attachment found");
            }

            //logger.debug(ics);
            if (ics) {
                icalJson = ical2json.convert(ics);
                logger.debug(icalJson);
            }
        }
    });
}