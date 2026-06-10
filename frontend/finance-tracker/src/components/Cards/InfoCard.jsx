import React from 'react'

const InfoCard = ({ icon, label, value, color, index = 0, loading = false, isHighlight = false }) => {
  return (
    <div
      className={`card p-4 sm:p-6 flex gap-3 sm:gap-4 items-center cursor-pointer ${
        isHighlight ? 'border-[rgba(212,175,55,0.4)] shadow-md' : ''
      }`}
      style={{
        animation: `fadeInUp 350ms cubic-bezier(0.4, 0, 0.2, 1) both`,
        animationDelay: `${index * 80}ms`,
        willChange: 'transform'
      }}
    >
      <div className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-xl sm:text-2xl rounded-xl flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0 w-full">
        <h6 className="text-xs sm:text-sm text-[var(--color-text)] opacity-70 mb-1 font-medium transition-colors duration-200">{label}</h6>
        {loading ? (
          <div className="h-6 sm:h-8 w-24 bg-[var(--color-input)] animate-pulse rounded"></div>
        ) : (
          <span className={`text-lg sm:text-2xl font-bold truncate block ${isHighlight ? 'text-[#D4AF37]' : 'text-[var(--color-text)]'}`}>
            ₹{value}
          </span>
        )}
      </div>
    </div>
  )
}

export default InfoCard