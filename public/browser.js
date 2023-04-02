// function changePassword(){
//   const Newval=prompt('enter new password');
//   console.log(Newval);
//   if(!Newval){
//     alert('Please enter credentials');
//     return
//   }else{
//     axios
//       .post("/changePassword",{Newval})
//       .then((res)=>{
//         console.log(res);
//         if(res.status !== 200){
//           alert('error with updation');
//           return;
//         }else{
//           window.location.href='/login';
//         }
//       })
//       .catch((err)=>{
//         console.log(err);
//       })
//   }
// }






  function register(){
    window.location.href='/register';
  }
  function login(){
    window.location.href='/login';
  }
  function forgotPassword(){
    window.location.href='/forgotPasswordPage';
  }
  function resendVerificationMail(){
    window.location.href='/resendVerificationMail';
  }