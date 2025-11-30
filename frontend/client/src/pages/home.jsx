export function Home() {
  const backendUrl = import.meta.env.VITE_API_URL; // new backend URL

  const handleLogin = () => {
   window.location.href = `${backendUrl}/auth/login`;
  };

  return (
    <div>
      <h1>Welcome to My Spotify App</h1>
      <p>Click below to connect your Spotify account</p>
      <button onClick={() => window.location.href = "https://resopwa-backend.up.railway.app/auth/login"}>
        Login with Spotify
      </button>
    </div>
  );
}
