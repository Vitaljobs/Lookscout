'use client';

import React, { useState, useEffect } from 'react';
import { saveApiKey, getApiKey } from '@/lib/storage';
import { Key, Save, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Load existing API key
        const existingKey = getApiKey('commonground');
        if (existingKey) {
            setApiKey(existingKey);
        }
    }, []);

    const handleSave = () => {
        if (!apiKey.trim()) {
            setError('API key cannot be empty');
            return;
        }

        try {
            saveApiKey('commonground', apiKey);
            setSaved(true);
            setError('');

            setTimeout(() => {
                setSaved(false);
            }, 3000);
        } catch (err) {
            setError('Failed to save API key');
            console.error(err);
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
                <p className="text-gray-400">
                    Manage your API keys and project configurations
                </p>
            </div>

            {/* API Key Section */}
            <div className="max-w-3xl">
                <div className="card">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Key className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">
                                Common Ground Pulse API Key
                            </h2>
                            <p className="text-sm text-gray-400">
                                Enter your API key to connect to Common Ground Pulse
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                API Key
                            </label>
                            <div className="relative">
                                <input
                                    type={showKey ? 'text' : 'password'}
                                    value={apiKey}
                                    onChange={(e) => {
                                        setApiKey(e.target.value);
                                        setError('');
                                        setSaved(false);
                                    }}
                                    placeholder="Enter your x-api-key"
                                    className="w-full px-4 py-3 pr-12 bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowKey(!showKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                >
                                    {showKey ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {error && (
                                <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>{error}</span>
                                </div>
                            )}
                            {saved && (
                                <div className="flex items-center gap-2 mt-2 text-green-500 text-sm">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>API key saved successfully!</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                            >
                                <Save className="w-4 h-4" />
                                Save API Key
                            </button>
                            <button
                                onClick={() => {
                                    setApiKey('');
                                    setError('');
                                    setSaved(false);
                                }}
                                className="px-6 py-3 bg-[var(--sidebar-bg)] hover:bg-[var(--hover-bg)] text-gray-300 font-medium rounded-lg border border-[var(--card-border)] transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <h3 className="text-sm font-semibold text-blue-400 mb-2">
                            🔐 Security Information
                        </h3>
                        <ul className="text-sm text-gray-400 space-y-1">
                            <li>• Your API key is encrypted and stored locally in your browser</li>
                            <li>• The key is never sent to any third-party servers</li>
                            <li>• For production use, consider implementing a backend service</li>
                        </ul>
                    </div>
                </div>

                {/* Additional Settings */}
                <div className="card mt-6">
                    <h2 className="text-xl font-semibold text-white mb-4">
                        Project Configuration
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Project Name
                            </label>
                            <input
                                type="text"
                                value="Common Ground Pulse"
                                disabled
                                className="w-full px-4 py-3 bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-lg text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                API Endpoint
                            </label>
                            <input
                                type="text"
                                value="https://api.commonground.example"
                                disabled
                                className="w-full px-4 py-3 bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-lg text-gray-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                This will be configurable in a future update
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
