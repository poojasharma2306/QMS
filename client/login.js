async function login() {
    const username = document.getElementById('username').value
    const password = document.getElementById('password').value
    try {
        showLoader();
        const result = await axios({
            method: 'POST',
            url: 'api/login',
            data: {
                username: username,
                password: password
            }
        })
        localStorage.setItem('user', result.data.toString())
        window.location.href = '/queue';
    } catch (e) {
        alert(e.response?.data || 'Something Went wrong');
        hideLoader();
    }
}

function showLoader() {
    document.getElementById('loader').style.display = 'block';
}

function hideLoader() {
    console.log("hideLoader");
    document.getElementById('loader').style.display = 'none';
}