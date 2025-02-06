import defaultLogger, {Logger} from "@workspace/logger";
export const logger: Logger = defaultLogger.child({ module: "@workspace/services" });
export default logger;