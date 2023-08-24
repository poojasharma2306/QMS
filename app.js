const express = require('express');
var bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const createAppointment = require('./create-appointment.js');
const dbConfig = require('./mysql-config.json');
const mysql = require(`mysql-await`);
const Razorpay = require('razorpay');
const moment = require('moment');
const twilio = require('twilio');
const smsConfig = require('./twilio-config.json');
const paymentConfig = require('./razorpay-config.json');
const razorpayInstance = new Razorpay({ key_id: paymentConfig.KEY_ID, key_secret: paymentConfig.KEY_SECRET });

const server = express();

server.use(express.static(path.join(__dirname, 'client')));

server.use(bodyParser.urlencoded({ extended: false }));

server.use(bodyParser.json());

// html files

server.get('/', function (req, res) {
	res.sendFile(path.join(__dirname, 'client/homepage.html'));
});

server.get('/appointment', function (req, res) {
	res.sendFile(path.join(__dirname, 'client/create-appointment.html'));
});

server.get('/tracker', function (req, res) {
	res.sendFile(path.join(__dirname, 'client/tracker.html'));
});

server.get('/queue', function (req, res) {
	res.sendFile(path.join(__dirname, 'client/qms.html'));
});

server.get('/history', function (req, res) {
	res.sendFile(path.join(__dirname, 'client/history.html'));
});

server.get('/login', function (req, res) {
	res.sendFile(path.join(__dirname, 'client/login.html'))
})

// api routes

server.get("/api/status", async function (req, res) {
	// console.log(req.query);
	const connection = mysql.createConnection(dbConfig);
	const userResult = await connection.awaitQuery("SELECT serial_number FROM appointments WHERE phone = ? && visit_date = ? AND status= ?", [req.query.mobile, req.query.visit_date, 'In Queue']);
	const currentResult = await connection.awaitQuery("SELECT serial_number FROM appointments WHERE status in ('In Progress', 'Ended')  AND visit_date=? ORDER BY serial_number DESC LIMIT 1", [req.query.visit_date]);
	const avg_time = await connection.awaitQuery("SELECT AVG(timestampdiff(minute,start_time,end_time))as avg FROM appointments WHERE visit_date = ? and status = ?", [req.query.visit_date, 'Ended']);
	// console.log(currentResult);
	res.status(200).send({
		userSerialNumber: userResult.length > 0 ? userResult[0].serial_number : 0,
		currentSerialNumber: currentResult.length > 0 ? currentResult[0].serial_number : 0,
		average_time: avg_time[0].avg
	});
});

server.post('/api/appointments', createAppointment);

server.post('/api/appointments/status', async function (req, res) {
	const connection = mysql.createConnection(dbConfig);
	let err = null;
	connection.on('error', function (error) {
		err = error;
	});
	let query = `UPDATE appointments SET status = ?`;
	let queryParams = [req.body.status];
	if (req.body.status == 'In Progress') {
		query += `, start_time=?`
		queryParams.push(moment().format('yyyy-MM-DD HH:mm:ss'));
	} else if (req.body.status == 'Ended') {
		query += `, end_time=?`
		queryParams.push(moment().format('yyyy-MM-DD HH:mm:ss'));
	}
	query += ' WHERE phone=? AND visit_date=? AND NOT status = ?'
	queryParams.push(req.body.phone);
	queryParams.push(req.body.visit_date);
	queryParams.push('Cancelled');
	const result = await connection.awaitQuery(query, queryParams);
	console.log(result, query, queryParams);
	if (!err && result.affectedRows > 0) {
		res.status(200).send('ok');
	} else {
		res.status(500).send(err || 'Error in updating appointment . Please refresh and try again');
	}
});

server.get('/api/appointments', async function (req, res) {
	const connection = mysql.createConnection(dbConfig);
	let err = null;
	connection.on('error', function (error) {
		err = error;
	});
	const result = await connection.awaitQuery('SELECT * from appointments where visit_date BETWEEN ? AND ? ORDER BY visit_date, serial_number', [req.query.start_date, req.query.end_date]);
	console.log(result, err);
	if (!err) {
		res.status(200).send(result);
	} else {
		res.status(500).send(err);
	}
});

server.get('/generateOtp', async function (req, res) {
	const otp = new Date().getTime().toString().substring(7);
	const connection = mysql.createConnection(dbConfig);
	let err = null;
	connection.on('error', function (error) {
		err = error;
	});
	const result = await connection.awaitQuery('INSERT INTO otp (otp, mobile, verified) VALUES (?, ?, ?)', [otp, req.query.mobile, false]);
	console.log(otp, result, err);
	if (!err) {
		sendSms(otp, req.query.mobile);
		res.status(200).send('OTP generated');
	} else {
		res.status(500).send(err);
	}
});

server.get('/verifyOtp', async function (req, res) {
	const connection = mysql.createConnection(dbConfig);
	let err = null;
	connection.on('error', function (error) {
		err = error;
	});
	const result = await connection.awaitQuery('UPDATE otp set verified = ? where otp = ? AND mobile = ? AND verified = ?', [true, req.query.otp, req.query.mobile, false]);
	console.log(result, err);
	if (!err && result.affectedRows > 0) {
		res.status(200).send('OTP verified');
	} else {
		res.status(500).send('Incorrect OTP');
	}
});

async function sendSms(otp, mobile) {
	const client = new twilio(smsConfig.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN || smsConfig.AUTH_TOKEN);
	try {
		const messsage = await client.messages.create({
			body: `OTP to confirm your appointment is ${otp}`,
			to: `+91${mobile}`,
			from: smsConfig.TWILIO_PHONE_NUMBER
		})
		console.log("twilio", messsage?.body);
	} catch (err) {
		console.log(err);
	}
}

server.post('/api/payment/order', async function (req, res) {
	var options = {
		amount: 50000,  // amount in the smallest currency unit
		currency: "INR",
		receipt: `order_rcptid_${req.body.mobile}_${req.body.visit_date}`
	};
	razorpayInstance.orders.create(options, function (err, order) {
		console.log(err, order);
		if (err) {
			return res.status(500).send("Server error while making payment");
		}
		res.status(200).send(order);
	});
})

server.post('/api/login', async function (req, res) {
	const connection = mysql.createConnection(dbConfig);
	let err = null;
	const hash = await bcrypt.hash(req.body.password, 10);
	console.log('hash', hash);
	connection.on('error', function (error) {
		err = error;
	});
	const result = await connection.awaitQuery('SELECT * from users where username = ?', [req.body.username]);
	if (err) {
		return res.status(500).send('Something went wrong');
	}
	if (result.length == 0) {
		res.status(404).send("This username does not exist");
	}
	if (result.length > 0) {
		const match = await bcrypt.compare(req.body.password, result[0].passwordHash);
		console.log(match, result[0].passwordHash);
		if (match == false) {
			return res.status(400).send("Incorrect Password");
		}
		return res.status(200).send({ username: result[0].username, name: result[0].name });
	}
})


server.listen(process.env.PORT || 3000, function () {
	console.log("server listening on port 3000");
});


