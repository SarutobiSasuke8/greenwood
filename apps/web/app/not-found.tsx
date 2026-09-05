import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-wrap section">
      <p className="eyebrow">404</p>
      <h1 style={{ marginTop: 12, fontSize: "clamp(2rem, 3.5vw + 0.5rem, 3.2rem)", fontWeight: 800 }}>Nothing at this address</h1>
      <p className="lead" style={{ marginTop: 16 }}>
        Not a game, not a ticker. <Link href="/">Back to the index.</Link>
      </p>
    </div>
  );
}
