import React, { useState, useEffect } from 'react';
import { adminService, UserDetails } from '../../../services/adminService';
import { toastService } from '../../../services/toastService';
import { useAppContext } from '../../../contexts/AppContext';

const AdminPanel: React.FC = () => {
    const [users, setUsers] = useState<UserDetails[]>([]);
    const { user: currentUser } = useAppContext();

    const fetchUsers = async () => {
        const userDetails = await adminService.getAllUsers();
        setUsers(userDetails);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDeleteUser = async (emailToDelete: string) => {
        if(currentUser?.email === emailToDelete) {
            toastService.error("You cannot delete yourself.");
            return;
        }
        if (window.confirm(`Are you sure you want to delete the user: ${emailToDelete}? This action cannot be undone.`)) {
            try {
                await adminService.deleteUser(emailToDelete);
                setUsers(users.filter(user => user.email !== emailToDelete));
                toastService.success(`User ${emailToDelete} deleted successfully.`);
            } catch (error) {
                if(error instanceof Error) toastService.error(error.message);
            }
        }
    };

    const handleResetPassword = async (emailToReset: string) => {
         if (window.confirm(`Are you sure you want to reset the password for ${emailToReset}?`)) {
            try {
                const newPassword = await adminService.resetPassword(emailToReset);
                toastService.success(`Password for ${emailToReset} has been reset to: ${newPassword}`);
            } catch (error) {
                if(error instanceof Error) toastService.error(error.message);
            }
        }
    }

    const handleDeleteAllData = async () => {
        if (window.confirm("DANGER: This will delete ALL user accounts except your own. This action is irreversible. Are you absolutely sure?")) {
            if(window.confirm("Second confirmation: Please confirm you want to permanently delete all user data.")) {
                try {
                    await adminService.deleteAllUserData();
                    await fetchUsers(); // Refresh the user list
                    toastService.success("All user accounts have been deleted.");
                } catch (error) {
                     if(error instanceof Error) toastService.error(error.message);
                }
            }
        }
    }

    return (
        <div className="space-y-8">
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4 border-b border-red-500/50 pb-2">
                    <h2 className="text-xl font-bold text-red-300">
                        <i className="fas fa-users-cog mr-2"></i>User Management
                    </h2>
                    <div className="text-red-300 font-semibold">
                        Total Users: {users.length}
                    </div>
                </div>
                <div className="space-y-3">
                    {/* Header */}
                    <div className="hidden md:flex text-sm font-semibold text-gray-400 px-3">
                        <div className="w-2/5">Email</div>
                        <div className="w-2/5">Date Registered</div>
                        <div className="w-1/5 text-right">Actions</div>
                    </div>

                    {users.map(user => (
                        <div key={user.email} className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 bg-gray-700/50 rounded-lg">
                            <div className="w-full md:w-2/5 mb-2 md:mb-0">
                                <span className="md:hidden font-semibold text-gray-400">Email: </span>{user.email}
                            </div>
                            <div className="w-full md:w-2/5 mb-2 md:mb-0">
                                <span className="md:hidden font-semibold text-gray-400">Registered: </span>{new Date(user.createdAt).toLocaleDateString()}
                            </div>
                            <div className="w-full md:w-1/5 flex justify-end items-center space-x-4">
                                <button
                                    onClick={() => handleResetPassword(user.email)}
                                    className="text-yellow-400 hover:text-yellow-300 disabled:text-gray-500"
                                    disabled={currentUser?.email === user.email}
                                    title={currentUser?.email === user.email ? "Cannot reset self" : "Reset password"}
                                >
                                    <i className="fas fa-key"></i>
                                </button>
                                <button 
                                    onClick={() => handleDeleteUser(user.email)} 
                                    className="text-red-400 hover:text-red-300 disabled:text-gray-500"
                                    disabled={currentUser?.email === user.email}
                                    title={currentUser?.email === user.email ? "Cannot delete self" : "Delete user"}
                                >
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-900/20 border-2 border-dashed border-red-500/50 rounded-lg p-6">
                 <h2 className="text-xl font-bold text-red-300 mb-3"><i className="fas fa-exclamation-triangle mr-2"></i>Danger Zone</h2>
                 <div className="flex justify-between items-center">
                    <div>
                        <p className="font-semibold text-white">Delete All User Data</p>
                        <p className="text-sm text-gray-400">Permanently delete all user accounts and their associated data. This action is irreversible.</p>
                    </div>
                    <button
                        onClick={handleDeleteAllData}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
                    >
                        Delete All Users
                    </button>
                 </div>
            </div>
        </div>
    );
};

export default AdminPanel;