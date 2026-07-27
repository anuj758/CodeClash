import React from 'react';

export default function Battle() {
    return (
        <div className="min-h-screen bg-base-300 text-base-content flex flex-col justify-between relative overflow-hidden">
            
            {/* Ambient Red Combat Glow in Background */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none"></div>

            {/* Main Battlefield Area */}
            <main className="flex-1 flex flex-col justify-center items-center px-4 py-12 max-w-5xl mx-auto text-center relative z-10 w-full">
                
                {/* Gamified Status Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-950/60 border border-red-500/40 text-xs font-mono font-extrabold text-red-400 mb-6 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                    <span>BATTLE ARENA IN DEVELOPMENT</span>
                </div>

                {/* Hero Title */}
                <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight text-base-content mb-4 leading-tight">
                    1v1 Real-Time <br />
                    <span className="bg-gradient-to-r from-red-500 via-orange-400 to-amber-300 bg-clip-text text-transparent">
                        Battlefield Arena ⚔️
                    </span>
                </h1>

                {/* Core Narrative */}
                <p className="text-base-content/90 text-base md:text-lg max-w-2xl mb-2 font-normal leading-relaxed">
                    Test your ultimate patience. Test your raw problem-solving under extreme time pressure.
                </p>
                <p className="text-base-content/60 text-xs md:text-sm max-w-xl mb-10 font-normal">
                    Step into an intensity-packed, head-to-head duel. One problem, two developers, dynamic live test-case tracking, and zero room for error.
                </p>

                {/* Replacement: Visual 1v1 Battle Arena Preview Card */}
                <div className="w-full bg-base-100 border border-red-500/30 rounded-3xl p-6 md:p-8 shadow-2xl mb-12 relative overflow-hidden backdrop-blur-sm">
                    
                    {/* Top Header / Mode Title */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-6 pb-4 border-b border-base-200">
                        <div className="flex items-center gap-2">
                            <span className="badge badge-error badge-sm font-extrabold px-2.5 py-2">1v1 RANKED</span>
                            <span className="text-xs font-mono text-base-content/60 font-semibold">Match ID: #BT-9042</span>
                        </div>
                        <div className="text-xs font-mono text-amber-400 font-extrabold flex items-center gap-1">
                            <span>⏱️ Sudden Death Clock: 15:00</span>
                        </div>
                    </div>

                    {/* Combat Arena Visualization */}
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                        
                        {/* Player 1 Card */}
                        <div className="md:col-span-3 bg-base-200/50 border border-base-300/80 rounded-2xl p-4 text-left">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center font-extrabold text-primary text-xs">
                                    YOU
                                </div>
                                <div>
                                    <div className="font-extrabold text-sm text-base-content">You (Player 1)</div>
                                    <div className="text-[11px] text-base-content/50 font-mono font-semibold">Rating: 1420 ELO</div>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[11px] font-mono">
                                    <span className="text-success font-extrabold">Test Cases Passed</span>
                                    <span className="font-bold">8 / 10</span>
                                </div>
                                <div className="w-full bg-base-300 h-2.5 rounded-full overflow-hidden">
                                    <div className="bg-success h-full w-[80%] rounded-full transition-all"></div>
                                </div>
                            </div>
                        </div>

                        {/* Versus Badge */}
                        <div className="md:col-span-1 flex flex-col items-center justify-center my-2 md:my-0">
                            <div className="w-12 h-12 rounded-2xl bg-red-950 border border-red-500/50 flex items-center justify-center font-black text-red-500 text-lg shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                                VS
                            </div>
                        </div>

                        {/* Opponent Card */}
                        <div className="md:col-span-3 bg-base-200/50 border border-base-300/80 rounded-2xl p-4 text-left">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center font-extrabold text-red-400 text-xs">
                                    OPP
                                </div>
                                <div>
                                    <div className="font-extrabold text-sm text-base-content">Opponent</div>
                                    <div className="text-[11px] text-base-content/50 font-mono font-semibold">Rating: 1485 ELO</div>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[11px] font-mono">
                                    <span className="text-amber-400 font-extrabold">Test Cases Passed</span>
                                    <span className="font-bold">5 / 10</span>
                                </div>
                                <div className="w-full bg-base-300 h-2.5 rounded-full overflow-hidden">
                                    <div className="bg-amber-400 h-full w-[50%] rounded-full transition-all"></div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Bottom Status Banner */}
                    <div className="mt-6 pt-4 border-t border-base-200 flex flex-wrap items-center justify-between text-xs text-base-content/60 font-mono font-semibold">
                        <span>Target Problem: <strong className="text-base-content">Medium • Dynamic Programming</strong></span>
                        <span className="text-red-400 font-extrabold">Matchmaking Engine Initializing...</span>
                    </div>

                </div>

                {/* Match Mechanics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left mb-12">
                    
                    {/* Mechanic 1 */}
                    <div className="bg-base-100 border border-base-200/80 hover:border-red-500/40 p-6 rounded-3xl shadow-sm transition-all group">
                        <div className="text-red-500 text-2xl mb-3">⏱️</div>
                        <h3 className="text-base-content font-extrabold text-base mb-2">Sudden Death Clock</h3>
                        <p className="text-base-content/70 text-xs font-normal leading-relaxed">
                            A ticking clock forces you to balance speed and accuracy. Every failed submission incurs penalty time that can cost you the victory.
                        </p>
                    </div>

                    {/* Mechanic 2 */}
                    <div className="bg-base-100 border border-base-200/80 hover:border-amber-400/40 p-6 rounded-3xl shadow-sm transition-all group">
                        <div className="text-amber-400 text-2xl mb-3">👁️</div>
                        <h3 className="text-base-content font-extrabold text-base mb-2">Live Execution Radar</h3>
                        <p className="text-base-content/70 text-xs font-normal leading-relaxed">
                            Watch opponent test-case passes in real-time without seeing their code. Feel the pressure as their green checks light up.
                        </p>
                    </div>

                    {/* Mechanic 3 */}
                    <div className="bg-base-100 border border-base-200/80 hover:border-orange-400/40 p-6 rounded-3xl shadow-sm transition-all group">
                        <div className="text-orange-400 text-2xl mb-3">🔥</div>
                        <h3 className="text-base-content font-extrabold text-base mb-2">Rank Stealing</h3>
                        <p className="text-base-content/70 text-xs font-normal leading-relaxed">
                            High-stakes ranked matchmaking. Defeat higher-tier combatants to siphon their MMR rating and dominate the global leaderboards.
                        </p>
                    </div>

                </div>

                {/* Gamified Tier Ranks Bar */}
                <div className="w-full bg-base-100 border border-base-200/80 p-5 rounded-3xl flex flex-wrap items-center justify-between gap-4 text-xs font-mono shadow-sm">
                    <span className="text-base-content/60 font-extrabold">UPCOMING ARENA TIERS:</span>
                    <div className="flex flex-wrap gap-3 font-semibold">
                        <span className="px-3.5 py-1.5 rounded-xl bg-base-200 text-base-content/70 border border-base-300">🥉 Bronze Duelist</span>
                        <span className="px-3.5 py-1.5 rounded-xl bg-base-200 text-amber-500 border border-amber-500/30">🥈 Gold Gladiator</span>
                        <span className="px-3.5 py-1.5 rounded-xl bg-base-200 text-cyan-500 border border-cyan-500/30">💎 Diamond Codebreaker</span>
                        <span className="px-3.5 py-1.5 rounded-xl bg-red-950/80 text-red-400 border border-red-500/50 font-extrabold">🔥 Grandmaster Clash</span>
                    </div>
                </div>

            </main>

            {/* Footer */}
            <footer className="footer footer-center p-6 text-base-content/60 border-t border-base-200 text-xs font-medium">
                <div>
                    <p>© {new Date().getFullYear()} CodeClash. All rights reserved.</p>
                </div>
            </footer>

        </div>
    );
}