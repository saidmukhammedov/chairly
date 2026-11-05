import React from 'react';
import { Link } from 'react-router-dom';
import {
  Scissors,
  Phone,
  Mail,
  MapPin,
  Send,
  Instagram,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import { useTranslation } from '../i18n';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-zinc-950 text-zinc-400 border-t border-zinc-900 mt-auto antialiased">
      {/* Top Banner / Trust Bar */}
      <div className="border-b border-zinc-900/80 bg-zinc-950/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-zinc-300 font-medium">
              Barcha tizimlar faol
            </span>
            <span className="text-zinc-600 hidden sm:inline">•</span>
            <span className="text-zinc-500 hidden sm:inline">24/7 onlayn bron tizimi</span>
          </div>
          <div className="flex items-center gap-4 text-zinc-500 text-[11px]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
              100% Xavfsiz bronlash
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              Tezkor tasdiqlash
            </span>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Brand Column (2 cols wide on desktop) */}
          <div className="lg:col-span-2 space-y-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 group focus:outline-hidden"
              title="CHAIRLY"
            >
              <div className="w-8 h-8 rounded-md bg-white text-black flex items-center justify-center font-black text-xs tracking-tighter group-hover:bg-zinc-200 transition-colors">
                CH
              </div>
              <span className="text-base font-black tracking-[0.25em] uppercase text-white group-hover:text-zinc-300 transition-colors">
                CHAIRLY
              </span>
            </Link>

            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              O'zbekistondagi sara sartaroshxonalar va erkaklar grooming salonlari uchun
              yagona onlayn bronlash platformasi. Eng mohir ustalar, qulay vaqt va yuqori darajadagi xizmat.
            </p>

            {/* Contact Details */}
            <div className="space-y-2 pt-2 text-xs">
              <a
                href="tel:+998712009999"
                className="flex items-center gap-2.5 text-zinc-300 hover:text-white transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-zinc-500" />
                <span>+998 (71) 200-99-99</span>
              </a>
              <a
                href="mailto:support@chairly.uz"
                className="flex items-center gap-2.5 text-zinc-300 hover:text-white transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-zinc-500" />
                <span>support@chairly.uz</span>
              </a>
              <div className="flex items-center gap-2.5 text-zinc-400">
                <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span>Toshkent shahri, O'zbekiston</span>
              </div>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-2 pt-2">
              <a
                href="https://t.me/chairly_uz"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Telegram"
              >
                <Send className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://instagram.com/chairly.uz"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Column 1: Mijozlarga */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Kashf qilish
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/"
                  className="hover:text-white transition-colors block py-0.5"
                >
                  Barcha sartaroshxonalar
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  className="hover:text-white transition-colors block py-0.5"
                >
                  Sara ustalar
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  className="hover:text-white transition-colors block py-0.5"
                >
                  Xizmatlar katalogi
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  className="hover:text-white transition-colors block py-0.5"
                >
                  Mening qabullarim
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Shaharlar */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Shaharlar
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="text-zinc-400 flex items-center justify-between">
                <span>Toshkent</span>
                <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.2 rounded-xs">
                  Faol
                </span>
              </li>
              <li className="text-zinc-500 flex items-center justify-between">
                <span>Samarqand</span>
                <span className="text-[9px] text-zinc-600">Yaqinda</span>
              </li>
              <li className="text-zinc-500 flex items-center justify-between">
                <span>Buxoro</span>
                <span className="text-[9px] text-zinc-600">Yaqinda</span>
              </li>
              <li className="text-zinc-500 flex items-center justify-between">
                <span>Namangan</span>
                <span className="text-[9px] text-zinc-600">Yaqinda</span>
              </li>
              <li className="text-zinc-500 flex items-center justify-between">
                <span>Farg'ona</span>
                <span className="text-[9px] text-zinc-600">Yaqinda</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Biznes va Hamkorlik */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Hamkorlik
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/apply"
                  className="inline-flex items-center gap-1 text-white hover:text-zinc-300 font-semibold group transition-colors py-0.5"
                >
                  <span>Sartaroshxonani ulash</span>
                  <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </li>
              <li>
                <Link
                  to="/apply"
                  className="hover:text-white transition-colors block py-0.5"
                >
                  Ariza holatini tekshirish
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="hover:text-white transition-colors block py-0.5"
                >
                  Hamkorlar kirishi
                </Link>
              </li>
              <li>
                <a
                  href="https://t.me/chairly_uz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors block py-0.5"
                >
                  Qo'llab-quvvatlash xizmati
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Sub-Footer Bar */}
      <div className="border-t border-zinc-900 bg-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} CHAIRLY Inc. Barcha huquqlar himoyalangan.</span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400">
            <span className="hover:text-white transition-colors cursor-pointer">
              Maxfiylik siyosati
            </span>
            <span>•</span>
            <span className="hover:text-white transition-colors cursor-pointer">
              Foydalanish shartlari
            </span>
            <span>•</span>
            <span className="font-mono text-zinc-500 font-semibold uppercase tracking-wider">
              chairly.uz
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
