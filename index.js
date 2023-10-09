const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zdki8if.mongodb.net/?retryWrites=true&w=majority`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });


// verify jwt for unautorized access
function verifyJWT(req, res, next){
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({message: 'Unauthorized access'})
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
    if(err){
      return res.status(403).send({message: 'Forbidded Access'})
    }
    req.decoded = decoded;
    next()
  });
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const jewelriesCollec = client.db("nurjahan-jewelry").collection("allJewelries");
    const userCollection = client.db("nurjahan-jewelry").collection("users");
    

    // verify admin
    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({ email: requester });
      if (requesterAccount.role === 'admin') {
        next();
      }
      else {
        res.status(403).send({ message: 'forbidden' });
      }
    }

     // get all  jewerlries
     app.get("/jewelries", async (req, res) => {
      const query = {};
      const cursor = jewelriesCollec.find(query);
      const parts = await cursor.toArray();
      res.send(parts);
    });
    
       // delete jewelry from database
       app.delete('/jewelry/:id', verifyJWT, verifyAdmin, async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = await jewelriesCollec.deleteOne(query);
        res.send(result);
      })
  
      // add jewelry in the database
      app.post("/jewelry", verifyJWT, verifyAdmin, async (req, res) => {
        const part = req.body;
        const result = await jewelriesCollec.insertOne(part);
        res.send(result);
      });
  
      // post jewelry in the database
      app.post("/review", async (req, res) => {
        const review = req.body;
        const result = await jewelriesCollec.insertOne(review);
        res.send(result);
      });
  
  
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('jewerly is running')
})

app.listen(port, () => {
    console.log(`jewerly is running on port ${port}`);
})