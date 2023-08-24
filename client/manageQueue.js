let patients = [];
let today = new Date();

async function fetchPatients(date) {
    try {
        const result = await axios({
            method: 'GET',
            url: '/api/appointments',
            params: {
                start_date: date,
                end_date: date
            }
        })
        // return [{
        //     serial_number: 1,
        //     name: 'Pooja',
        //     age: 23,
        //     phone: '9992850880',
        //     status: 'In Progress',
        //     visit_date: date
        // }, {
        //     serial_number: 2,
        //     name: 'Rajat',
        //     age: 23,
        //     phone: '8586936365',
        //     status: 'In Queue',
        //     visit_date: date
        // }, {
        //     serial_number: 3,
        //     name: 'Chetna',
        //     age: 23,
        //     phone: '1234567',
        //     status: 'In Queue',
        //     visit_date: date
        // }]
        return result.data;
    } catch (e) {
        alert("An error occurred. Please try again");
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
    // Assuming the list is sorted, the first entry with "In Queue" status will be next patient in Queue
    const nextPatientInQueue = patients.find(function (patient) {
        return patient.status == 'In Queue'
    });
    if (nextPatientInQueue) {
        nextPatientInQueue.isNextInQueue = true;
    }
    let index = 0;
    patients.forEach(function (patient) {
        numAwaitingVisits = patient.status === 'In Queue' ? numAwaitingVisits + 1 : numAwaitingVisits;
        numNoShowVisits = patient.status === 'No Show' ? numNoShowVisits + 1 : numNoShowVisits;
        numEndedVisits = patient.status === 'Ended' ? numEndedVisits + 1 : numEndedVisits;
        if (patient.status === 'In Queue' || patient.status === 'In Progress') {
            renderPatientInTable(patient, index);
            index++;
        }
    });
    document.getElementById('numAwaiting').innerText = numAwaitingVisits;
    document.getElementById('numNoShow').innerText = numNoShowVisits;
    document.getElementById('numEnded').innerText = numEndedVisits;
}

async function loadPage() {
    //set date to today by default;
    today = new Date().toLocaleDateString('en-GB').split('/').reverse().join('-');
    document.getElementById('date').value = today;
    patients = await fetchPatients(today);
    renderData();
}

async function getAppointmentsByDate() {
    const inputDate = document.getElementById('date').value;
    if (new Date(inputDate).getTime() < new Date(today).getTime()) {
        alert("Selected date can't be before current date");
        return false;
    }
    patients = await fetchPatients(inputDate);
    renderData();
}

function renderPatientInTable(patient, index) {
    const tbody = document.getElementById('queue');
    const row = tbody.insertRow();

    const cell1 = row.insertCell();
    cell1.innerHTML = patient.serial_number;

    const cell2 = row.insertCell();
    cell2.innerHTML = patient.name;

    const cell3 = row.insertCell();
    cell3.innerHTML = patient.age;

    const cell4 = row.insertCell();
    cell4.innerHTML = patient.phone;

    const cell5 = row.insertCell();
    cell5.innerHTML = patient.status;

    const cell6 = row.insertCell();
    const startVisitBtn = document.createElement('button');
    startVisitBtn.innerHTML = 'Start Visit';
    startVisitBtn.classList.add('btn', 'btn-primary', 'btn-sm', !patient.isNextInQueue || new Date(patient.visit_date).getTime() > new Date(today).getTime() || index > 0 || patient.status == 'In Progress' ? 'disabled' : 'none');
    startVisitBtn.onclick = function () {
        startVisit(patient);
    }
    cell6.appendChild(startVisitBtn);

    const cell7 = row.insertCell();
    const endVisitBtn = document.createElement('button');
    endVisitBtn.innerHTML = 'End Visit';
    endVisitBtn.classList.add('btn', 'btn-success', 'btn-sm', patient.status !== 'In Progress' || new Date(patient.visit_date).getTime() > new Date(today).getTime() ? 'disabled' : 'none');
    endVisitBtn.onclick = function () {
        endVisit(patient)
    }
    cell7.appendChild(endVisitBtn);

    const cell8 = row.insertCell();
    const noShowBtn = document.createElement('button');
    noShowBtn.innerHTML = 'No Show';
    noShowBtn.classList.add('btn', 'btn-danger', 'btn-sm', !patient.isNextInQueue || new Date(patient.visit_date).getTime() > new Date(today).getTime() || index > 0 || patient.status == 'In Progress' ? 'disabled' : 'none');
    noShowBtn.onclick = function () {
        markVisitAsNoShow(patient)
    };
    cell8.appendChild(noShowBtn);
}

async function startVisit(patient) {
    try {
        await axios({
            method: 'POST',
            url: '/api/appointments/status',
            data: {
                status: 'In Progress',
                visit_date: new Date(patient.visit_date).toLocaleDateString('en-GB').split('/').reverse().join('-'),
                phone: patient.phone
            }
        });
        alert('Starting visit successful');
        patient.status = 'In Progress';
        renderData();
    } catch (err) {
        console.log(err);
        alert("There was an error. Please try again")
    }
}

async function endVisit(patient) {
    try {
        await axios({
            method: 'POST',
            url: '/api/appointments/status',
            data: {
                status: 'Ended',
                visit_date: new Date(patient.visit_date).toLocaleDateString('en-GB').split('/').reverse().join('-'),
                phone: patient.phone
            }
        });
        alert('Ended Visit');
        patient.status = 'Ended';
        renderData();
    } catch (err) {
        console.log(err);
        alert("There was an error. Please try again")
    }
}

async function markVisitAsNoShow(patient) {
    try {
        await axios({
            method: 'POST',
            url: '/api/appointments/status',
            data: {
                status: 'No Show',
                visit_date: new Date(patient.visit_date).toLocaleDateString('en-GB').split('/').reverse().join('-'),
                phone: patient.phone
            }
        });
        alert('Marked as No Show');
        patient.status = 'No Show';
        renderData();
    } catch (err) {
        console.log(err);
        alert("There was an error. Please try again")
    }
}