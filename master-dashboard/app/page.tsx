import Link from 'next/link';
import { Zap, ShieldCheck, Globe, Cpu } from 'lucide-react';

export default function TitanLanding() {
    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-[#ccff00] selection:text-black overflow-hidden relative flex flex-col font-sans">

            {/* Dynamic Background */}
            <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-[#ccff00]/5 rounded-full blur-[180px] pointer-events-none translate-x-1/3 -translate-y-1/4" />
            <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-emerald-900/10 rounded-full blur-[150px] pointer-events-none -translate-x-1/3 translate-y-1/3" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            {/* Header */}
            <nav className="fixed top-0 w-full z-50 px-6 py-6 flex justify-between items-center backdrop-blur-sm border-b border-white/5">
                <div className="text-xl font-bold tracking-tighter flex items-center gap-2 font-mono">
                    <Zap className="w-5 h-5 text-[#ccff00]" />
                    TITAN_OS
                </div>
                <div className="hidden md:flex gap-10 text-xs font-medium tracking-widest text-gray-500 uppercase">
                    <span className="hover:text-[#ccff00] cursor-pointer transition-colors">Protocol</span>
                    <span className="hover:text-[#ccff00] cursor-pointer transition-colors">Network</span>
                    <span className="hover:text-[#ccff00] cursor-pointer transition-colors">Governance</span>
                </div>
                <Link href="/dashboard">
                    <button className="group px-6 py-2 bg-[#ccff00] hover:bg-[#b3e600] text-black text-xs font-bold tracking-wider uppercase rounded-full transition-all hover:shadow-[0_0_20px_rgba(204,255,0,0.3)] flex items-center gap-2">
                        Connect
                        <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
                    </button>
                </Link>
            </nav>

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 mt-16">

                {/* Status Indicator */}
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-[#ccff00]/20 bg-[#ccff00]/5 backdrop-blur-md mb-12 animate-fade-in-up">
                    <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ccff00] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ccff00]"></span>
                    </div>
                    <span className="text-[#ccff00] text-[10px] font-mono font-bold tracking-[0.2em] uppercase">System Operational</span>
                </div>

                {/* Hero Title */}
                <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-8 leading-none select-none">
                    TITAN <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">CONTROL</span>
                </h1>

                <p className="max-w-xl text-lg md:text-xl text-gray-400 mb-16 leading-relaxed font-light">
                    The central nervous system for <span className="text-white font-medium">CommonGround</span>, <span className="text-white font-medium">VIBECHAIN</span>, and <span className="text-white font-medium">VitalJobs</span>.
                    <br /> Orchestrating the future of decentralized platforms.
                </p>

                {/* Primary Interaction */}
                <div className="flex flex-col md:flex-row gap-6 items-center">
                    <Link href="/dashboard" className="group relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#ccff00] to-emerald-500 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
                        <button className="relative px-12 py-4 bg-black border border-[#ccff00]/30 hover:border-[#ccff00] text-white font-bold rounded-full transition-all flex items-center gap-3 group-hover:text-[#ccff00]">
                            <Cpu className="w-5 h-5" />
                            <span>INITIALIZE DASHBOARD</span>
                        </button>
                    </Link>
                </div>

            </main>

            {/* Footer / Stats */}
            <footer className="relative z-10 w-full px-8 py-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs text-gray-600 uppercase tracking-widest font-mono">
                <div className="flex gap-8">
                    <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-400">Net: Mainnet</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-400">Security: Maximum</span>
                    </div>
                </div>
                <div className="mt-4 md:mt-0 opacity-50">
                    Titan OS v1.0.4 // Authorized Access Only
                </div>
            </footer>
        </div>
    );
}
