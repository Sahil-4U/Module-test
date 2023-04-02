const express=require('express');
const mongoose=require('mongoose');
const clc=require('cli-color');
const bcrypt=require('bcrypt');
const validator=require('validator');
const session=require('express-session');
const mongodbSession=require('connect-mongodb-session')(session);
const jwt=require('jsonwebtoken');

const app=express();


//file exports
const userSchema=require('./Modles/UserSchema');
const { cleanUpAndValidate, 
    generateJwtToken, 
    sendverificationToken, 
    secretKey } = require('./Utils/AuthUtils');
const { isAuth } = require('./Middleware/authmiddleware');
const rateLimiting = require('./Middleware/ratelimiting');
const UserSchema = require('./Modles/UserSchema');
const { up } = require('cli-color/move');

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

//here i create mongodb store to store session
const store=new mongodbSession({
    uri:uri,
    collection:'sessions',
})



//middle wares
app.set("view engine", "ejs");
//now i create here session which is address of mongodb store
app.use(
    session({
        secret:"This is our module test project",
        resave:false,
        saveUninitialized:false,
        store:store,
    })
);
app.use(express.json());                     //this middle ware is used to excess req.body
app.use(express.urlencoded({extended:true}));//this middle ware change binary data to json data
app.use(express.static("public"));//this middle-ware excess public folder files to clien and server side

//how to make our port dynamic
const PORT = process.env.PORT || 8000




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
//Change password route
app.get('/forgotPasswordPage',(req,res)=>{
    res.render('forgotPasswordPage')
})
//dashboard route
app.get('/dashboard',isAuth,(req,res)=>{
    res.render('dashboard')
})

//salt round variable
const saltround=10;
//registration route
app.post("/register",async (req,res)=>{
    // console.log(req.body);
    const {name,email,username,password}=req.body;
    try{
        await cleanUpAndValidate({name,email,username,password});
        const hashPassword=await bcrypt.hash(password,saltround);
        let userH;
        try{
            userH=await userSchema.findOne({email});
        }catch(err){
            console.log(err);
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
            password:hashPassword,
        });
        //here i create token for 2fa
        const token=generateJwtToken(email);
        console.log(token);
        try{
            const userdb=await user.save();
            sendverificationToken(email,token);
            console.log(userdb);
            return res.status(200).redirect("/login");
        }catch(error){
            console.log(error);
            return res.send({
                status:400,
                message:"error in saving data at db from register form ",
                error:error,
            })
        }
    }catch(error){
        console.log(error);
        return res.send({
            status:400,
            message:"error with cleanupandvalidate function",
            error:error
        })
    }
});


//i am checking here is email authenticated or not
app.get("/verify/:token",(req,res)=>{
    const token=req.params.token;
    jwt.verify(token,secretKey,async (err,decodedData)=>{
        if(err) throw err;
        console.log(decodedData);
        try {
            const userauth=await userSchema.findOneAndUpdate(
                {email:decodedData.email},
                {emailAuth:true}
            );
            console.log(userauth);
            return res.status(200).redirect('/login');
        } catch (error) {
            return res.send({
                status:400,
                message:"error in 2fa",
                error:error,
            })
        }
    });
})
//login route
app.post('/login',async (req,res)=>{
    console.log(req.body);
    const {loginId,password}=req.body;

    //validate our data is to be correct or not 
    if (!loginId || !password) {
        return res.send({
            status: 405,
            message: "missing credentials",
        })
    }
    if (typeof loginId !== "string" || typeof password !== "string") {
        return res.send({
            status: 400,
            message: "invalid credentials",
        })
    }

    //identifing the data is user send email or username
    try{
        let isUser;
        //we use here validator's is isEmail method to check loginId is email or username
        if(validator.isEmail('loginId')){
            isUser=await userSchema.findOne({email:loginId});
        }else{
            isUser=await userSchema.findOne({username:loginId});
        }
        console.log(isUser);
        if(!isUser){
            return res.send({
                status:400,
                message:"user not exist",
            })
        };
        //i implement a check here for email authenticate
        if(!isUser.emailAuth){
            console.log(isUser.emailAuth);
            return res.send({
                status:400,
                message:"please verify email first",
            })
        };
        //validate password is correct or not
        const isMatch=await bcrypt.compare(password,isUser.password);
        if(!isMatch){
            return res.send({
                status:400,
                message:'Password is not matched',
            })
        }
        //here we need to store our session for implement session base authentication
        req.session.isAuth=true;
        req.session.user={
            username:isUser.username,
            email:isUser.email,
            userId:isUser._id,
        }
        return res.status(200).redirect('dashboard')
    }catch(error){
        console.log(error);
        return res.send({
            status:400,
            message:"User is not exist",
            error:error,
        })
    }
});
//route for forget password
app.post('/forgetPassword',async(req,res)=>{
    console.log(req.body);
    const {loginId,oldpassword,newpassword}=req.body;

    //validate our data is to be correct or not 
    if (!loginId || !oldpassword || !newpassword) {
        return res.send({
            status: 405,
            message: `<h2>missing credentials</h2>`,
        })
    }
    if (typeof loginId !== "string" || typeof oldpassword !== "string" || typeof newpassword !== "string") {
        return res.send({
            status: 400,
            message: "invalid credentials",
        })
    }
    //identifing the data is user send email or username
    try{
        let isUser;
        //we use here validator's is isEmail method to check loginId is email or username
        if(validator.isEmail('loginId')){
            isUser=await userSchema.findOne({email:loginId});
        }else{
            isUser=await userSchema.findOne({username:loginId});
        }
        console.log(isUser);
        if(!isUser){
            return res.send({
                status:400,
                message:"user not exist",
            })
        };
        //i implement a check here for email authenticate
        if(!isUser.emailAuth){
            console.log(isUser.emailAuth);
            return res.send({
                status:400,
                message:"please verify email first",
            })
        };
        //validate password is correct or not
        const isMatch=await bcrypt.compare(oldpassword,isUser.password);
        if(!isMatch){
            return res.send({
                status:400,
                message:'Password is not matched',
            })
        }
        try{
            const hashPassword=await bcrypt.hash(newpassword,saltround);
            const update=await userSchema.findOneAndUpdate({username:loginId},{password:hashPassword});
            // const update=await userSchema.findOne({username:loginId});
            // console.log("update function "+update);
        }catch(error){
            return res.status({
                status:400,
                message:"error in db while changing  the password",
                error:error,
            })
        }
        return res.status(200).redirect('login')
    }catch(error){
        console.log(error);
        return res.send({
            status:400,
            message:"User is not exist",
            error:error,
        })
    }
})

//dashboard route
app.post('/dashboard',isAuth,rateLimiting,(req,res)=>{
  console.log(req.body);
  return res.send('this is dashboard');
})


//start our port
app.listen(PORT, () => {
    console.log(clc.yellow("server is started"));
    console.log(clc.blue.underline(`http://localhost:${PORT}/`));
})