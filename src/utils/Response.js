import HttpStatus from 'http-status-codes';
import _ from 'lodash';

class Response {
	/**
	 * @example extra = {pagination: {offset: 10, limit: 50, rows: 1000}}
	 *
	 * @static
	 * @param {*} res
	 * @param {*} message
	 * @param {*} [data=null]
	 * @param {number} [code=200]
	 * @param {*} [extra={}]
	 * @memberof Response
	 */
	static success(res, message, data = null, code = HttpStatus.OK, extra = {}) {
		const resObj = { success: true };

		if (_.isObjectLike(message)) {
			resObj.message = message.message || 'success';
			resObj.data = message.data || null;
			resObj.code = message.code || HttpStatus.OK;
			if (!_.isEmpty(message.extra) && _.isObjectLike(message.extra)) {
				resObj.extra = message.extra;
			}
		} else {
			resObj.message = message || 'success';
			resObj.data = data || null;
			resObj.code = code || HttpStatus.OK;
			if (!_.isEmpty(extra) && _.isObjectLike(extra)) {
				resObj.extra = extra;
			}
		}

		if (res.req.headers.json) {
			res
				.status(resObj.code)
				.type('json')
				.send(`${JSON.stringify(resObj, null, 2)}\n`);
		} else {
			res.status(resObj.code).json(resObj);
		}
	}

	/**
	 * @static
	 * @param {*} res
	 * @param {*} message
	 * @param {number} [code=404]
	 * @param {*} [resCode=null]
	 * @param {*} [extra={}]
	 * @memberof Response
	 */
	static fail(res, message, code = HttpStatus.StatusCodes.NOT_FOUND, resCode = HttpStatus.StatusCodes.NOT_FOUND, extra = {}) {
		const resObj = { success: false };

		if (_.isObjectLike(message)) {
			resObj.message = message.message || 'failed';
			resObj.errors = [{msg: resObj.message }];
			resObj.code = message.code || HttpStatus.StatusCodes.NOT_FOUND;
			resObj.resCode = message.resCode || resObj.code;
			if (!_.isEmpty(message.extra) && _.isObjectLike(message.extra)) {
				resObj.extra = message.extra;
			}
		} else {
			resObj.message = message || 'failed';
			resObj.errors = [{msg: resObj.message }];
			resObj.code = code || HttpStatus.StatusCodes.NOT_FOUND;
			resObj.resCode = resCode || resObj.code;
			if (!_.isEmpty(extra) && _.isObjectLike(extra)) {
				resObj.extra = extra;
			}
		}

		if (res.req.headers.json) {
			res
				.status(resObj.code)
				.type('json')
				.send(`${JSON.stringify(resObj, null, 2)}\n`);
		} else {
			res.status(resObj.code).json(resObj);
		}
	}

}

module.exports = Response;