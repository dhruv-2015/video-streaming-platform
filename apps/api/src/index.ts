import { prisma } from "@workspace/database";

console.log("Hello, world!");

(async () => {
    // console.log("prisma", prisma);
    prisma
        .$connect()
        .then(() => {
            console.log("Connected to database");
            prisma.user.create({
                data: {
                    email: "test@test.com",
                    name: "Test User",
                }
            }).then(() => {
                prisma.user.findMany().then(users => {
                    console.log("Users", users);    
                });
            })
        })
        .catch(e => {
            console.error("Error connecting to database", e);
        });

    await new Promise(resolve => setTimeout(resolve, 100000));
})();
