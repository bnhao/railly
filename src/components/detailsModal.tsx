interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: number;
    title: string;
    description: string;
    status: string;
    assigned_to: number;
    start_date: string,
    start_time: string,
    end_date: string,
    end_time: string,
    priority: string;
    due_date: string;
  };
  onDelete: (id: number) => void; // Add onDelete prop
}

export default function TaskDetailsModal({ isOpen, onClose, task, onDelete }: TaskDetailsModalProps) {
  if (!isOpen) {
    return null;
  }

  const handleDelete = async () => {
    const confirmed = window.confirm("Are you sure you want to delete this task?");
    if (!confirmed) return;
    onDelete(task.id); // Call the onDelete function from props
    try {
      alert("Task deleted successfully");
      onClose(); // Close the modal
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };
  

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e2128] border-l border-gray-800/50 p-8 rounded-2xl w-full max-w-md shadow-2xl shadow-black/50 border border-gray-800/50">
        <h2 className="font-bold text-center text-2xl text-cyan-400 tracking-wide drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]">Task Details</h2>
        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300">Title</label>
            <p className="mt-1 text-gray-100">{task.title}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">Description</label>
            <p className="mt-1 text-gray-100">{task.description}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">Status</label>
            <p className="mt-1 text-gray-100">{task.status}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">Assigned To</label>
            <p className="mt-1 text-gray-100">{task.assigned_to}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">Due Date</label>
            <p className="mt-1 text-gray-100">{task.end_date}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">Priority</label>
            <p className="mt-1 text-gray-100">{task.priority}</p>
          </div>
        </div>
        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={handleDelete}
            className="rounded-xl bg-red-600/10 border border-red-500/20 px-5 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-600/20 hover:text-red-300 transition-colors shadow-lg shadow-red-500/10 ml-3"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="rounded-xl bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-300 hover:bg-gray-700 hover:text-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}