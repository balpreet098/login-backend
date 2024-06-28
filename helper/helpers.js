const nodemailer = require('nodemailer');
function generateOTP() {
    let otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
}


async function sendEmail(email, subject, text) {
    try {
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'noreply.cloudmailer@gmail.com', 
        pass: '  nily rjtl njjk nrug' 
      }
    });

    let message = {
      from: 'bs9988153010@gmail.com', 
      to: email, 
      subject: subject,
      text: text 
    };
  
      let info = await transporter.sendMail(message);
      return info;
    } catch (err) {
      return 0;
    }
  }
  

module.exports = {
    generateOTP,
    sendEmail
}
  
  