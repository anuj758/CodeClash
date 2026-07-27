import React from 'react';

export default function ContestsComingSoon() {
    const upcomingContests = [
        {
            title: "CodeClash Weekly #01",
            type: "Ranked Rated",
            typeColor: "badge-primary",
            difficulty: "All Skill Levels",
            duration: "90 Mins",
            problems: "4 Problems",
            status: "Scheduled",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            )
        },
        {
            title: "Sprint Blitz: Algorithms",
            type: "Speed Run",
            typeColor: "badge-secondary",
            difficulty: "Intermediate",
            duration: "45 Mins",
            problems: "3 Problems",
            status: "In Pipeline",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            title: "Grandmaster Invitational",
            type: "Prize Pool",
            typeColor: "badge-accent",
            difficulty: "Hard / Expert",
            duration: "180 Mins",
            problems: "5 Problems",
            status: "Teaser",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-base-300 text-base-content flex flex-col justify-between">

            {/* Main Section */}
            <main className="flex-1 flex flex-col justify-center items-center px-4 py-12 max-w-5xl mx-auto text-center relative z-10 w-full">
                
                {/* Status Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-secondary/10 border border-secondary/30 text-xs font-extrabold text-secondary mb-6 shadow-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span>
                    <span>CONTEST ARENA IN DEVELOPMENT</span>
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-base-content mb-4 leading-tight">
                    Timed Contests <br />
                    <span className="bg-gradient-to-r from-primary via-indigo-400 to-secondary bg-clip-text text-transparent">
                        Are Launching Soon
                    </span>
                </h1>

                <p className="text-base-content/70 text-base md:text-lg max-w-2xl mb-10 leading-relaxed font-normal">
                    Gear up to test your algorithmic speed, execution efficiency, and edge-case handling against top programmers in real-time ranked matches.
                </p>

                {/* Visual Showcase: Contest Cards Preview */}
                <div className="w-full mb-12">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-base-content/55">
                            Upcoming Format Teasers
                        </span>
                        <span className="badge badge-outline text-xs opacity-60 font-semibold px-2.5 py-2">
                            Preview Mode
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {upcomingContests.map((contest, index) => (
                            <div 
                                key={index} 
                                className="bg-base-100 border border-base-200/80 hover:border-secondary/40 rounded-3xl p-6 shadow-sm flex flex-col justify-between text-left transition-all duration-300 hover:-translate-y-1"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="p-3 rounded-2xl bg-base-200/60 border border-base-300/50">
                                            {contest.icon}
                                        </div>
                                        <span className={`badge ${contest.typeColor} badge-sm font-extrabold px-2.5 py-2`}>
                                            {contest.type}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-extrabold text-base-content mb-1">
                                        {contest.title}
                                    </h3>
                                    
                                    <p className="text-xs font-extrabold text-base-content/50 mb-4 uppercase tracking-wider">
                                        Difficulty: {contest.difficulty}
                                    </p>

                                    {/* Contest Specs */}
                                    <div className="space-y-2.5 py-3 border-y border-base-200/60 text-xs font-semibold">
                                        <div className="flex items-center justify-between text-base-content/70">
                                            <span>Duration</span>
                                            <span className="font-mono font-bold text-base-content">{contest.duration}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-base-content/70">
                                            <span>Challenges</span>
                                            <span className="font-mono font-bold text-base-content">{contest.problems}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 pt-1">
                                    <button disabled className="btn btn-sm btn-outline btn-block rounded-xl border-base-300 opacity-60 cursor-not-allowed font-extrabold">
                                        {contest.status}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Feature Highlights Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full text-left">
                    <div className="bg-base-100 border border-base-200/80 p-5 rounded-3xl shadow-sm hover:border-primary/40 transition-all">
                        <div className="text-primary font-extrabold text-sm mb-1">📊 ELO Rankings</div>
                        <p className="text-xs text-base-content/70 font-normal leading-relaxed">Dynamic tier ratings from Novice to Grandmaster based on performance.</p>
                    </div>
                    <div className="bg-base-100 border border-base-200/80 p-5 rounded-3xl shadow-sm hover:border-secondary/40 transition-all">
                        <div className="text-secondary font-extrabold text-sm mb-1">⚡ Live Standings</div>
                        <p className="text-xs text-base-content/70 font-normal leading-relaxed">Real-time rank updates with automatic penalty time calculation.</p>
                    </div>
                    <div className="bg-base-100 border border-base-200/80 p-5 rounded-3xl shadow-sm hover:border-indigo-400/40 transition-all">
                        <div className="text-indigo-400 font-extrabold text-sm mb-1">🎯 Original Problems</div>
                        <p className="text-xs text-base-content/70 font-normal leading-relaxed">Fresh, unseen problem sets crafted to test original thinking.</p>
                    </div>
                    <div className="bg-base-100 border border-base-200/80 p-5 rounded-3xl shadow-sm hover:border-emerald-400/40 transition-all">
                        <div className="text-emerald-400 font-extrabold text-sm mb-1">🛡 Anti-Cheat</div>
                        <p className="text-xs text-base-content/70 font-normal leading-relaxed">Automated AST similarity checks ensuring fair competitive play.</p>
                    </div>
                </div>

            </main>

            {/* Footer */}
            <footer className="footer footer-center p-6  text-base-content/60 border-t border-base-200 text-xs font-medium">
                <div>
                    <p>© {new Date().getFullYear()} CodeClash. All rights reserved.</p>
                </div>
            </footer>

        </div>
    );
}