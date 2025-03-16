import React, { useState } from "react";

const UserProfile = () => {
  // State for Profile
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@college.edu");
  const [phone, setPhone] = useState("+1 (123) 456-7890");
  const [collegeId, setCollegeId] = useState("CS2023001");
  const [department, setDepartment] = useState("Computer Science");
  const [memberSince, setMemberSince] = useState("March 2023");

  // State for Addresses
  const [addresses, setAddresses] = useState([
    {
      id: 1,
      name: "Main Campus - Building A",
      address: "123 University Ave, Room 101",
    },
    {
      id: 2,
      name: "Student Dorms - Block C",
      address: "456 College Street, Room 203",
    },
  ]);

  // State for Notifications
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: true,
    newArrivals: true,
    emailNotifications: true,
  });

  // Save Profile Changes
  const handleSaveProfile = () => {
    console.log("Profile Saved:", {
      name,
      email,
      phone,
      collegeId,
      department,
      memberSince,
    });
  };

  // Save Address Changes
  const handleSaveAddress = (id, newAddress) => {
    const updatedAddresses = addresses.map((addr) =>
      addr.id === id ? { ...addr, address: newAddress } : addr
    );
    setAddresses(updatedAddresses);
    console.log("Addresses Updated:", updatedAddresses);
  };

  // Toggle Notifications
  const handleToggleNotification = (key) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
    console.log("Notifications Updated:", {
      ...notifications,
      [key]: !notifications[key],
    });
  };

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      {/* Profile Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h1 className="text-2xl font-bold text-blue-900 mb-4">
          Account Information
        </h1>
        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* College ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              College ID
            </label>
            <input
              type="text"
              value={collegeId}
              onChange={(e) => setCollegeId(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Department
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Member Since */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Member Since
            </label>
            <input
              type="text"
              value={memberSince}
              onChange={(e) => setMemberSince(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <button
              className="mt-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              onClick={() => console.log("Change Password Clicked")}
            >
              Change Password
            </button>
          </div>

          {/* Danger Zone */}
          <div>
            <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
            <button
              className="mt-1 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
              onClick={() => console.log("Delete Account Clicked")}
            >
              Delete Account
            </button>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveProfile}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Save Profile Changes
          </button>
        </div>
      </div>

      {/* Addresses Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h1 className="text-2xl font-bold text-blue-900 mb-4">
          Saved Addresses
        </h1>
        <div className="space-y-4">
          {addresses.map((addr) => (
            <div key={addr.id}>
              <h3 className="text-lg font-semibold text-gray-800">
                {addr.name}
              </h3>
              <input
                type="text"
                value={addr.address}
                onChange={(e) => handleSaveAddress(addr.id, e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-blue-900 mb-4">
          Notification Preferences
        </h1>
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={notifications.orderUpdates}
              onChange={() => handleToggleNotification("orderUpdates")}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span className="text-gray-700">Order Updates</span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={notifications.promotions}
              onChange={() => handleToggleNotification("promotions")}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span className="text-gray-700">Promotions</span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={notifications.newArrivals}
              onChange={() => handleToggleNotification("newArrivals")}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span className="text-gray-700">New Arrivals</span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={notifications.emailNotifications}
              onChange={() => handleToggleNotification("emailNotifications")}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span className="text-gray-700">Email Notifications</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
