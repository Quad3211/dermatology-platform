import { Outlet } from "react-router-dom";
import { PublicNavbar } from "../shared/PublicNavbar";

export function AuthLayout() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-white">
      <PublicNavbar />
      <div className="flex-1 mt-20 flex">
        <Outlet />
      </div>
    </div>
  );
}
