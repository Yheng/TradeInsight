import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  LineChart,
  BarChart3, 
  Bell, 
  User 
} from 'lucide-react';
import { clsx } from 'clsx';

const MobileNavigation: React.FC = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Trading', href: '/trading', icon: TrendingUp },
    { name: 'Charts', href: '/charts', icon: LineChart },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Alerts', href: '/alerts', icon: Bell },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-dark-800 border-t border-dark-700 md:hidden z-50">
      <div className="grid grid-cols-6 h-16">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={clsx(
                'flex flex-col items-center justify-center p-2 text-xs transition-colors',
                isActive
                  ? 'text-primary-400 bg-dark-700'
                  : 'text-gray-400 hover:text-gray-200'
              )}
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNavigation;