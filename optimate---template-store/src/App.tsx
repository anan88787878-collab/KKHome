import { useState, useEffect, type FormEvent } from 'react';
import { ShoppingBag, ChevronDown, PlayCircle, CheckCircle2, X, Trash2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { PRODUCTS, Product } from './constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (cart.length === 0) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items: cart.map(item => ({ id: item.product.id, title: item.product.title, price: item.product.price, qty: item.quantity })),
          total: totalAmount
        })
      });

      if (response.ok) {
        toast.success('Đặt hàng thành công! Chúng tôi sẽ liên hệ sớm.');
        setCart([]);
        setIsCheckoutOpen(false);
        setFormData({ name: '', email: '', phone: '' });
      } else {
        throw new Error('Failed to place order');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra, vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-center" />
      
      {/* Top Banner */}
      <div className="bg-black text-white py-2 px-4 text-center text-xs md:text-sm font-medium">
        Giảm ngay 10% khi đơn hàng có giá trị hơn 160k | Chỉ đến ngày 28/02/2026 | Code: <span className="font-bold">OPTIMATE</span>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <a href="#" className="hover:text-accent transition-colors">Trang chủ</a>
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

          <button 
            onClick={() => setIsCartOpen(true)}
            className="flex items-center space-x-2 hover:text-accent transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-sm font-medium">Giỏ hàng ({cartCount})</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-12">Tất cả sản phẩm</h1>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PRODUCTS.map((product) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group flex flex-col"
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
                onClick={() => addToCart(product)}
                className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors active:scale-[0.98]"
              >
                Thêm vào giỏ hàng
              </button>
            </motion.div>
          ))}
        </div>
      </main>

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
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
                    <p>Giỏ hàng của bạn đang trống</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.product.id} className="flex space-x-4">
                      <img src={item.product.image} className="w-20 h-20 object-cover rounded" referrerPolicy="no-referrer" />
                      <div className="flex-1">
                        <h4 className="font-medium line-clamp-2">{item.product.title}</h4>
                        <p className="text-sm text-gray-500">{item.quantity} x {item.product.price.toLocaleString('vi-VN')}đ</p>
                      </div>
                      <button onClick={() => removeFromCart(item.product.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t bg-gray-50">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-gray-600">Tổng cộng:</span>
                    <span className="text-2xl font-bold">{totalAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <button 
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors"
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
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
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
