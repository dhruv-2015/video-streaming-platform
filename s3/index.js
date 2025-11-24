const S3rver = require("s3rver");
const fs = require("fs");
const path = require("path");

const corsConfig = require.resolve("./cors.xml");

const cors = fs.readFileSync(corsConfig);
const { fromEvent } = require("rxjs");
const { filter } = require("rxjs/operators");

const dataDir =
  process.env.S3_DATA_DIR && process.env.S3_DATA_DIR.trim().length
    ? path.resolve(process.env.S3_DATA_DIR)
    : path.resolve(__dirname, "data");

fs.mkdirSync(dataDir, { recursive: true });

const s3rver = new S3rver({
  address: "0.0.0.0",
  port: 4568,
  directory: dataDir,
  vhostBuckets: true,

  configureBuckets: [
    {
      name: "test-video-bucket",
      configs: [cors],
    },
    {
      name: "test-bucket",
      configs: [cors],
    },
  ],
});

s3rver.run((err, address) => {
  console.log(address, err);
});

const s3Events = fromEvent(s3rver, "event");
// s3Events.subscribe((event) => console.log(event));
// s3Events
//   .pipe(filter((event) => event.Records[0].eventName == 'ObjectCreated:Copy'))
//   .subscribe((event) => console.log(event));


