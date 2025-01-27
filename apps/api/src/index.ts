import { prisma } from "@workspace/prisma";

console.log("Hello, world!");

(async () => {
    // console.log("prisma", prisma);

    await new Promise((resolve) => setTimeout(resolve, 100000));
})()

