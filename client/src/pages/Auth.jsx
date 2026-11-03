import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import logo from '../assets/logo-light.png';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api, errMsg } from '../services/api.js';
import { Field } from '../components/ui.jsx';
import { useTitle } from '../hooks/useSettings.js';

const pw = z.string().min(8, 'At least 8 characters').regex(/[A-Za-z]/, 'Include a letter').regex(/\d/, 'Include a number');
const schemas = {
  login: z.object({ email: z.string().email(), password: z.string().min(1, 'Required') }),
  register: z.object({ name: z.string().min(2, 'Required'), email: z.string().email(), phone: z.string().optional(), password: pw }),
  forgot: z.object({ email: z.string().email() }),
  reset: z.object({ password: pw }),
};
const titles = { login: 'Welcome back', register: 'Create your account', forgot: 'Forgot password', reset: 'Choose a new password', verify: 'Email verification' };

export default function Auth({ mode }) {
  useTitle(titles[mode]);
  const { login, register: reg } = useAuth(); const nav = useNavigate(); const loc = useLocation(); const [sp] = useSearchParams();
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: schemas[mode] ? zodResolver(schemas[mode]) : undefined });
  useEffect(() => {
    if (mode === 'verify') api.post('/auth/verify-email', { token: sp.get('token'), email: sp.get('email') }).then(() => setMsg('Your email has been verified.')).catch((e) => setErr(errMsg(e)));
  }, [mode]); // eslint-disable-line
  const submit = async (b) => {
    setErr(''); setMsg('');
    try {
      if (mode === 'login') { const u = await login(b); nav(loc.state?.from || (['admin', 'staff'].includes(u.role) ? '/admin' : '/account'), { replace: true }); }
      if (mode === 'register') { await reg(b); nav('/account'); }
      if (mode === 'forgot') { await api.post('/auth/forgot-password', b); setMsg('If that email exists, a reset link has been sent.'); }
      if (mode === 'reset') { await api.post('/auth/reset-password', { ...b, token: sp.get('token'), email: sp.get('email') }); setMsg('Password updated. You can now log in.'); }
    } catch (e) { setErr(errMsg(e)); }
  };
  return (
    <div className="grid min-h-[70vh] place-items-center px-4 py-10">
      <div className="card w-full max-w-md p-8">
        <img src={logo} alt="Cars@855" className="mx-auto h-14" />
        <h1 className="mt-4 text-center text-xl font-extrabold">{titles[mode]}</h1>
        {mode === 'verify' ? <p className={`mt-4 text-center text-sm ${err ? 'text-red-600' : ''}`}>{msg || err || 'Verifying…'}</p> :
          <form onSubmit={handleSubmit(submit)} className="mt-5 space-y-4">
            {mode === 'register' && <Field label="Full name" error={errors.name}><input className="input" {...register('name')} /></Field>}
            {mode !== 'reset' && <Field label="Email" error={errors.email}><input type="email" className="input" {...register('email')} /></Field>}
            {mode === 'register' && <Field label="Phone"><input className="input" {...register('phone')} /></Field>}
            {mode !== 'forgot' && <Field label={mode === 'reset' ? 'New password' : 'Password'} error={errors.password}><input type="password" className="input" {...register('password')} /></Field>}
            {err && <p className="text-sm text-red-600">{err}</p>}{msg && <p className="text-sm text-green-700">{msg}</p>}
            <button className="btn-gold w-full" disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : { login: 'Log in', register: 'Create account', forgot: 'Send reset link', reset: 'Update password' }[mode]}</button>
          </form>}
        <div className="mt-4 text-center text-sm text-gray-500">
          {mode === 'login' && <><Link to="/forgot-password" className="text-gold">Forgot password?</Link><br />No account? <Link to="/register" className="font-semibold text-gold">Sign up</Link></>}
          {mode === 'register' && <>Already registered? <Link to="/login" className="font-semibold text-gold">Log in</Link></>}
          {['forgot', 'reset', 'verify'].includes(mode) && <Link to="/login" className="text-gold">Back to login</Link>}
        </div>
      </div>
    </div>
  );
}
