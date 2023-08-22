const loggedInUser = localStorage.getItem('user');
if (!loggedInUser) {
    alert("This page requires staff access");
    window.location.href = `/login?source=queue`;
}