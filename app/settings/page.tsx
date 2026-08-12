"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  User,
  Bell,
  Shield,
  Palette,
  ChevronRight,
  Globe,
  Moon,
  Sun,
  Laptop,
  Lock,
  Loader2,
  Key,
  Trash2,
} from "lucide-react";
import { LanguagePicker } from "@/components/language-picker";
import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";

import { createClient } from "@/utils/supabase/client";
import { useLanguage } from "@/lib/i18n/language-context";

const translations = {
  en: {
    headerTitle: "Settings",
    headerDesc: "Manage your account settings and preferences.",
    preferences: "Preferences",
    preferencesDesc: "Customize your experience.",
    language: "Language",
    languageDesc: "Select your preferred language.",
    appearance: "Appearance",
    appearanceDesc: "Switch between light and dark mode.",
    sections: {
      profile: {
        title: "Profile",
        desc: "Manage your public profile and personal details",
      },
      account: {
        title: "Account",
        desc: "Change your password and manage security settings",
      },
      notifications: {
        title: "Notifications",
        desc: "Manage your alerts (Coming Soon)",
      },
    },
    changePassword: {
      title: "Change Password",
      description: "Enter your new password below.",
      currentPassword: "Current Password",
      newPassword: "New Password",
      confirmPassword: "Confirm New Password",
      currentPlaceholder: "Enter current password",
      newPlaceholder: "Enter new password",
      confirmPlaceholder: "Confirm new password",
      submit: "Update Password",
      submitting: "Updating...",
      success: "Password updated successfully!",
      error: "Failed to update password. Please try again.",
      passwordMismatch: "Passwords do not match",
      passwordTooShort: "Password must be at least 6 characters",
      incorrectPassword: "Current password is incorrect",
    },
    deleteAccount: {
      title: "Delete Account",
      desc: "Permanently delete your account and all data",
      confirmTitle: "Delete your account?",
      confirmDesc:
        "This will permanently delete your account and all associated data, including progress, reflections, and team memberships. This action cannot be undone.",
      typeToConfirm: 'Type "DELETE" to confirm',
      cancel: "Cancel",
      confirm: "Delete Account",
      deleting: "Deleting...",
      error: "Failed to delete account. Please try again.",
    },
  },
  th: {
    headerTitle: "ตั้งค่า",
    headerDesc: "จัดการการตั้งค่าบัญชีและความชอบของคุณ",
    preferences: "ความชอบ",
    preferencesDesc: "ปรับแต่งประสบการณ์การใช้งานของคุณ",
    language: "ภาษา",
    languageDesc: "เลือกภาษาที่คุณต้องการ",
    appearance: "รูปลักษณ์",
    appearanceDesc: "เปลี่ยนระหว่างโหมดสว่างและโหมดมืด",
    sections: {
      profile: {
        title: "โปรไฟล์",
        desc: "จัดการโปรไฟล์สาธารณะและข้อมูลส่วนตัว",
      },
      account: {
        title: "บัญชี",
        desc: "เปลี่ยนรหัสผ่านและจัดการการตั้งค่าความปลอดภัย",
      },
      notifications: {
        title: "การแจ้งเตือน",
        desc: "จัดการการแจ้งเตือนของคุณ (เร็วๆ นี้)",
      },
    },
    changePassword: {
      title: "เปลี่ยนรหัสผ่าน",
      description: "กรุณากรอกรหัสผ่านใหม่ของคุณ",
      currentPassword: "รหัสผ่านปัจจุบัน",
      newPassword: "รหัสผ่านใหม่",
      confirmPassword: "ยืนยันรหัสผ่านใหม่",
      currentPlaceholder: "กรอกรหัสผ่านปัจจุบัน",
      newPlaceholder: "กรอกรหัสผ่านใหม่",
      confirmPlaceholder: "ยืนยันรหัสผ่านใหม่",
      submit: "อัปเดตรหัสผ่าน",
      submitting: "กำลังอัปเดต...",
      success: "อัปเดตรหัสผ่านสำเร็จ!",
      error: "ไม่สามารถอัปเดตรหัสผ่านได้ กรุณาลองอีกครั้ง",
      passwordMismatch: "รหัสผ่านไม่ตรงกัน",
      passwordTooShort: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
      incorrectPassword: "รหัสผ่านปัจจุบันไม่ถูกต้อง",
    },
    deleteAccount: {
      title: "ลบบัญชี",
      desc: "ลบบัญชีและข้อมูลทั้งหมดของคุณอย่างถาวร",
      confirmTitle: "ลบบัญชีของคุณ?",
      confirmDesc:
        "การดำเนินการนี้จะลบบัญชีและข้อมูลทั้งหมดของคุณอย่างถาวร รวมถึงความคืบหน้า บันทึกสะท้อนคิด และการเป็นสมาชิกทีม ไม่สามารถย้อนกลับได้",
      typeToConfirm: 'พิมพ์ "DELETE" เพื่อยืนยัน',
      cancel: "ยกเลิก",
      confirm: "ลบบัญชี",
      deleting: "กำลังลบ...",
      error: "ไม่สามารถลบบัญชีได้ กรุณาลองอีกครั้ง",
    },
  },
};

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language } = useLanguage();
  const t = translations[language] || translations["en"];
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  // Password change state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Delete account state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("user_settings")
        .upsert({ user_id: user.id, theme: newTheme });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (newPassword.length < 6) {
      setPasswordError(t.changePassword.passwordTooShort);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t.changePassword.passwordMismatch);
      return;
    }

    setPasswordLoading(true);

    try {
      // Update password directly (user is already authenticated)
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordError(t.changePassword.error);
      } else {
        setPasswordSuccess(true);
        setTimeout(() => {
          setPasswordDialogOpen(false);
          setPasswordSuccess(false);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        }, 2000);
      }
    } catch {
      setPasswordError(t.changePassword.error);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError("");
    setDeleteLoading(true);

    try {
      const response = await fetch("/api/profile/delete-account", {
        method: "DELETE",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setDeleteError(data.error || t.deleteAccount.error);
        setDeleteLoading(false);
        return;
      }

      // Auth user already gone — clear local session only, then hard-nav.
      // Global signOut can hang/fail; router.push is soft and can leave stale state.
      await supabase.auth.signOut({ scope: "local" }).catch(() => {});
      window.location.href = "/";
    } catch {
      setDeleteError(t.deleteAccount.error);
      setDeleteLoading(false);
    }
  };

  const settingsSections = [
    {
      title: t.sections.profile.title,
      description: t.sections.profile.desc,
      icon: User,
      href: "/profile",
      color: "text-blue-500",
    },
  ];

  return (
    <div className="dawn-theme relative min-h-screen text-white antialiased">
      <DawnScene />
      <div className="relative z-10 mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 space-y-8 animate-in fade-in duration-500">
        {/* Header section styled like Onboarding cards */}
        <div className="ei-card ei-card--static relative overflow-hidden rounded-[28px] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center space-x-5">
              <Avatar className="h-16 w-16 border border-white/10 ring-2 ring-white/10">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-white/10 text-white text-xl font-medium">
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="dawn-eyebrow">Settings</p>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                  {t.headerTitle}
                </h1>
                <p className="text-sm text-white/60">{t.headerDesc}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* General Settings / Preferences */}
          <div className="ei-card ei-card--static relative overflow-hidden rounded-[28px] p-6 sm:p-8 space-y-6">
            <div className="border-b border-white/[0.08] pb-4">
              <h2 className="text-xl font-semibold text-white">{t.preferences}</h2>
              <p className="text-sm text-white/60">{t.preferencesDesc}</p>
            </div>
            <div className="space-y-6">
              {/* Language */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="space-y-1">
                  <Label className="text-base font-medium text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-400" /> {t.language}
                  </Label>
                  <p className="text-xs sm:text-sm text-white/60">
                    {t.languageDesc}
                  </p>
                </div>
                <div className="self-start sm:self-auto">
                  <LanguagePicker />
                </div>
              </div>

              {/* Theme */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="space-y-1">
                  <Label className="text-base font-medium text-white flex items-center gap-2">
                    <Palette className="w-4 h-4 text-amber-400" /> {t.appearance}
                  </Label>
                  <p className="text-xs sm:text-sm text-white/60">
                    {t.appearanceDesc}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 p-1.5 rounded-xl">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleThemeChange("light")}
                    className={`h-9 px-3 text-xs gap-1.5 rounded-lg transition-all ${
                      mounted && theme === "light"
                        ? "bg-white/20 text-white font-medium shadow-sm"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Sun className="h-4 w-4" />
                    Light
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleThemeChange("dark")}
                    className={`h-9 px-3 text-xs gap-1.5 rounded-lg transition-all ${
                      mounted && theme === "dark"
                        ? "bg-white/20 text-white font-medium shadow-sm"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Moon className="h-4 w-4" />
                    Dark
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleThemeChange("system")}
                    className={`h-9 px-3 text-xs gap-1.5 rounded-lg transition-all ${
                      mounted && theme === "system"
                        ? "bg-white/20 text-white font-medium shadow-sm"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Laptop className="h-4 w-4" />
                    System
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Cards */}
          <div className="grid sm:grid-cols-2 gap-6">
            {settingsSections.map((section) => (
              <Link key={section.title} href={section.href} className="group block">
                <div className="ei-card relative overflow-hidden rounded-[24px] p-6 h-full border border-white/10 bg-white/[0.03] transition-all hover:bg-white/[0.06] hover:border-white/20 flex flex-col justify-between gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                        <section.icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-medium text-white group-hover:text-blue-300 transition-colors">
                        {section.title}
                      </h3>
                    </div>
                    <ChevronRight className="h-5 w-5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                    {section.description}
                  </p>
                </div>
              </Link>
            ))}

            {/* Account - Password Change */}
            <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
              <DialogTrigger asChild>
                <div className="ei-card relative overflow-hidden rounded-[24px] p-6 h-full border border-white/10 bg-white/[0.03] transition-all hover:bg-white/[0.06] hover:border-white/20 flex flex-col justify-between gap-4 cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <Shield className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-medium text-white group-hover:text-emerald-300 transition-colors">
                        {t.sections.account.title}
                      </h3>
                    </div>
                    <ChevronRight className="h-5 w-5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                    {t.sections.account.desc}
                  </p>
                </div>
              </DialogTrigger>
              <DialogContent className="border border-white/15 bg-[#0b1026]/95 text-white backdrop-blur-xl sm:max-w-md rounded-3xl p-6 shadow-2xl">
                <DialogHeader className="space-y-2">
                  <DialogTitle className="flex items-center gap-2.5 text-xl font-semibold text-white">
                    <Key className="h-5 w-5 text-emerald-400" />
                    {t.changePassword.title}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-white/60">
                    {t.changePassword.description}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-xs uppercase font-semibold tracking-wider text-white/70">
                      {t.changePassword.newPassword}
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder={t.changePassword.newPlaceholder}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="h-12 rounded-xl border-white/10 bg-white/[0.05] text-white placeholder:text-white/30 focus:border-blue-400/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-xs uppercase font-semibold tracking-wider text-white/70">
                      {t.changePassword.confirmPassword}
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder={t.changePassword.confirmPlaceholder}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="h-12 rounded-xl border-white/10 bg-white/[0.05] text-white placeholder:text-white/30 focus:border-blue-400/50"
                    />
                  </div>
                  {passwordError && (
                    <p className="text-xs text-rose-400 font-medium">{passwordError}</p>
                  )}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setPasswordDialogOpen(false)}
                      className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={passwordLoading || !newPassword || !confirmPassword}
                      className="ei-button-dawn px-5 py-2.5 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {passwordLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t.changePassword.submitting}
                        </div>
                      ) : (
                        t.changePassword.submit
                      )}
                    </button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Notifications (Coming soon) */}
            <div className="ei-card relative overflow-hidden rounded-[24px] p-6 h-full border border-white/5 bg-white/[0.01] opacity-50 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                    <Bell className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-medium text-white">
                    {t.sections.notifications.title}
                  </h3>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                {t.sections.notifications.desc}
              </p>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="ei-card ei-card--static relative overflow-hidden rounded-[28px] p-6 sm:p-8 border border-rose-500/20 bg-rose-950/10 space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-rose-400 flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                {t.deleteAccount.title}
              </h2>
              <p className="text-xs sm:text-sm text-white/60">{t.deleteAccount.desc}</p>
            </div>
            <Dialog
              open={deleteDialogOpen}
              onOpenChange={(open) => {
                setDeleteDialogOpen(open);
                if (!open) {
                  setDeleteConfirmText("");
                  setDeleteError("");
                }
              }}
            >
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-all flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {t.deleteAccount.confirm}
                </button>
              </DialogTrigger>
              <DialogContent className="border border-rose-500/30 bg-[#0b1026]/95 text-white backdrop-blur-xl sm:max-w-md rounded-3xl p-6 shadow-2xl">
                <DialogHeader className="space-y-2">
                  <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-rose-400">
                    <Trash2 className="h-5 w-5" />
                    {t.deleteAccount.confirmTitle}
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm text-white/60">
                    {t.deleteAccount.confirmDesc}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="deleteConfirm" className="text-xs uppercase font-semibold tracking-wider text-white/70">
                      {t.deleteAccount.typeToConfirm}
                    </Label>
                    <Input
                      id="deleteConfirm"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="DELETE"
                      className="h-12 rounded-xl border-white/10 bg-white/[0.05] text-white placeholder:text-white/30 focus:border-rose-400/50"
                    />
                  </div>
                  {deleteError && (
                    <p className="text-xs text-rose-400 font-medium">{deleteError}</p>
                  )}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setDeleteDialogOpen(false)}
                      className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white transition-all"
                    >
                      {t.deleteAccount.cancel}
                    </button>
                    <button
                      type="button"
                      disabled={deleteConfirmText !== "DELETE" || deleteLoading}
                      onClick={handleDeleteAccount}
                      className="rounded-xl border border-rose-500/40 bg-rose-600/80 px-5 py-2.5 text-xs font-semibold text-white hover:bg-rose-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {deleteLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t.deleteAccount.deleting}
                        </>
                      ) : (
                        t.deleteAccount.confirm
                      )}
                    </button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Success Dialog */}
        <AlertDialog open={passwordSuccess} onOpenChange={setPasswordSuccess}>
          <AlertDialogContent className="border border-white/15 bg-[#0b1026]/95 text-white backdrop-blur-xl rounded-3xl p-6 shadow-2xl">
            <AlertDialogHeader className="space-y-2">
              <AlertDialogTitle className="text-xl font-semibold text-emerald-400">
                {t.changePassword.success}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-white/70">
                Your password has been updated successfully.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="pt-2">
              <AlertDialogAction
                onClick={() => setPasswordSuccess(false)}
                className="ei-button-dawn px-5 py-2 text-xs font-semibold"
              >
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}