import { logger as loggerDefault, Logger } from "@workspace/logger";

export const logger: Logger = loggerDefault.child({ service: "@workspace/transcoder" });

export default logger