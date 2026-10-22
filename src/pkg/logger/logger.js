/// logger.js

class Logger {
    constructor() {
        if (!Logger.instance) {
            Logger.instance = this;
        }
        return Logger.instance;
    }

    log(level, message, metaData = {}) {
        const messageObj = {
            level, /// log, error, debug, info
            message,
            timestamp: new Date().toISOString(),
            ...metaData,
        };
        const line = JSON.stringify(messageObj);
        if (level === "error") {
            console.error(line);
        } else {
            console.log(line);
        }
    }

    error(message, metaData = {}) {
        this.log("error", message, metaData);
    }

    warn(message, metaData = {}) {
        this.log("warn", message, metaData);
    }

    debug(message, metaData = {}) {
        this.log("debug", message, metaData);
    }

    info(message, metaData = {}) {
        this.log("info", message, metaData);
    }
}

export const logger = new Logger();
