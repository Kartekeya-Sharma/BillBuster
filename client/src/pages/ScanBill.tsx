import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { createWorker } from "tesseract.js";
import {
  CameraIcon,
  DocumentIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface BillItem {
  name: string;
  price: number;
  assignedTo: string[];
}

const ScanBill: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [items, setItems] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // Create a preview URL for the image
      const imageUrl = URL.createObjectURL(file);
      setImage(imageUrl);

      // Initialize Tesseract worker
      const worker = await createWorker();
      await worker.loadLanguage("eng");
      await worker.initialize("eng");

      // Perform OCR
      const {
        data: { text },
      } = await worker.recognize(file);
      await worker.terminate();

      // Parse the OCR text to extract items and prices
      const parsedItems = parseBillText(text);
      setItems(parsedItems);
    } catch (err) {
      setError("Error processing the image. Please try again.");
      console.error("OCR Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png"],
    },
    maxFiles: 1,
  });

  const parseBillText = (text: string): BillItem[] => {
    // This is a simple parser - you might want to enhance it based on your needs
    const lines = text.split("\n").filter((line) => line.trim());
    const items: BillItem[] = [];

    for (const line of lines) {
      // Look for price patterns like $XX.XX or XX.XX
      const priceMatch = line.match(/\$?\d+\.\d{2}/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[0].replace("$", ""));
        const name = line.replace(priceMatch[0], "").trim();
        if (name) {
          items.push({
            name,
            price,
            assignedTo: [],
          });
        }
      }
    }

    return items;
  };

  const handleAssignItem = (index: number, userId: string) => {
    setItems((prevItems) => {
      const newItems = [...prevItems];
      const item = newItems[index];
      const assignedTo = new Set(item.assignedTo);

      if (assignedTo.has(userId)) {
        assignedTo.delete(userId);
      } else {
        assignedTo.add(userId);
      }

      newItems[index] = {
        ...item,
        assignedTo: Array.from(assignedTo),
      };

      return newItems;
    });
  };

  const handleSaveBill = async () => {
    // TODO: Implement saving to Firestore
    console.log("Saving bill:", items);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            Scan Bill
          </h2>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Upload Section */}
        <div>
          <div
            {...getRootProps()}
            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg ${
              isDragActive
                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                : "border-gray-300 dark:border-gray-600"
            }`}
          >
            <div className="space-y-1 text-center">
              {image ? (
                <div className="relative">
                  <img
                    src={image}
                    alt="Uploaded bill"
                    className="max-h-96 rounded-lg"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setImage(null);
                      setItems([]);
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <>
                  <CameraIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
                      <span>Upload a file</span>
                      <input {...getInputProps()} className="sr-only" />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG, JPEG up to 10MB
                  </p>
                </>
              )}
            </div>
          </div>

          {loading && (
            <div className="mt-4 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Processing image...
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Items List */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Bill Items
          </h3>
          {items.length > 0 ? (
            <div className="mt-4 space-y-4">
              {items.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 shadow rounded-lg p-4"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {/* TODO: Add user selection UI */}
                      <button
                        onClick={() => handleAssignItem(index, "user1")}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.assignedTo.includes("user1")
                            ? "bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                        }`}
                      >
                        You
                      </button>
                      <button
                        onClick={() => handleAssignItem(index, "user2")}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.assignedTo.includes("user2")
                            ? "bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                        }`}
                      >
                        Friend
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveBill}
                className="w-full mt-6 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Save Bill
              </motion.button>
            </div>
          ) : (
            <div className="mt-4 text-center py-12 bg-white dark:bg-gray-800 shadow rounded-lg">
              <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No items detected
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Upload a bill to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanBill;
