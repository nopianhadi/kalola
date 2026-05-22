// Design System Component

const ColorSwatch = ({ name, colorClass, hex }: { name: string, colorClass: string, hex: string }) => (
  <div className="flex flex-col items-center group">
    <div className={`w-24 h-24 rounded-2xl shadow-lg mb-3 ${colorClass} group-hover:scale-110 transition-transform duration-300 ring-1 ring-black/5`}></div>
    <span className="font-semibold text-sm text-slate-800">{name}</span>
    <span className="text-xs text-slate-500 font-mono mt-1">{hex}</span>
  </div>
);

const DesignSystem = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-blue-500/30">
      <div className="max-w-7xl mx-auto space-y-24">
        
        {/* Header Section */}
        <header className="text-center space-y-6">
          <div className="inline-block p-4 rounded-3xl bg-white shadow-xl shadow-blue-500/10 mb-4 animate-slide-down">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 animate-fade-in">
            Emagenic <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Design System</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto animate-slide-up">
            A comprehensive guide to the typography, colors, and components that make up the Emagenic visual language. Designed for premium feel and dynamic interactions.
          </p>
        </header>

        {/* 1. Color Palette */}
        <section className="space-y-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-3xl font-bold text-slate-900">1. Color Palette</h2>
            <p className="text-slate-500 mt-2">The core colors that represent the brand's identity and state communication.</p>
          </div>
          
          <div className="space-y-12">
            <div>
              <h3 className="text-lg font-semibold text-slate-700 mb-6">Brand Primary</h3>
              <div className="flex flex-wrap gap-8">
                <ColorSwatch name="Blue 500" colorClass="bg-blue-500" hex="#3b82f6" />
                <ColorSwatch name="Blue 600" colorClass="bg-blue-600" hex="#2563eb" />
                <ColorSwatch name="Indigo 500" colorClass="bg-indigo-500" hex="#6366f1" />
                <ColorSwatch name="Indigo 600" colorClass="bg-indigo-600" hex="#4f46e5" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-700 mb-6">Grayscale & Backgrounds</h3>
              <div className="flex flex-wrap gap-8">
                <ColorSwatch name="Slate 50" colorClass="bg-slate-50" hex="#f8fafc" />
                <ColorSwatch name="Slate 100" colorClass="bg-slate-100" hex="#f1f5f9" />
                <ColorSwatch name="Slate 800" colorClass="bg-slate-800" hex="#1e293b" />
                <ColorSwatch name="Slate 900" colorClass="bg-slate-900" hex="#0f172a" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-700 mb-6">Semantic / Status</h3>
              <div className="flex flex-wrap gap-8">
                <ColorSwatch name="Success" colorClass="bg-green-500" hex="#22c55e" />
                <ColorSwatch name="Warning" colorClass="bg-amber-500" hex="#f59e0b" />
                <ColorSwatch name="Danger" colorClass="bg-red-500" hex="#ef4444" />
                <ColorSwatch name="Info" colorClass="bg-cyan-500" hex="#06b6d4" />
              </div>
            </div>
          </div>
        </section>

        {/* 2. Typography */}
        <section className="space-y-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-3xl font-bold text-slate-900">2. Typography</h2>
            <p className="text-slate-500 mt-2">Clear, legible, and modern typography using the Manrope font family.</p>
          </div>
          
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm ring-1 ring-slate-200/50 space-y-12">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Headings</p>
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-baseline gap-4 md:gap-12">
                  <span className="text-slate-400 font-mono text-sm w-32 shrink-0">H1 / 5xl</span>
                  <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">Beautiful design is obvious.</h1>
                </div>
                <div className="flex flex-col md:flex-row md:items-baseline gap-4 md:gap-12">
                  <span className="text-slate-400 font-mono text-sm w-32 shrink-0">H2 / 4xl</span>
                  <h2 className="text-4xl font-bold text-slate-900 tracking-tight">Great design is transparent.</h2>
                </div>
                <div className="flex flex-col md:flex-row md:items-baseline gap-4 md:gap-12">
                  <span className="text-slate-400 font-mono text-sm w-32 shrink-0">H3 / 2xl</span>
                  <h3 className="text-2xl font-bold text-slate-900">Typography creates hierarchy and flow.</h3>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Body Copy</p>
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-baseline gap-4 md:gap-12">
                  <span className="text-slate-400 font-mono text-sm w-32 shrink-0">Body Large</span>
                  <p className="text-lg text-slate-700 leading-relaxed max-w-3xl">
                    Our design system provides a shared vocabulary for teams to build high-quality user experiences. It ensures consistency, accessibility, and speed in our product development.
                  </p>
                </div>
                <div className="flex flex-col md:flex-row md:items-baseline gap-4 md:gap-12">
                  <span className="text-slate-400 font-mono text-sm w-32 shrink-0">Body Regular</span>
                  <p className="text-base text-slate-600 leading-relaxed max-w-3xl">
                    Every element is carefully crafted to serve a purpose. We believe that good design should be invisible, letting the content and functionality shine through without friction.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Buttons & Actions */}
        <section className="space-y-8 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-3xl font-bold text-slate-900">3. Buttons & Actions</h2>
            <p className="text-slate-500 mt-2">Interactive elements designed for high affordance and delightful feedback.</p>
          </div>

          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm ring-1 ring-slate-200/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-500 uppercase">Primary</h4>
                <div className="flex flex-col gap-4">
                  <button className="button-primary">Save Changes</button>
                  <button className="button-primary opacity-50 cursor-not-allowed">Disabled State</button>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-500 uppercase">Secondary</h4>
                <div className="flex flex-col gap-4">
                  <button className="button-secondary">Cancel</button>
                  <button className="button-secondary opacity-50 cursor-not-allowed">Disabled State</button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-500 uppercase">Danger</h4>
                <div className="flex flex-col gap-4">
                  <button className="button-danger">Delete Project</button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-500 uppercase">Success</h4>
                <div className="flex flex-col gap-4">
                  <button className="button-success">Approve Invoice</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Badges & Status */}
        <section className="space-y-8 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-3xl font-bold text-slate-900">4. Status Badges</h2>
            <p className="text-slate-500 mt-2">Used for metadata, tags, and indicating state.</p>
          </div>

          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm ring-1 ring-slate-200/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase mb-6">Solid Badges</h4>
                <div className="flex flex-wrap gap-4">
                  <span className="status-badge status-success">Completed</span>
                  <span className="status-badge status-info">In Progress</span>
                  <span className="status-badge status-warning">Pending</span>
                  <span className="status-badge status-danger">Overdue</span>
                  <span className="status-badge status-purple">Review</span>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase mb-6">Soft Badges (Light)</h4>
                <div className="flex flex-wrap gap-4">
                  <span className="status-badge status-light-success">Completed</span>
                  <span className="status-badge status-light-info">In Progress</span>
                  <span className="status-badge status-light-warning">Pending</span>
                  <span className="status-badge status-light-danger">Overdue</span>
                  <span className="status-badge status-light-purple">Review</span>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase mb-6">Animated Variants</h4>
                <div className="flex flex-wrap gap-4">
                  <span className="status-badge status-success status-glow">Live Now</span>
                  <span className="status-badge status-danger status-pulse">Urgent!</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. UI Components Showcase */}
        <section className="space-y-8 animate-fade-in" style={{ animationDelay: '500ms' }}>
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-3xl font-bold text-slate-900">5. Component Showcase</h2>
            <p className="text-slate-500 mt-2">Combined elements forming cohesive UI patterns.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Mock Card 1 */}
            <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/50 card-hover-lift transition-all">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-xl text-slate-900">Wedding Photography</h3>
                  <p className="text-slate-500 text-sm mt-1">John & Jane • Oct 24, 2026</p>
                </div>
                <span className="status-badge status-light-info">In Progress</span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700">Project Completion</span>
                    <span className="font-bold text-blue-600">65%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                  <div className="flex -space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-600">J</div>
                    <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-600">M</div>
                  </div>
                  <button className="button-secondary !py-2 !px-4 text-xs">View Details</button>
                </div>
              </div>
            </div>

            {/* Mock Glass Card */}
            <div className="relative rounded-3xl p-6 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-2xl">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-50 transform translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500 rounded-full mix-blend-overlay filter blur-3xl opacity-50 transform -translate-x-1/2 translate-y-1/2"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="status-badge bg-white/20 text-white border-0 backdrop-blur-md">Pro Feature</span>
                </div>
                
                <h3 className="font-bold text-2xl mb-2">Premium Analytics</h3>
                <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                  Unlock advanced insights into your business growth with real-time tracking and automated reporting.
                </p>
                
                <button className="w-full bg-white text-slate-900 hover:bg-slate-50 font-bold py-3 px-4 rounded-xl transition-transform hover:scale-[1.02] active:scale-95 shadow-lg">
                  Upgrade Now
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* 6. Form Elements */}
        <section className="space-y-8 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-3xl font-bold text-slate-900">6. Form Elements</h2>
            <p className="text-slate-500 mt-2">Input fields, toggles, and controls for user data entry.</p>
          </div>

          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm ring-1 ring-slate-200/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="John Doe" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address <span className="text-red-500">*</span></label>
                  <input 
                    type="email" 
                    defaultValue="invalid-email" 
                    className="w-full px-4 py-3 rounded-xl border border-red-300 bg-red-50 text-red-900 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                  />
                  <p className="text-xs text-red-500 mt-2 font-medium">Please enter a valid email address.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Project Type</label>
                  <div className="relative">
                    <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none appearance-none">
                      <option>Wedding Photography</option>
                      <option>Pre-Wedding</option>
                      <option>Event Documentation</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-4">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-6 h-6">
                      <input type="checkbox" className="peer appearance-none w-6 h-6 border-2 border-slate-300 rounded-lg checked:bg-blue-500 checked:border-blue-500 transition-colors" defaultChecked />
                      <svg className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-slate-700 font-medium group-hover:text-slate-900 transition-colors">Subscribe to newsletter</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-12 h-6">
                      <input type="checkbox" className="peer sr-only" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </div>
                    <span className="text-slate-700 font-medium group-hover:text-slate-900 transition-colors">Enable notifications</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Alerts & Feedback */}
        <section className="space-y-8 animate-fade-in" style={{ animationDelay: '700ms' }}>
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-3xl font-bold text-slate-900">7. Alerts & Feedback</h2>
            <p className="text-slate-500 mt-2">Contextual messages and user feedback elements.</p>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-blue-900">Information</h4>
                <p className="text-blue-700 text-sm mt-1">A new version of the dashboard is available. Refresh to apply updates.</p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-green-900">Success</h4>
                <p className="text-green-700 text-sm mt-1">Your payment of Rp 5.000.000 has been successfully processed.</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-amber-900">Warning</h4>
                <p className="text-amber-700 text-sm mt-1">Your storage space is almost full (95%). Please upgrade your plan soon.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Avatars & Profiles */}
        <section className="space-y-8 animate-fade-in" style={{ animationDelay: '800ms' }}>
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-3xl font-bold text-slate-900">8. Avatars & Profiles</h2>
            <p className="text-slate-500 mt-2">Visual representation of users and team members.</p>
          </div>

          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm ring-1 ring-slate-200/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase mb-6">Sizes</h4>
                <div className="flex items-end gap-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">AD</div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-lg font-bold shadow-md">JD</div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold shadow">SM</div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-xs font-bold">RW</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase mb-6">Avatar Groups</h4>
                <div className="flex -space-x-4">
                  <img className="w-12 h-12 rounded-full border-4 border-white object-cover" src="https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff" alt="User" />
                  <img className="w-12 h-12 rounded-full border-4 border-white object-cover" src="https://ui-avatars.com/api/?name=Jane+Smith&background=E53E3E&color=fff" alt="User" />
                  <img className="w-12 h-12 rounded-full border-4 border-white object-cover" src="https://ui-avatars.com/api/?name=Bob+Johnson&background=38A169&color=fff" alt="User" />
                  <div className="w-12 h-12 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 z-10">+5</div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default DesignSystem;
