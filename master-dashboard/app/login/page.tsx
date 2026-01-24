'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, ShieldCheck, Loader2 } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        const supabase = createClient()
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setMessage({ type: 'error', text: error.message })
            setLoading(false)
        } else {
            router.push('/dashboard')
            router.refresh()
        }
    }

    // Optional: Magic Link Handler
    const handleMagicLink = async () => {
        if (!email) {
            setMessage({ type: 'error', text: 'Enter your email first.' })
            return
        }
        setLoading(true)
        const supabase = createClient()
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
            }
        })
        if (error) {
            setMessage({ type: 'error', text: error.message })
        } else {
            setMessage({ type: 'success', text: 'Magic link sent! Check your email.' })
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Background FX */}
            <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#ccff00]/5 rounded-full blur-[150px] pointer-events-none translate-x-1/2 -translate-y-1/2" />

            <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl relative z-10">

                <div className="flex flex-col items-center mb-8">
                    <div className="p-3 bg-[#ccff00]/10 rounded-full mb-4 border border-[#ccff00]/20">
                        <Zap className="w-8 h-8 text-[#ccff00]" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Access Control Tower</h1>
                    <p className="text-gray-400 text-sm mt-2">Identify yourself to initiate sequence</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#ccff00] transition-colors"
                            placeholder="admin@titan.os"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#ccff00] transition-colors"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#ccff00] hover:bg-[#b3e600] text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                        <span>AUTHENTICATE</span>
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t border-white/5 text-center">
                    <button onClick={handleMagicLink} className="text-xs text-gray-500 hover:text-[#ccff00] transition-colors">
                        Forgot password? Send Magic Link
                    </button>
                </div>
            </div>

            <div className="absolute bottom-8 text-xs text-gray-600 font-mono tracking-widest">
                SECURE CONNECTION ESTABLISHED
            </div>
        </div>
    )
}
