import React, { useEffect, useState } from "react";

export default function ResetBanner({ message }) {
  const [show, setShow] = useState(Boolean(message));
  useEffect(() => {
    if (!message) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 3000);
    return () => clearTimeout(t);
  }, [message]);

  if (!show) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-xl px-4 py-2 bg-lime-600/90 text-white shadow-lg">
      {message}
    </div>
  );
}
