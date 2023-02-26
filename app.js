const express=require('express');
const mongoose=require('mongoose');
const clc=require('cli-color');

const app=express();


//file exports
const userSchema=require('./Modles/UserSchema');
const { cleanUpAndValidate } = require('./Utils/AuthUtils');

//middle wares
app.set("view engine", "ejs");
app.use(express.json());                     //this middle ware is used to excess req.body
app.use(express.urlencoded({extended:true}));//this middle ware change binary data to json data
app.use(express.static("public"));//this middle-ware excess public folder files to clien and server side

//how to make our port dynamic
const PORT = process.env.PORT || 8000

//mongodb connection
const uri='mongodb+srv://Sahil:9992@cluster0.7dhdonx.mongodb.net/moduleTest';
mongoose.set('strictQuery', true);
mongoose.connect(uri)
.then(()=>{
    console.log(clc.green('mongodb connected'));
})
.catch((err)=>{
    console.log(clc.red('err'));
})


//home route
app.get('/',(req,res)=>{
    res.render('home')
})
//register route
app.get('/register',(req,res)=>{
    res.render('register')
})
//login route
app.get('/login',(req,res)=>{
    res.render('login')
})

//registration route
app.post("/register",async (req,res)=>{
    console.log(req.body);
    const {name,email,username,password}=req.body;
    try{
        await cleanUpAndValidate({name,email,username,password});

        let userH;
        try{
            userH=await userSchema.findOne({email});
        }catch(err){
            console.log(err+"line no 57");
            return res.send({
                status:400,
                message:"database error",
                error:err,
            })
        }
        if(userH){
            return res.send({
                status:401,
                message:"user already exist",
            });
        }
        //now we save data in mongoose
        const user=new userSchema({
            name:name,
            email:email,
            username:username,
            password:password,
        })
        try{
            const userdb=await user.save();
            console.log(userdb);
            return res.status(200).redirect("/login");
        }catch(error){
            console.log(error+" error at line no=81");
        }
    }catch(error){
        console.log(error+"at line no=78");
        return res.send({
            status:400,
            message:"error with cleanupandvalidate function",
            error:error
        })
    }
})



//start our port
app.listen(PORT, () => {
    console.log(clc.yellow("server is started"));
    console.log(clc.blue.underline(`http://localhost:${PORT}/`));
})