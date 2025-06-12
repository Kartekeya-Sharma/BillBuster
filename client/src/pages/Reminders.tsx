import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, getFCMToken } from "../config/firebase";
import { BellIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";

interface Reminder {
  id: string;
  recipientId: string;
  recipientName: string;
  amount: number;
  message: string;
  timestamp: any;
  status: string;
}

interface User {
  id: string;
  name: string;
  fcmToken?: string;
}

const Reminders: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersQuery = query(collection(db, "users"));
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as User[];
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    const fetchReminders = async () => {
      try {
        const remindersQuery = query(
          collection(db, "reminders"),
          where("status", "==", "pending")
        );
        const remindersSnapshot = await getDocs(remindersQuery);
        const remindersData = remindersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Reminder[];
        setReminders(remindersData);
      } catch (error) {
        console.error("Error fetching reminders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    fetchReminders();
  }, []);

  const handleSendReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !amount || !message) return;

    setSending(true);
    try {
      // Get recipient's FCM token
      const recipient = users.find((u) => u.id === selectedUser);
      if (!recipient?.fcmToken) {
        throw new Error("Recipient not found or has no FCM token");
      }

      // Save reminder to Firestore
      const reminderData = {
        recipientId: selectedUser,
        recipientName: recipient.name,
        amount: parseFloat(amount),
        message,
        timestamp: serverTimestamp(),
        status: "pending",
      };

      const reminderRef = await addDoc(
        collection(db, "reminders"),
        reminderData
      );

      // Send FCM notification
      const response = await fetch("/api/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: recipient.fcmToken,
          title: "Payment Reminder",
          body: message,
          data: {
            amount,
            reminderId: reminderRef.id,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send notification");
      }

      // Update local state
      setReminders((prev) => [
        {
          id: reminderRef.id,
          ...reminderData,
        } as Reminder,
        ...prev,
      ]);
      setAmount("");
      setMessage("");
      setSelectedUser("");
    } catch (error) {
      console.error("Error sending reminder:", error);
      alert("Failed to send reminder. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Send Reminders</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Send Reminder Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Send New Reminder</h2>
            <form onSubmit={handleSendReminder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select User
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter reminder message"
                  rows={3}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {sending ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                    Send Reminder
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Recent Reminders */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Reminders</h2>
            {reminders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No recent reminders
              </p>
            ) : (
              <div className="space-y-4">
                {reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="border border-gray-200 rounded-md p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">
                          {reminder.recipientName}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {reminder.message}
                        </p>
                      </div>
                      <span className="text-lg font-semibold text-blue-500">
                        ${reminder.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {reminder.timestamp?.toDate().toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Reminders;
