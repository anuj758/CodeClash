import React from 'react';
import { Link } from 'react-router';
import { useSelector } from 'react-redux';

export default function Home() {
    const { isAuthenticated } = useSelector((state) => state.auth);

    const dsaRoadmap = [
        {
            stage: "Stage 01",
            title: "Language Syntax & Control Flow",
            description: "Master foundational language constructs, input/output operations, primitive data types, functions, and memory basics.",
            topics: ["Variables & Data Types", "Conditionals & Loops", "Functions & Scope", "Pointers / References"],
            accent: "text-primary"
        },
        {
            stage: "Stage 02",
            title: "Complexity & Standard Libraries",
            description: "Analyze runtime behavior and leverage built-in container abstractions for rapid problem solving.",
            topics: ["Big-O Notation", "Time & Space Analysis", "C++ STL / Java Collections", "Iterators & Algorithmic Utilities"],
            accent: "text-primary"
        },
        {
            stage: "Stage 03",
            title: "Linear Data Structures",
            description: "Understand contiguous memory layout, pointer chaining, and fundamental sequence operations.",
            topics: ["Static & Dynamic Arrays", "String Manipulation", "Singly & Doubly Linked Lists", "Fast & Slow Pointers"],
            accent: "text-info"
        },
        {
            stage: "Stage 04",
            title: "Stacks, Queues & Hashing",
            description: "Master LIFO/FIFO execution patterns and constant-time key-value data retrieval mechanics.",
            topics: ["Monotonic Stack", "Circular & Priority Queues", "Hash Maps & Hash Sets", "Sliding Window & Two Pointers"],
            accent: "text-info"
        },
        {
            stage: "Stage 05",
            title: "Trees & Hierarchical Structures",
            description: "Navigate recursive hierarchy, binary search trees, self-balancing mechanics, and priority heaps.",
            topics: ["Binary Trees & Traversals", "Binary Search Trees (BST)", "Heaps & Priority Queues", "Tries (Prefix Trees)"],
            accent: "text-accent"
        },
        {
            stage: "Stage 06",
            title: "Graph Algorithms & Networks",
            description: "Model complex real-world relationships, connected components, shortest paths, and network flows.",
            topics: ["Adjacency Matrix/List", "BFS & DFS Traversals", "Dijkstra & Bellman-Ford", "Union-Find (DSU)"],
            accent: "text-accent"
        },
        {
            stage: "Stage 07",
            title: "Dynamic Programming & Advanced Algorithmic Patterns",
            description: "Optimize overlapping subproblems, memoization tables, decision trees, and greedy choices.",
            topics: ["Recursion & Backtracking", "Greedy Choice Property", "1D & 2D Dynamic Programming", "Bitmask & DP on Trees"],
            accent: "text-secondary"
        },
        {
            stage: "Stage 08",
            title: "Competitive Arenas & Rating Matches",
            description: "Put your algorithmic muscle to test in real-time head-to-head duels and scheduled rating matches.",
            topics: ["1v1 Real-Time Duels", "Timed Algorithmic Contests", "Live Test Case Debugging", "Global ELO Rankings"],
            accent: "text-secondary",
            isFinal: true
        }
    ];

    return (
        <div className="min-h-screen bg-base-300 text-base-content flex flex-col justify-between relative overflow-hidden">

            {/* Hero Main Section */}
            <main className="flex-1 flex flex-col justify-center items-center px-4 py-16 md:py-20 max-w-6xl mx-auto text-center relative z-10 w-full">
                
                {/* Status Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary/10 border border-primary/30 text-xs font-extrabold text-primary mb-6 shadow-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                    <span>NEXT-GEN COMPETITIVE CODING PLATFORM</span>
                </div>

                {/* Main Hero Headline */}
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-base-content mb-6 max-w-4xl leading-tight">
                    Master Your Problem Solving. <br />
                    <span className="bg-gradient-to-r from-primary via-indigo-400 to-secondary bg-clip-text text-transparent">
                        Code. Conquer. Compete.
                    </span>
                </h1>

                {/* Subtitle Description */}
                <p className="text-base-content/70 text-base md:text-lg max-w-2xl mb-10 leading-relaxed font-normal">
                    Level up your algorithmic dexterity with curated coding challenges, real-time leaderboard rankings, and competitive matches designed to sharpen your engineering skills.
                </p>

                {/* Dynamic Call-to-Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-16 justify-center">
                    <Link to="/problemset" className="btn btn-primary btn-md px-8 rounded-2xl shadow-sm hover:shadow-md font-semibold cursor-pointer">
                        {isAuthenticated ? 'Go to Problemset' : 'Explore Problemset'}
                    </Link>
                    
                    {isAuthenticated ? (
                        <Link to="/battle" className="btn btn-outline btn-md px-8 rounded-2xl text-base-content/80 border-base-300 hover:bg-base-200 cursor-pointer">
                            1v1 Arena
                        </Link>
                    ) : (
                        <Link to="/signup" className="btn btn-outline btn-md px-8 rounded-2xl text-base-content/80 border-base-300 hover:bg-base-200 cursor-pointer">
                            Join CodeClash
                        </Link>
                    )}
                </div>

                {/* Platform Highlights Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-20">
                    <div className="bg-base-100 border border-base-200/80 p-5 rounded-3xl shadow-sm relative hover:border-primary/40 transition-all text-left">
                        <div className="font-mono text-2xl md:text-3xl font-black text-primary">100+</div>
                        <div className="text-xs text-base-content/60 font-bold uppercase tracking-wider mt-1">Curated Problems</div>
                    </div>

                    <div className="bg-base-100 border border-base-200/80 p-5 rounded-3xl shadow-sm relative overflow-hidden hover:border-secondary/40 transition-all text-left">
                        <span className="badge badge-warning badge-sm font-extrabold uppercase tracking-wider absolute top-4 right-4 px-2.5 py-2">
                            Upcoming
                        </span>
                        <div className="font-mono text-2xl md:text-3xl font-black text-secondary">1v1</div>
                        <div className="text-xs text-base-content/60 font-bold uppercase tracking-wider mt-1">Real-Time Duels</div>
                    </div>

                    <div className="bg-base-100 border border-base-200/80 p-5 rounded-3xl shadow-sm relative overflow-hidden hover:border-emerald-400/40 transition-all text-left">
                        <span className="badge badge-warning badge-sm font-extrabold uppercase tracking-wider absolute top-4 right-4 px-2.5 py-2">
                            Upcoming
                        </span>
                        <div className="font-mono text-2xl md:text-3xl font-black text-emerald-400">ELO</div>
                        <div className="text-xs text-base-content/60 font-bold uppercase tracking-wider mt-1">Ranked Ladder</div>
                    </div>
                </div>

                {/* Core Pillars Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left mb-24">
                    
                    {/* Card 1 */}
                    <div className="card bg-base-100 border border-base-200/80 p-6 rounded-3xl shadow-sm hover:border-primary/40 transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-extrabold text-base-content mb-2">Curated Problemset</h3>
                        <p className="text-base-content/70 text-sm leading-relaxed mb-4">
                            Solve problems ranging from fundamental data structures to advanced graph algorithms with multi-language code compilation.
                        </p>
                        <Link to="/problemset" className="text-xs font-extrabold text-primary hover:underline mt-auto inline-flex items-center gap-1">
                            Browse Problems &rarr;
                        </Link>
                    </div>

                    {/* Card 2 */}
                    <div className="card bg-base-100 border border-base-200/80 p-6 rounded-3xl shadow-sm hover:border-secondary/40 transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-extrabold text-base-content mb-2">Timed Contests</h3>
                        <p className="text-base-content/70 text-sm leading-relaxed mb-4">
                            Test your speed and accuracy in scheduled coding matches against participants with live global rating updates.
                        </p>
                        <Link to="/contest" className="text-xs font-extrabold text-secondary hover:underline mt-auto inline-flex items-center gap-1">
                            View Contests &rarr;
                        </Link>
                    </div>

                    {/* Card 3 */}
                    <div className="card bg-base-100 border border-base-200/80 p-6 rounded-3xl shadow-sm hover:border-info/40 transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-info/10 flex items-center justify-center text-info mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-extrabold text-base-content mb-2">Detailed Performance</h3>
                        <p className="text-base-content/70 text-sm leading-relaxed mb-4">
                            Analyze execution memory usage, time complexities, and test cases to continuously refine your solutions.
                        </p>
                        <span className="text-xs font-extrabold text-info opacity-90 mt-auto">
                            Built-in Analytics
                        </span>
                    </div>

                </div>

                {/* DaisyUI Timeline Roadmap Section */}
                <div className="w-full text-left mb-24">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <span className="text-xs font-extrabold font-mono tracking-widest text-primary uppercase">Curriculum Roadmap</span>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-base-content mt-1 mb-3">
                            Data Structures & Algorithms Path
                        </h2>
                        <p className="text-sm text-base-content/70">
                            A complete step-by-step learning progression starting from language syntax, advancing through graph models, dynamic programming, and culminating in competitive matches.
                        </p>
                    </div>

                    {/* Daisy UI Timeline Component */}
                    <ul className="timeline timeline-snap-icon max-md:timeline-compact timeline-vertical">
                        {dsaRoadmap.map((item, index) => {
                            const isEven = index % 2 === 0;

                            return (
                                <li key={item.stage}>
                                    {index > 0 && <hr className="bg-base-200" />}

                                    {/* Timeline Marker Badge */}
                                    <div className="timeline-middle">
                                        <div className="w-10 h-10 rounded-2xl bg-base-100 border border-base-200 shadow-sm flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${item.accent}`} viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Timeline Content Card */}
                                    <div className={`${isEven ? 'timeline-start md:text-right' : 'timeline-end'} mb-10`}>
                                        <div className="card bg-base-100 border border-base-200/80 shadow-sm p-6 rounded-3xl hover:border-primary/40 transition-all max-w-lg">
                                            <div className="flex items-center gap-2 mb-1 justify-start md:justify-end">
                                                <span className={`font-mono text-xs font-extrabold uppercase tracking-wider ${item.accent}`}>
                                                    {item.stage}
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-extrabold text-base-content mb-2">
                                                {item.title}
                                            </h3>

                                            <p className="text-xs text-base-content/70 leading-relaxed mb-4">
                                                {item.description}
                                            </p>

                                            {/* Topics Tags */}
                                            <div className={`flex flex-wrap gap-1.5 ${isEven ? 'md:justify-end' : 'justify-start'}`}>
                                                {item.topics.map((topic) => (
                                                    <span key={topic} className="badge badge-ghost badge-sm text-[11px] font-mono font-semibold border-base-200 px-2.5 py-2">
                                                        {topic}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {!item.isFinal && <hr className="bg-base-200" />}
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* Feature Showcase 1: Real-Time 1v1 Battle Arena */}
                <div className="w-full bg-base-100 border border-base-200/80 rounded-3xl p-8 text-left shadow-sm relative overflow-hidden">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="badge badge-warning badge-sm font-extrabold uppercase tracking-wider px-2.5 py-2">
                                    Upcoming
                                </span>
                                <span className="text-xs text-base-content/50 font-mono font-semibold">Pre-season</span>
                            </div>
                            <h2 className="text-2xl font-extrabold text-base-content mb-2">
                                Real-Time 1v1 Battle Arena ⚔️
                            </h2>
                            <p className="text-base-content/70 text-sm max-w-2xl leading-relaxed">
                                Go head-to-head in real-time matchmaking. Race against another engineer to solve identical problems first and watch test-case execution live as you code.
                            </p>
                        </div>

                        <Link to="/battle" className="btn btn-error btn-sm px-6 rounded-xl font-semibold whitespace-nowrap self-start lg:self-auto text-white shadow-xs cursor-pointer">
                            Preview Arena
                        </Link>
                    </div>
                </div>

                {/* Feature Showcase 2: Timed Contest Arena */}
                <div className="w-full mt-6 bg-base-100 border border-base-200/80 rounded-3xl p-8 text-left shadow-sm relative overflow-hidden">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="badge badge-warning badge-sm font-extrabold uppercase tracking-wider px-2.5 py-2">
                                    Upcoming
                                </span>
                                <span className="text-xs text-base-content/50 font-mono font-semibold">Arena Schedule</span>
                            </div>
                            <h2 className="text-2xl font-extrabold text-base-content mb-2">
                                Timed Contest Arena 🏆
                            </h2>
                            <p className="text-base-content/70 text-sm max-w-2xl leading-relaxed">
                                Compete in scheduled algorithmic rounds, test your problem-solving resilience under tight time constraints, and climb global ELO leaderboard tiers.
                            </p>
                        </div>

                        <Link to="/contest" className="btn btn-secondary btn-sm px-6 rounded-xl font-semibold whitespace-nowrap self-start lg:self-auto shadow-xs cursor-pointer">
                            View Formats
                        </Link>
                    </div>
                </div>

            </main>

            {/* Footer */}
            <footer className="footer footer-center p-6 text-base-content/60 border-t border-base-200 text-xs font-medium relative z-10">
                <div>
                    <p>© {new Date().getFullYear()} CodeClash. All rights reserved.</p>
                </div>
            </footer>

        </div>
    );
}