<?php $pageTitle = 'MapAble 4.0 — Empowering Independence'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MapAble 4.0 — NDIS Support Services | Australian Disability Ltd</title>
    <meta name="description" content="MapAble 4.0 is the NDIS superapp by Australian Disability Ltd. Book care, arrange transport, find jobs, track budgets, and chat with our AI assistant — all in one place.">
    <meta property="og:title" content="MapAble 4.0 — Empowering Independence">
    <meta property="og:description" content="The NDIS superapp for care, transport, employment, and budget tracking.">
    <meta property="og:type" content="website">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>tailwind.config={theme:{extend:{colors:{'map-blue':'#1B6EB5','map-teal':'#2EAA6E','map-gold':'#E6A817','map-navy':'#14578F','map-dark':'#0F1A2E'}}}}</script>
    <link rel="stylesheet" href="/assets/css/style.css">
    <style>
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .float-anim { animation: float 6s ease-in-out infinite; }
        .float-anim-delay { animation: float 6s ease-in-out 2s infinite; }
        .float-anim-delay2 { animation: float 6s ease-in-out 4s infinite; }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeInUp 0.8s ease forwards; }
        .fade-up-d1 { animation: fadeInUp 0.8s ease 0.1s forwards; opacity:0; }
        .fade-up-d2 { animation: fadeInUp 0.8s ease 0.2s forwards; opacity:0; }
        .fade-up-d3 { animation: fadeInUp 0.8s ease 0.3s forwards; opacity:0; }
        .fade-up-d4 { animation: fadeInUp 0.8s ease 0.4s forwards; opacity:0; }
        .fade-up-d5 { animation: fadeInUp 0.8s ease 0.5s forwards; opacity:0; }
    </style>
