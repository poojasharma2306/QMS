const dbConfig = require('./mysql-config.json');
const mysql = require(`mysql-await`);
const nodemailer = require('nodemailer');
const smsConfig = require('./twilio-config.json');
const twilio = require('twilio');

const createAppointment = async function (req, res) {
	console.log(req.body);
	let error;
	const appointment = req.body;
	const connection = mysql.createConnection(dbConfig);
	connection.on(`error`, function (err) {
		console.error(`Connection error`, err);
		error = err;
	});
	let countResult = await connection.awaitQuery(`SELECT COUNT(*) as count FROM appointments WHERE visit_date = ?`, [appointment.visit_date]);
	const serial_number = countResult[0].count + 1;
	const result = await connection.awaitQuery(`INSERT INTO appointments (name, phone, age, email, city, medical_condition, serial_number, visit_date, status) VALUES (?, ?, ?, ?, ? , ?, ?, ?, ?)`, [
		appointment.name,
		appointment.mobile,
		appointment.age,
		appointment.email,
		appointment.city,
		appointment.medical_condition,
		serial_number,
		appointment.visit_date,
		"In Queue"
	]);
	// console.log(result);
	connection.awaitEnd();
	if (result) {
		if (appointment.email) {
			sendEmail(req, appointment, serial_number);
		}
		sendSms(req, appointment, serial_number);
		res.status(200).send(serial_number.toString());
	} else {
		console.log(error.code);
		const message = error.code === 'ER_DUP_ENTRY' ? 'An appointment is already created with this mobile number on this date' : 'Internal Server Error'
		res.status(500).send(message);
	}
}

async function sendEmail(req, appointment, serial_number) {
	console.log("mail", req.get('host'));
	const transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: 'harupooja2306@gmail.com',
			pass: 'qxoyrjgbwwtekstc'
		}
	});

	var mailOptions = {
		from: 'harupooja2306@gmail.com',
		to: appointment.email,
		subject: 'Your appointment is Confirmed',
		html: `<h3>Hi ${appointment.name}, Your appointment on ${appointment.visit_date} is Confirmed <h3>
		 <h3>Your appointment number is ${serial_number}. Your can track or cancel your appointment status and ETA using below link</h3>
		 <h3>${req.protocol}://${req.get('host')}/tracker</h3>	
		`
	};

	try {
		const result = await transporter.sendMail(mailOptions);
	} catch (err) {
		console.log(err);
	}
}

async function sendSms(req, appointment, serial_number) {
	const client = new twilio(smsConfig.TWILIO_ACCOUNT_SID, smsConfig.AUTH_TOKEN);
	try {
		const messsage = await client.messages.create({
			body: `Hi ${appointment.name}, Your appointment on ${appointment.visit_date} is Confirmed. Your appointment number is ${serial_number}. Your can track or cancel your appointment status and ETA using below link.\n${req.protocol}://${req.get('host')}/tracker`,
			to: `+91${appointment.mobile}`,
			from: smsConfig.TWILIO_PHONE_NUMBER
		})
		console.log("twilio", messsage?.body);
	} catch (err) {
		console.log(err);
	}
}

module.exports = createAppointment;


