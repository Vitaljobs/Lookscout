'use client';

import React, { useState, useEffect } from 'react';
import {
    getExternalSites,
    addExternalSite,
    updateExternalSite,
    deleteExternalSite,
    ExternalSite
} from '@/app/actions/connections';
import {
    Globe,
    Plus,
    Trash2,
    Edit3,
    X,
    Save,
    ExternalLink,
    ShieldCheck,
    AlertCircle,
    Loader2
} from 'lucide-react';

export default function ConnectionsPage() {
    const [sites, setSites] = useState<ExternalSite[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        site_name: '',
        api_key: '',
        webhook_url: ''
    });

    useEffect(() => {
        loadSites();
    }, []);

    const loadSites = async () => {
        setIsLoading(true);
        try {
            const data = await getExternalSites();
            setSites(data);
        } catch (error) {
            console.error('Failed to load sites:', error);
            alert('Failed to load connections.');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ site_name: '', api_key: '', webhook_url: '' });
        setIsEditing(false);
        setEditingId(null);
    };

    const handleEdit = (site: ExternalSite) => {
        setFormData({
            site_name: site.site_name,
            api_key: site.api_key,
            webhook_url: site.webhook_url || ''
        });
        setEditingId(site.id);
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingId) {
                await updateExternalSite(editingId, formData);
            } else {
                await addExternalSite(formData);
            }
            await loadSites();
            resetForm();
        } catch (error) {
            console.error('Failed to save site:', error);
            alert('Error saving connection. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this connection?')) return;

        try {
            await deleteExternalSite(id);
            await loadSites();
        } catch (error) {
            console.error('Failed to delete site:', error);
            alert('Failed to delete connection.');
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto animate-fade-in">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Globe className="w-8 h-8 text-blue-400" />
                        External Connections
                    </h1>
                    <p className="text-gray-400">
                        Manage your connected sites, API keys, and webhooks centrally.
                    </p>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-lg shadow-blue-500/20"
                    >
                        <Plus className="w-4 h-4" /> Add New Site
                    </button>
                )}
            </div>

            {/* Form Section */}
            {isEditing && (
                <div className="card mb-8 border-l-4 border-blue-500 animate-slide-in">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {editingId ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                            {editingId ? 'Edit Connection' : 'New Connection'}
                        </h2>
                        <button onClick={resetForm} className="p-1 hover:bg-white/5 rounded">
                            <X className="w-5 h-5 text-gray-400 hover:text-white" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Site Name</label>
                                <input
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={formData.site_name}
                                    onChange={e => setFormData({ ...formData, site_name: e.target.value })}
                                    placeholder="e.g. My Shopify Store"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Webhook URL (Optional)</label>
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={formData.webhook_url}
                                    onChange={e => setFormData({ ...formData, webhook_url: e.target.value })}
                                    placeholder="https://mysite.com/api/webhook"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                    API Key
                                    <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded-full border border-green-500/20 uppercase tracking-widest font-bold">
                                        Secure Encrypted
                                    </span>
                                </label>
                                <div className="relative">
                                    <input
                                        required
                                        type="password"
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-10"
                                        value={formData.api_key}
                                        onChange={e => setFormData({ ...formData, api_key: e.target.value })}
                                        placeholder="Paste your API key here"
                                    />
                                    <ShieldCheck className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500/50" />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">
                                    Your key is encrypted using AES-256 before being stored in our database.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-2 transition-all"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {editingId ? 'Update Connection' : 'Save Connection'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List Section */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                        <p className="font-mono text-sm">Synchronizing Secure Vault...</p>
                    </div>
                ) : sites.length === 0 ? (
                    <div className="card p-20 text-center border-dashed border-2 border-white/5 bg-transparent">
                        <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Globe className="w-8 h-8 text-gray-600" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No Connections Yet</h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-6">
                            Add your first external site to start managing support messages and webhooks from a central dashboard.
                        </p>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-2 mx-auto"
                        >
                            <Plus className="w-4 h-4" /> Add your first site
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {sites.map((site) => (
                            <div
                                key={site.id}
                                className="group card bg-white/5 border-white/5 hover:border-blue-500/50 transition-all duration-300"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                                            <Globe className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                                                {site.site_name}
                                            </h3>
                                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <ShieldCheck className="w-3 h-3 text-green-500" /> Key Encrypted
                                                </span>
                                                {site.webhook_url && (
                                                    <span className="flex items-center gap-1">
                                                        <ExternalLink className="w-3 h-3" /> Webhook Active
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(site)}
                                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                            title="Edit Connection"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(site.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                            title="Remove Connection"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {site.webhook_url && (
                                    <div className="mt-4 pt-4 border-t border-white/5 text-[10px] font-mono text-gray-600 truncate">
                                        HOOK: {site.webhook_url}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-12 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl flex gap-4 items-start">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-yellow-500 mb-1">Security Notice</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        API keys are sensitive information. While we use industry-standard AES-256 encryption to store them, we recommend rotating your keys periodically and using restricted permissions if your external provider supports it.
                    </p>
                </div>
            </div>
        </div>
    );
}
