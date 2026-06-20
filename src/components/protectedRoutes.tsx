import { Outlet, useLocation } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import { Navigate } from "react-router-dom"

const ProtectedRoute = () => {
    const { isAuth, user, loading } = useAppData();

    const location = useLocation();// Gives current location information, this can be '/login','/home','select-role'

    if (loading) return null;



    if (!isAuth) {
        return <Navigate to={"/login"} replace />
    }

    if (user?.role===null && location.pathname !== "/select-role") {
        return <Navigate to={"/select-role"} replace />;// This forces the authenticated user to select a role.
    }

    if (user?.role!==null && location.pathname === "/select-role") {
        return <Navigate to={"/"} replace />;
    }



    console.log("USER:", user);
    console.log("ROLE:", user?.role);
    console.log("PATH:", location.pathname);

    return <Outlet />;
    // If all checks passed then render actual protected page.
};

export default ProtectedRoute;

/*
It ensures:

Only logged-in users can access protected pages.
Users must select a role before using the app.
Users who already selected a role cannot revisit /select-role.
*/

