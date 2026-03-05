import { useState, useEffect, type FormEvent } from 'react';
import { ShoppingBag, ChevronDown, PlayCircle, CheckCircle2, X, Trash2, Send, Plus, Image as ImageIcon, Tag, DollarSign, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { PRODUCTS as DEFAULT_PRODUCTS, Product } from '../constants';
import { supabase } from '../lib/supabase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Link } from "react-router-dom";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const getYoutubeEmbedUrl = (url: string) => {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
};

export default function HomePage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>(() => {
    const stored = localStorage.getItem('cart');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    price: '',
    oldPrice: '',
    image: '',
    badge: '',
    features: '',
    youtubeUrl: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    fetchProducts();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const stored = localStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('user');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch products from Supabase, using defaults.');
        setProducts(DEFAULT_PRODUCTS);
      } else if (data && data.length > 0) {
        // Map snake_case from DB to camelCase for UI
        const mappedProducts = data.map((p: any) => ({
          id: p.id.toString(),
          title: p.title,
          description: p.description,
          price: p.price,
          oldPrice: p.old_price,
          image: p.image,
          badge: p.badge,
          features: Array.isArray(p.features) ? p.features : (typeof p.features === 'string' ? JSON.parse(p.features) : []),
          youtubeUrl: p.youtube_url
        }));
        setProducts(mappedProducts);
      } else {
        setProducts(DEFAULT_PRODUCTS);
      }
    } catch (err) {
      setProducts(DEFAULT_PRODUCTS);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    setIsAddingProduct(true);
    try {
      const productData = {
        title: newProduct.title,
        description: newProduct.description,
        price: parseInt(newProduct.price),
        old_price: newProduct.oldPrice ? parseInt(newProduct.oldPrice) : null,
        image: newProduct.image || `https://picsum.photos/seed/${Math.random()}/800/600`,
        badge: newProduct.badge || null,
        features: newProduct.features.split(',').map(f => f.trim()).filter(f => f !== ''),
        youtube_url: newProduct.youtubeUrl
      };

      const { error } = await supabase
        .from('products')
        .insert([productData]);

      if (error) throw error;

      toast.success('Đã thêm sản phẩm thành công!');
      setIsAddProductOpen(false);
      setNewProduct({
        title: '',
        description: '',
        price: '',
        oldPrice: '',
        image: '',
        badge: '',
        features: '',
        youtubeUrl: ''
      });
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Không thể thêm sản phẩm. Vui lòng kiểm tra lại bảng "products" trong Supabase.');
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Đã đăng xuất');
    navigate('/');
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success(`Đã thêm ${product.title.slice(0, 20)}... vào giỏ hàng`);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async (e: FormEvent) => {
    e.preventDefault();

    // ✅ Kiểm tra đăng nhập thực tế từ Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || !user || !user.id) {
      toast.error('Bạn cần đăng nhập để đặt hàng');
      navigate('/login');
      return;
    }

    if (cart.length === 0) {
      toast.error('Giỏ hàng trống');
      return;
    }

  setIsSubmitting(true);
  try {
    const orderData = {
      customer_name: formData.name,
      customer_email: formData.email,
      customer_phone: formData.phone,
      items: cart.map(item => ({
        id: item.product.id,
        title: item.product.title,
        price: item.product.price,
        qty: item.quantity
      })),
      total_amount: totalAmount,
      status: 'pending',
      user_id: user.id
    };

    const { error } = await supabase
      .from('orders')
      .insert([orderData]);

    if (error) throw error;

    // Trigger Google Sheets sync via Vercel Function
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          items: cart.map(item => ({ title: item.product.title, qty: item.quantity })),
          total: totalAmount
        })
      });
    } catch (apiErr) {
      console.warn("Failed to sync with Google Sheets, but order was saved to DB.");
    }

    toast.success('Đặt hàng thành công!');
    setCart([]);
    setIsCheckoutOpen(false);
    setFormData({ name: '', email: '', phone: '' });
    navigate('/thank-you');
  } catch (error) {
    console.error('Order error:', error);
    toast.error('Có lỗi xảy ra, vui lòng thử lại sau.');
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <Link to="/" className="hover:text-accent transition-colors">Trang chủ</Link>
            <div className="group relative">
              <button className="flex items-center hover:text-accent transition-colors">
                Template <ChevronDown className="ml-1 w-4 h-4" />
              </button>
            </div>
            <div className="group relative">
              <button className="flex items-center hover:text-accent transition-colors">
                Hỗ trợ <ChevronDown className="ml-1 w-4 h-4" />
              </button>
            </div>
          </nav>

          <div className="text-2xl font-bold tracking-tighter">Optimate</div>

          <div className="flex items-center space-x-6">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold">{user.name}</div>
                  <Link to="/be" className="text-[10px] text-accent font-bold hover:underline">
                    {user.role === 'admin' ? 'Admin Panel' : 'Đơn hàng của tôi'}
                  </Link>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-xs font-bold hover:text-red-600 transition-colors"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4 text-xs font-bold">
                <Link to="/login" className="hover:text-accent transition-colors">Đăng nhập</Link>
                <Link to="/register" className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">Đăng ký</Link>
              </div>
            )}
            
            <button 
              onClick={() => setIsCartOpen(true)}
              className="flex items-center space-x-2 hover:text-accent transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-sm font-medium">({cartCount})</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl font-bold">Tất cả sản phẩm</h1>
          {user?.role === 'admin' && (
            <button 
              onClick={() => setIsAddProductOpen(true)}
              className="flex items-center space-x-2 bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>Thêm sản phẩm</span>
            </button>
          )}
        </div>

        {/* Product Grid */}
        {loadingProducts ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-gray-100 rounded-lg mb-4" />
                <div className="h-6 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group flex flex-col cursor-pointer"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="relative aspect-[4/3] bg-gray-50 rounded-lg overflow-hidden mb-4 product-card-shadow">
                  {product.badge && (
                    <div className="absolute top-4 left-4 z-10">
                      <span className={cn(
                        product.badge === 'NEW' ? 'badge-new' : 'badge-hot'
                      )}>
                        {product.badge}
                      </span>
                    </div>
                  )}
                  
                  <img 
                    src={product.image} 
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                  
                  <button className="absolute bottom-4 right-4 bg-white rounded-full p-2 shadow-lg hover:scale-110 transition-transform">
                    <PlayCircle className="w-8 h-8 text-red-600" />
                  </button>

                  <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                    {product.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center bg-white/90 backdrop-blur px-2 py-1 rounded text-[8px] font-bold uppercase tracking-tighter">
                        {feature === 'GOOGLE SHEETS' ? (
                          <CheckCircle2 className="w-2 h-2 mr-1 text-green-600" />
                        ) : null}
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold leading-tight mb-2 group-hover:text-accent transition-colors">
                    {product.title}
                  </h3>
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-xl font-bold">{product.price.toLocaleString('vi-VN')}đ</span>
                    {product.oldPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        {product.oldPrice.toLocaleString('vi-VN')}đ
                      </span>
                    )}
                  </div>
                </div>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product);
                  }}
                  className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors active:scale-[0.98]"
                >
                  Thêm vào giỏ hàng
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Add Product Modal */}
      <AnimatePresence>
        {isAddProductOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddProductOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold tracking-tight">Thêm sản phẩm mới</h2>
                  <button onClick={() => setIsAddProductOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-2">Tên sản phẩm</label>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        required
                        type="text"
                        value={newProduct.title}
                        onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                        placeholder="VD: Template quản lý tài chính"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-2">Mô tả ngắn</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                      <textarea 
                        required
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all min-h-[100px]"
                        placeholder="Nhập mô tả sản phẩm..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Giá bán (đ)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        required
                        type="number"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                        placeholder="150000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Giá cũ (đ) - Không bắt buộc</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="number"
                        value={newProduct.oldPrice}
                        onChange={(e) => setNewProduct({ ...newProduct, oldPrice: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                        placeholder="200000"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-2">URL Hình ảnh</label>
                    <div className="relative">
                      <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="url"
                        value={newProduct.image}
                        onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Nhãn (Badge)</label>
                    <select 
                      value={newProduct.badge}
                      onChange={(e) => setNewProduct({ ...newProduct, badge: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all appearance-none"
                    >
                      <option value="">Không có</option>
                      <option value="NEW">NEW</option>
                      <option value="BÁN CHẠY">BÁN CHẠY</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Tính năng (Cách nhau bằng dấu phẩy)</label>
                    <input 
                      type="text"
                      value={newProduct.features}
                      onChange={(e) => setNewProduct({ ...newProduct, features: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                      placeholder="GOOGLE SHEETS, DỄ SỬ DỤNG"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-2">Link YouTube (Embed URL)</label>
                    <div className="relative">
                      <PlayCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="url"
                        value={newProduct.youtubeUrl}
                        onChange={(e) => setNewProduct({ ...newProduct, youtubeUrl: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                        placeholder="https://www.youtube.com/embed/..."
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Sử dụng link dạng embed (ví dụ: https://www.youtube.com/embed/dQw4w9WgXcQ)</p>
                  </div>

                  <div className="md:col-span-2 pt-4">
                    <button 
                      disabled={isAddingProduct}
                      type="submit"
                      className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {isAddingProduct ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          <span>Thêm sản phẩm vào cửa hàng</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-8 border-b flex items-center justify-between bg-white sticky top-0 z-10">
                <h2 className="text-2xl font-bold tracking-tight pr-8">{selectedProduct.title}</h2>
                <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-xl">
                      <img 
                        src={selectedProduct.image} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer" 
                      />
                    </div>

                    <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="p-2 bg-white rounded-xl shadow-sm">
                          <FileText className="w-5 h-5 text-gray-400" />
                        </div>
                        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Mô tả sản phẩm</h5>
                      </div>
                      <p className="text-gray-600 leading-relaxed font-medium text-lg">
                        {selectedProduct.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {selectedProduct.features.map((feature, idx) => (
                        <span key={idx} className="px-4 py-2 bg-black text-white rounded-full text-xs font-bold uppercase tracking-wider">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-end mb-8">
                        <div>
                          <span className="text-gray-400 text-xs font-bold uppercase tracking-widest block mb-1">Giá bán</span>
                          <span className="text-4xl font-black">{selectedProduct.price.toLocaleString('vi-VN')}đ</span>
                        </div>
                        {selectedProduct.oldPrice && (
                          <span className="text-xl text-gray-300 line-through mb-1">
                            {selectedProduct.oldPrice.toLocaleString('vi-VN')}đ
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => {
                          addToCart(selectedProduct);
                          setSelectedProduct(null);
                        }}
                        className="w-full bg-black text-white py-5 rounded-full font-bold text-xl hover:bg-gray-800 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/10 flex items-center justify-center space-x-3"
                      >
                        <ShoppingBag className="w-6 h-6" />
                        <span>Thêm vào giỏ hàng</span>
                      </button>
                    </div>

                    {selectedProduct.youtubeUrl && (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-red-50 rounded-xl shadow-sm">
                            <PlayCircle className="w-5 h-5 text-red-500" />
                          </div>
                          <h5 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Video hướng dẫn</h5>
                        </div>
                        <div className="aspect-video rounded-[2rem] overflow-hidden shadow-2xl bg-black">
                          <iframe 
                            src={getYoutubeEmbedUrl(selectedProduct.youtubeUrl)}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">Giỏ hàng ({cartCount})</h2>
                <div className="flex items-center space-x-2">
                  {cart.length > 0 && (
                    <button 
                      onClick={() => setCart([])}
                      className="text-xs text-red-500 hover:underline font-bold mr-2"
                    >
                      Xóa tất cả
                    </button>
                  )}
                  <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
                    <p>Giỏ hàng của bạn đang trống</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.product.id} className="flex space-x-4 pb-4 border-b border-gray-50 last:border-0">
                      <img src={item.product.image} className="w-16 h-16 object-cover rounded-xl shadow-sm" referrerPolicy="no-referrer" />
                      <div className="flex-1">
                        <h4 className="font-bold text-sm line-clamp-2 leading-tight mb-1">{item.product.title}</h4>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 font-medium">{item.quantity} x {item.product.price.toLocaleString('vi-VN')}đ</p>
                          <span className="font-bold text-sm">{(item.product.price * item.quantity).toLocaleString('vi-VN')}đ</span>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(item.product.id)} className="text-gray-300 hover:text-red-500 p-1 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t bg-gray-50">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-gray-600 font-medium">Tổng cộng:</span>
                    <span className="text-2xl font-black">{totalAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <button 
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-black/10"
                  >
                    Thanh toán ngay
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold tracking-tight">Thông tin đặt hàng</h2>
                  <button onClick={() => setIsCheckoutOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleCheckout} className="space-y-6">
                  {/* Item List in Checkout */}
                  <div className="max-h-40 overflow-y-auto space-y-3 mb-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="text-xs font-bold text-gray-400 uppercase mb-2">Sản phẩm của bạn</div>
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex items-center justify-between text-sm">
                        <div className="flex-1 pr-4">
                          <div className="font-medium line-clamp-1">{item.product.title}</div>
                          <div className="text-xs text-gray-500">x{item.quantity}</div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="font-bold">{(item.product.price * item.quantity).toLocaleString('vi-VN')}đ</span>
                          <button 
                            type="button"
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-red-500 hover:bg-red-50 p-1 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Họ và tên</label>
                    <input 
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Email</label>
                    <input 
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Số điện thoại</label>
                    <input 
                      required
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                      placeholder="0901234567"
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Tổng thanh toán:</span>
                      <span>{totalAmount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>

                  <button 
                    disabled={isSubmitting}
                    type="submit"
                    className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Gửi đơn hàng</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:col-span-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="text-2xl font-bold tracking-tighter mb-4">Optimate</div>
            <p className="text-gray-500 max-w-sm">
              Cung cấp các giải pháp quản lý thông minh trên nền tảng Google Sheets, giúp tối ưu hóa quy trình làm việc của bạn.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Liên kết</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-black">Về chúng tôi</a></li>
              <li><a href="#" className="hover:text-black">Chính sách bảo mật</a></li>
              <li><a href="#" className="hover:text-black">Điều khoản sử dụng</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-black">Hướng dẫn mua hàng</a></li>
              <li><a href="#" className="hover:text-black">Câu hỏi thường gặp</a></li>
              <li><a href="#" className="hover:text-black">Liên hệ</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-gray-200 text-center text-xs text-gray-400">
          © 2026 Optimate. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
