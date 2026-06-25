import { useEffect, useState } from "react";
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
  riderLocation: [number, number];
  deliveryLocation: [number, number];
}

interface RouteProps {
  from: [number, number];
  to: [number, number];
}

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

  if (route.length === 0) {
    return null;
  }

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

const UserOrderMap = ({
  riderLocation,
  deliveryLocation,
}: Props) => {

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
          <Popup>Rider</Popup>
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

export default UserOrderMap;