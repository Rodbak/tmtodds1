"use client";

import Link from "next/link";
import {
  UserCircle,
  LogIn,
  LogOut,
  Settings,
} from "lucide-react";
import { useApp } from "@/app/store/AppProvider";

interface AccountControlsProps {
  compact: boolean;
  onRequestAuth: () => void;
}

export default function AccountControls({ compact, onRequestAuth }: AccountControlsProps) {
  const { profile, logout } = useApp();

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {profile?.role === "admin" && (
          <Link href="/admin" className="text-text-secondary">
            <Settings size={19} />
          </Link>
        )}
        {profile ? (
          <button onClick={logout} className="text-text-secondary"><LogOut size={18} /></button>
        ) : (
          <button onClick={onRequestAuth} className="text-accent-lime"><LogIn size={20} /></button>
        )}
        <UserCircle size={25} className="text-text-secondary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {profile?.role === "admin" && (
        <Link
          href="/admin"
          className="flex items-center justify-center gap-2 border border-white/14 text-text-secondary rounded-[10px] py-2 font-archivo font-bold text-[13px]"
        >
          <Settings size={15} /> Admin
        </Link>
      )}
      {profile ? (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <UserCircle size={22} className="text-text-secondary flex-shrink-0" />
            <span className="font-archivo font-bold text-[13px] text-text-primary truncate">{profile.name}</span>
          </div>
          <button onClick={logout} className="text-text-muted flex-shrink-0"><LogOut size={17} /></button>
        </div>
      ) : (
        <button
          onClick={onRequestAuth}
          className="w-full flex items-center justify-center gap-2 bg-accent-lime text-bg-primary rounded-[10px] py-2.5 font-archivo font-bold text-[13px]"
        >
          <LogIn size={16} /> Log in
        </button>
      )}
    </div>
  );
}