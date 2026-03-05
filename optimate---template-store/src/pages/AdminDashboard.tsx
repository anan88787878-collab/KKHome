import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Users, LogOut, Package, 
  Clock, CheckCircle, Home, Trash2, Plus, Edit3, Save, X,
  Search, Filter, MoreVertical, ChevronRight, User as UserIcon,
  DollarSign
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

type Tab = 'orders' | 'customers' | 'products';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [orderNote, setOrderNote] = useState('');
  const [orderStatus, setOrderStatus] = useState('');

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

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      if (parsedUser.role === 'admin') {
        fetchAllData();
      } else {
        fetchUserOrders(parsedUser.id);
      }
    } catch (e) {
      console.error('Invalid user data in localStorage');
      localStorage.removeItem('user');
      navigate('/login');
    }
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchOrders(),
      fetchCustomers(),
      fetchProducts()
    ]);
    setLoading(false);
  };

  const fetchUserOrders = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching user orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Đã đăng xuất');
    navigate('/');
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast.success('Đã xóa sản phẩm');
      fetchProducts();
    } catch (error) {
      toast.error('Lỗi khi xóa sản phẩm');
    }
  };

  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
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

      const { error } = await supabase.from('products').insert([productData]);
      if (error) throw error;

      toast.success('Đã thêm sản phẩm!');
      setIsAddProductOpen(false);
      setNewProduct({
        title: '', description: '', price: '', oldPrice: '',
        image: '', badge: '', features: '', youtubeUrl: ''
      });
      fetchProducts();
    } catch (error) {
      toast.error('Lỗi khi thêm sản phẩm');
    }
  };

  const handleUpdateOrder = async () => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: orderStatus,
          notes: orderNote 
        })
        .eq('id', editingOrder.id);

      if (error) throw error;
      toast.success('Đã cập nhật đơn hàng');
      setEditingOrder(null);
      fetchOrders();
    } catch (error) {
      toast.error('Lỗi khi cập nhật đơn hàng');
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex font-sans text-[#1A1A1A]">
      <Toaster position="top-center" />
      
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-8 border-b border-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <Package className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-black tracking-tighter">OPTTIMATE</span>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-2">
          <Link to="/" className="flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-black hover:bg-gray-50 rounded-2xl font-bold transition-all group">
            <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Cửa hàng</span>
          </Link>
          
          <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">Menu chính</div>
          
          <button 
            onClick={() => setActiveTab('orders')}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold transition-all group",
              activeTab === 'orders' ? "bg-black text-white shadow-xl shadow-black/10" : "text-gray-400 hover:text-black hover:bg-gray-50"
            )}
          >
            <div className="flex items-center space-x-3">
              <ShoppingCart className="w-5 h-5" />
              <span>{isAdmin ? 'Đơn hàng' : 'Đơn hàng của tôi'}</span>
            </div>
            {activeTab === 'orders' && <ChevronRight className="w-4 h-4" />}
          </button>

          {isAdmin && (
            <>
              <button 
                onClick={() => setActiveTab('customers')}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold transition-all group",
                  activeTab === 'customers' ? "bg-black text-white shadow-xl shadow-black/10" : "text-gray-400 hover:text-black hover:bg-gray-50"
                )}
              >
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5" />
                  <span>Khách hàng</span>
                </div>
                {activeTab === 'customers' && <ChevronRight className="w-4 h-4" />}
              </button>

              <button 
                onClick={() => setActiveTab('products')}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold transition-all group",
                  activeTab === 'products' ? "bg-black text-white shadow-xl shadow-black/10" : "text-gray-400 hover:text-black hover:bg-gray-50"
                )}
              >
                <div className="flex items-center space-x-3">
                  <Package className="w-5 h-5" />
                  <span>Sản phẩm</span>
                </div>
                {activeTab === 'products' && <ChevronRight className="w-4 h-4" />}
              </button>
            </>
          )}
        </nav>

        <div className="p-6 border-t border-gray-200">
          <div className="bg-gray-50 p-4 rounded-3xl mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center font-black text-sm">
                {user?.name?.charAt(0) || user?.email?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{user?.name || user?.email}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{user?.role}</div>
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-2xl font-bold transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-gray-50 flex items-center justify-between px-10 sticky top-0 z-20">
          <div>
            <h1 className="text-2xl font-black tracking-tight capitalize">
              {activeTab === 'orders' ? (isAdmin ? 'Quản lý đơn hàng' : 'Lịch sử mua hàng') : 
               activeTab === 'customers' ? 'Danh sách khách hàng' : 'Quản lý sản phẩm'}
            </h1>
            <p className="text-gray-400 text-sm font-medium">Chào mừng trở lại, {user?.name || 'User'}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {activeTab === 'products' && isAdmin && (
              <button 
                onClick={() => setIsAddProductOpen(true)}
                className="bg-black text-white px-6 py-3 rounded-full font-bold flex items-center space-x-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/10"
              >
                <Plus className="w-5 h-5" />
                <span>Thêm sản phẩm</span>
              </button>
            )}
          </div>
        </header>

        <div className="p-10">
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-black/10 border-t-black rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Stats for Admin Orders */}
              {activeTab === 'orders' && isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                      <ShoppingCart className="w-24 h-24" />
                    </div>
                    <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Tổng đơn hàng</div>
                    <div className="text-5xl font-black tracking-tighter">{orders.length}</div>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                      <DollarSign className="w-24 h-24" />
                    </div>
                    <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Doanh thu</div>
                    <div className="text-5xl font-black tracking-tighter">
                      {orders.reduce((sum, o) => sum + o.total_amount, 0).toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                      <Clock className="w-24 h-24" />
                    </div>
                    <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Đang xử lý</div>
                    <div className="text-5xl font-black tracking-tighter">
                      {orders.filter(o => o.status === 'pending').length}
                    </div>
                  </div>
                </div>
              )}

              {/* Stats for Regular Users */}
              {activeTab === 'orders' && !isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                      <ShoppingCart className="w-24 h-24" />
                    </div>
                    <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Đơn hàng đã đặt</div>
                    <div className="text-5xl font-black tracking-tighter">{orders.length}</div>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                      <CheckCircle className="w-24 h-24" />
                    </div>
                    <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Tổng chi tiêu</div>
                    <div className="text-5xl font-black tracking-tighter">
                      {orders.reduce((sum, o) => sum + o.total_amount, 0).toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                </div>
              )}

              {/* Content Tables */}
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                      {activeTab === 'orders' ? (
                        <tr>
                          <th className="px-8 py-6">{isAdmin ? 'Đơn hàng' : 'Mã đơn hàng'}</th>
                          <th className="px-8 py-6">Sản phẩm</th>
                          <th className="px-8 py-6">Tổng cộng</th>
                          <th className="px-8 py-6">Trạng thái</th>
                          <th className="px-8 py-6 text-right">Thao tác</th>
                        </tr>
                      ) : activeTab === 'customers' ? (
                        <tr>
                          <th className="px-8 py-6">Khách hàng</th>
                          <th className="px-8 py-6">Email</th>
                          <th className="px-8 py-6">Vai trò</th>
                          <th className="px-8 py-6">Ngày tham gia</th>
                        </tr>
                      ) : (
                        <tr>
                          <th className="px-8 py-6">Sản phẩm</th>
                          <th className="px-8 py-6">Giá bán</th>
                          <th className="px-8 py-6">Kho hàng</th>
                          <th className="px-8 py-6 text-right">Thao tác</th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {activeTab === 'orders' && orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-black text-gray-400">
                                #{order.id.toString().slice(-4)}
                              </div>
                              <div>
                                <div className="font-bold text-lg">{isAdmin ? order.customer_name : `Đơn hàng #${order.id.toString().slice(-4)}`}</div>
                                <div className="text-xs text-gray-400 font-medium">{new Date(order.created_at).toLocaleDateString('vi-VN')}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="max-w-xs">
                              <div className="text-sm font-bold truncate">
                                {(typeof order.items === 'string' ? JSON.parse(order.items) : order.items).map((i: any) => i.title).join(', ')}
                              </div>
                              <div className="text-xs text-gray-400">
                                {(typeof order.items === 'string' ? JSON.parse(order.items) : order.items).length} sản phẩm
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-xl font-black">{order.total_amount.toLocaleString('vi-VN')}đ</div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              "inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              order.status === 'completed' ? "bg-green-100 text-green-700" :
                              order.status === 'processing' ? "bg-blue-100 text-blue-700" :
                              "bg-yellow-100 text-yellow-700"
                            )}>
                              {order.status === 'completed' ? <CheckCircle className="w-3 h-3 mr-2" /> : <Clock className="w-3 h-3 mr-2" />}
                              {order.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button 
                              onClick={() => {
                                setEditingOrder(order);
                                setOrderNote(order.notes || '');
                                setOrderStatus(order.status);
                              }}
                              className="p-3 hover:bg-black hover:text-white rounded-2xl transition-all"
                            >
                              {isAdmin ? <Edit3 className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                            </button>
                          </td>
                        </tr>
                      ))}

                      {activeTab === 'customers' && customers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center font-black text-black/20">
                                <UserIcon className="w-6 h-6" />
                              </div>
                              <div className="font-bold text-lg">{customer.name || 'N/A'}</div>
                            </div>
                          </td>
                          <td className="px-8 py-6 font-medium text-gray-500">{customer.email || 'N/A'}</td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                              customer.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
                            )}>
                              {customer.role}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-sm text-gray-400">
                            {new Date(customer.created_at).toLocaleDateString('vi-VN')}
                          </td>
                        </tr>
                      ))}

                      {activeTab === 'products' && products.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center space-x-4">
                              <img src={product.image} className="w-16 h-16 object-cover rounded-2xl shadow-sm" referrerPolicy="no-referrer" />
                              <div>
                                <div className="font-bold text-lg">{product.title}</div>
                                <div className="text-xs text-gray-400 line-clamp-1 max-w-xs">{product.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-xl font-black">{product.price.toLocaleString('vi-VN')}đ</div>
                            {product.old_price && <div className="text-xs text-gray-300 line-through">{product.old_price.toLocaleString('vi-VN')}đ</div>}
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-xs font-bold text-green-500 bg-green-50 px-3 py-1 rounded-lg">Còn hàng</span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-black">
                                <Edit3 className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-3 hover:bg-red-50 rounded-2xl transition-all text-gray-400 hover:text-red-500"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Edit Order Modal */}
      <AnimatePresence>
        {editingOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingOrder(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-black tracking-tight">{isAdmin ? 'Xử lý đơn hàng' : 'Chi tiết đơn hàng'}</h2>
                  <button onClick={() => setEditingOrder(null)} className="p-2 hover:bg-gray-100 rounded-full">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mã đơn hàng</span>
                      <span className="font-black">#{editingOrder.id.toString().slice(-4)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ngày đặt</span>
                      <span className="font-bold">{new Date(editingOrder.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tổng tiền</span>
                      <span className="font-black text-xl">{editingOrder.total_amount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Sản phẩm</label>
                    <div className="space-y-3">
                      {(typeof editingOrder.items === 'string' ? JSON.parse(editingOrder.items) : editingOrder.items).map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-2xl">
                          <span className="font-bold">{item.title}</span>
                          <span className="text-gray-400 font-bold">x{item.qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Trạng thái xử lý</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['pending', 'processing', 'completed'].map((status) => (
                        <button
                          key={status}
                          disabled={!isAdmin}
                          onClick={() => setOrderStatus(status)}
                          className={cn(
                            "py-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider border-2 transition-all",
                            orderStatus === status ? "bg-black text-white border-black" : "border-gray-100 text-gray-400 hover:border-gray-200",
                            !isAdmin && orderStatus !== status && "opacity-50"
                          )}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Ghi chú xử lý</label>
                    {isAdmin ? (
                      <textarea 
                        value={orderNote}
                        onChange={(e) => setOrderNote(e.target.value)}
                        className="w-full px-6 py-4 rounded-3xl border-2 border-gray-100 focus:border-black outline-none transition-all min-h-[120px] font-medium"
                        placeholder="Nhập ghi chú cho đơn hàng này..."
                      />
                    ) : (
                      <div className="w-full px-6 py-4 rounded-3xl bg-gray-50 text-gray-500 font-medium min-h-[60px]">
                        {orderNote || 'Không có ghi chú nào từ quản trị viên.'}
                      </div>
                    )}
                  </div>

                  {isAdmin && (
                    <button 
                      onClick={handleUpdateOrder}
                      className="w-full bg-black text-white py-5 rounded-full font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/10 flex items-center justify-center space-x-3"
                    >
                      <Save className="w-5 h-5" />
                      <span>Lưu thay đổi</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Product Modal */}
      <AnimatePresence>
        {isAddProductOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddProductOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-black tracking-tight">Thêm sản phẩm</h2>
                  <button onClick={() => setIsAddProductOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleAddProduct} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Tên sản phẩm</label>
                      <input 
                        required
                        type="text"
                        value={newProduct.title}
                        onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                        className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-black outline-none transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Giá bán</label>
                      <input 
                        required
                        type="number"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-black outline-none transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Giá cũ (nếu có)</label>
                      <input 
                        type="number"
                        value={newProduct.oldPrice}
                        onChange={(e) => setNewProduct({ ...newProduct, oldPrice: e.target.value })}
                        className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-black outline-none transition-all font-medium"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Mô tả</label>
                      <textarea 
                        required
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                        className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-black outline-none transition-all font-medium min-h-[100px]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">URL Hình ảnh</label>
                      <input 
                        type="text"
                        value={newProduct.image}
                        onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                        className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-black outline-none transition-all font-medium"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">YouTube URL</label>
                      <input 
                        type="text"
                        value={newProduct.youtubeUrl}
                        onChange={(e) => setNewProduct({ ...newProduct, youtubeUrl: e.target.value })}
                        className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-black outline-none transition-all font-medium"
                        placeholder="https://youtube.com/..."
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-black text-white py-5 rounded-full font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/10 mt-4"
                  >
                    Xác nhận thêm
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
