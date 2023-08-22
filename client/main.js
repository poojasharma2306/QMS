const KEY_ID = 'rzp_test_DNiH1xL5NTiogw';

async function submitData() {
	let err = validateForm();
	if (err == true) {
		return false;
	}
	let sex = null;
	const radio = document.getElementsByName('sex');
	for (let i = 0; i < radio.length; i++) {
		if (radio[i].checked) {
			sex = radio[i].value;
		}
	}
	let appointment = {
		name: document.getElementById("name").value,
		mobile: document.getElementById("phone").value,
		email: document.getElementById("email").value,
		sex: sex,
		visit_date: document.getElementById("date").value,
		age: document.getElementById("age").value,
		city: document.getElementById("city").value,
		medical_condition: document.getElementById("condition").value
	}
	// console.log(appointment); 
	try {
		// generate OTP from server
		showLoader();
		await axios.get('/generateOtp?mobile=' + appointment.mobile);
		hideLoader();

		//get OTP from user
		const otp = prompt('Please enter the OTP sent to your phone');

		// verify OTP from server
		showLoader();
		await axios.get('/verifyOtp?mobile=' + appointment.mobile + '&otp=' + otp);
		hideLoader();

		// create a payment order from server
		showLoader();
		const orderResponse = await axios.post('/api/payment/order', appointment);
		const order = orderResponse.data;
		hideLoader();

		payAndCreateAppointment(appointment, order);

		// const result = await axios({
		// 	method: 'post',
		// 	url: '/api/appointments',
		// 	data: appointment
		// });
		// // console.log(result);
		// alert('appointment created. Your appointment number is ' + result.data);
		// const formFields = document.getElementsByClassName('form-control');
		// for (let i = 0; i < formFields.length; i++) {
		// 	formFields[i].value = ''
		// }
	}
	catch (e) {
		hideLoader();
		console.log(e);
		alert(e.response?.data || 'Internal Server Error');
	}
}

function validateForm() {
	let error = false;
	var name = document.getElementById('name').value;
	if (name) {
		document.getElementById('nameError').innerHTML = "";

	}
	else {
		document.getElementById('nameError').innerHTML = "Please enter your name"
		error = true;
	}

	var phone = document.getElementById('phone').value;
	if (phone.length == 10) {
		document.getElementById('phoneError').innerHTML = "";
	}
	else {
		document.getElementById('phoneError').innerHTML = "Please  enter a valid Mobile Number";
		error = true;
	}

	const Email = document.getElementById("email").value;
	const valid3 = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
	if (Email.match(valid3)) {
		document.getElementById("emailError").innerHTML = " ";
	}
	else {
		document.getElementById("emailError").innerHTML = "Please enter valid email";
		error = true;
	}

	const date = document.getElementById('date').value;
	const currDate = new Date(new Date().setHours(0, 0, 0));
	const inputDate = new Date(date);
	if (inputDate >= currDate) {
		document.getElementById("dateError").innerHTML = " ";
	} else {
		document.getElementById("dateError").innerHTML = "Date must be greater or equal to today's Date";
		error = true;
	}

	const age = document.getElementById("age").value;
	if (isNaN(age) || age < 1 || age > 100) {
		document.getElementById("ageError").innerHTML = "Age must be a number between 1 and 100";
		error = true;
	}
	else {
		document.getElementById("ageError").innerHTML = " ";

	}

	const city = document.getElementById("city").value;
	if (city) {
		document.getElementById("cityError").innerHTML = " ";
	}
	else {
		document.getElementById("cityError").innerHTML = "Please enter a valid city name";
		error = true;

	}
	return error;
}

function payAndCreateAppointment(appointment, order) {
	var options = {
		"key": KEY_ID, // Enter the Key ID generated from the Dashboard
		"amount": "50000", // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
		"currency": "INR",
		"name": "Pooja's Clinic",
		"description": "Consulting fee",
		"image": "https://example.com/your_logo",
		"order_id": order.id,
		"handler": function (response) {
			// payment successful . now create appointment
			showLoader();
			axios({
				method: 'post',
				url: '/api/appointments',
				data: appointment
			}).then(function (response) {
				hideLoader();
				console.log(response);
				alert('appointment created. Your appointment number is ' + response.data);
				const formFields = document.getElementsByClassName('form-control');
				for (let i = 0; i < formFields.length; i++) {
					formFields[i].value = ''
				}
			}).catch(function (err) {
				hideLoader();
				alert(err.response.data);
			});
		},
		"prefill": {
			"name": appointment.name,
			"email": appointment.email,
			"contact": appointment.mobile
		},
		"notes": {
			"address": "Razorpay Corporate Office"
		},
		"theme": {
			"color": "#3399cc"
		}
	};
	var rzp1 = new Razorpay(options);
	rzp1.on('payment.failed', function (response) {
		console.log(response);
		alert("Payment failed. " + response.error.reason);
	});
	rzp1.open();
}

function showLoader() {
	document.getElementById('loader').style.display = 'block';
}

function hideLoader() {
	console.log("hideLoader");
	document.getElementById('loader').style.display = 'none';
}