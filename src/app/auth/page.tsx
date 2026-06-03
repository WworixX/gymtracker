'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dumbbell, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, '6 caractères minimum'),
});
type FormData = z.infer<typeof schema>;

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError('');
    const supabase = createClient();
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword(data);
      if (error) { setError(error.message); return; }
    } else {
      const { data: signUpData, error } = await supabase.auth.signUp(data);
      if (error) { setError(error.message); return; }
      if (signUpData.user) {
        await supabase.rpc('seed_default_exercises', { p_user_id: signUpData.user.id });
      }
    }
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-bg-base flex">
      <div className="hidden md:flex flex-col justify-between w-1/2 bg-bg-surface border-r border-border p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
            <Dumbbell size={20} className="text-bg-base" strokeWidth={2.5} />
          </div>
          <span className="font-mono text-base font-semibold uppercase tracking-widest text-text-primary">GymTracker</span>
        </div>
        <div>
          <div className="grid grid-cols-2 gap-4 mb-12">
            {[
              { metric: '∞', label: 'Séances' },
              { metric: 'PRs', label: 'Détectés auto' },
              { metric: '100%', label: 'Hors-ligne ready' },
              { metric: '0s', label: 'Friction' },
            ].map(({ metric, label }) => (
              <div key={label} className="p-4 bg-bg-elevated border border-border rounded-lg">
                <div className="font-mono text-2xl font-bold text-accent mb-1">{metric}</div>
                <div className="text-xs font-mono uppercase tracking-widest text-text-muted">{label}</div>
              </div>
            ))}
          </div>
          <p className="text-text-muted text-sm font-mono leading-relaxed">Chaque séance. Chaque série. Chaque PR.<br />Zéro friction entre toi et tes données.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-16 max-w-md mx-auto w-full">
        <div className="md:hidden flex items-center gap-3 mb-10">
          <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center">
            <Dumbbell size={18} className="text-bg-base" strokeWidth={2.5} />
          </div>
          <span className="font-mono text-sm font-semibold uppercase tracking-widest">GymTracker</span>
        </div>
        <h1 className="font-mono text-xl font-bold text-text-primary mb-1">{mode === 'login' ? 'Connexion' : 'Créer un compte'}</h1>
        <p className="text-sm text-text-muted font-mono mb-8">{mode === 'login' ? 'Reprends là où tu t\'es arrêté.' : 'Lance-toi.'}</p>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Email" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
          <div className="relative">
            <Input label="Mot de passe" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} {...register('password')} error={errors.password?.message} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-8 text-text-muted hover:text-text-secondary transition-colors">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-danger font-mono bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
                {error}
              </motion.p>
            )}
          </AnimatePresence>
          <Button type="submit" loading={isSubmitting} fullWidth size="lg" className="mt-2">{mode === 'login' ? 'Se connecter' : 'Créer le compte'}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-text-muted font-mono">
          {mode === 'login' ? 'Pas de compte ?' : 'Déjà inscrit ?'}{' '}
          <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-accent hover:text-accent-dim transition-colors">
            {mode === 'login' ? 'S\'inscrire' : 'Se connecter'}
          </button>
        </p>
      </div>
    </div>
  );
}
