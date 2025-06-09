
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isTokenValid, getUserRole } from '../utils/auth';

function AutoRedirector({ roleRequired }) {
  const navigate = useNavigate();

  useEffect(() => {
    // Safe check for Electron or fallback to localStorage
    const isElectron = window && window.process && window.process.type;

    let token = null;

    if (isElectron && window.electronStore) {
      token = window.electronStore.get('authToken');
    } else {
      token = localStorage.getItem('authToken');
    }

    if (token && isTokenValid(token)) {
      const role = getUserRole(token);

      if (roleRequired && role !== roleRequired) {
        // Wrong role → send to sign in
        navigate('/signin');
      }
    } else {
      // No valid token → send to sign in
      navigate('/signin');
    }
  }, [navigate, roleRequired]);

  return null; // No UI, just side effect
}

export default AutoRedirector;
