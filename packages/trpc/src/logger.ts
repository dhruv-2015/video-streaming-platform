import loggerDefault, { Logger } from "@workspace/logger";

const logger: Logger = loggerDefault.child({ service: "trpc" });

export default logger;
