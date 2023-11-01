import HttpStatus from 'http-status-codes';

module.exports = {

	badRequest: {
		name: 'Bad Request',
		message: 'Some Error Occurred!',
		code: HttpStatus.StatusCodes.BAD_REQUEST
	},

	infoSaved: {
		name: 'Info saved',
		message: 'Information saved successfully',
		code: HttpStatus.StatusCodes.OK
	},

	noContent: {
		name: 'Data not found',
		message: 'Data not found',
		code: HttpStatus.StatusCodes.OK
	},

	msgOk: {
		message: 'Ok',
		code: HttpStatus.StatusCodes.OK
	},

}