import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../config/firebase";
import { PlusIcon, UserGroupIcon } from "@heroicons/react/24/outline";

interface Group {
  id: string;
  name: string;
  members: string[];
  lastActivity: Date;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const groupsRef = collection(db, "groups");
        const q = query(
          groupsRef,
          where("members", "array-contains", user.uid)
        );
        const querySnapshot = await getDocs(q);

        const groupsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          lastActivity: doc.data().lastActivity?.toDate() || new Date(),
        })) as Group[];

        setGroups(groupsData);
      } catch (error) {
        console.error("Error fetching groups:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            Welcome back!
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/scan")}
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            New Bill
          </motion.button>
        </div>
      </div>

      {/* Groups Section */}
      <div className="mt-8">
        <div className="md:flex md:items-center md:justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Your Groups
          </h3>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-3 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <UserGroupIcon className="-ml-1 mr-2 h-5 w-5" />
            Create Group
          </motion.button>
        </div>

        {loading ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 animate-pulse"
              >
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="space-y-3 mt-4">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {groups.map((group) => (
              <motion.div
                key={group.id}
                variants={item}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/groups/${group.id}`)}
                className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 cursor-pointer"
              >
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                  {group.name}
                </h4>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {group.members.length} members
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Last activity: {group.lastActivity.toLocaleDateString()}
                </p>
              </motion.div>
            ))}

            {groups.length === 0 && (
              <div className="col-span-full text-center py-12">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No groups
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Get started by creating a new group.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-12">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
          Quick Actions
        </h3>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/scan")}
            className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
              Scan New Bill
            </h4>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Upload or take a photo of your receipt
            </p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/balances")}
            className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
              View Balances
            </h4>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Check who owes what
            </p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/reminders")}
            className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
              Send Reminders
            </h4>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Remind friends about pending payments
            </p>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
