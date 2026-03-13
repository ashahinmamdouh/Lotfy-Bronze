import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebase } from '../context/FirebaseContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function Login() {
  const { user, signInWithGoogle } = useFirebase();
  const navigate = useNavigate();
  const [logo, setLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('Lotfy Bronze');

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.logo !== undefined) setLogo(data.logo);
        if (data.companyName) setCompanyName(data.companyName);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        {logo ? (
          <img src={logo} alt="Company Logo" className="h-24 w-24 object-contain bg-white rounded-lg shadow-sm p-2 mb-4" />
        ) : (
          <div className="h-24 w-24 bg-indigo-100 rounded-lg shadow-sm flex items-center justify-center mb-4">
            <span className="text-3xl font-serif italic text-indigo-600">{companyName.substring(0, 2).toUpperCase()}</span>
          </div>
        )}
        <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {companyName} - Quality From Experience
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <button
                onClick={signInWithGoogle}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign in with Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
