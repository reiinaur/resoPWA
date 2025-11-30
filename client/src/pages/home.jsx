export function Home() {
  const handleLogin = () => {
    // Redirects to backend Spotify login
    window.location.href = '/auth/login';
  };

  return (
    <div>
      <h1>Welcome to My Spotify App</h1>
      <p>Click below to connect your Spotify account</p>
      <button onClick={() => window.location.href = "https://figure-florence-forever-hon.trycloudflare.com/auth/login"}>
        Login with Spotify
      </button>
    </div>
  );
}
