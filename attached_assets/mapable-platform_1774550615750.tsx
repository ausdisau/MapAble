import React, { useState } from 'react';
import { MapPin, Heart, Briefcase, Bus, Search, Menu, X, Star, ChevronRight, Phone, Mail, MessageCircle, User, Settings } from 'lucide-react';

const MapAbleApp = () => {
  const [activeTab, setActiveTab] = useState('care');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const services = {
    care: [
      { id: 1, name: 'Sarah Johnson', type: 'Support Worker', rating: 4.9, reviews: 127, location: 'Sydney, NSW', distance: '2.3 km', verified: true, ndis: true },
      { id: 2, name: 'Michael Chen', type: 'Personal Care Assistant', rating: 4.8, reviews: 94, location: 'Melbourne, VIC', distance: '3.7 km', verified: true, ndis: true },
      { id: 3, name: 'Emma Wilson', type: 'Disability Support Worker', rating: 5.0, reviews: 156, location: 'Brisbane, QLD', distance: '1.8 km', verified: true, ndis: true },
    ],
    transport: [
      { id: 1, name: 'Accessible Bus Route 301', type: 'Public Transport', accessibility: 'Wheelchair accessible', nextArrival: '5 min', location: 'Central Station' },
      { id: 2, name: 'AccessiRide Taxi Service', type: 'On-Demand', accessibility: 'Full wheelchair access', availability: 'Available now', location: 'City-wide' },
      { id: 3, name: 'Train Line - Eastern Suburbs', type: 'Rail', accessibility: 'Step-free access', nextArrival: '12 min', location: 'Town Hall Station' },
    ],
    marketplace: [
      { id: 1, name: 'Adaptive Kitchen Tools Set', category: 'Daily Living Aids', price: 89, rating: 4.7, seller: 'Accessible Living Store' },
      { id: 2, name: 'Wheelchair Maintenance Service', category: 'Services', price: 120, rating: 4.9, seller: 'MobilityPro Services' },
      { id: 3, name: 'Sign Language Interpreter', category: 'Professional Services', price: 85, rating: 5.0, seller: 'AUSLAN Connect' },
    ]
  };

  const TabButton = ({ icon: Icon, label, value }) => (
    <button
      onClick={() => setActiveTab(value)}
      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
        activeTab === value
          ? 'bg-blue-600 text-white shadow-lg'
          : 'bg-white text-gray-700 hover:bg-gray-50'
      }`}
    >
      <Icon size={20} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  const ServiceCard = ({ service, type }) => (
    <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-xl transition-shadow border border-gray-100">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900 mb-1">{service.name}</h3>
          <p className="text-sm text-gray-600">{service.type || service.category}</p>
        </div>
        {service.verified && (
          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
            Verified
          </span>
        )}
      </div>

      {type === 'care' && (
        <>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              <Star size={16} className="fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-sm">{service.rating}</span>
            </div>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-600">{service.reviews} reviews</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <MapPin size={14} />
            <span>{service.location} • {service.distance}</span>
          </div>
          {service.ndis && (
            <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium mb-3">
              NDIS Registered
            </span>
          )}
        </>
      )}

      {type === 'transport' && (
        <>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <MapPin size={14} />
            <span>{service.location}</span>
          </div>
          <div className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded-lg mb-2">
            {service.accessibility}
          </div>
          <div className="text-sm font-medium text-gray-900">
            {service.nextArrival ? `Next: ${service.nextArrival}` : service.availability}
          </div>
        </>
      )}

      {type === 'marketplace' && (
        <>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              <Star size={14} className="fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{service.rating}</span>
            </div>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-600">{service.seller}</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-3">
            ${service.price}
            {service.category === 'Services' && <span className="text-sm font-normal text-gray-600">/hour</span>}
          </div>
        </>
      )}

      <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2">
        {type === 'care' && 'Contact'}
        {type === 'transport' && 'View Details'}
        {type === 'marketplace' && 'View Listing'}
        <ChevronRight size={16} />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-green-500 rounded-xl flex items-center justify-center">
                <MapPin className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">MapAble</h1>
                <p className="text-xs text-gray-600">Empowering accessibility</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-4">
              <button className="text-gray-700 hover:text-blue-600 transition-colors">
                <User size={20} />
              </button>
              <button className="text-gray-700 hover:text-blue-600 transition-colors">
                <MessageCircle size={20} />
              </button>
              <button className="text-gray-700 hover:text-blue-600 transition-colors">
                <Settings size={20} />
              </button>
            </nav>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-gray-700"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-green-500 rounded-2xl p-8 mb-8 text-white shadow-xl">
          <h2 className="text-3xl font-bold mb-2">Find Accessible Services</h2>
          <p className="text-blue-100 mb-6">Care, transport, and marketplace services designed for you</p>
          
          {/* Search Bar */}
          <div className="bg-white rounded-xl p-2 flex items-center gap-2 max-w-2xl">
            <Search className="text-gray-400 ml-2" size={20} />
            <input
              type="text"
              placeholder="Search for services, locations, or providers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 outline-none text-gray-900 px-2 py-2"
            />
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Search
            </button>
          </div>
        </div>

        {/* Service Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          <TabButton icon={Heart} label="Care Services" value="care" />
          <TabButton icon={Bus} label="Transport" value="transport" />
          <TabButton icon={Briefcase} label="Marketplace" value="marketplace" />
        </div>

        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {services[activeTab].map(service => (
            <ServiceCard key={service.id} service={service} type={activeTab} />
          ))}
        </div>

        {/* Quick Access Features */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Access</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
              <MapPin className="text-blue-600" size={24} />
              <div className="text-left">
                <div className="font-medium text-gray-900">Find Nearby</div>
                <div className="text-xs text-gray-600">Search by location</div>
              </div>
            </button>
            <button className="flex items-center gap-3 p-4 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
              <Phone className="text-green-600" size={24} />
              <div className="text-left">
                <div className="font-medium text-gray-900">24/7 Support</div>
                <div className="text-xs text-gray-600">Get help anytime</div>
              </div>
            </button>
            <button className="flex items-center gap-3 p-4 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors">
              <Star className="text-purple-600" size={24} />
              <div className="text-left">
                <div className="font-medium text-gray-900">My Favorites</div>
                <div className="text-xs text-gray-600">Saved services</div>
              </div>
            </button>
            <button className="flex items-center gap-3 p-4 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors">
              <MessageCircle className="text-orange-600" size={24} />
              <div className="text-left">
                <div className="font-medium text-gray-900">Community</div>
                <div className="text-xs text-gray-600">Connect with others</div>
              </div>
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold mb-1">NDIS Registered Platform</h3>
              <p className="text-green-100">All listed care providers are verified and NDIS compliant</p>
            </div>
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors whitespace-nowrap">
              Learn More
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-500 rounded-lg flex items-center justify-center">
                  <MapPin className="text-white" size={20} />
                </div>
                <span className="text-xl font-bold">MapAble</span>
              </div>
              <p className="text-gray-400 text-sm">
                Empowering people with disabilities across Australia and New Zealand with accessible services.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Care Services</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Transport</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Marketplace</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Employment</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">NDIS Information</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Accessibility</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li className="flex items-center gap-2">
                  <Phone size={14} />
                  <span>1800 MAP ABLE</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail size={14} />
                  <span>hello@mapable.org.au</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2025 MapAble. Built by Australian Disability Ltd. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MapAbleApp;