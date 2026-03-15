export function logout(){
    localStorage.removeItem("token");
    localStorage.removeItem("mockUser");
    window.location.href = "/login";
}