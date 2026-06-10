import React, { useState } from 'react'
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa6';

const Input = ({ value, onChange, label, placeholder, type, id, name }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="w-full">
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                {label}
            </label>

            <div className={`relative input-box transition-all duration-200 ${isFocused ? 'ring-2 ring-primary/50 border-primary' : ''}`}>
                <input
                    id={id}
                    name={name}
                    type={type == 'password' ? showPassword ? 'text' : 'password' : type}
                    placeholder={placeholder}
                    className='w-full bg-transparent outline-none text-[var(--color-text)] placeholder:text-gray-400'
                    value={value}
                    onChange={(e) => onChange(e)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />

                {type == 'password' && (
                    <button
                        type="button"
                        className='text-gray-400 hover:text-primary cursor-pointer transition-colors duration-200'
                        onClick={() => toggleShowPassword()}
                    >
                        {showPassword ? (
                            <FaRegEyeSlash size={20} />
                        ) : (
                            <FaRegEye size={20} />
                        )}
                    </button>
                )}
            </div>
        </div>
    )
}

export default Input