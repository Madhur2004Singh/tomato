import  { useState } from 'react'
import { useAppData } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { authService } from '../main';
import axios from 'axios';

type Role = "customer" | "rider" | "seller" | null;
const SelectRole = () => {
    const [role, setRole] = useState<Role>(null);
    const { setUser } = useAppData();
    const navigate = useNavigate();

    const roles: Role[] = ["customer", "rider", "seller"];//An array of selectable roles.

    //Usually used for rendering buttons/cards dynamically.

    const addRole = async () => {
        try {
            const { data } = await axios.put(`${authService}/api/auth/add/role`, { role },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                }
            );

            localStorage.setItem("token", data.token);// Stores the updated token.
            setUser(data.user);

            navigate("/", { replace: true });
            // replace:true prevents back button from returning to role selection page.
        } catch (error) {
            alert("Something went wrong!");
            console.log(error);

        }
    }
    return (
        <div className="flex min-h-screen items-center justify-center bg-white px-4">
            <div className='w-full max-w-sm space-y-6'>
                <h1 className='text-center text-2xt font-bold'>Choose One Role</h1>

                <div className='space-y-4'>
                    {
                        roles.map((r) => (
                            <button key={r} onClick={() => setRole(r)} className={`
                            w-full rounded-xl border px-4 py-3 text-sm font-medium capitalize transition 
                            ${role === r
                                    ? "border-[#E23744] bg-[#E23744] text-white"
                                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                }
                            `}>
                                Continue as {r}
                            </button>
                        ))
                    }
                </div>
                <button disabled={!role} onClick={addRole} className={`w-full rounded-xl px-4 py-3 text-sm 
                font-semibold transition ${role ? "border-[#E23744] bg-[#E23744] text-white hover:bg-[#d32f3a]" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}>Next</button>
            </div>
        </div>
    )
}

export default SelectRole
