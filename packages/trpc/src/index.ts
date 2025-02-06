import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter, AppRouter } from "./root";
import { createContext } from "./context";
export * from "./root";

/**
 * Create a server-side caller for the tRPC API
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
// const createCaller = createCallerFactory(appRouter);

/**
 * Inference helpers for input types
 * @example
 * type PostByIdInput = RouterInputs['post']['byId']
 *      ^? { id: number }
 **/
type RouterInputs = inferRouterInputs<AppRouter>;
/**
 * Inference helpers for output types
 * @example
 * type AllPostsOutput = RouterOutputs['post']['all']
 *      ^? Post[]
 **/
type RouterOutputs = inferRouterOutputs<AppRouter>;

// trpcExpress =
// export { createTRPCContext, appRouter, createCaller };
export type { RouterInputs, RouterOutputs };

// express adapter

export const trpcExpress = createExpressMiddleware({
  router: appRouter,
  createContext,
});

// export const trpcOpenApi = appRouter.createOpenAPISchema({

import { generateOpenApiDocument } from "trpc-openapi";
import { createOpenApiExpressMiddleware } from "trpc-openapi/dist/adapters/express";
import { Router } from "express";

const expressRouter: Router = Router();
import { env } from "@workspace/env";

const openApiDocument = generateOpenApiDocument(appRouter, {
    title: "tRPC OpenAPI",
    version: "1.0.0",
    baseUrl: "http://localhost:5000/api",

});
// expressRouter.use('/', swaggerUi.serve);
// expressRouter.get('/', swaggerUi.setup(openApiDocument));
// @ts-ignore
expressRouter.get('/open-api-config', (req, res) => res.json((openApiDocument)));

// console.log(openApiDocument, "openApiDocument");

export const expressTrpcOpenApi = createOpenApiExpressMiddleware({
    router: appRouter,
    createContext,
    responseMeta: () => ({}),
    onError: (error: any) => {
        env
        // console.error(error);
    },
    maxBodySize: "1mb",
});

expressRouter.use("/", expressTrpcOpenApi);

export { expressRouter as openApiUi };
