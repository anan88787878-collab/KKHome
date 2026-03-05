import { motion } from 'framer-motion';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-4 rounded-full">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-4">Cảm ơn bạn!</h1>
        <p className="text-gray-600 mb-8">
          Đơn hàng của bạn đã được tiếp nhận. Chúng tôi sẽ liên hệ với bạn qua email hoặc số điện thoại trong thời gian sớm nhất để hoàn tất giao dịch.
        </p>
        <Link 
          to="/"
          className="inline-flex items-center space-x-2 bg-black text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại trang chủ</span>
        </Link>
      </motion.div>
    </div>
  );
}
