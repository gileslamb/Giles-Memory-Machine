export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0a0a0a",
        color: "#e8e8e8",
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Page not found</h1>
      <p style={{ color: "#737373", marginBottom: "1.5rem" }}>
        The app runs at the root URL.
      </p>
      <a
        href="/"
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#262626",
          color: "#e8e8e8",
          borderRadius: "0.5rem",
          textDecoration: "none",
        }}
      >
        Go to Giles Memory Machine
      </a>
    </div>
  );
}
