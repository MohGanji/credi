import winston from 'winston'
import path from 'path'

type LogLevel = 'error' | 'warn' | 'info' | 'debug'

class Logger {
    private winston: winston.Logger

    constructor() {
        const logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info'

        // Custom format that includes file context
        const customFormat = winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.errors({ stack: true }),
            winston.format.printf(({ timestamp, level, message, data, stack, ...meta }) => {
                let logMessage = `[${timestamp}] [${level.toUpperCase()}]`

                // Add caller info if available in meta
                if (meta.caller) {
                    logMessage += ` [${meta.caller}]`
                }

                logMessage += ` ${message}`

                // Add data if provided
                if (data && Object.keys(data).length > 0) {
                    logMessage += ` ${JSON.stringify(data)}`
                }

                // Add stack trace for errors
                if (stack) {
                    logMessage += `\n${stack}`
                }

                return logMessage
            })
        )

        this.winston = winston.createLogger({
            level: logLevel,
            format: customFormat,
            transports: [
                new winston.transports.Console({
                    handleExceptions: true,
                    handleRejections: true
                })
            ],
            exitOnError: false
        })
    }

    private getCallerInfo(): string {
        const stack = new Error().stack
        if (!stack) return 'unknown'

        const stackLines = stack.split('\n')
        // Skip the first 4 lines (Error, getCallerInfo, log method, public method)
        const callerLine = stackLines[4]
        if (!callerLine) return 'unknown'

        // Extract file path and line number
        const match = callerLine.match(/\((.+):(\d+):(\d+)\)/) || callerLine.match(/at (.+):(\d+):(\d+)/)
        if (!match) return 'unknown'

        const filePath = match[1]
        const lineNumber = match[2]
        const fileName = path.basename(filePath)

        return `${fileName}:${lineNumber}`
    }

    private log(level: LogLevel, message: string, data?: any) {
        const caller = this.getCallerInfo()

        this.winston.log({
            level,
            message,
            data,
            caller
        })
    }

    error(message: string, data?: any) {
        this.log('error', message, data)
    }

    warn(message: string, data?: any) {
        this.log('warn', message, data)
    }

    info(message: string, data?: any) {
        this.log('info', message, data)
    }

    debug(message: string, data?: any) {
        this.log('debug', message, data)
    }
}

// Export singleton instance
export const logger = new Logger()
export type { LogLevel }