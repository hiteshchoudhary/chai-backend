import userService from '../../../services/user';
import Response from '../../../utils/Response';
import Message from '../../../utils/Message';

class controller {

    static async sendOtp(req, res) {
        try {
            const response = { data: {}, message: Message.badRequest.message, code: Message.badRequest.code, extra: {} };
            const srvRes = await userService.sendOtp(req.body);

            if (srvRes.status) {

                response.message = Message.otpSent.message;
                response.code = Message.otpSent.code;

            }

            response.extra = srvRes.extra;
            Response.success(res, response);
        } catch (err) {
            Response.fail(res, Response.createError(Message.dataFetchingError, err));
        }
    }

    static async validateOtp(req, res) {
        try {
            const response = { data: {}, message: Message.badRequest.message, code: Message.badRequest.code, extra: {} };
            const srvRes = await userService.validateOtp(req.body);

            if (srvRes.status) {
                response.data = srvRes.data;
                response.message = Message.otpValidateLogin.message;
                response.code = Message.otpValidateLogin.code;
            } else {
                response.message = "OTP is wrong";
            }

            Response.success(res, response);
        } catch (err) {
            Response.fail(res, Response.createError(Message.dataFetchingError, err));
        }
    }


}

module.exports = controller;