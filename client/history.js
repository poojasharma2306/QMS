let patients = [];
let today = new Date();

async function fetchPatients(startDate, endDate) {
    console.log(startDate, endDate)
    try {
        const result = await axios({
            method: 'GET',
            url: '/api/appointments',
            params: {
                start_date: startDate,
                end_date: endDate
            }
        });
        /*result = [
            {
                serial_number: 1,
                name: 'Pooja',
                age: 23,
                phone: '9992850880',
                status: 'No Show',
                visit_date: startDate,
            }, {
                serial_number: 2,
                name: 'Rajat',
                age: 23,
                phone: '8586936365',
                status: 'Ended',
                visit_date: startDate,
                timeTaken: 10
            }, {
                serial_number: 3,
                name: 'Chetna',
                age: 23,
                phone: '1234567890',
                status: 'Ended',
                visit_date: startDate,
                timeTaken: 10
            }, {
                serial_number: 4,
                name: 'John',
                age: 23,
                phone: '8586936364',
                status: 'Ended',
                visit_date: startDate,
                timeTaken: 5
            }, {
                serial_number: 3,
                name: 'Alicia',
                age: 23,
                phone: '1234567890',
                status: 'No Show',
                visit_date: startDate,
            }]*/
        return result.data;
    } catch (err) {
        console.log(err);
        alert('Something Went wrong. Try again');
    }
}

function renderData() {
    console.log("renderData", patients.length);
    document.getElementById('queue').innerHTML = ''
    let numAwaitingVisits = 0;
    let numNoShowVisits = 0;
    let numEndedVisits = 0;
    if (patients.length == 0) {
        alert("No appointments for this date");
        return false;
    }
    let totalTimeTaken = 0;
    patients.forEach(function (patient) {
        if (patient.status === 'Ended') {
            patient.timeTaken = Math.max(parseInt((new Date(patient.end_time).getTime() - new Date(patient.start_time).getTime()) / 60000), 1);
            totalTimeTaken += patient.timeTaken
        }
        numAwaitingVisits = patient.status === 'In Queue' ? numAwaitingVisits + 1 : numAwaitingVisits;
        numNoShowVisits = patient.status === 'No Show' || patient.status === 'Cancelled' ? numNoShowVisits + 1 : numNoShowVisits;
        numEndedVisits = patient.status === 'Ended' ? numEndedVisits + 1 : numEndedVisits;
        renderPatientInTable(patient);
    });
    console.log("numEndedVisits", numEndedVisits);
    document.getElementById('numNoShow').innerText = numNoShowVisits;
    document.getElementById('numEnded').innerText = numEndedVisits;
    document.getElementById('avgTime').innerText = numEndedVisits > 0 ? parseInt(totalTimeTaken / numEndedVisits) + ' mins' : 'NA';
}

async function getAppointmentsByDate() {
    const startDate = document.getElementById('startDate').value;
    let endDate = document.getElementById('endDate').value;
    if (new Date(startDate).getTime() >= new Date().getTime() || new Date(endDate).getTime() >= new Date().getTime()) {
        alert("Start/End date should be before current date");
        return false;
    }
    if (new Date(startDate).getTime() > new Date(endDate).getTime()) {
        alert("Start date should be less than end date");
        return false;
    }
    patients = await fetchPatients(startDate, endDate);
    console.log(patients);
    renderData();
}

function renderPatientInTable(patient) {
    const tbody = document.getElementById('queue');
    const row = tbody.insertRow();

    const cell1 = row.insertCell();
    cell1.innerHTML = patient.serial_number;

    const cell7 = row.insertCell();
    cell7.innerHTML = new Date(patient.visit_date).toLocaleDateString('en-GB').split('/').reverse().join('-')

    const cell2 = row.insertCell();
    cell2.innerHTML = patient.name;

    const cell3 = row.insertCell();
    cell3.innerHTML = patient.age;

    const cell4 = row.insertCell();
    cell4.innerHTML = patient.phone;

    const cell5 = row.insertCell();
    cell5.innerHTML = patient.status;

    const cell6 = row.insertCell();
    cell6.innerHTML = patient.timeTaken ? patient.timeTaken + ' mins' : 'NA'
}

function downloadCSV() {
    if (patients.length == 0) {
        alert("No patients in the list");
        return false;
    }
    const csvEntries = patients.map(function (patient) {
        return {
            'Appointment Number': patient.serial_number,
            'Visit Date': new Date(patient.visit_date).toLocaleDateString('en-GB').split('/').reverse().join('-'),
            'Name': patient.name,
            'Phone': patient.phone,
            'Age': patient.age,
            'Email': patient.email,
            'Status': patient.status,
            'Time Taken': patient.timeTaken ? patient.timeTaken + ' mins' : 'NA',
        }
    });
    // Empty array for storing the values
    csvRows = [];

    // Headers is basically a keys of an
    // object which is id, name, and
    // profession
    const headers = Object.keys(csvEntries[0]);

    // As for making csv format, headers 
    // must be separated by comma and
    // pushing it into array
    csvRows.push(headers.join(','));

    csvEntries.forEach(function (data) {
        const values = Object.values(data).join(',');
        csvRows.push(values)
    });

    // Returning the array joining with new line 
    const csvData = csvRows.join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });

    // Creating an object for downloading url
    const url = window.URL.createObjectURL(blob)

    // Creating an anchor(a) tag of HTML
    const a = document.createElement('a')

    // Passing the blob downloading url 
    a.setAttribute('href', url)

    // Setting the anchor tag attribute for downloading
    // and passing the download file name
    a.setAttribute('download', 'patient.csv');

    // Performing a download with click
    a.click()
}
