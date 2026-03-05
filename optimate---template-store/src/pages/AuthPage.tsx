import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { User, Mail, Lock, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isLogin = location.pathname === '/login';
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    if (isLogin) {
      // LOGIN
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      const userId = data.user?.id;

      // Lấy role từ bảng profiles
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileErr) {
        toast.error('Không lấy được role');
        return;
      }

      const userToStore = {
        id: userId,
        email: data.user?.email,
        name: formData.email,
        role: profile?.role || 'user',
      };

      localStorage.setItem('user', JSON.stringify(userToStore));
      toast.success('Đăng nhập thành công!');

      navigate('/');
    } else {
      // REGISTER
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      const userId = data.user?.id;

      // Tạo profile mặc định role = user
      if (userId) {
        await supabase.from('profiles').insert([
          { 
            id: userId, 
            role: 'user',
            email: formData.email,
            name: formData.name
          }
        ]);
      }

      toast.success('Đăng ký thành công!');
      navigate('/login');
    }

  } catch (err) {
    toast.error('Lỗi kết nối server');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Toaster />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8"
      >
        <Link to="/" className="inline-flex items-center text-sm text-gray-500 hover:text-black mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại trang chủ
        </Link>
        
        <h2 className="text-3xl font-bold mb-2">{isLogin ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}</h2>
        <p className="text-gray-500 mb-8">
          {isLogin ? 'Nhập thông tin để truy cập tài khoản của bạn' : 'Tham gia cùng chúng tôi để nhận nhiều ưu đãi'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-semibold mb-2">Họ và tên</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                  placeholder="Nguyễn Văn A"
                />
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-semibold mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                required
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            disabled={loading}
            type="submit"
            className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              isLogin ? 'Đăng nhập' : 'Đăng ký'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          {isLogin ? (
            <p>Chưa có tài khoản? <Link to="/register" className="text-black font-bold hover:underline">Đăng ký ngay</Link></p>
          ) : (
            <p>Đã có tài khoản? <Link to="/login" className="text-black font-bold hover:underline">Đăng nhập</Link></p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
