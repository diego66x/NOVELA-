import React, { useState, useEffect } from 'react';
import { Search, Bell, Menu, X, Edit3, User } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  setView: (view: string) => void;
  isEditMode: boolean;
  toggleEditMode: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setView, isEditMode, toggleEditMode }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Início', id: 'home' },
    { label: 'Novelas', id: 'novelas' },
    { label: 'Filmes', id: 'filmes' },
    { label: 'Minha Lista', id: 'favoritos' },
  ];

  return (
    <nav className={`fixed w-full z-50 transition-colors duration-300 ${isScrolled ? 'bg-[#141414]' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
      <div className="px-4 md:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div 
            className="text-red-600 font-bold text-2xl md:text-3xl cursor-pointer tracking-tighter"
            onClick={() => setView('home')}
          >
            STREAMFLEX
          </div>
          
          <div className="hidden md:flex gap-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`text-sm font-medium transition-colors ${currentView === item.id ? 'text-white font-bold' : 'text-gray-300 hover:text-gray-400'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-white">
          <button 
            onClick={toggleEditMode}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${isEditMode ? 'bg-white text-black border-white' : 'border-gray-500 text-gray-300 hover:border-white'}`}
          >
            <Edit3 size={14} />
            <span className="hidden sm:inline">EDITION MODE</span>
          </button>
          
          <Search className="w-5 h-5 cursor-pointer hover:text-gray-300 hidden sm:block" />
          <Bell className="w-5 h-5 cursor-pointer hover:text-gray-300 hidden sm:block" />
          
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
               <User size={16} />
            </div>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#141414] border-t border-gray-800 p-4 flex flex-col gap-4 animate-fade-in">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`text-left text-sm ${currentView === item.id ? 'text-white font-bold' : 'text-gray-400'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;