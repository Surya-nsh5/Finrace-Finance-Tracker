import React, { useContext, useState } from 'react';
import AuthLayout from '../../components/layouts/AuthLayout';
import { useNavigate, Link } from 'react-router-dom';
import { validateEmail } from '../../utils/helper';
import Input from '../../components/Inputs/Input';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import { UserContext } from '../../context/UserContext';


const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated } = useContext(UserContext);
  const navigate = useNavigate();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Handle Login form Submit
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    setError("");
    setIsLoading(true);

    // Login API Call
    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
        email,
        password
      });
      const { token, user } = response.data;

      if (token) {
        // Use the login function from context for proper session management
        login(user, token);
        navigate('/dashboard');
      }
    } catch (error) {
      if (error.response) {
        setError(error.response.data.message);
      } else {
        setError("Something went wrong. Please try again later.");
      }
      setIsLoading(false); // Only unset loading on error, on success we navigate away
    }
  }

  return (
    <AuthLayout showRight={true}>
      <div className="w-full max-w-md mx-auto flex flex-col justify-center flex-1">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 text-[var(--color-text)]">Welcome back</h1>
          <p className="text-lg text-[var(--color-text)] opacity-70">
            Enter your details to log in to your account
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            id="email"
            name="email"
            label="Email"
            placeholder="you@example.com"
            type="text"
            disabled={isLoading}
          />

          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            id="password"
            name="password"
            label="Password"
            placeholder="Enter your password"
            type="password"
            disabled={isLoading}
          />

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full px-6 py-3 bg-primary text-white rounded-lg font-medium text-base transition-colors shadow-md hover:shadow-lg cursor-pointer ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary/90'}`}
          >
            {isLoading ? "Logging in..." : "Log in"}
          </button>

          <p className="text-sm text-[var(--color-text)] opacity-70 text-center">
            Don't have an account?{" "}
            <Link className="font-medium text-[var(--color-text)] underline" to="/signup">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  )
}

export default Login