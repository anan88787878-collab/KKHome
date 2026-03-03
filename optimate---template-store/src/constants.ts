export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  oldPrice?: number;
  image: string;
  badge?: 'NEW' | 'BÁN CHẠY';
  features: string[];
}

export const PRODUCTS: Product[] = [
  {
    id: '1',
    title: 'Chấm công & tính lương tự động (Cập nhật luật 2026 mới nhất) - Google Sheets',
    description: 'Hệ thống quản lý nhân sự chuyên nghiệp',
    price: 125000,
    oldPrice: 210000,
    image: 'https://picsum.photos/seed/payroll/800/600',
    badge: 'NEW',
    features: ['THIẾT KẾ ĐƠN GIẢN', 'CÓ VIDEO HƯỚNG DẪN CỤ THỂ', 'GOOGLE SHEETS']
  },
  {
    id: '2',
    title: 'Content Planner - Lập kế hoạch bài đăng - Google Sheets Template',
    description: 'Quản lý nội dung đa kênh hiệu quả',
    price: 90000,
    oldPrice: 200000,
    image: 'https://picsum.photos/seed/content/800/600',
    badge: 'NEW',
    features: ['THIẾT KẾ ĐƠN GIẢN', 'CÓ VIDEO HƯỚNG DẪN CỤ THỂ', 'GOOGLE SHEETS']
  },
  {
    id: '3',
    title: 'Đặt đơn nhóm - Google Spreadsheets Template',
    description: 'Công cụ gom đơn hàng cho văn phòng',
    price: 30000,
    oldPrice: 100000,
    image: 'https://picsum.photos/seed/order/800/600',
    badge: 'NEW',
    features: ['THIẾT KẾ ĐƠN GIẢN', 'DỄ SỬ DỤNG', 'GOOGLE SHEETS']
  },
  {
    id: '4',
    title: 'Spaced Repetition - Học lặp lại ngắt quãng',
    description: 'Phương pháp ghi nhớ đỉnh cao',
    price: 150000,
    image: 'https://picsum.photos/seed/study/800/600',
    badge: 'NEW',
    features: ['THIẾT KẾ ĐƠN GIẢN', 'HIỆU QUẢ CAO', 'GOOGLE SHEETS']
  },
  {
    id: '5',
    title: 'Quản lý dự án/Công việc cho team',
    description: 'Theo dõi tiến độ dự án thời gian thực',
    price: 250000,
    image: 'https://picsum.photos/seed/project/800/600',
    badge: 'BÁN CHẠY',
    features: ['THIẾT KẾ ĐƠN GIẢN', 'QUẢN LÝ TEAM', 'GOOGLE SHEETS']
  },
  {
    id: '6',
    title: 'Quản lý hồ sơ nhân sự',
    description: 'Lưu trữ thông tin nhân viên khoa học',
    price: 180000,
    image: 'https://picsum.photos/seed/hr/800/600',
    badge: 'NEW',
    features: ['THIẾT KẾ ĐƠN GIẢN', 'BẢO MẬT', 'GOOGLE SHEETS']
  }
];
