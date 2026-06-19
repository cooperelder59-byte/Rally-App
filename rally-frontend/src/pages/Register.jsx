import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import '../styles/register.css';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(user, { displayName: name });

      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        teamIds: [],
        createdAt: serverTimestamp()
      });

      navigate('/team-setup');
    } catch (error) {
      console.error('Register error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setErrorMsg('That email is already registered.');
      } else if (error.code === 'auth/weak-password') {
        setErrorMsg('Password should be at least 6 characters.');
      } else {
        setErrorMsg('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <svg width="60" height="24" viewBox="0 0 108 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="0,0 13,16 0,32 7,32 20,16 7,0" fill="#c8ff3d"/>
            <polygon points="10,0 23,16 10,32 17,32 30,16 17,0" fill="#c8ff3d"/>
            <polygon points="20,0 33,16 20,32 27,32 40,16 27,0" fill="#c8ff3d"/>
          </svg>
        </div>

        <h1>Create your account</h1>
        <p className="auth-sub">Join Rally and bring your team together.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {errorMsg && <p className="form-error">{errorMsg}</p>}

          <button type="submit" className="btn btn-primary btn-full" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <a href="/login">Log in</a>
        </p>
      </div>
    </div>
  );
}