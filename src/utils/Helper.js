
function genRandomNumber(otp_length) {
    let OTP = "";
    for (let i = 0; i < otp_length; i++) {
        OTP += false ? "0123456789"[Math.floor(Math.random() * 10)] : "0123456789"[i];
    }
    return OTP;
};


module.exports = {
    genRandomNumber
};