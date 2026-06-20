import {Navigate, Outlet} from 'react-router-dom';
// Outlet here refers to the 'children' routes nested inside the wrapper

import { useAppData } from "../context/AppContext"

const PublicRoute=()=>{
    const {isAuth,loading}=useAppData();

    if(loading) return null;

    return isAuth? <Navigate to="/"/>:<Outlet/>

};

export default PublicRoute;

