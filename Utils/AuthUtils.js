const cleanUpAndValidate=({name,email,username,password})=>{
    return new Promise((res,rej)=>{
        if(!name || !email || !username || !password){
            rej('invalid credentials')
        };
        if(typeof(email) !== 'string' || !email.includes('@') || !email.includes('.')){
            rej('enter valid email ');
        };
        if(typeof(name) !=='string' ||name.length <=3 || name.length >= 49){
            rej('enter valid name');
        };
        if(typeof(username) !=='string' ||username.length <=3 || username.length >= 49){
            rej('enter valid username');
        };
        if(typeof(password) !=='string' ||password.length <=3 || password.length >= 49){
            rej('enter valid password');
        };
        res();
    })
}


module.exports={cleanUpAndValidate};