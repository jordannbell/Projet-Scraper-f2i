'use client';

import { useState, useEffect, useRef } from 'react';
import { Globe, Clock, ChevronRight, Edit2, Loader2, Check } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { useLanguage } from '@/context/LanguageContext';

export default function AccountSettingsPanel() {
    const { language, setLanguage, t } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [uploadingImage, setUploadingImage] = useState(false);

    // User data
    const [userId, setUserId] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            // Use getSession first, to avoid throwing if not logged in
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) throw sessionError;

            if (!session) {
                // User is not logged in
                return;
            }

            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;

            if (user) {
                setUserId(user.id);
                setEmail(user.email || '');
                const metaName = user.user_metadata?.name || user.user_metadata?.full_name || 'User';
                setName(metaName);
                setEditName(metaName);
                setEditEmail(user.email || '');
                setAvatarUrl(user.user_metadata?.avatar_url || null);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async () => {
        setSaveMessage(null);
        try {
            const updates: { data?: { name: string }; email?: string } = {};
            let isEmailUpdating = false;

            if (editName !== name) {
                updates.data = { name: editName };
            }

            if (editEmail !== email && editEmail.trim() !== '') {
                updates.email = editEmail;
                isEmailUpdating = true;
            }

            if (Object.keys(updates).length > 0) {
                const { error, data } = await supabase.auth.updateUser(updates);
                if (error) throw error;

                setName(editName);
                if (isEmailUpdating) {
                    setSaveMessage({ text: "Profile updated. Check both old and new email for confirmation links.", type: 'success' });
                } else {
                    setSaveMessage({ text: "Profile updated successfully.", type: 'success' });
                }
            } else {
                setSaveMessage({ text: "No changes to save.", type: 'success' });
            }
            setIsEditing(false);
        } catch (error: any) {
            setSaveMessage({ text: error.message || "Failed to update profile.", type: 'error' });
        }
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploadingImage(true);
            setSaveMessage(null);

            if (!userId) {
                throw new Error("You must be logged in to upload an avatar.");
            }

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const filePath = `${userId}-${Math.random()}.${fileExt}`;

            // Upload the file to "avatar" bucket
            const { error: uploadError } = await supabase.storage
                .from('avatar')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get the public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatar')
                .getPublicUrl(filePath);

            // Update user metadata
            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            if (updateError) throw updateError;

            setAvatarUrl(publicUrl);
            setSaveMessage({ text: "Avatar updated successfully.", type: 'success' });

        } catch (error: any) {
            setSaveMessage({ text: error.message || "Error uploading image.", type: 'error' });
        } finally {
            setUploadingImage(false);
        }
    };

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'fr' : 'en');
    };

    if (loading) {
        return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
    }

    if (!userId) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-900 border border-white/10 rounded-2xl gap-4">
                <h2 className="text-xl font-bold text-white">Not Logged In</h2>
                <p className="text-slate-400 text-center">You must be logged in to view and edit your profile settings.</p>
                <a href="/login" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-semibold text-sm transition-colors mt-2">
                    Go to Login
                </a>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">

            {/* Header / Avatar Section */}
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg overflow-hidden border-2 border-slate-900 transition-opacity group-hover:opacity-80">
                            {uploadingImage ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span>{name ? name.charAt(0).toUpperCase() : 'U'}</span>
                            )}
                        </div>
                        <button
                            className="absolute bottom-0 right-0 bg-indigo-600 group-hover:bg-indigo-500 text-white rounded-full p-1.5 shadow-lg transition-colors border-2 border-slate-900"
                            disabled={uploadingImage}
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAvatarUpload}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>
                    {!isEditing ? (
                        <div>
                            <h2 className="text-2xl font-bold text-white">{name}</h2>
                            <p className="text-slate-400">{email}</p>
                            <div className="flex gap-2 mt-2">
                                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">Active User</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 w-full max-w-xs">
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                                placeholder="Your Name"
                            />
                            <input
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                                placeholder="Your Email"
                            />
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-end gap-2">
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-lg shadow-indigo-500/20"
                        >
                            Edit Profile
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setIsEditing(false); setEditName(name); setEditEmail(email); }}
                                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors border border-white/10"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleProfileUpdate}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
                            >
                                <Check className="w-4 h-4" /> Save
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {saveMessage && (
                <div className={`p-4 rounded-lg text-sm border ${saveMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {saveMessage.text}
                </div>
            )}

            {/* Account Preferences */}
            <div>
                <h3 className="text-lg font-bold text-white mb-3 flex items-center">Account Preferences</h3>
                <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
                    <button
                        onClick={toggleLanguage}
                        className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors border-b border-white/5"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-indigo-500/10 p-2.5 rounded-lg text-indigo-400">
                                <Globe className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <h4 className="font-semibold text-slate-200">Language</h4>
                                <p className="text-xs text-slate-400">Preferred display language</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                            <span className="text-sm font-medium hover:text-indigo-400 transition-colors">
                                {language === 'en' ? 'English (US)' : 'Français'}
                            </span>
                            <ChevronRight className="w-4 h-4" />
                        </div>
                    </button>
                    <button className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="bg-indigo-500/10 p-2.5 rounded-lg text-indigo-400">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <h4 className="font-semibold text-slate-200">Timezone</h4>
                                <p className="text-xs text-slate-400">Used for dates and scheduling</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                            <span className="text-sm font-medium">GMT-5 (EST)</span>
                            <ChevronRight className="w-4 h-4" />
                        </div>
                    </button>
                </div>
            </div>

        </div>
    );
}
