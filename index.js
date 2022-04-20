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
    ///..other options
  };
app.use(cookieParser())
app.use(cors(corsOptions));
const {haspPassword,comparePassword} = require("./hashPage")


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
            const logintocken = jwt.sign({_id:user[0]._id},process.env.secret_key,{expiresIn:"1m"})
            const upadteTocken = await table.updateOne({email:user[0].email},{$set:{tocken:logintocken}})
            const {_id,name,email} = user[0]
            res.status(200).send({logintocken,user:{_id,name,email},message:"Login Successfull"})
        }else{
            const SigninTocken = jwt.sign({name,email},process.env.secret_key,{expiresIn:"1m"})
            let pwd = name+email
            let newPassword = await haspPassword(pwd)
            password = newPassword
            let newUser = await table.insertOne({name,email,password,SigninTocken})
            res.status(200).send({SigninTocken,user:{name,email},message:"SignUp successfull"})
        }
    }
    }catch(error) {
        console.log("===>error==>",error)
        res.send("Intrenal Server Problem")
    }
})




app.listen(8000)