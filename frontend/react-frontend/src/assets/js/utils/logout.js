import { clearAdminSessionArtifacts } from "./adminSession";

export function logout(){
    clearAdminSessionArtifacts();
    localStorage.removeItem("token");
    localStorage.removeItem("mockUser");
    window.location.href = "/login";
}
