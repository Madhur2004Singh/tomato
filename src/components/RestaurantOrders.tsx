import { useEffect, useRef, useState } from "react";
import type { IOrder } from "../types";
import { useSocket } from "../context/SocketContext";
import audio from "../assets/quack.wav"
import axios from "axios";
import { restaurantService } from "../main";
import OrderCard from "./OrderCard";

const ACTIVE_STATUSES = [// These are all the status the restaurant can assign or are in their hand.
    "placed",
    "accepted",
    "preparing",
    "ready_for_rider",
    "rider_assigned",
    "picked_up",
];

const RestaurantOrders = ({ restaurantId }: { restaurantId: string }) => {
    const [orders, setOrders] = useState<IOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [audioUnlocked, setAudioUnlocked] = useState(false);// This flag tracks wheter the sound persmissionis provided on the browser

    const { socket } = useSocket();// gets a shared socket connection.
    const audioRef = useRef<HTMLAudioElement | null>(null);// Stores the audio object without causing re-renders

    useEffect(() => {
        audioRef.current = new Audio(audio);//   Stores audio without rerenders.
        audioRef.current.load();
    }, []);

    const unlockAudio = () => {// This is like enable notification setting.
        if (audioRef.current) {
            audioRef.current
                .play()
                .then(() => {
                    audioRef.current!.pause();
                    audioRef.current!.currentTime = 0;// This is used to reset the audio
                    setAudioUnlocked(true);
                    console.log("Audio unlocked");
                })
                .catch((err) => {
                    console.log("Failed to unlock audio: ", err);
                });
        }
    };

    const fetchOrders = async () => {
        try {
            const { data } = await axios.get(
                `${restaurantService}/api/order/restaurant/${restaurantId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            setOrders(data.orders || []);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [restaurantId]);

    useEffect(() => {
        if (!socket) return;

        const onNewOrder = () => {
            console.log("New Order recived socket");

            if (audioUnlocked && audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch((err) => {
                    console.error("Audio play failed:", err);
                });
            }

            fetchOrders();
        };

        socket.on("order:new", onNewOrder);

        return () => {
            socket.off("order:new", onNewOrder);
        };
    }, [socket, audioUnlocked]);

    useEffect(() => {
        if (!socket) return;

        const onUpdateOrder = () => {
            fetchOrders();
        };

        socket.on("order:rider_assigned", onUpdateOrder);

        return () => {
            socket.off("order:rider_assigned", onUpdateOrder);
        };
    }, [socket]);

    if (loading) {
        return <p className="text-gray-500">Loading Orders</p>;
    }

    const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
    const completedOrders = orders.filter(
        (o) => !ACTIVE_STATUSES.includes(o.status)
    );
    return (
        <div className="space-y-6">
            {!audioUnlocked && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🔔</span>
                        <div>
                            <p className="font-medium text-blue-900">
                                Enable Sound Notification
                            </p>
                            <p className="text-sm text-blue-700">
                                Get Notified when new orders arrive
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={unlockAudio}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
                    >
                        Enable sound
                    </button>
                </div>
            )}

            {/* Active orders */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold">Active Orders</h3>

                {activeOrders.length === 0 ? (
                    <p className="text-sm text-gray-500">No Acitve orders</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeOrders.map((order) => (
                            <OrderCard
                                key={order._id}
                                order={order}
                                onStatusUpdate={fetchOrders}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-3">
                <h3 className="text-lg font-semibold">Completed Orders</h3>

                {completedOrders.length === 0 ? (
                    <p className="text-sm text-gray-500">No completed orders</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {completedOrders.map((order) => (
                            <OrderCard
                                key={order._id}
                                order={order}
                                onStatusUpdate={fetchOrders}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RestaurantOrders;

/*
This component is essentially the restaurant's live order dashboard. It:

Fetches all orders for a restaurant.
Displays them in Active Orders and Completed Orders sections.
Listens to Socket.IO events for new orders and order updates.
Plays a notification sound when a new order arrives.
Allows refreshing after status changes.
*/
