import { logger as loggerDefault, Logger } from "@workspace/logger";

export const logger: Logger = loggerDefault.child({ service: "transcoder" });

export default logger