</head>
<body class="bg-white text-gray-900 overflow-x-hidden">
    <div class="skip-links" role="navigation" aria-label="Skip links">
        <a href="#landing-main" data-testid="link-skip-to-content">Skip to main content</a>
        <a href="#services" data-testid="link-skip-to-services">Skip to services</a>
        <a href="#features" data-testid="link-skip-to-features">Skip to features</a>
    </div>

    <nav class="fixed top-0 left-0 right-0 z-50 transition-all" id="landing-nav" role="navigation" aria-label="Main navigation" data-testid="nav-landing">
        <div class="flex h-[3px] shrink-0" aria-hidden="true">
            <div class="flex-1 bg-map-teal"></div>
            <div class="flex-1" style="background:#1A4B7A"></div>
            <div class="flex-1 bg-map-gold"></div>
        </div>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <div class="flex items-center gap-3">
                    <img src="/assets/images/logo.png" alt="MapAble home" class="w-10 h-10 rounded-lg" data-testid="img-landing-logo">
                    <div aria-hidden="true">
                        <span class="text-lg font-black text-map-gold tracking-tight">MapAble</span>
                        <span class="text-xs font-bold text-map-gold/70 ml-0.5">4.0</span>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <a href="#features" class="hidden sm:inline-block text-sm text-white/70 hover:text-white transition-colors px-3 py-2 min-h-[44px] flex items-center" data-testid="link-nav-features">Features</a>
                    <a href="#services" class="hidden sm:inline-block text-sm text-white/70 hover:text-white transition-colors px-3 py-2 min-h-[44px] flex items-center" data-testid="link-nav-services">Services</a>
                    <a href="#assistant" class="hidden sm:inline-block text-sm text-white/70 hover:text-white transition-colors px-3 py-2 min-h-[44px] flex items-center" data-testid="link-nav-assistant">AI Assistant</a>
                    <a href="/login" class="text-sm font-semibold text-white bg-map-teal hover:bg-map-teal/90 px-5 py-2 rounded-lg transition-colors min-h-[44px] flex items-center" data-testid="link-landing-signin">Sign In</a>
                </div>
            </div>
        </div>
    </nav>

    <main id="landing-main" role="main">
    <section class="relative min-h-screen flex items-center overflow-hidden" style="background:linear-gradient(135deg,#0F1A2E 0%,#14578F 40%,#1B6EB5 70%,#2384C9 100%)" aria-label="Hero — MapAble 4.0 overview" data-testid="section-hero">
        <div class="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <div class="absolute top-20 left-10 w-72 h-72 bg-map-teal/10 rounded-full blur-3xl float-anim"></div>
            <div class="absolute bottom-20 right-10 w-96 h-96 bg-map-gold/10 rounded-full blur-3xl float-anim-delay"></div>
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-map-blue/5 rounded-full blur-3xl float-anim-delay2"></div>
        </div>

        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-40">
            <div class="grid lg:grid-cols-2 gap-12 items-center">
                <div class="space-y-8">
                    <div class="fade-up">
                        <div class="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 text-xs text-white/80 mb-6" data-testid="badge-ndis-hero">
                            <span class="w-2 h-2 bg-map-teal rounded-full"></span>
                            NDIS Registered Provider
                        </div>
                        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight" data-testid="text-hero-heading">
                            Empowering<br>
                            <span class="text-map-gold">Independence</span>
                        </h1>
                        <p class="text-lg sm:text-xl text-white/70 mt-6 max-w-lg leading-relaxed" data-testid="text-hero-description">
                            MapAble 4.0 is the all-in-one NDIS superapp by <strong class="text-white/90">Australian Disability Ltd</strong>. Care, transport, employment, AI assistance, and budget tracking — unified in one platform.
                        </p>
                    </div>

                    <div class="flex flex-col sm:flex-row gap-3 fade-up-d1">
                        <a href="/login" class="inline-flex items-center justify-center gap-2 bg-map-teal hover:bg-map-teal/90 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-all shadow-lg shadow-map-teal/20 min-h-[48px]" data-testid="button-hero-get-started">
                            Get Started
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                        </a>
                        <a href="#services" class="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-all min-h-[48px]" data-testid="button-hero-learn-more">
                            Learn More
                        </a>
                    </div>

                    <div class="flex items-center gap-8 pt-2 fade-up-d2">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-white" data-testid="text-stat-services">6</div>
                            <div class="text-[11px] text-white/50 mt-0.5">Core Services</div>
                        </div>
                        <div class="w-px h-10 bg-white/15"></div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-white" data-testid="text-stat-tools">17</div>
                            <div class="text-[11px] text-white/50 mt-0.5">AI Tools</div>
                        </div>
                        <div class="w-px h-10 bg-white/15"></div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-white" data-testid="text-stat-wcag">AA</div>
                            <div class="text-[11px] text-white/50 mt-0.5">WCAG 2.2</div>
                        </div>
                    </div>
                </div>

                <div class="hidden lg:block relative fade-up-d3">
                    <div class="relative">
                        <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                            <div class="flex items-center gap-2 mb-4">
                                <div class="w-3 h-3 rounded-full bg-red-400"></div>
                                <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
                                <div class="w-3 h-3 rounded-full bg-green-400"></div>
                                <span class="text-xs text-white/40 ml-2">MapAble Dashboard</span>
                            </div>
                            <div class="space-y-3">
                                <div class="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                                    <div class="w-10 h-10 rounded-lg bg-map-teal/20 flex items-center justify-center text-map-teal">♥</div>
                                    <div>
                                        <div class="text-sm font-semibold text-white/90">Care Booking</div>
                                        <div class="text-[11px] text-white/50">3 workers available nearby</div>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                                    <div class="w-10 h-10 rounded-lg bg-map-blue/20 flex items-center justify-center text-map-blue">🚌</div>
                                    <div>
                                        <div class="text-sm font-semibold text-white/90">Transport Ready</div>
                                        <div class="text-[11px] text-white/50">Wheelchair accessible options</div>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                                    <div class="w-10 h-10 rounded-lg bg-map-gold/20 flex items-center justify-center text-map-gold">📊</div>
                                    <div>
                                        <div class="text-sm font-semibold text-white/90">Budget: 62% Remaining</div>
                                        <div class="text-[11px] text-white/50">$18,600 of $30,000 NDIS plan</div>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3 bg-map-teal/10 border border-map-teal/20 rounded-lg p-3">
                                    <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-map-teal to-map-blue flex items-center justify-center text-white font-bold text-sm">M</div>
                                    <div class="flex-1">
                                        <div class="text-sm font-semibold text-white/90">MapAble Assistant</div>
                                        <div class="text-[11px] text-map-teal">Ready to help — voice + predictive text</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="services" class="py-24 bg-gray-50" aria-labelledby="services-heading" data-testid="section-services">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <div class="inline-flex items-center gap-2 bg-map-teal/10 text-map-teal rounded-full px-4 py-1.5 text-xs font-semibold mb-4">NDIS Services</div>
                <h2 id="services-heading" class="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight" data-testid="text-services-heading">Everything You Need, One App</h2>
                <p class="text-gray-500 mt-3 max-w-2xl mx-auto">Six integrated services designed around your NDIS plan, accessibility needs, and independence goals.</p>
            </div>

            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="bg-white rounded-xl p-6 border border-gray-200 hover:border-map-teal/30 hover:shadow-lg transition-all group" data-testid="card-service-care">
                    <div class="w-12 h-12 rounded-xl bg-map-teal/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">♥</div>
                    <h3 class="font-bold text-lg text-gray-900">MapAble for Care</h3>
                    <p class="text-sm text-gray-500 mt-2 leading-relaxed">Book verified support workers and carers. Search by specialisation, location, and accessibility needs. Track shifts and sessions.</p>
                    <div class="flex flex-wrap gap-1.5 mt-4">
                        <span class="text-[10px] bg-map-teal/10 text-map-teal px-2 py-0.5 rounded-full">Verified Workers</span>
                        <span class="text-[10px] bg-map-teal/10 text-map-teal px-2 py-0.5 rounded-full">Shift Timer</span>
                        <span class="text-[10px] bg-map-teal/10 text-map-teal px-2 py-0.5 rounded-full">Reviews</span>
                    </div>
                </div>

                <div class="bg-white rounded-xl p-6 border border-gray-200 hover:border-map-blue/30 hover:shadow-lg transition-all group" data-testid="card-service-transport">
                    <div class="w-12 h-12 rounded-xl bg-map-blue/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">🚌</div>
                    <h3 class="font-bold text-lg text-gray-900">MapAble for Transport</h3>
                    <p class="text-sm text-gray-500 mt-2 leading-relaxed">Arrange wheelchair-accessible transport. Log trips, track distances, and get automatic NDIS tier pricing applied.</p>
                    <div class="flex flex-wrap gap-1.5 mt-4">
                        <span class="text-[10px] bg-map-blue/10 text-map-blue px-2 py-0.5 rounded-full">Wheelchair Access</span>
                        <span class="text-[10px] bg-map-blue/10 text-map-blue px-2 py-0.5 rounded-full">Trip Logger</span>
                        <span class="text-[10px] bg-map-blue/10 text-map-blue px-2 py-0.5 rounded-full">Tier Pricing</span>
                    </div>
                </div>

                <div class="bg-white rounded-xl p-6 border border-gray-200 hover:border-map-gold/30 hover:shadow-lg transition-all group" data-testid="card-service-employment">
                    <div class="w-12 h-12 rounded-xl bg-map-gold/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">💼</div>
                    <h3 class="font-bold text-lg text-gray-900">MapAble for Employment</h3>
                    <p class="text-sm text-gray-500 mt-2 leading-relaxed">Find disability support jobs across care, transport, support coordination, and employment services. Filter by type and location.</p>
                    <div class="flex flex-wrap gap-1.5 mt-4">
                        <span class="text-[10px] bg-map-gold/10 text-map-gold px-2 py-0.5 rounded-full">Job Board</span>
                        <span class="text-[10px] bg-map-gold/10 text-map-gold px-2 py-0.5 rounded-full">Categories</span>
                        <span class="text-[10px] bg-map-gold/10 text-map-gold px-2 py-0.5 rounded-full">Apply Online</span>
                    </div>
                </div>

                <div class="bg-white rounded-xl p-6 border border-gray-200 hover:border-map-teal/30 hover:shadow-lg transition-all group" data-testid="card-service-ai">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-map-teal/20 to-map-blue/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <span class="text-lg font-bold bg-gradient-to-r from-map-teal to-map-blue bg-clip-text text-transparent">M</span>
                    </div>
                    <h3 class="font-bold text-lg text-gray-900">MapAble Assistant</h3>
                    <p class="text-sm text-gray-500 mt-2 leading-relaxed">AI-powered agentic assistant with 17 tools. Voice recognition, predictive text, multi-step reasoning, and personalised NDIS guidance.</p>
                    <div class="flex flex-wrap gap-1.5 mt-4">
                        <span class="text-[10px] bg-map-teal/10 text-map-teal px-2 py-0.5 rounded-full">Voice Input</span>
                        <span class="text-[10px] bg-map-teal/10 text-map-teal px-2 py-0.5 rounded-full">Predictive Text</span>
                        <span class="text-[10px] bg-map-teal/10 text-map-teal px-2 py-0.5 rounded-full">17 Tools</span>
                    </div>
                </div>

                <div class="bg-white rounded-xl p-6 border border-gray-200 hover:border-map-blue/30 hover:shadow-lg transition-all group" data-testid="card-service-pricing">
                    <div class="w-12 h-12 rounded-xl bg-map-blue/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">💲</div>
                    <h3 class="font-bold text-lg text-gray-900">NDIS Pricing</h3>
                    <p class="text-sm text-gray-500 mt-2 leading-relaxed">Transparent NDIS-aligned pricing with automatic tier calculation. Care and transport tiers with item codes for claiming.</p>
                    <div class="flex flex-wrap gap-1.5 mt-4">
                        <span class="text-[10px] bg-map-blue/10 text-map-blue px-2 py-0.5 rounded-full">Tier Pricing</span>
                        <span class="text-[10px] bg-map-blue/10 text-map-blue px-2 py-0.5 rounded-full">NDIS Codes</span>
                        <span class="text-[10px] bg-map-blue/10 text-map-blue px-2 py-0.5 rounded-full">Auto-Calculate</span>
                    </div>
                </div>

                <div class="bg-white rounded-xl p-6 border border-gray-200 hover:border-map-gold/30 hover:shadow-lg transition-all group" data-testid="card-service-budget">
                    <div class="w-12 h-12 rounded-xl bg-map-gold/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">📊</div>
                    <h3 class="font-bold text-lg text-gray-900">Budget Tracking</h3>
                    <p class="text-sm text-gray-500 mt-2 leading-relaxed">Real-time NDIS plan budget monitoring. Track spending across care, transport, and support categories with visual progress bars.</p>
                    <div class="flex flex-wrap gap-1.5 mt-4">
                        <span class="text-[10px] bg-map-gold/10 text-map-gold px-2 py-0.5 rounded-full">Real-Time</span>
                        <span class="text-[10px] bg-map-gold/10 text-map-gold px-2 py-0.5 rounded-full">Categories</span>
                        <span class="text-[10px] bg-map-gold/10 text-map-gold px-2 py-0.5 rounded-full">Invoices</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="features" class="py-24 bg-white" aria-labelledby="features-heading" data-testid="section-features">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <div class="inline-flex items-center gap-2 bg-map-blue/10 text-map-blue rounded-full px-4 py-1.5 text-xs font-semibold mb-4">Platform Features</div>
                <h2 id="features-heading" class="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight" data-testid="text-features-heading">Built for Accessibility</h2>
                <p class="text-gray-500 mt-3 max-w-2xl mx-auto">Every feature is designed with WCAG 2.2 AA compliance, ensuring the platform works for everyone.</p>
            </div>

            <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="text-center p-6" data-testid="feature-voice">
                    <div class="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-2xl mx-auto mb-4">🎤</div>
                    <h3 class="font-bold text-gray-900">Voice Input</h3>
                    <p class="text-sm text-gray-500 mt-2">Speak naturally with Web Speech API voice recognition. Australian English optimised.</p>
                </div>
                <div class="text-center p-6" data-testid="feature-predictions">
                    <div class="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-2xl mx-auto mb-4">✨</div>
                    <h3 class="font-bold text-gray-900">Predictive Text</h3>
                    <p class="text-sm text-gray-500 mt-2">AI-powered text predictions help you compose messages faster, like Co:Writer.</p>
                </div>
                <div class="text-center p-6" data-testid="feature-accessible">
                    <div class="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl mx-auto mb-4">♿</div>
                    <h3 class="font-bold text-gray-900">Fully Accessible</h3>
                    <p class="text-sm text-gray-500 mt-2">44px touch targets, skip navigation, ARIA landmarks, dark mode, and screen reader support.</p>
                </div>
                <div class="text-center p-6" data-testid="feature-auth">
                    <div class="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-2xl mx-auto mb-4">🔐</div>
                    <h3 class="font-bold text-gray-900">Secure Login</h3>
                    <p class="text-sm text-gray-500 mt-2">Sign in with Google or Microsoft via Auth0, or use your MapAble account.</p>
                </div>
            </div>
        </div>
    </section>

    <section id="assistant" class="py-24 relative overflow-hidden" style="background:linear-gradient(135deg,#0F1A2E,#14578F)" aria-labelledby="assistant-heading" data-testid="section-assistant">
        <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div class="absolute top-10 right-20 w-64 h-64 bg-map-teal/10 rounded-full blur-3xl"></div>
            <div class="absolute bottom-10 left-20 w-80 h-80 bg-map-gold/10 rounded-full blur-3xl"></div>
        </div>
        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                    <div class="inline-flex items-center gap-2 bg-map-teal/10 text-map-teal rounded-full px-4 py-1.5 text-xs font-semibold mb-6">Agentic AI</div>
                    <h2 id="assistant-heading" class="text-3xl sm:text-4xl font-black text-white tracking-tight" data-testid="text-assistant-heading">
                        Meet Your <span class="text-map-gold">Intelligent</span> Assistant
                    </h2>
                    <p class="text-white/70 mt-4 text-lg leading-relaxed">MapAble Assistant is an autonomous AI agent that reasons, plans, and executes multi-step tasks to help you manage your NDIS services.</p>

                    <div class="space-y-4 mt-8">
                        <div class="flex items-start gap-3">
                            <div class="w-8 h-8 rounded-lg bg-map-teal/20 flex items-center justify-center text-map-teal shrink-0 mt-0.5">🧠</div>
                            <div>
                                <h4 class="font-semibold text-white text-sm">Autonomous Reasoning</h4>
                                <p class="text-white/60 text-sm mt-0.5">Plans multi-step tasks and executes them independently using 17 specialised tools.</p>
                            </div>
                        </div>
                        <div class="flex items-start gap-3">
                            <div class="w-8 h-8 rounded-lg bg-map-teal/20 flex items-center justify-center text-map-teal shrink-0 mt-0.5">🎤</div>
                            <div>
                                <h4 class="font-semibold text-white text-sm">Voice & Predictive Text</h4>
                                <p class="text-white/60 text-sm mt-0.5">Speak your requests or get AI text predictions as you type — designed for accessibility.</p>
                            </div>
                        </div>
                        <div class="flex items-start gap-3">
                            <div class="w-8 h-8 rounded-lg bg-map-teal/20 flex items-center justify-center text-map-teal shrink-0 mt-0.5">🛡️</div>
                            <div>
                                <h4 class="font-semibold text-white text-sm">Safety-First</h4>
                                <p class="text-white/60 text-sm mt-0.5">Proactive safety warnings based on your access profile — stairs, transfer distances, and more.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="hidden lg:block">
                    <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
                        <div class="flex items-center gap-2 mb-4">
                            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-map-teal to-map-blue flex items-center justify-center text-white text-sm font-bold">M</div>
                            <div>
                                <div class="text-sm font-semibold text-white">MapAble Assistant</div>
                                <div class="text-[10px] text-map-teal">Agentic AI · Voice · Predictive Text</div>
                            </div>
                        </div>
                        <div class="space-y-3">
                            <div class="flex justify-end">
                                <div class="bg-map-teal/20 text-white/90 text-sm rounded-xl rounded-br-sm px-4 py-2.5 max-w-[80%]">Review my budget and find available carers near Sydney</div>
                            </div>
                            <div class="flex justify-start">
                                <div class="bg-white/10 text-white/90 text-sm rounded-xl rounded-bl-sm px-4 py-2.5 max-w-[85%] space-y-2">
                                    <p><strong>Budget Overview:</strong></p>
                                    <p>• Core Support: $12,400 remaining (62%)</p>
                                    <p>• Transport: $3,200 remaining (80%)</p>
                                    <p class="mt-2"><strong>Available Carers in Sydney:</strong></p>
                                    <p>• Sarah Chen ★4.9 — $68/hr</p>
                                    <p>• Michael Torres ★4.8 — $65/hr</p>
                                    <div class="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                                        <span class="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">high · 2 tools</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="py-20 bg-gray-50" aria-labelledby="cta-heading" data-testid="section-cta">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 id="cta-heading" class="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight" data-testid="text-cta-heading">Ready to Get Started?</h2>
            <p class="text-gray-500 mt-3 text-lg">Join MapAble 4.0 and take control of your NDIS services today.</p>
            <div class="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <a href="/login" class="inline-flex items-center justify-center gap-2 bg-map-teal hover:bg-map-teal/90 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-all shadow-lg shadow-map-teal/20 min-h-[48px]" data-testid="button-cta-signin">
                    Sign In to MapAble
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </a>
            </div>
        </div>
    </section>

    </main>

    <footer class="bg-gray-900 text-gray-400 py-12" role="contentinfo" data-testid="footer-landing">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <div>
                    <div class="flex items-center gap-2 mb-4">
                        <img src="/assets/images/logo.png" alt="" class="w-8 h-8 rounded-lg" aria-hidden="true">
                        <span class="text-lg font-black text-map-gold">MapAble</span>
                        <span class="text-xs font-bold text-map-gold/70">4.0</span>
                    </div>
                    <p class="text-sm leading-relaxed">Empowering Independence through integrated NDIS services.</p>
                    <p class="text-sm mt-2">By Australian Disability Ltd</p>
                </div>
                <div>
                    <h4 class="font-semibold text-white text-sm mb-3">Services</h4>
                    <ul class="space-y-2 text-sm">
                        <li>Care & Support Workers</li>
                        <li>Accessible Transport</li>
                        <li>Employment Opportunities</li>
                        <li>AI-Powered Assistance</li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-semibold text-white text-sm mb-3">Platform</h4>
                    <ul class="space-y-2 text-sm">
                        <li>NDIS Pricing</li>
                        <li>Budget Tracking</li>
                        <li>Invoice Management</li>
                        <li>Accessibility Reports</li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-semibold text-white text-sm mb-3">Compliance</h4>
                    <ul class="space-y-2 text-sm">
                        <li class="flex items-center gap-1.5"><span class="text-map-teal" aria-hidden="true">✓</span> NDIS Registered Provider</li>
                        <li class="flex items-center gap-1.5"><span class="text-map-teal" aria-hidden="true">✓</span> WCAG 2.2 AA Compliant</li>
                        <li class="flex items-center gap-1.5"><span class="text-map-teal" aria-hidden="true">✓</span> Auth0 Secure Login</li>
                        <li class="flex items-center gap-1.5"><span class="text-map-teal" aria-hidden="true">✓</span> Data Encryption</li>
                    </ul>
                </div>
            </div>
            <div class="flex h-[2px] mt-10 mb-6" aria-hidden="true">
                <div class="flex-1 bg-map-teal/30"></div>
                <div class="flex-1 bg-map-navy/30"></div>
                <div class="flex-1 bg-map-gold/30"></div>
            </div>
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p class="text-xs text-gray-500">&copy; <?= date('Y') ?> Australian Disability Ltd. All rights reserved.</p>
                <div class="flex items-center gap-4">
                    <button type="button" onclick="speakDescription('MapAble 4.0 by Australian Disability Ltd. An NDIS superapp with six services: care, transport, employment, AI assistant, pricing, and budget tracking. The platform is WCAG 2.2 AA compliant with voice input, predictive text, and secure login via Google or Microsoft.')" class="audio-desc-link text-gray-500 hover:text-gray-300 flex items-center gap-1.5" aria-label="Listen to site overview" data-testid="button-audio-desc-landing">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                        <span class="text-xs">Listen</span>
                    </button>
                    <div class="flex items-center gap-2 text-xs text-gray-500">
                        <span class="text-map-teal/60" aria-hidden="true">✓</span>
                        <span>MapAble 4.0 — Empowering Independence</span>
                    </div>
                </div>
            </div>
        </div>
    </footer>

    <script src="/assets/js/app.js"></script>
    <script>
    const nav = document.getElementById('landing-nav');
    const navBg = 'background:linear-gradient(90deg,#14578F,#1B6EB5,#2384C9)';
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.style.cssText = navBg + ';backdrop-filter:blur(12px)';
        } else {
            nav.style.cssText = '';
        }
    });

    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            e.preventDefault();
            const el = document.querySelector(a.getAttribute('href'));
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        });
    });
    </script>
    <?php require __DIR__ . '/../includes/accessibe_widget.php'; ?>
</body>
</html>
