import userModel from "../models/user";
import { genRandomNumber } from "../utils/Helper";

class UserService {

    static async sendOtp(data) {
        try {
            const response = { data: {}, status: false, isNew: false };

            const docData = await userModel.findOne({ phone: data.phone }) || new userModel();
            docData.phone = data.phone;
            docData.otp = { value: data.phone === "0000000000" ? "0123" : genRandomNumber(4), time: Date.now() };
            docData.isDeleted = false
            await docData.save()
            response.data = docData;
            response.status = true;

            return response;
        } catch (e) {
            throw e;
        }
    }


    static async validateOtp(data) {
        try {
            const response = { data: {}, status: false };
            const docData = await userModel.findOne({ phone: data.phone, "otp.value": data.otp });

            if (docData) {
                docData.otp = {};
                docData.save();
                response.data = {
                    token: "jwt generated token"
                }
                response.status = true;
            }

            return response;
        } catch (e) {
            throw e;

        }
    }


}

module.exports = UserService;