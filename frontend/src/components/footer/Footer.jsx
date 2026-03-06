// Footer.jsx
import React, { useState } from 'react';
import './footer.scss';
import { Twitter , Instagram , Facebook , Youtube } from 'lucide-react';


// Footer sections configuration
const FOOTER_SECTIONS = [
  {
    title: 'Danh mục chính',
    links: [
      { label: 'Giới thiệu', href: '#' },
      { label: 'Tổ chức thi', href: '#' },
      { label: 'Ôn thi sinh viên', href: '#' },
    ],
  },
  {
    title: 'Liên Kết',
    links: [
      { label: 'Trung tâm Dược lý làm sáng', href: '#' },
      { label: 'Bệnh viện Đại học Y Hà Nội', href: '#' },
      { label: 'Viện Đào tạo răng hàm mặt', href: '#' },
    ],
  },
  {
    title: 'Điều khoản & Chính sách',
    links: [
      { label: 'Điều khoản sử dụng', href: '#' },
      { label: 'Điều khoản bảo mật', href: '#' },
      { label: 'Chính sách sử dụng "Trợ lý AI"', href: '#' },
      { label: 'Điều khoản hỗ trợ kỹ thuật', href: '#' },
    ],
  },
];

// Social links configuration
const SOCIAL_LINKS = [
  { icon: 'twitter', href: '#', label: 'Twitter' },
  { icon: 'instagram', href: '#', label: 'Instagram' },
  { icon: 'facebook', href: '#', label: 'Facebook' },
  { icon: 'youtube', href: '#', label: 'YouTube' },
];

const iconMap = {
  twitter: <Twitter />,
  instagram: <Instagram />,
  facebook: <Facebook />,
  youtube: <Youtube />,
};

const SocialLinks = () => (
  <div className="footer__social">
    {SOCIAL_LINKS.map((social) => (
      <a
        key={social.icon}
        href={social.href}
        className={`footer__social-link footer__social-link--${social.icon}`}
        aria-label={social.label}
      >
        {/* This line now renders the correct icon component */}
        {iconMap[social.icon]}
      </a>
    ))}
  </div>
);
// Contact info component
function ContactInfo() {
  return (
    <div className="footer__contact">
      <h3 className="footer__title">HỆ THỐNG THI TRẠM OSCE Y HÀ NỘI</h3>
      <p className="footer__address">01 Tôn Thất Tùng, P. Kim Liên, Hà Nội</p>
      <p className="footer__phone">+84 024 38523798</p>
      <p className="footer__email">daihocyhn@hmu.edu.vn</p>
    </div>
  );
}

// Newsletter subscription component
const Newsletter = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Subscribed with email:', email);
    setEmail('');
  };

  return (
    <div className="footer__newsletter">
      <h3 className="footer__title">ĐĂNG KÝ NHẬN THÔNG TIN</h3>
      <form onSubmit={handleSubmit} className="footer__form">
        <input
          type="email"
          placeholder="Email của bạn"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="footer__input"
          required
        />
        <button type="submit" className="footer__button">
          ĐĂNG KÝ
        </button>
      </form>
    </div>
  );
};

// Footer links section component
const FooterSection = ({ section }) => (
  <div className="footer__section">
    <h4 className="footer__section-title">{section.title}</h4>
    <ul className="footer__links">
      {section.links.map((link) => (
        <li key={`${section.title}-${link.label}`}>
          <a href={link.href} className="footer__link">
            {link.label}
          </a>
        </li>
      ))}
    </ul>

  </div>
);


// Main Footer component
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__container">
        {/* Top section */}
        <div className="footer__top">
          <ContactInfo />
          <Newsletter />
          <div className="footer__links-grid">
            {FOOTER_SECTIONS.map((section) => (
              <FooterSection key={section.title} section={section} />
            ))}
          </div>
        </div>

        {/* Bottom section */}
        <div className="footer__bottom">
          <div className="footer__copyright">
            © Hệ Thống Thi OSCE {currentYear}, Mọi quyền đã được bảo lưu.
          </div>
          <SocialLinks />
        </div>
      </div>
    </footer>
  );
};

export default Footer;