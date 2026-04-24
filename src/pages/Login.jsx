import Aurora from "../components/effects/Aurora.jsx";

export default function Login() {
  return (
    <>
      <Aurora
        colorStops={["#0a2a3a", "#0d6e8a", "#1a3a4a"]}
        blend={0.4}
        amplitude={1.2}
        speed={0.5}
      />
      <h1>Login</h1>
    </>
  );
}
