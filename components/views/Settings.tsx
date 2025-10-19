import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import AdminPanel from './admin/AdminPanel';

const Settings: React.FC = () => {
    const { user, theme, setTheme, colorScheme, setColorScheme, aiMode, setAiMode, apiKey } = useAppContext();
    const isAdmin = user?.email === 'preetjgfilj2@gmail.com';
    const isCloudDisabled = !isAdmin && (!apiKey || apiKey === 'on-device-placeholder');

    const handleModeToggle = () => {
        if (isCloudDisabled) {
            return; // Or show a toast
        }
        setAiMode(aiMode === 'Device' ? 'Cloud AI' : 'Device');
    };

    return (
        <div className="p-8 h-full text-white overflow-y-auto">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>
            
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Profile Section */}
                <div className="bg-gray-800 rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Profile</h2>
                    <p><span className="font-medium text-gray-400">Email:</span> {user?.email}</p>
                </div>

                {/* AI Mode Section */}
                <div className="bg-gray-800 rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">AI Mode</h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Select your preferred AI processing mode.</p>
                             {isCloudDisabled && (
                                <p className="text-sm text-yellow-400 mt-1">An API key is required to enable Cloud AI.</p>
                            )}
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className={`font-medium ${aiMode === 'Device' ? 'text-purple-400' : 'text-gray-400'}`}>Device</span>
                            <label htmlFor="ai-toggle-settings" className={`relative inline-flex items-center ${isCloudDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                <input 
                                    type="checkbox" 
                                    id="ai-toggle-settings" 
                                    className="sr-only peer" 
                                    checked={aiMode === 'Cloud AI'} 
                                    onChange={handleModeToggle}
                                    disabled={isCloudDisabled}
                                />
                                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 peer-disabled:opacity-50"></div>
                            </label>
                            <span className={`font-medium ${aiMode === 'Cloud AI' ? 'text-purple-400' : 'text-gray-400'} ${isCloudDisabled ? 'opacity-50' : ''}`}>Cloud AI</span>
                        </div>
                    </div>
                </div>

                {/* Appearance Section */}
                <div className="bg-gray-800 rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Appearance</h2>
                    <div className="space-y-4">
                         <div>
                            <label className="block text-gray-400 mb-2">Color Scheme</label>
                            <div className="flex space-x-4">
                               <button onClick={() => setColorScheme('theme-genesis')} className={`w-8 h-8 rounded-full bg-purple-500 ring-2 ${colorScheme === 'theme-genesis' ? 'ring-white' : 'ring-transparent'}`}></button>
                               <button onClick={() => setColorScheme('theme-aurora')} className={`w-8 h-8 rounded-full bg-green-500 ring-2 ${colorScheme === 'theme-aurora' ? 'ring-white' : 'ring-transparent'}`}></button>
                               <button onClick={() => setColorScheme('theme-capcut')} className={`w-8 h-8 rounded-full bg-blue-500 ring-2 ${colorScheme === 'theme-capcut' ? 'ring-white' : 'ring-transparent'}`}></button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Admin Panel */}
                {isAdmin && <AdminPanel />}
            </div>
        </div>
    );
};

export default Settings;