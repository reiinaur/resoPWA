export function Home() {
  const backendUrl = import.meta.env.VITE_API_URL;

  const handleLogin = () => {
    window.location.href = `${backendUrl}/auth/login`;
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Welcome to My Spotify App</h1>
      <p>Click below to connect your Spotify account</p>
      <button
        onClick={handleLogin}
        style={{ padding: '10px 20px', fontSize: '16px', marginTop: '20px', cursor: 'pointer' }}
      >
        Login with Spotify
      </button>
    </div>
  );
}
