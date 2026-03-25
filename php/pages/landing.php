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
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .float-anim { animation: float 6s ease-in-out infinite; }
        .float-anim-delay { animation: float 6s ease-in-out 2s infinite; }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeInUp 0.6s ease forwards; }
        .fade-up-d1 { animation: fadeInUp 0.6s ease 0.1s forwards; opacity:0; }
        .fade-up-d2 { animation: fadeInUp 0.6s ease 0.2s forwards; opacity:0; }
        .fade-up-d3 { animation: fadeInUp 0.6s ease 0.3s forwards; opacity:0; }
        .fade-up-d4 { animation: fadeInUp 0.6s ease 0.4s forwards; opacity:0; }
        .how-step { counter-increment: step-counter; }
        .how-step::before {
            content: counter(step-counter);
            display: flex; align-items: center; justify-content: center;
            width: 48px; height: 48px; border-radius: 50%;
            background: #1B6EB5; color: white; font-weight: 800; font-size: 1.25rem;
            margin-bottom: 1rem; flex-shrink: 0;
        }
    </style>
</head>
<body class="bg-white text-gray-900 overflow-x-hidden">
    <div class="skip-links" role="navigation" aria-label="Skip links">
        <a href="#landing-main" data-testid="link-skip-to-content">Skip to main content</a>
        <a href="#how-it-works" data-testid="link-skip-to-how">Skip to how it works</a>
        <a href="#services" data-testid="link-skip-to-services">Skip to services</a>
    </div>

    <nav class="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm" id="landing-nav" role="navigation" aria-label="Main navigation" data-testid="nav-landing">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <a href="/" class="flex items-center gap-2.5" aria-label="MapAble home">
                    <img src="/assets/images/logo.png" alt="" class="w-10 h-10 rounded-lg" data-testid="img-landing-logo" aria-hidden="true">
                    <div>
                        <span class="text-lg font-black text-map-blue tracking-tight">MapAble</span>
                        <span class="text-xs font-bold text-map-blue/60 ml-0.5">4.0</span>
                    </div>
                </a>
                <div class="hidden md:flex items-center gap-1">
                    <a href="#how-it-works" class="text-sm text-gray-600 hover:text-map-blue transition-colors px-3 py-2 rounded-lg hover:bg-gray-50 min-h-[44px] flex items-center" data-testid="link-nav-how">How It Works</a>
                    <a href="#services" class="text-sm text-gray-600 hover:text-map-blue transition-colors px-3 py-2 rounded-lg hover:bg-gray-50 min-h-[44px] flex items-center" data-testid="link-nav-services">Services</a>
                    <a href="#stories" class="text-sm text-gray-600 hover:text-map-blue transition-colors px-3 py-2 rounded-lg hover:bg-gray-50 min-h-[44px] flex items-center" data-testid="link-nav-stories">Stories</a>
                    <a href="#accessibility" class="text-sm text-gray-600 hover:text-map-blue transition-colors px-3 py-2 rounded-lg hover:bg-gray-50 min-h-[44px] flex items-center" data-testid="link-nav-accessibility">Accessibility</a>
                </div>
                <div class="flex items-center gap-2">
                    <a href="/login" class="text-sm font-medium text-map-blue hover:text-map-navy px-4 py-2 min-h-[44px] flex items-center" data-testid="link-landing-login">Log in</a>
                    <a href="/login" class="text-sm font-semibold text-white bg-map-teal hover:bg-map-teal/90 px-5 py-2.5 rounded-full transition-colors min-h-[44px] flex items-center shadow-sm" data-testid="link-landing-signup">Get Started</a>
                </div>
            </div>
        </div>
        <div class="flex h-[3px] shrink-0" aria-hidden="true">
            <div class="flex-1 bg-map-teal"></div>
            <div class="flex-1 bg-map-blue"></div>
            <div class="flex-1 bg-map-gold"></div>
        </div>
    </nav>

    <main id="landing-main" role="main">

    <section class="pt-28 pb-16 md:pt-32 md:pb-24 bg-gradient-to-b from-blue-50/80 to-white" aria-label="Welcome to MapAble" data-testid="section-hero">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                <div class="space-y-6 fade-up">
                    <div class="inline-flex items-center gap-2 bg-map-teal/10 border border-map-teal/20 rounded-full px-4 py-1.5 text-xs font-semibold text-map-teal" data-testid="badge-ndis-hero">
                        <span class="w-2 h-2 bg-map-teal rounded-full" aria-hidden="true"></span>
                        NDIS Registered Provider
                    </div>
                    <h1 class="text-4xl sm:text-5xl lg:text-[3.5rem] font-black text-gray-900 leading-[1.1] tracking-tight" data-testid="text-hero-heading">
                        Choose your own<br>
                        <span class="text-map-blue">support workers</span>
                    </h1>
                    <p class="text-lg text-gray-600 max-w-lg leading-relaxed" data-testid="text-hero-description">
                        MapAble connects you with verified care workers, accessible transport, and employment opportunities — all managed through your NDIS plan.
                    </p>

                    <form action="/login" method="get" class="max-w-lg" data-testid="form-hero-search">
                        <label for="hero-search" class="sr-only">Search for support workers or services</label>
                        <div class="flex items-center bg-white border-2 border-gray-200 rounded-full px-4 py-1 shadow-sm hover:border-map-blue/40 focus-within:border-map-blue focus-within:ring-4 focus-within:ring-map-blue/10 transition-all">
                            <svg class="w-5 h-5 text-gray-400 shrink-0 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                            <input type="search" id="hero-search" placeholder="Search workers, services, locations..." class="flex-1 bg-transparent outline-none text-sm py-3 text-gray-700 placeholder:text-gray-400" data-testid="input-hero-search">
                            <button type="submit" class="bg-map-teal hover:bg-map-teal/90 text-white font-semibold px-5 py-2 rounded-full text-sm transition-colors min-h-[40px]" data-testid="button-hero-search">Search</button>
                        </div>
                        <p class="text-xs text-gray-400 mt-2 ml-4">Try: "personal care Sydney" or "wheelchair transport Melbourne"</p>
                    </form>

                    <div class="flex flex-wrap items-center gap-6 pt-2 fade-up-d1">
                        <div class="flex items-center gap-2">
                            <span class="text-map-teal font-bold" aria-hidden="true">&#10003;</span>
                            <span class="text-sm text-gray-600">NDIS compliant</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-map-teal font-bold" aria-hidden="true">&#10003;</span>
                            <span class="text-sm text-gray-600">Verified workers</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-map-teal font-bold" aria-hidden="true">&#10003;</span>
                            <span class="text-sm text-gray-600">WCAG 2.2 AA</span>
                        </div>
                    </div>
                </div>

                <div class="hidden lg:block fade-up-d2">
                    <div class="relative">
                        <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4">
                            <div class="flex items-center gap-3 pb-3 border-b border-gray-100">
                                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-map-teal to-map-blue flex items-center justify-center text-white font-bold text-lg">S</div>
                                <div>
                                    <p class="font-bold text-gray-900">Sarah Chen</p>
                                    <p class="text-sm text-gray-500">Personal Care &middot; Sydney</p>
                                </div>
                                <div class="ml-auto text-right">
                                    <div class="text-map-gold text-sm" aria-label="Rating 4.9 out of 5">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                                    <p class="text-xs text-gray-400">42 reviews</p>
                                </div>
                            </div>
                            <div class="flex flex-wrap gap-2">
                                <span class="text-xs bg-map-teal/10 text-map-teal px-3 py-1 rounded-full font-medium">NDIS Verified</span>
                                <span class="text-xs bg-map-blue/10 text-map-blue px-3 py-1 rounded-full font-medium">First Aid</span>
                                <span class="text-xs bg-purple-50 text-purple-600 px-3 py-1 rounded-full font-medium">Manual Handling</span>
                            </div>
                            <p class="text-sm text-gray-600 leading-relaxed">"I'm passionate about empowering people to live independently. I specialise in personal care, community access, and meal preparation."</p>
                            <div class="flex items-center justify-between pt-2">
                                <span class="text-lg font-bold text-map-blue">$68.00<span class="text-sm font-normal text-gray-400">/hr</span></span>
                                <span class="bg-map-teal text-white text-sm font-semibold px-5 py-2 rounded-full">Book Now</span>
                            </div>
                        </div>
                        <div class="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3 flex items-center gap-3 float-anim" aria-hidden="true">
                            <div class="w-8 h-8 rounded-full bg-map-gold/10 flex items-center justify-center text-map-gold text-sm">&#9733;</div>
                            <div>
                                <p class="text-xs font-semibold text-gray-900">4.8 average rating</p>
                                <p class="text-[10px] text-gray-400">Across all workers</p>
                            </div>
                        </div>
                        <div class="absolute -top-3 -left-3 bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3 flex items-center gap-3 float-anim-delay" aria-hidden="true">
                            <div class="w-8 h-8 rounded-full bg-map-teal/10 flex items-center justify-center text-map-teal text-sm">&#10003;</div>
                            <div>
                                <p class="text-xs font-semibold text-gray-900">NDIS Registered</p>
                                <p class="text-[10px] text-gray-400">All workers verified</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="how-it-works" class="py-20 bg-white" aria-labelledby="how-heading" data-testid="section-how-it-works" style="counter-reset: step-counter;">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-14">
                <h2 id="how-heading" class="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight" data-testid="text-how-heading">How MapAble Works</h2>
                <p class="text-gray-500 mt-3 max-w-xl mx-auto text-lg">Getting started is simple. Find support that fits your needs in three easy steps.</p>
            </div>
            <div class="grid md:grid-cols-3 gap-8 md:gap-12">
                <div class="how-step text-center flex flex-col items-center fade-up-d1" data-testid="step-search">
                    <h3 class="font-bold text-lg text-gray-900 mb-2">Search & Browse</h3>
                    <p class="text-sm text-gray-500 leading-relaxed">Find verified support workers near you. Filter by services, availability, languages, and specialisations.</p>
                </div>
                <div class="how-step text-center flex flex-col items-center fade-up-d2" data-testid="step-connect">
                    <h3 class="font-bold text-lg text-gray-900 mb-2">Connect & Book</h3>
                    <p class="text-sm text-gray-500 leading-relaxed">Read reviews, check profiles, and book directly. Your NDIS plan rates are applied automatically.</p>
                </div>
                <div class="how-step text-center flex flex-col items-center fade-up-d3" data-testid="step-manage">
                    <h3 class="font-bold text-lg text-gray-900 mb-2">Manage & Track</h3>
                    <p class="text-sm text-gray-500 leading-relaxed">Track sessions, budgets, and invoices in one place. Our AI assistant helps you stay on top of everything.</p>
                </div>
            </div>
        </div>
    </section>

    <section id="services" class="py-20 bg-gray-50" aria-labelledby="services-heading" data-testid="section-services">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-14">
                <div class="inline-flex items-center gap-2 bg-map-blue/10 text-map-blue rounded-full px-4 py-1.5 text-xs font-semibold mb-4">All-in-One Platform</div>
                <h2 id="services-heading" class="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight" data-testid="text-services-heading">Everything You Need</h2>
                <p class="text-gray-500 mt-3 max-w-2xl mx-auto text-lg">Six integrated services built around your NDIS plan, all designed to be accessible and easy to use.</p>
            </div>

            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-map-teal/30 transition-all group" data-testid="card-service-care">
                    <div class="w-14 h-14 rounded-2xl bg-map-teal/10 flex items-center justify-center text-2xl mb-5 group-hover:scale-105 transition-transform" aria-hidden="true">&#9829;</div>
                    <h3 class="font-bold text-lg text-gray-900 mb-2">Care & Support</h3>
                    <p class="text-sm text-gray-500 leading-relaxed mb-4">Find verified support workers for personal care, daily living, community access, and specialist support. Read reviews and book directly.</p>
                    <ul class="space-y-2" aria-label="Care features">
                        <li class="flex items-center gap-2 text-sm text-gray-600"><span class="text-map-teal" aria-hidden="true">&#10003;</span> NDIS-verified workers</li>
                        <li class="flex items-center gap-2 text-sm text-gray-600"><span class="text-map-teal" aria-hidden="true">&#10003;</span> Shift tracking & timers</li>
                        <li class="flex items-center gap-2 text-sm text-gray-600"><span class="text-map-teal" aria-hidden="true">&#10003;</span> Reviews & ratings</li>
                    </ul>
                </div>

                <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-map-blue/30 transition-all group" data-testid="card-service-transport">
                    <div class="w-14 h-14 rounded-2xl bg-map-blue/10 flex items-center justify-center text-2xl mb-5 group-hover:scale-105 transition-transform" aria-hidden="true">&#128652;</div>
                    <h3 class="font-bold text-lg text-gray-900 mb-2">Accessible Transport</h3>
                    <p class="text-sm text-gray-500 leading-relaxed mb-4">Book wheelchair-accessible transport with trained drivers. Log trips and distances, with automatic NDIS pricing applied.</p>
                    <ul class="space-y-2" aria-label="Transport features">
                        <li class="flex items-center gap-2 text-sm text-gray-600"><span class="text-map-teal" aria-hidden="true">&#10003;</span> Wheelchair accessible</li>
                        <li class="flex items-center gap-2 text-sm text-gray-600"><span class="text-map-teal" aria-hidden="true">&#10003;</span> Automated trip logging</li>
                        <li class="flex items-center gap-2 text-sm text-gray-600"><span class="text-map-teal" aria-hidden="true">&#10003;</span> Volume-based pricing</li>
                    </ul>
                </div>

                <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-map-gold/30 transition-all group" data-testid="card-service-employment">
                    <div class="w-14 h-14 rounded-2xl bg-map-gold/10 flex items-center justify-center text-2xl mb-5 group-hover:scale-105 transition-transform" aria-hidden="true">&#128188;</div>
                    <h3 class="font-bold text-lg text-gray-900 mb-2">Find Work</h3>
                    <p class="text-sm text-gray-500 leading-relaxed mb-4">Browse disability support jobs across care, transport, and coordination roles. Filter by location, type, and apply online.</p>
                    <ul class="space-y-2" aria-label="Employment features">
                        <li class="flex items-center gap-2 text-sm text-gray-600"><span class="text-map-teal" aria-hidden="true">&#10003;</span> Care & transport roles</li>
                        <li class="flex items-center gap-2 text-sm text-gray-600"><span class="text-map-teal" aria-hidden="true">&#10003;</span> Location filtering</li>
                        <li class="flex items-center gap-2 text-sm text-gray-600"><span class="text-map-teal" aria-hidden="true">&#10003;</span> Direct applications</li>
                    </ul>
                </div>

                <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-map-teal/30 transition-all group" data-testid="card-service-ai">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-map-teal/10 to-map-blue/10 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform" aria-hidden="true">
                        <span class="text-xl font-black bg-gradient-to-r from-map-teal to-map-blue bg-clip-text text-transparent">AI</span>
                    </div>
                    <h3 class="font-bold text-lg text-gray-900 mb-2">Smart Assistant</h3>
                    <p class="text-sm text-gray-500 leading-relaxed mb-4">Your personal AI helper that can search workers, check budgets, send emails, book transport, and answer NDIS questions.</p>
                    <ul class="space-y-2" aria-label="AI assistant features">
                        <li class="flex items-center gap-2 text-sm text-gray-600"><span class="text-map-teal" aria-hidden="true">&#10003;</span> Voice & predictive text</li>
                        <li class="flex items-center gap-2 text-sm text-gray-600"><span class="text-map-teal" aria-hidden="true">&#10003;</span> 19 integrated tools</li>
                        <li class="flex items-center gap-2 text-sm text-gray-600"><span class="text-map-teal" aria-hidden="true">&#10003;</span> Multi-step reasoning</li>
                    </ul>
                </div>

                <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-map-blue/30 transition-all group" data-testid="card-service-budget">
                    <div class="w-14 h-14 rounded-2xl bg-map-blue/10 flex items-center justify-center text-2xl mb-5 group-hover:scale-105 transition-transform" aria-hidden="true">&#128200;</div>
                    <h3 class="font-bold text-lg text-gray-900 mb-2">Budget Tracking</h3>
                    <p class="text-sm text-gray-500 leading-relaxed mb-4">See exactly where your NDIS funding goes. Track spending across care, transport, and capacity building in real time.</p>
                    <ul class="space-y-2" aria-label="Budget features">
                        <li class="flex items-center gap-2 text-sm text-gray-600"><span class="text-map-teal" aria-hidden="true">&#10003;</span> Real-time balances</li>
                        <li class="flex items-center gap-2 text-sm text-gray-600"><span class="text-map-teal" aria-hidden="true">&#10003;</span> Category breakdown</li>
                        <li class="flex items-center gap-2 text-sm text-gray-600"><span class="text-map-teal" aria-hidden="true">&#10003;</span> Invoice generation</li>
                    </ul>
                </div>

                <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-map-gold/30 transition-all group" data-testid="card-service-pricing">
                    <div class="w-14 h-14 rounded-2xl bg-map-gold/10 flex items-center justify-center text-2xl mb-5 group-hover:scale-105 transition-transform" aria-hidden="true">&#128176;</div>
                    <h3 class="font-bold text-lg text-gray-900 mb-2">Transparent Pricing</h3>
                    <p class="text-sm text-gray-500 leading-relaxed mb-4">NDIS Price Guide-aligned rates with volume discounts. The more you use, the more you save. GST handled automatically.</p>
                    <ul class="space-y-2" aria-label="Pricing features">
                        <li class="flex items-center gap-2 text-sm text-gray-600"><span class="text-map-teal" aria-hidden="true">&#10003;</span> NDIS Price Guide rates</li>
                        <li class="flex items-center gap-2 text-sm text-gray-600"><span class="text-map-teal" aria-hidden="true">&#10003;</span> Volume-based tiers</li>
                        <li class="flex items-center gap-2 text-sm text-gray-600"><span class="text-map-teal" aria-hidden="true">&#10003;</span> GST-free care services</li>
                    </ul>
                </div>
            </div>
        </div>
    </section>

    <section id="stories" class="py-20 bg-white" aria-labelledby="stories-heading" data-testid="section-stories">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-14">
                <h2 id="stories-heading" class="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight" data-testid="text-stories-heading">People Love MapAble</h2>
                <p class="text-gray-500 mt-3 max-w-xl mx-auto text-lg">Real feedback from participants and support workers.</p>
            </div>
            <div class="grid md:grid-cols-3 gap-6">
                <blockquote class="bg-gray-50 rounded-2xl p-6 border border-gray-100" data-testid="card-story-1">
                    <div class="flex items-center gap-1 text-map-gold mb-3" aria-label="5 star rating">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                    <p class="text-sm text-gray-700 leading-relaxed mb-4">"MapAble made it so easy to find a carer who understands my needs. The budget tracking means I always know exactly where my funding is going."</p>
                    <footer class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-map-teal/10 flex items-center justify-center text-map-teal font-bold">J</div>
                        <div>
                            <p class="text-sm font-semibold text-gray-900">Jordan</p>
                            <p class="text-xs text-gray-400">NDIS Participant, Sydney</p>
                        </div>
                    </footer>
                </blockquote>
                <blockquote class="bg-gray-50 rounded-2xl p-6 border border-gray-100" data-testid="card-story-2">
                    <div class="flex items-center gap-1 text-map-gold mb-3" aria-label="5 star rating">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                    <p class="text-sm text-gray-700 leading-relaxed mb-4">"As a support worker, MapAble connects me with participants who are a great fit. The shift timer and invoicing save me hours of admin every week."</p>
                    <footer class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-map-blue/10 flex items-center justify-center text-map-blue font-bold">A</div>
                        <div>
                            <p class="text-sm font-semibold text-gray-900">Alex</p>
                            <p class="text-xs text-gray-400">Support Worker, Melbourne</p>
                        </div>
                    </footer>
                </blockquote>
                <blockquote class="bg-gray-50 rounded-2xl p-6 border border-gray-100" data-testid="card-story-3">
                    <div class="flex items-center gap-1 text-map-gold mb-3" aria-label="5 star rating">&#9733;&#9733;&#9733;&#9733;&#9734;</div>
                    <p class="text-sm text-gray-700 leading-relaxed mb-4">"The AI assistant is brilliant — I just asked it to check my budget and find transport, and it did everything in one go. Voice input makes it even easier."</p>
                    <footer class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-map-gold/10 flex items-center justify-center text-map-gold font-bold">M</div>
                        <div>
                            <p class="text-sm font-semibold text-gray-900">Maria</p>
                            <p class="text-xs text-gray-400">NDIS Participant, Brisbane</p>
                        </div>
                    </footer>
                </blockquote>
            </div>
        </div>
    </section>

    <section id="accessibility" class="py-20 bg-map-blue/[0.03]" aria-labelledby="a11y-heading" data-testid="section-accessibility">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-14">
                <div class="inline-flex items-center gap-2 bg-map-teal/10 text-map-teal rounded-full px-4 py-1.5 text-xs font-semibold mb-4">Built for Everyone</div>
                <h2 id="a11y-heading" class="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight" data-testid="text-a11y-heading">Accessibility First</h2>
                <p class="text-gray-500 mt-3 max-w-xl mx-auto text-lg">MapAble is designed to work for everyone, meeting WCAG 2.2 AA standards throughout.</p>
            </div>
            <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center" data-testid="feature-voice">
                    <div class="w-12 h-12 rounded-xl bg-map-teal/10 flex items-center justify-center text-xl mx-auto mb-3" aria-hidden="true">&#127908;</div>
                    <h3 class="font-bold text-gray-900 mb-1">Voice Input</h3>
                    <p class="text-xs text-gray-500 leading-relaxed">Speak naturally using Web Speech API. Australian English optimised.</p>
                </div>
                <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center" data-testid="feature-keyboard">
                    <div class="w-12 h-12 rounded-xl bg-map-blue/10 flex items-center justify-center text-xl mx-auto mb-3" aria-hidden="true">&#9000;</div>
                    <h3 class="font-bold text-gray-900 mb-1">Keyboard Friendly</h3>
                    <p class="text-xs text-gray-500 leading-relaxed">Full keyboard navigation with visible focus indicators and skip links.</p>
                </div>
                <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center" data-testid="feature-screen-reader">
                    <div class="w-12 h-12 rounded-xl bg-map-gold/10 flex items-center justify-center text-xl mx-auto mb-3" aria-hidden="true">&#128483;</div>
                    <h3 class="font-bold text-gray-900 mb-1">Screen Readers</h3>
                    <p class="text-xs text-gray-500 leading-relaxed">ARIA landmarks, live regions, and descriptive labels throughout.</p>
                </div>
                <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center" data-testid="feature-visual">
                    <div class="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-xl mx-auto mb-3" aria-hidden="true">&#128065;</div>
                    <h3 class="font-bold text-gray-900 mb-1">Visual Options</h3>
                    <p class="text-xs text-gray-500 leading-relaxed">Dark mode, high contrast support, and 44px minimum touch targets.</p>
                </div>
            </div>
        </div>
    </section>

    <section class="py-20 bg-gradient-to-br from-map-blue to-map-navy text-white" aria-labelledby="cta-heading" data-testid="section-cta">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 id="cta-heading" class="text-3xl sm:text-4xl font-black tracking-tight" data-testid="text-cta-heading">Ready to find your support?</h2>
            <p class="text-white/70 mt-4 text-lg leading-relaxed max-w-xl mx-auto">Join MapAble and connect with verified support workers, accessible transport, and employment opportunities — all managed through your NDIS plan.</p>
            <div class="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <a href="/login" class="inline-flex items-center justify-center gap-2 bg-map-teal hover:bg-map-teal/90 text-white font-semibold px-8 py-3.5 rounded-full text-base transition-all shadow-lg min-h-[48px]" data-testid="button-cta-get-started">
                    Get Started Free
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </a>
                <a href="#how-it-works" class="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold px-8 py-3.5 rounded-full text-base transition-all min-h-[48px]" data-testid="button-cta-learn-more">
                    Learn More
                </a>
            </div>
            <p class="text-white/40 text-sm mt-6">No credit card required. NDIS plan rates applied automatically.</p>
        </div>
    </section>

    </main>

    <footer class="bg-gray-900 text-gray-400 py-12" role="contentinfo" data-testid="footer-landing">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <div>
                    <div class="flex items-center gap-2 mb-4">
                        <img src="/assets/images/logo.png" alt="" class="w-8 h-8 rounded-lg" aria-hidden="true">
                        <span class="text-lg font-black text-white">MapAble</span>
                        <span class="text-xs font-bold text-white/50">4.0</span>
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
                        <li>GST Handling</li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-semibold text-white text-sm mb-3">Compliance</h4>
                    <ul class="space-y-2 text-sm">
                        <li class="flex items-center gap-1.5"><span class="text-map-teal" aria-hidden="true">&#10003;</span> NDIS Registered Provider</li>
                        <li class="flex items-center gap-1.5"><span class="text-map-teal" aria-hidden="true">&#10003;</span> WCAG 2.2 AA Compliant</li>
                        <li class="flex items-center gap-1.5"><span class="text-map-teal" aria-hidden="true">&#10003;</span> Secure Auth0 Login</li>
                        <li class="flex items-center gap-1.5"><span class="text-map-teal" aria-hidden="true">&#10003;</span> Data Encryption</li>
                    </ul>
                </div>
            </div>
            <div class="flex h-[2px] mt-10 mb-6" aria-hidden="true">
                <div class="flex-1 bg-map-teal/30"></div>
                <div class="flex-1 bg-map-blue/30"></div>
                <div class="flex-1 bg-map-gold/30"></div>
            </div>
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p class="text-xs text-gray-500">&copy; <?= date('Y') ?> Australian Disability Ltd. All rights reserved.</p>
                <div class="flex items-center gap-4">
                    <button type="button" onclick="speakDescription('MapAble 4.0 by Australian Disability Ltd. An NDIS superapp with six services: care, transport, employment, AI assistant, pricing, and budget tracking. The platform is WCAG 2.2 AA compliant with voice input, predictive text, and secure login.')" class="audio-desc-link text-gray-500 hover:text-gray-300 flex items-center gap-1.5" aria-label="Listen to site overview" data-testid="button-audio-desc-landing">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                        <span class="text-xs">Listen</span>
                    </button>
                </div>
            </div>
        </div>
    </footer>

    <script src="/assets/js/app.js"></script>
    <script>
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            e.preventDefault();
            const el = document.querySelector(a.getAttribute('href'));
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
                el.focus({ preventScroll: true });
            }
        });
    });
    </script>
    <?php require __DIR__ . '/../includes/accessibe_widget.php'; ?>
</body>
</html>
