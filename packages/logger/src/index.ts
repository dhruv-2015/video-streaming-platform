import { createLogger, transports, format, Logger } from "winston";
import "winston-daily-rotate-file";
const { combine, timestamp, printf, json } = format;
import { env } from "@workspace/env";

const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
});


export const logger = createLogger({
    level: "info",
    format: combine(json(), timestamp()),
    // defaultMeta: { service: "user-service" },
    transports: [
        //
        // - Write all logs with importance level of `error` or less to `error.log`
        // - Write all logs with importance level of `info` or less to `combined.log`
        //
        // new transports.Console({
        //     format: logFormat
        // }),
        new transports.DailyRotateFile({
            level: "error",
            dirname: env.LOG_DIR,
            filename: "application-error-%DATE%.log",
            datePattern: "YYYY-MM-DD-HH",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "14d",
        }),
        new transports.DailyRotateFile({
            level: "info",
            dirname: env.LOG_DIR,
            filename: "application-info-%DATE%.log",
            datePattern: "YYYY-MM-DD-HH",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "14d",
        }),
        new transports.DailyRotateFile({
            level: "warn",
            dirname: env.LOG_DIR,
            filename: "application-warn-%DATE%.log",
            datePattern: "YYYY-MM-DD-HH",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "14d",
        }),
    ],
});


if (env.NODE_ENV !== "production" || env.LOG) {
    logger.add(
        new transports.Console(),
    );
}

// const api_logger = logger.child({ service: "api" });

// export default api_logger;
export default logger;
export { Logger };
