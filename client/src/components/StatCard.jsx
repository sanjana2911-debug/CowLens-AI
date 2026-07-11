import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const StatCard = ({ label, value, icon: Icon, color = 'primary', link, trend, subtitle }) => {
  const colorMap = {
    primary: 'bg-primary-100 text-primary-600',
    green: 'bg-emerald-100 text-emerald-600',
    red: 'bg-red-100 text-red-600',
    amber: 'bg-amber-100 text-amber-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  const content = (
    <motion.div
      whileHover={{ y: -2 }}
      className="card hover:shadow-lg transition-all duration-300 cursor-pointer group"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colorMap[color] || colorMap.primary} group-hover:scale-110 transition-transform`}>
          {Icon && <Icon className="w-7 h-7" />}
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1">
          <span className={`text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          <span className="text-xs text-gray-400">vs last month</span>
        </div>
      )}
    </motion.div>
  );

  if (link) return <Link to={link}>{content}</Link>;
  return content;
};

export default StatCard;