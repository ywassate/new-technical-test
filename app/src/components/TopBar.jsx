import React, { Fragment } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Transition } from "@headlessui/react";
import { TbLogout, TbUser, TbSettings, TbBell } from "react-icons/tb";

import useStore from "@/services/store";
import api from "@/services/api";

const TopBar = () => {
  const location = useLocation();

  // Get page title based on route
  const getPageTitle = () => {
    if (location.pathname === "/") return "Tableau de Bord";
    if (location.pathname === "/projects") return "Mes Projets";
    if (location.pathname.startsWith("/project/")) return "Détails du Projet";
    return "Budget Tracker";
  };

  return (
    <div className="w-full h-full flex items-center justify-between px-6 border-b bg-white border-gray-200">
      {/* Page Title */}
      <div className="flex items-center space-x-4">
        <h2 className="text-2xl font-bold text-gray-800">{getPageTitle()}</h2>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-2">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg transition hover:bg-gray-100">
          <TbBell className="text-xl text-gray-700" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Profile Menu */}
        <ProfileMenu />
      </div>
    </div>
  );
};

const ProfileMenu = () => {
  const { user, setUser } = useStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/user/logout");
    } catch (error) {
      console.error("Logout error:", error);
    }
    setUser(null);
    api.removeToken();
    navigate("/auth");
  };

  // Get user initials
  const getInitials = () => {
    if (user.name) {
      const names = user.name.split(" ");
      if (names.length >= 2) return `${names[0][0]}${names[1][0]}`.toUpperCase();
      return user.name.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <Menu as="div" className="relative flex items-center">
      <Menu.Button className="flex items-center space-x-3 rounded-lg p-2 transition hover:bg-gray-100">
        {user.avatar ? (
          <img className="h-10 w-10 rounded-full border-2 border-blue-500 object-cover" src={user.avatar} alt="" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">{getInitials()}</div>
        )}
        <div className="hidden md:block text-left">
          <div className="text-sm font-semibold text-gray-800">{user.name || "Utilisateur"}</div>
          <div className="text-xs text-gray-500">{user.email}</div>
        </div>
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95">
        <Menu.Items className="absolute top-14 right-0 w-64 rounded-lg shadow-xl border p-2 z-50 bg-white border-gray-200">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b mb-2 border-gray-200">
            <div className="font-semibold text-gray-800">{user.name || "Utilisateur"}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
            {user.organisation_name && <div className="text-xs text-blue-500 mt-1">{user.organisation_name}</div>}
          </div>

          {/* Menu Items */}
          <Menu.Item>
            {({ active }) => (
              <button
                className={`w-full flex items-center space-x-3 rounded-lg px-4 py-2 text-sm transition ${
                  active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                }`}
                onClick={() => navigate("/profile")}>
                <TbUser className="text-xl" />
                <span>Mon Profil</span>
              </button>
            )}
          </Menu.Item>

          <Menu.Item>
            {({ active }) => (
              <button
                className={`w-full flex items-center space-x-3 rounded-lg px-4 py-2 text-sm transition ${
                  active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                }`}
                onClick={() => navigate("/settings")}>
                <TbSettings className="text-xl" />
                <span>Paramètres</span>
              </button>
            )}
          </Menu.Item>

          <div className="border-t my-2 border-gray-200"></div>

          <Menu.Item>
            {({ active }) => (
              <button
                className={`w-full flex items-center space-x-3 rounded-lg px-4 py-2 text-sm transition ${active ? "bg-red-50 text-red-600" : "text-red-500"}`}
                onClick={handleLogout}>
                <TbLogout className="text-xl" />
                <span className="font-medium">Se déconnecter</span>
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default TopBar;
