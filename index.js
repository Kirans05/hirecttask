require("dotenv").config()
const express = require("express")
const app = express()
const cors = require("cors")
app.use(express.json())
const { OAuth2Client } = require('google-auth-library')
const client = new OAuth2Client(process.env.CLIENT_ID)
const {MongoClient} = require("mongodb")
const databasename = "hirectProject"
const url = "mongodb+srv://kiran:NRAgrrZT70l3ZH2x@cluster0.pchuk.mongodb.net/test?authSource=admin&replicaSet=atlas-sgk23x-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true"
const backend = new MongoClient(url) 
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser")
const corsOptions = {
    credentials: true,
  };
app.use(cookieParser())
app.use(cors(corsOptions));
const {haspPassword,comparePassword} = require("./hashPage")
const port = process.env.PORT || 8000


app.post("/login/signin",async (req,res)=>{
    try{
        const { tocken }  = req.body
    const ticket = await client.verifyIdToken({
        idToken: tocken,
        audience: process.env.CLIENT_ID
    })
    const { name, email, picture ,email_verified} = ticket.getPayload(); 
    console.log(ticket.getPayload())
    if(email_verified){
        let resposne = await backend.connect()
        let db = await resposne.db(databasename)
        let table = await db.collection("usersTable")
        let user = await table.find({email}).toArray()
        if(user.length){
            const logintocken = jwt.sign({_id:user[0]._id,email:user[0].email},process.env.secret_key,{expiresIn:"7d"})
            const upadteTocken = await table.updateOne({email:user[0].email},{$set:{tocken:logintocken}})
            const {_id,name,email} = user[0]
            res.status(200).send({logintocken,user:{_id,name,email},message:"Login Successfull"})
        }else{
            const tocken = jwt.sign({name,email},process.env.secret_key,{expiresIn:"7d"})
            let pwd = name+email
            let newPassword = await haspPassword(pwd)
            password = newPassword
            let newUser = await table.insertOne({name,email,password,tocken})
            res.status(200).send({tocken,user:{name,email},message:"SignUp successfull"})
        }
    }
    }catch(error) {
        console.log("===>error==>",error)
        res.send("Intrenal Server Problem")
    }
})




// inserting search keyword

app.post("/searchKeyword",async (req,res) => {
    console.log(req.body)
        try{
            let resposne = await backend.connect()
            let db = await resposne.db(databasename)
            let table = await db.collection("usersTable")
            let user = await table.find({tocken:req.body.tocken}).toArray()
            console.log("===>",user)
            if(user.length){
                if(user[0].searchKeywords){
                    let value = req.body.keys 
                    user[0].searchKeywords.push(value)
                    let insertNewKeys = await table.updateOne({email:user[0].email},{$set:{searchKeywords:user[0].searchKeywords}})
                    res.json({message:"New Keys Inserted"})
                }else{
                    let arr = [req.body.keys]
                    let insertKeys = await table.updateOne({email:user[0].email},{$set:{searchKeywords:arr}})
                    res.json({message:"Keys Inserted for First time"})
                }
            }else{
                res.json({message:"User Not Found"})
            }
        }catch(error) {
            res.json({message:"Internal Server Problem"})
        }
})



// display searched key words
// app.post("/displaySearch",async (req,res) => {
//     console.log(req.body)
//     let resposne = await backend.connect()
//     let db = await resposne.db(databasename)
//     let table = await db.collection("usersTable")
//     let user = await table.find({tocken:req.body.tocken}).toArray()
//     res.json({
//         keys:user[0].searchKeywords
//     })
// })




app.listen(port)