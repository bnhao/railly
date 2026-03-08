import React, { useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (
    title: string,
    description: string,
    startDate: string,
    startTime: string,
    endDate: string,
    endTime: string,
    assignedTo: number,
    priority: string,
    status: string,
    trackID: string
  ) => void;
}

export default function Modal({ isOpen, onClose, onAddTask }: ModalProps) {
  const [inputValue, setInputValue] = useState("");
  const [textareaValue, setTextareaValue] = useState("");
  const [trackId, setTrackId] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [assignedTo, setAssignedTo] = useState(0);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<User[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue || !textareaValue || !trackId || !startDate || !startTime || !endDate || !endTime || !assignedTo || !priority || !status) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    onAddTask(inputValue, textareaValue, startDate, startTime, endDate, endTime, assignedTo, priority, status, trackId);
    setInputValue("");
    setTextareaValue("");
    setTrackId("");
    setStartDate("");
    setStartTime("");
    setEndDate("");
    setEndTime("");
    setAssignedTo(0);
    setPriority("");
    setStatus("");
    onClose(); // Close the modal after saving
  };
  const getUsers = async (): Promise<User[]> => {
    const response = await fetch("/api/users");
    const data = await response.json();
    return data;
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const users = await getUsers();
      setUsers(users);
    };

    fetchUsers();
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="absolute right-0 top-0 h-full w-1/3 bg-gray-800 p-8 shadow-lg">
        <form onSubmit={handleSubmit}>
          <div className="space-y-12">
            <div className="border-b border-gray-900/10 pb-12">
              <h2 className="font-medium text-center text-xl text-white">
                Add Task
              </h2>
              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}
              <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <div className="mt-2">
                    <div className="flex items-center rounded-md bg-white pl-3 outline outline-1 -outline-offset-1 outline-gray-300 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
                      <input
                        id="title"
                        name="username"
                        type="text"
                        placeholder="Add a title"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="block min-w-0 grow py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-800 focus:outline focus:outline-0 sm:text-sm/6"
                      />
                    </div>
                  </div>
                </div>

                <div className="col-span-full">
                  <div className="mt-2">
                    <textarea
                      id="about"
                      name="about"
                      rows={4}
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 placeholder:text-gray-800 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      value={textareaValue}
                      onChange={(e) => setTextareaValue(e.target.value)}
                      placeholder="Add task description"
                    />
                  </div>
                </div>
                <div className="col-span-full">
                  <div className="mt-2">
                    <label className="block text-sm font-medium leading-6 text-white">
                      Track ID
                    </label>
                    <textarea
                      id="trackID"
                      name="trackID"
                      rows={1}
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 placeholder:text-gray-800 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      value={trackId}
                      onChange={(e) => setTrackId(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="col-span-full mt-4">
                <label className="block text-sm font-medium leading-6 text-white">
                  Start Date and Time
                </label>
                <div className="mt-2 flex gap-4">
                  <input
                    type="date"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 placeholder:text-gray-800 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <input
                    type="time"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 placeholder:text-gray-800 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-span-full mt-4">
                <label className="block text-sm font-medium leading-6 text-white">
                  End Date and Time
                </label>
                <div className="mt-2 flex gap-4">
                  <input
                    type="date"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 placeholder:text-gray-800 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  <input
                    type="time"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 placeholder:text-gray-800 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-span-full mt-4">
                <label
                  htmlFor="users"
                  className="block text-sm font-medium leading-6 text-white"
                >
                  Assign User
                </label>
                <div className="mt-2">
                  <select
                    name="users"
                    id="users"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(Number(e.target.value))}
                  >
                    <option value={0}>Select a user</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-span-full mt-4">
                <label
                  htmlFor="priority"
                  className="block text-sm font-medium leading-6 text-white"
                >
                  Priority
                </label>
                <div className="mt-2">
                  <select
                    id="priority"
                    name="priority"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="">Select a priority</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              <div className="col-span-full mt-4">
                <label
                  htmlFor="status"
                  className="block text-sm font-medium leading-6 text-white"
                >
                  Status
                </label>
                <div className="mt-2">
                  <select
                    id="status"
                    name="status"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">Select a status</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-end gap-x-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
