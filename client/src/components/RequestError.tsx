import type { ReactNode } from "react";

interface Props {
  message: ReactNode;
}
export function RequestError({ message }: Props) {
  return (
    <div
      role="alert"
      className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
    >
      {message}
    </div>
  );
}
