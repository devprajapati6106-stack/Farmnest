export default function Toast({ message, type = 'success' }) {
  if (!message) return null;
  return <div className={`app-toast alert alert-${type} shadow-lg`}>{message}</div>;
}
