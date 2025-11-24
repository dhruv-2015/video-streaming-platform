# Video Streaming Platform

A modern video streaming platform built with Next.js, Express, and MongoDB.

## Features

- 🎥 Video upload and streaming
- 👤 User authentication with Google OAuth
- 💾 MongoDB for data persistence
- 🚀 Redis caching for improved performance
- ☁️ S3-compatible storage for video files
- 🔍 ChromaDB for video search capabilities
- 🎨 Modern UI with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, tRPC
- **Database**: MongoDB
- **Caching**: Redis
- **Storage**: S3-compatible storage
- **Authentication**: Google OAuth
- **Search**: ChromaDB
- **Development**: TypeScript, Turbo Repo, pnpm workspaces

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm ( npm i -g pnpm )
- MongoDB
- Redis
- S3-compatible storage (or local S3 server)
- ChromaDB

### Environment Setup

- Copy .env.example to .env.local
- fill all variables
- add http://localhost:3000/api/auth/callback/google and http://localhost:5000/api/auth/callback/google as callback in google console
- you can use docker to setup database and s3 server by running `pnpm dev:db` (close it with `pnpm dev:db:down`) 
- for s3  i am using `s3rver` npm pakage
```js
// s3-server.js
const S3rver = require("s3rver");
const fs = require('fs');

const corsConfig = require.resolve('./cors.xml');

const cors = fs.readFileSync(corsConfig)
const { fromEvent } = require('rxjs');
const { filter } = require('rxjs/operators');

const s3rver = new S3rver({
    address: "0.0.0.0",
    port: 4568,
    directory: ".",

    configureBuckets: [
        {
            name: 'test-video-bucket',
            configs: [cors],
        },
        {
            name: 'test-bucket',
            configs: [cors],
        },
    ],
});

s3rver.run((err, address) => {
    console.log(address, err);
});

```
- makesure to modify cors rules
```xml
<!-- cors.xml -->
<CORSConfiguration>
 <CORSRule>
   <AllowedOrigin>*</AllowedOrigin>

   <AllowedMethod>PUT</AllowedMethod>
   <AllowedMethod>POST</AllowedMethod>
   <AllowedMethod>DELETE</AllowedMethod>

   <AllowedHeader>*</AllowedHeader>
 </CORSRule>
 <CORSRule>
   <AllowedOrigin>*</AllowedOrigin>
   <AllowedMethod>GET</AllowedMethod>
 </CORSRule>
</CORSConfiguration>
``` 
- i am using docker to host chroma db (	`chromadb/chroma` image)
