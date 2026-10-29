import React, { useState } from 'react';
import {
  Clapperboard,
  Crown,
  KeyRound,
  LogOut,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../firebase/authService';
import { Modal } from '../ui/Modal';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    currentUser,
    userProfile,
    role,
    loginWithEmail,
    registerWithEmail,
    quickLoginAsRole,
    signInWithGoogle,
    logout,
    isLoading,
  } = useAuth();

  const [mode, setMode] = useState<'QUICK' | 'EMAIL_LOGIN' | 'EMAIL_REGISTER'>('QUICK');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatFirebaseAuthError = (err: unknown): string => {
    const raw = err instanceof Error ? err.message : String(err);
    if (
      raw.includes('auth/admin-restricted-operation') ||
      raw.includes('auth/operation-not-allowed')
    ) {
      return 'โปรเจกต์ Firebase นี้เปิดไว้เฉพาะ "เข้าสู่ระบบด้วย Google" เท่านั้น — กรุณากดปุ่ม "เข้าสู่ระบบด้วยบัญชี Google" ด้านบนแทน (หรือไปเปิด Email/Password ในหน้า Firebase Console > Authentication > Sign-in method)';
    }
    if (raw.includes('auth/invalid-credential') || raw.includes('auth/wrong-password')) {
      return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
    }
    if (raw.includes('auth/email-already-in-use')) {
      return 'อีเมลนี้ถูกลงทะเบียนไว้แล้ว กรุณาใช้โหมดล็อกอินด้วยอีเมล';
    }
    if (raw.includes('auth/popup-closed-by-user')) {
      return 'คุณปิดหน้าต่างเลือกบัญชี Google ก่อนดำเนินการเสร็จสิ้น';
    }
    return raw;
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    try {
      await signInWithGoogle();
      setIsAuthModalOpen(false);
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err));
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      if (mode === 'EMAIL_LOGIN') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, displayName, selectedRole);
      }
      setIsAuthModalOpen(false);
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err));
    }
  };

  const handleQuickSwitch = async (targetRole: UserRole) => {
    setErrorMsg(null);
    try {
      await quickLoginAsRole(
        targetRole,
        targetRole === 'ADMIN' ? 'หัวหน้าโปรดิวเซอร์ (Admin)' : 'นักตัดต่อคลิป (Editor)'
      );
      setIsAuthModalOpen(false);
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err));
    }
  };

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={() => setIsAuthModalOpen(false)}
      title="จัดการบัญชีผู้ใช้งาน & สิทธิ์ทีมงาน (Firebase Authentication)"
      subtitle="เข้าสู่ระบบด้วยบัญชี Google หรือสลับบทบาทการทำงานระหว่างหัวหน้าทีม (Admin) และผู้ตัดต่อ (Editor)"
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4">
        {/* Current User Info Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {role === 'ADMIN' ? (
                <Crown className="w-5 h-5 text-amber-400" />
              ) : (
                <Clapperboard className="w-5 h-5 text-sky-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 flex flex-wrap items-center gap-1.5">
                <span className="truncate">{userProfile?.displayName || 'ผู้ใช้งานระบบ'}</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    role === 'ADMIN'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-sky-100 text-sky-900 border border-sky-300'
                  }`}
                >
                  {role === 'ADMIN' ? (
                    <>
                      <Crown className="w-3 h-3 text-amber-600" />
                      <span>ADMIN (สิทธิ์เต็ม)</span>
                    </>
                  ) : (
                    <>
                      <Clapperboard className="w-3 h-3 text-sky-600" />
                      <span>EDITOR (ผู้ตัดต่อ)</span>
                    </>
                  )}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 truncate">
                {currentUser?.email || userProfile?.email || 'admin@studio.local'}
              </div>
            </div>
          </div>

          {currentUser && (
            <button
              type="button"
              onClick={logout}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ออก</span>
            </button>
          )}
        </div>

        {/* Primary Action: Sign in with Google (Always Enabled in AI Studio Firebase) */}
        <div className="bg-indigo-50/70 border border-indigo-200/90 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-indigo-950 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>เข้าสู่ระบบด้วย Google (แนะนำ)</span>
            </span>
            {currentUser && !currentUser.isAnonymous && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                เชื่อมต่อแล้ว
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            ใช้ล็อกอินด้วยเมล <span className="font-mono font-bold">dramaeveryday222@gmail.com</span> หรือ{' '}
            <span className="font-mono font-bold">jengwaachanel@gmail.com</span> เพื่อซิงก์สิทธิ์และเชื่อมต่อ Google Drive ในคลิกเดียว
          </p>
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleLogin}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>
              {currentUser && !currentUser.isAnonymous
                ? 'สลับบัญชี Google (เลือกเมลใหม่)'
                : 'เข้าสู่ระบบด้วยบัญชี Google'}
            </span>
          </button>
        </div>

        {/* Tab switchers: Quick 1-Click vs Email */}
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setMode('QUICK');
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'QUICK' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>1-Click สลับสิทธิ์</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setMode('EMAIL_LOGIN');
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'EMAIL_LOGIN' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-slate-500" />
            <span>อีเมล/รหัสผ่าน</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setMode('EMAIL_REGISTER');
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'EMAIL_REGISTER' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-slate-500" />
            <span>สมัครใหม่</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 leading-relaxed">
            {errorMsg}
          </div>
        )}

        {/* Tab 1: 1-Click Role Switch */}
        {mode === 'QUICK' && (
          <div className="space-y-2.5">
            <p className="text-xs text-slate-600">
              สลับบทบาทการทำงานในระบบได้ทันทีโดยไม่ต้องใช้รหัสผ่าน:
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickSwitch('ADMIN')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                  role === 'ADMIN'
                    ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300'
                    : 'bg-white border-slate-200 hover:border-amber-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center">
                    <Crown className="w-4 h-4 text-amber-700" />
                  </div>
                  {role === 'ADMIN' && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-200 px-1.5 py-0.5 rounded">
                      กำลังใช้งาน
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">หัวหน้าทีม (Admin)</div>
                  <div className="text-[10px] text-slate-500">
                    มีสิทธิ์ตั้งค่า Time-Decay, จัดการหมวด และรีเซ็ตข้อมูล
                  </div>
                </div>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickSwitch('EDITOR')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                  role === 'EDITOR'
                    ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-300'
                    : 'bg-white border-slate-200 hover:border-sky-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 border border-sky-300 flex items-center justify-center">
                    <Clapperboard className="w-4 h-4 text-sky-700" />
                  </div>
                  {role === 'EDITOR' && (
                    <span className="text-[10px] font-bold text-sky-800 bg-sky-200 px-1.5 py-0.5 rounded">
                      กำลังใช้งาน
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">ผู้ตัดต่อ (Editor)</div>
                  <div className="text-[10px] text-slate-500">
                    นำเข้าฟุต, หั่นไลฟ์, จัดคิวคลิป 5 อันดับ และบันทึกสถานะ
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2 & 3: Email Form */}
        {(mode === 'EMAIL_LOGIN' || mode === 'EMAIL_REGISTER') && (
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {mode === 'EMAIL_REGISTER' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อผู้ใช้งาน</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น สมชาย ช่างตัดต่อ"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">อีเมล</label>
              <input
                type="email"
                required
                placeholder="name@team.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">รหัสผ่าน</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>

            {mode === 'EMAIL_REGISTER' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">บทบาทสิทธิ์</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="ADMIN">หัวหน้าทีม / โปรดิวเซอร์ (ADMIN)</option>
                  <option value="EDITOR">ผู้ตัดต่อคลิป (EDITOR)</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              {isLoading ? 'กำลังประมวลผล...' : mode === 'EMAIL_LOGIN' ? 'เข้าสู่ระบบ' : 'ลงทะเบียนผู้ใช้'}
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
};
