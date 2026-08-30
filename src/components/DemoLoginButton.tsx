/** Full-page POST so the session cookie is set on a real navigation (iframe-safe). */
export default function DemoLoginButton({
  className,
  label = "Continue with demo",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <form action="/api/auth/demo" method="post">
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
