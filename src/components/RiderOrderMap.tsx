import type { IOrder } from "../types";
import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import { realtimeService } from "../main";

const riderIcon = new L.DivIcon({
  html: "🛵",
  iconSize: [30, 30],
  className: "",
});

const deliveryIcon = new L.DivIcon({
  html: "📦",
  iconSize: [30, 30],
  className: "",
});

interface Props {
  order: IOrder;
}

interface RouteProps {
  from: [number, number];
  to: [number, number];
}

/**
 * Distance between two GPS coordinates in meters.
 * Used so that tiny GPS fluctuations don't trigger
 * unnecessary rerenders and API calls.
 */
const distanceInMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371000;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const RoutePolyline = ({ from, to }: RouteProps) => {
  const [route, setRoute] = useState<[number, number][]>([]);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;

        const { data } = await axios.get(url);

        if (!data.routes || data.routes.length === 0) {
          return;
        }

        const coordinates = data.routes[0].geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );

        setRoute(coordinates);
      } catch (err) {
        console.error("Unable to fetch route", err);
      }
    };

    fetchRoute();
  }, [from, to]);

  if (route.length === 0) return null;

  return (
    <Polyline
      positions={route}
      pathOptions={{
        color: "#E23744",
        weight: 5,
      }}
    />
  );
};

const RiderOrderMap = ({ order }: Props) => {
  const [riderLocation, setRiderLocation] = useState<
    [number, number] | null
  >(null);

  // Ignore tiny GPS fluctuations (<20 m)
  const MIN_DISTANCE = 20;

  if (
    order.deliveryAddress.latitude == null ||
    order.deliveryAddress.longitude == null
  ) {
    return null;
  }

  const deliveryLocation: [number, number] = [
    order.deliveryAddress.latitude,
    order.deliveryAddress.longitude,
  ];

  useEffect(() => {
    const fetchLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const latitude = pos.coords.latitude;
          const longitude = pos.coords.longitude;

          const newLocation: [number, number] = [
            latitude,
            longitude,
          ];

          let shouldUpdate = false;

          setRiderLocation((prev) => {
            if (!prev) {
              shouldUpdate = true;
              return newLocation;
            }

            const moved = distanceInMeters(
              prev[0],
              prev[1],
              latitude,
              longitude
            );

            if (moved >= MIN_DISTANCE) {
              shouldUpdate = true;
              return newLocation;
            }

            return prev;
          });

          // Rider hasn't moved enough.
          if (!shouldUpdate) return;

          try {
            await axios.post(
              `${realtimeService}/api/v1/internal/emit`,
              {
                event: "rider:location",
                room: `user:${order.userId}`,
                payload: {
                  latitude,
                  longitude,
                },
              },
              {
                headers: {
                  "x-internal-key":
                    import.meta.env.VITE_INTERNAL_SERVICE_KEY,
                },
              }
            );
          } catch (err) {
            console.error("Unable to emit rider location", err);
          }
        },
        (err) => {
          console.log("Location Error:", err);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000,
        }
      );
    };

    // Initial fetch
    fetchLocation();

    // Refresh every 10 seconds
    const interval = setInterval(fetchLocation, 10000);

    return () => clearInterval(interval);
  }, [order.userId]);

    if (!riderLocation) {
    return null;
  }

  return (
    <div className="rounded-xl bg-white shadow-sm p-3">
      <MapContainer
        center={riderLocation}
        zoom={14}
        className="h-87.5 w-full rounded-lg"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={riderLocation} icon={riderIcon}>
          <Popup>You (Rider)</Popup>
        </Marker>

        <Marker position={deliveryLocation} icon={deliveryIcon}>
          <Popup>Delivery Location</Popup>
        </Marker>

        <RoutePolyline
          from={riderLocation}
          to={deliveryLocation}
        />
      </MapContainer>
    </div>
  );
};

export default RiderOrderMap;