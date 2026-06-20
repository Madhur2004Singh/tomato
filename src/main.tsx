import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AppProvider } from './context/AppContext.tsx';
import "leaflet/dist/leaflet.css"
import { SocketProvider } from './context/SocketContext.tsx';

export const authService="https://tomato-auth-8bqw.onrender.com";
export const restaurantService="https://restaurant-service-mnp6.onrender.com";
export const utilsService="https://tomato-utils-ltp4.onrender.com";
export const realtimeService="https://realtime-service-4qk5.onrender.com";
export const riderService="https://rider-service-ngwh.onrender.com";
export const adminService="https://tomato-admin-a91x.onrender.com";



createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="427004247326-cd41a70sk2f90d3dsaqg87ddtrb6or48.apps.googleusercontent.com">
      <AppProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
        
        </AppProvider>
      
      
      </GoogleOAuthProvider>
    
  </StrictMode>,
)
