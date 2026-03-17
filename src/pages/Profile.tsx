import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';

const Profile = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    allergies: [] as string[],
    food_preferences: '',
    favorite_table_area: '',
  });
  const [newAllergy, setNewAllergy] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, phone, address, city, postal_code, allergies, food_preferences, favorite_table_area')
      .eq('user_id', user!.id)
      .single();

    if (data && !error) {
      setProfile({
        full_name: data.full_name || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        postal_code: data.postal_code || '',
        allergies: (data.allergies as string[]) || [],
        food_preferences: data.food_preferences || '',
        favorite_table_area: data.favorite_table_area || '',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        postal_code: profile.postal_code,
        allergies: profile.allergies,
        food_preferences: profile.food_preferences,
        favorite_table_area: profile.favorite_table_area,
      })
      .eq('user_id', user!.id);

    if (error) {
      toast.error('Error al guardar los datos');
    } else {
      toast.success('¡Datos actualizados correctamente!');
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-16 px-4">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Mi Perfil</h1>
              <p className="text-muted-foreground font-body text-sm mt-1">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-destructive font-body text-sm font-bold hover:underline"
            >
              Cerrar sesión
            </button>
          </div>

          <div className="bg-card rounded-lg p-8 shadow-lg border border-border">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block font-body text-sm font-bold text-foreground mb-1.5">Nombre completo</label>
                <input
                  type="text"
                  name="full_name"
                  value={profile.full_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-sm bg-background border border-input font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Tu nombre completo"
                />
              </div>
              <div>
                <label className="block font-body text-sm font-bold text-foreground mb-1.5">Teléfono</label>
                <input
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-sm bg-background border border-input font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="+34 600 000 000"
                />
              </div>
              <div>
                <label className="block font-body text-sm font-bold text-foreground mb-1.5">Dirección</label>
                <input
                  type="text"
                  name="address"
                  value={profile.address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-sm bg-background border border-input font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Calle, número, piso..."
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block font-body text-sm font-bold text-foreground mb-1.5">Ciudad</label>
                  <input
                    type="text"
                    name="city"
                    value={profile.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-sm bg-background border border-input font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Madrid"
                  />
                </div>
                <div>
                  <label className="block font-body text-sm font-bold text-foreground mb-1.5">Código postal</label>
                  <input
                    type="text"
                    name="postal_code"
                    value={profile.postal_code}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-sm bg-background border border-input font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="28001"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-3 rounded-sm font-body font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar Datos'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
