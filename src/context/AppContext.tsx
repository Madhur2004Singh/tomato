import { createContext, useEffect, useState, type ReactNode } from "react";
import { useContext } from "react";
import { authService, restaurantService } from "../main";
import axios from "axios";
import type { AppContextType, ICart, LocationData, User } from "../types";
import { Toaster } from "react-hot-toast";



const AppContext = createContext<AppContextType | undefined>(undefined);//This creates a global context object.
//Any component wrapped inside this provider can access values from it.

interface AppProviderProps {//Defines TypeScript types.
    children: ReactNode
}

export const AppProvider = ({ children }: AppProviderProps) => {//This component wraps your entire app.
    const [user, setUser] = useState<User | null>(null)//Stores logged-in user data.<> is used to determine type.
    const [isAuth, setIsAuth] = useState(false);//Tracks whether user is authenticated.
    const [loading, setLoading] = useState(true);//Tracks whether authentication check is still happening.

    const [location, setLocation] = useState<LocationData | null>(null);
    const [loadingLocation, setloadingLocation] = useState(false);
    const [city, setCity] = useState("Fetching Location...");

    // Now we will fetch the user

    async function fetchUser() {
        try {
            const token = localStorage.getItem("token");
            const { data } = await axios.get(`${authService}/api/auth/me`, { //This endpoint is commonly used to get the authenticated user's profile.
                headers: {
                    Authorization: `Bearer ${token}`,
                },

            });

            setUser(data);
            setIsAuth(true);
        } catch (error) {
            console.log(error);

        }
        finally {
            setLoading(false);
        }
    }

      const [cart, setCart] = useState<ICart[]>([]);
  const [subTotal, setSubTotal] = useState(0);
  const [quauntity, setQuauntity] = useState(0);

  async function fetchCart() {
    if (!user || user.role !== "customer") return;
    try {
      const { data } = await axios.get(`${restaurantService}/api/cart/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setCart(data.cart || []);
      setSubTotal(data.subtotal || 0);
      setQuauntity(data.cartLength);
    } catch (error) {
      console.log(error);
    }
  }

    useEffect(() => {
        fetchUser();
    }, []);// empty dependency error means this will render only once when the app starts.

    useEffect(() => {
    if (user && user.role === "customer") {
      fetchCart();
    }
  }, [user]);

    useEffect(()=>{
        if(!navigator.geolocation){
            return alert("Please Allow location to continue.");
        }
        setloadingLocation(true);
        navigator.geolocation.getCurrentPosition(async(position)=>{
            const {latitude,longitude}=position.coords;
            // We are using nominatiom location API here in this project for location.

            try {
                const res=await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const data=await res.json();
                setLocation({
                    latitude,
                    longitude,
                    formattedAddress:data.display_name || "current location"
                })

                setCity(data.address.city||data.address.town||data.address.village||"Your location");
            } catch (error) {
                setLocation({
                    latitude,
                    longitude,
                    formattedAddress:"current location"
                });
                setCity("Failed to Load.")
            }
            setloadingLocation(false);
        })
    },[]);

    return <AppContext.Provider value={{ isAuth, loading, setIsAuth, setLoading, setUser, user,location,loadingLocation,city,cart,
        fetchCart,
        quauntity,
        subTotal, }}>{children}
    
    <Toaster/>
    </AppContext.Provider>//This wraps all child components with access to global state.
    // Typescript checks - Does this object match AppContextType?
};

export const useAppData = (): AppContextType => {// Here we created a custom hook
    const context = useContext(AppContext)// this reads data from the global context
    if (!context) {
        throw new Error("useAppData must be used within AppProvider")// Otherwise it will return undefined!
    }

    return context;
}

/*
This code creates a global authentication and app state manager in your React application using React Context API.

It is mainly responsible for:

checking if a user is logged in
fetching the logged-in user from backend
storing auth state globally
making user data accessible throughout the app
managing loading state
preparing location-related state

Instead of passing user/auth data manually through props everywhere, you store it in a Context so any component can access it.
*/

/*
Step 1 → Context Created
const AppContext=createContext(undefined);

Creates global communication channel.

Step 2 → Provider Supplies Data
<AppContext.Provider value={{ user, isAuth }}>

Stores and shares state globally.

Step 3 → Hook Reads Data
const { user } = useAppData();

Any component can access shared data.
*/

/*
Here we mentioned 'children', children actually refers to what we mention inside <AppProvider> and </AppProvider>
For example <App/>
*/

/*
Every component can access the cart information through this appContext.
*/