"use client";
import { useRouter } from "next/navigation";
import React, { useState, FormEvent } from "react";
import { useEffect } from "react";
import Nav from "@/components/navbar";
import ProtectedRoute from "@/components/ProtectedRoute";

/**
 * 
 * Sources used: 
 * https://webdev2-git-dv-dereksaits-projects.vercel.app/week-12/api-implementation 
 * https://github.com/warsylewicz/webdev2/blob/main/pages/week-12/api-implementation.mdx 
 */


type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export default function page() {
  const [users, setUsers] = useState([] as User[]);
  const [selectedUser, setSelectedUser] = useState({} as User);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "" });
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fetch all users
  const getUsers = async (): Promise<User[]> => {
    const response = await fetch("/api/users");
    const data = await response.json();
    return data;
  };

  const updateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Send a PUT request to update the user
    await fetch(`/api/users/${selectedUser?.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(selectedUser),
    });
    const users = await getUsers();
    setUsers(users);
    setSelectedUser({} as User);
    setIsAddingUser(false);
    setIsEditingUser(false);
  };

  const addUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Send a POST request to add a new user
    await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...newUser, role: "user" }),
    });
    const users = await getUsers();
    setUsers(users);
    setNewUser({ name: "", email: "", role: "" });
    setIsAddingUser(false);
    setIsEditingUser(false);
  };

  //Delete a user
  const deleteUser = async (id: number) => {
    await fetch(`/api/users/${id}`, {
      method: "DELETE",
    });
    setSelectedUser({} as User);
    const users = await getUsers();
    setUsers(users);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const users = await getUsers();
      setUsers(users);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const handleAddUser = () => {
    setIsAddingUser(true);
  };

  const handleCancel = () => {
    setIsAddingUser(false);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditingUser(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  } else {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
        <div className="flex">
          <Nav />
          <div className="px-6 w-full">
            <h1>Manage Users</h1>
            <div className="flex justify-between">
              <input
                type="text"
                className="border border-gray-800 text-black"
                placeholder="Search by name"
                onChange={(e) => {
                  const query = e.target.value.toLowerCase();
                  if (query) {
                    const filteredUsers = users.filter((user) =>
                      user.name.toLowerCase().includes(query)
                    );
                    setUsers(filteredUsers);
                  } else {
                    getUsers().then(setUsers);
                  }
                }}
              />
              <div>
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                  onClick={handleAddUser}
                >
                  Add User
                </button>
              </div>
            </div>

          <table className="border-collapse border border-gray-800 w-full">
            <thead>
              <tr className="">
                <th className="border border-gray-800 p-2">Name</th>
                <th className="border border-gray-800 p-2">ID</th>
                <th className="border border-gray-800 p-2">Email</th>
                <th className="border border-gray-800 p-2">Role</th>
                <th className="border border-gray-800 p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-600">
                  <td className="border border-gray-700 p-2 text-center">
                    {user.name}
                  </td>
                  <td className="border border-gray-700 p-2 text-center">
                    {user.id}
                  </td>
                  <td className="border border-gray-700 p-2 text-center">
                    {user.email}
                  </td>
                  <td className="border border-gray-700 p-2 text-center">
                    {user.role}
                  </td>
                  <td className="border border-gray-700 p-2 text-center space-x-2">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                    >
                      Modify
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {isAddingUser && (
            <div>
              <h2>Add User</h2>
              <form onSubmit={addUser}>
                <input
                  type="text"
                  required
                  className="border border-gray-800 text-black"
                  placeholder="Name"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                />
                <input
                  type="email"
                  required
                  className="border border-gray-800 text-black"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                />
                <select
                  required
                  className="border border-gray-800 text-black"
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                >
                  <option value="">Select Role</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                  type="submit"
                >
                  Add User
                </button>
                <button
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </form>
            </div>
          )}

            {isEditingUser && selectedUser && (
              <div>
                <h2>Edit User</h2>
                <form onSubmit={updateUser}>
                  <input
                    type="text"
                    required
                    className="border border-gray-800 text-black"
                    placeholder="Name"
                    value={selectedUser.name}
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, name: e.target.value })
                    }
                  />
                  <input
                    type="email"
                    required
                    className="border border-gray-800 text-black"
                    placeholder="Email"
                    value={selectedUser.email}
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, email: e.target.value })
                    }
                  />
                  <select
                    required
                    className="border border-gray-800 text-black"
                    value={selectedUser.role}
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, role: e.target.value })
                    }
                  >
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </select>
                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                    type="submit"
                  >
                    Save Changes
                  </button>
                  <button
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </ProtectedRoute>
    );
  }
}