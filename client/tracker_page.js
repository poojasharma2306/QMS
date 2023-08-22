async function sendData() {
	let err = validateForm();
	if (err == true) {
		return false;
	}
	let get_status = {
		mobile: document.getElementById("phone").value,
		visit_date: document.getElementById("date").value,
	}
	document.getElementById('result').style.display = 'none !important';
	// console.log(get_status); 
	try {
		// console.log(hello);
		const response = await axios({
			method: 'get',
			url: '/api/status',
			params: get_status
		});
		const result = response.data;
		// console.log(result);
		if (result.userSerialNumber == 0) {
			document.getElementById("demo").innerHTML = "You dont have any pending appointment for this date";
		}
		else {
			document.getElementById('cancel').style.display = 'block';
			document.getElementById('demo').innerHTML = 'Current Appointment Number: ' + (result.currentSerialNumber || 'Not Started Yet');
			document.getElementById('demo1').innerHTML = 'Your Appointment Number: ' + result.userSerialNumber;
			if (result.average_time) {
				document.getElementById('eta').innerHTML = 'Estimated time : ' + parseInt(result.average_time * (result.userSerialNumber - result.currentSerialNumber)) + ' mins';
			} else {
				document.getElementById('eta').innerHTML = '';
			}
		}
		document.getElementById('result').style.display = 'block';
	}
	catch (e) {
		console.log(e);
		alert('Something went wrong');
	}
}

function validateForm() {
	let error = false;
	var phone = document.getElementById('phone').value;
	if (phone.length == 10) {
		document.getElementById('phoneError').innerHTML = "";
	}
	else {
		document.getElementById('phoneError').innerHTML = "Please  enter a valid Mobile Number";
		error = true;
	}

	const date = document.getElementById('date').value;
	const currDate = new Date(new Date().setHours(0, 0, 0));
	const inputDate = new Date(date);
	if (inputDate >= currDate) {
		document.getElementById("dateError").innerHTML = " ";
	}
	else {
		document.getElementById("dateError").innerHTML = "Date must be greater or equal to today's Date"
		error = true;
	}
	return error;
}

async function cancel() {
	try {
		const date = document.getElementById('date').value;
		const currDate = new Date(new Date().setHours(5, 30, 0));
		const inputDate = new Date(date);
		console.log(inputDate, currDate);
		if (inputDate <= currDate) {
			alert("Appointment should be cancelled atleast one day before");
			return false;
		}
		const response = await axios({
			method: 'post',
			url: '/api/appointments/status',
			data: {
				status: "Cancelled",
				phone: document.getElementById("phone").value,
				visit_date: document.getElementById("date").value
			}
		});
		document.getElementById("result").style.display = "none !important";
		alert("Appointment Cancelled");
		window.location.reload();
	}
	catch (e) {
		console.log(e);
		alert('Something went wrong');
	}
} 