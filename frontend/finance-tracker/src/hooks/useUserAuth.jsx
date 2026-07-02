import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import axiosInstance from '../utils/axiosinstance';
import { API_PATHS } from '../utils/apiPaths';

export const useUserAuth = () => {
    const { user, isAuthenticated, isAuthChecking } = useContext(UserContext);
    const navigate = useNavigate();

    useEffect(() => {
        // Only redirect if we are done checking auth and user is not authenticated
        if (!isAuthChecking && !isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, isAuthChecking, navigate]);

    return { user, isAuthenticated };
};
