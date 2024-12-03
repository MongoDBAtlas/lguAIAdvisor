const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://admin:Rbehd1768%23@serverless.9g4ngex.mongodb.net/?retryWrites=true&w=majority";

//const client = new MongoClient(uri);
const client = new MongoClient(uri, {serverApi:{version: ServerApiVersion.v1, strict: true, deprecationErrors:true}});

async function run() {
    try {
      const database = client.db("stableapi");
      const userCollection = database.collection("sales");

      const result = await userCollection.count();
      console.log(`Find One Record: ${result}`);

    } finally {
      await client.close();
    }
  }

  run().catch(console.dir);