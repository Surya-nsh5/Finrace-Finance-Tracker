import React, { useContext, useState } from "react";
import AuthLayout from "../../components/layouts/AuthLayout";
import { useNavigate, Link } from "react-router-dom";
import { validateEmail } from "../../utils/helper";
import Input from "../../components/Inputs/Input";
import ProfilePhotoSelector from "../../components/Inputs/ProfilePhotoSelector";
import axiosInstance from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";
import { UserContext } from "../../context/UserContext";
import uploadImage from "../../utils/uploadImage";


const Signup = () => {
  const [profilePic, setProfilePic] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { updateUser, isAuthenticated } = useContext(UserContext);
  const navigate = useNavigate();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  // Handle Signup form Submit
  const handleSignup = async (e) => {
    e.preventDefault();

    let profileImageUrl = "";

    if (!fullName) {
      setError("Please enter your full name");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!password) {
      setError("Please enter your password");
      return;
    }

    setError("");
    setIsLoading(true);

    // Signup API Call
    try {

      // Upload image if present
      if (profilePic) {
        const imgUploadRes = await uploadImage(profilePic);
        profileImageUrl = imgUploadRes.imageUrl || "";
      }

      // Signup API Call
      await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
        fullName,
        email,
        password,
        profileImageUrl
      });

      // Handle custom error block removed as backend now returns 409 for conflicts

      // We don't auto-login anymore. Redirect to login.
      navigate("/login");
    } catch (error) {
      if (error.response && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError("Something went wrong. Please try again later.");
      }
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout showRight={true}>
      <div className="w-full max-w-md mx-auto flex flex-col justify-center flex-1">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 text-[var(--color-text)]">Create account</h1>
          <p className="text-lg text-[var(--color-text)] opacity-70">
            Start tracking your finances today
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <ProfilePhotoSelector image={profilePic} setImage={setProfilePic} />

          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            id="fullName"
            name="fullName"
            label="Full Name"
            placeholder="John Doe"
            type="text"
            disabled={isLoading}
          />

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
            label="Password"
            placeholder="At least 8 characters"
            type="password"
            id="password"
            name="password"
            disabled={isLoading}
          />

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full px-6 py-3 bg-primary text-white rounded-lg font-medium text-base transition-colors shadow-md hover:shadow-lg cursor-pointer ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary/90'}`}
          >
            {isLoading ? "Creating Account..." : "Sign up"}
          </button>

          <p className="text-sm text-[var(--color-text)] opacity-70 text-center">
            Already have an account?{" "}
            <Link className="font-medium text-[var(--color-text)] underline" to="/login">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Signup;
