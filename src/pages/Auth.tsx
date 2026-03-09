import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/perfil');
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('¡Bienvenido de nuevo!');
        navigate('/perfil');
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('¡Cuenta creada! Revisa tu email para confirmar.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="font-display text-3xl font-bold text-primary">Lo Zio</a>
          <p className="text-muted-foreground font-body mt-2">
            {isLogin ? 'Inicia sesión en tu cuenta' : 'Crea tu cuenta'}
          </p>
        </div>

        <div className="bg-card rounded-lg p-8 shadow-lg border border-border">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-body text-sm font-bold text-foreground mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-sm bg-background border border-input font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-bold text-foreground mb-1.5">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-sm bg-background border border-input font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-sm font-body font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Cargando...' : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-body text-sm hover:underline"
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
