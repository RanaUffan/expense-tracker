import { useEffect, useRef } from 'react';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleButton({ onCredential, onError }) {
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!CLIENT_ID) return;

    function initialize() {
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => {
          if (response.credential) {
            onCredential(response.credential);
          } else {
            onError?.('Google sign-in was cancelled.');
          }
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
      });
    }

    if (window.google?.accounts?.id) {
      initialize();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initialize;
    document.body.appendChild(script);
  }, [onCredential, onError]);

  if (!CLIENT_ID) return null;

  return <div ref={buttonRef} />;
}
