const AccessModle=require('../Modles/AccessModle');

const rateLimiting=async(req,res,next)=>{
 const sessionId=req.session.id;
 if(!sessionId){
    return res.send({
        status:400,
        message:"invalid authorization",
    });
 }
 //rate limiting logic now
 

 //check if the user has access recently
 const sessionDb=await AccessModle.findOne({sessionId:sessionId});
//  console.log(sessionDb);

 //if the user is not there,that means user is accessing the controller for the first time
 if(!sessionDb){
    //create a new entry in accessmodle
    const accessTime=new AccessModle({
        sessionId:sessionId,
        time:Date.now(),
    });
    await accessTime.save();
    next();
    return;
 }
 //if the entry was there,then we need to compare sessionDb.time
 const previousAccessTime=sessionDb.time;
 const currentTime=Date.now();
 console.log(currentTime-previousAccessTime/(1000*60));
 if(currentTime-previousAccessTime <2000){
    console.log('here');
    return res.send({
        status:401,
        message:"too many requests",
    });
 }
 //allow the person to make the request by updating the the previous time to currenttime
 try {
    await AccessModle.findOneAndUpdate(
      { sessionId: sessionId },
      { time: Date.now() }
    );

    next();
  } catch (error) {
    return res.send({
      status: 400,
      message: "bad request",
      error: error,
    });
  }

}
module.exports=rateLimiting;