'use client';

import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import {
  LayoutGrid,
  Film,
  Folder,
  ShoppingCart,
  Users,
  Settings,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  X,
  FileText,
  Download,
  Upload,
  Shield,
  RefreshCw,
  Eye,
  AlertCircle,
} from 'lucide-react';

type Tab = 'dashboard' | 'categories' | 'movies' | 'orders' | 'users' | 'settings' | 'logs';

interface MovieItem {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryId: string;
  year: number;
  quality: string;
  duration: string;
  status: 'Опубликован' | 'Черновик';
  poster: string;
  trailerUrl: string;
  stills: string[];
  tags: string[];
  country: string;
  ageRating: string;
  audioLang: string;
  territory: string;
  rightsPeriod: string;
  views?: number;
}

// 10 эталонных категорий с привязкой английских синонимов
const CATEGORY_MAP = [
  { slug: 'nature', ru: 'Природа', synonyms: ['nature', 'природа', 'дикая природа'] },
  { slug: 'travel', ru: 'Путешествия', synonyms: ['travel', 'путешествия', 'туризм'] },
  { slug: 'culinary', ru: 'Кулинария и еда', synonyms: ['culinary', 'cooking', 'food', 'кулинария', 'кулинария и еда', 'еда'] },
  { slug: 'science', ru: 'Научпоп', synonyms: ['science', 'popular-science', 'popular_science', 'научпоп', 'наука'] },
  { slug: 'educational', ru: 'Познавательный', synonyms: ['educational', 'education', 'познавательный', 'познавательное'] },
  { slug: 'experts', ru: 'Эксперты', synonyms: ['experts', 'expert', 'эксперты'] },
  { slug: 'garden', ru: 'Дача и сад', synonyms: ['garden', 'dacha', 'дача и сад', 'дача', 'сад'] },
  { slug: 'kids', ru: 'Детям и подросткам', synonyms: ['kids', 'children', 'детям и подросткам', 'детям', 'подросткам'] },
  { slug: 'workout', ru: 'Тренировки', synonyms: ['workout', 'workouts', 'sport', 'sports', 'fitness', 'тренировки', 'спорт'] },
  { slug: 'on-demand', ru: 'Под запрос', synonyms: ['on-demand', 'on_demand', 'ondemand', 'request', 'custom', 'под запрос'] },
];

function normalizeToRussianCategory(val: any): string {
  if (!val) return 'Природа';
  const str = (typeof val === 'object' ? (val.ru || val.en || '') : String(val)).toLowerCase().trim();
  for (const item of CATEGORY_MAP) {
    if (item.synonyms.some((s) => str === s || str.includes(s) || s.includes(str))) {
      return item.ru;
    }
  }
  return typeof val === 'object' ? (val.ru || val.en || 'Природа') : String(val);
}

function getCategorySlug(val: any): string {
  if (!val) return 'nature';
  const str = (typeof val === 'object' ? (val.ru || val.en || '') : String(val)).toLowerCase().trim();
  for (const item of CATEGORY_MAP) {
    if (item.synonyms.some((s) => str === s || str.includes(s) || s.includes(str))) {
      return item.slug;
    }
  }
  return str;
}

function formatCount(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) return `${count} тайтлов`;
  if (mod10 === 1) return `${count} тайтл`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} тайтла`;
  return `${count} тайтлов`;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Дашборд', icon: LayoutGrid },
  { id: 'movies', label: 'Тайтлы', icon: Film },
  { id: 'categories', label: 'Категории', icon: Folder },
  { id: 'orders', label: 'Заказы', icon: ShoppingCart },
  { id: 'logs', label: 'Логи и Аудит', icon: FileText },
  { id: 'users', label: 'Пользователи', icon: Users },
  { id: 'settings', label: 'Настройки', icon: Settings },
];

export interface AdminDashboardProps {
  movies?: any[];
  categories?: any[];
}

export function AdminDashboard({ movies: _initialMovies, categories: _initialCategories }: AdminDashboardProps = {}) {
  const [tab, setTab] = useState<Tab>('dashboard');
  const { user } = useAuth();
  const userName = user?.fullName || user?.email || '';
  const userInitials = userName.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [_ordersLoading, setOrdersLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logLevelFilter, setLogLevelFilter] = useState('ALL');
  const [logSearch, setLogSearch] = useState('');
  const [excelImportLoading, setExcelImportLoading] = useState(false);
  const [selectedLogDetails, setSelectedLogDetails] = useState<any | null>(null);
  const [settings, setSettings] = useState({
    siteName: 'Каталог контента UTV Media',
    adminEmail: 'admin@utvmedia.ru',
    telegramBotToken: '',
    telegramChatId: '',
    notificationEmails: 'orders@utv.ru',
    consoleNoise: true,
  });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);

  const loadLogs = async () => {
    try {
      setLogsLoading(true);
      const params = new URLSearchParams();
      if (logLevelFilter !== 'ALL') params.append('level', logLevelFilter);
      if (logSearch) params.append('search', logSearch);
      const res = await fetch(`/api/admin/logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error('Ошибка загрузки логов:', e);
    } finally {
      setLogsLoading(false);
    }
  };

  const clearLogs = async () => {
    if (!confirm('Вы действительно хотите очистить журнал аудита?')) return;
    try {
      const res = await fetch('/api/admin/logs', { method: 'DELETE' });
      if (res.ok) {
        setLogs([]);
      }
    } catch (e) {
      console.error('Ошибка очистки логов:', e);
    }
  };

  const handleExportExcel = () => {
    window.open('/api/admin/excel', '_blank');
  };

  const handleImportExcel = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelImportLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/admin/excel', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        alert(`Каталог успешно обновлен из Excel! Обработано позиций: ${data.importedCount}`);
        loadMovies();
        loadLogs();
      } else {
        alert(data.error || 'Ошибка импорта Excel');
      }
    } catch (err: any) {
      alert('Ошибка загрузки файла: ' + err.message);
    } finally {
      setExcelImportLoading(false);
      e.target.value = '';
    }
  };

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
      }
    } catch (e) {
      console.error('Ошибка загрузки настроек:', e);
    }
  };

  const saveSettings = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 3000);
      }
    } catch (e) {
      console.error('Ошибка сохранения настроек:', e);
    }
  };

  const testTelegram = async () => {
    setTelegramStatus('Отправка теста...');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test-telegram',
          telegramBotToken: settings.telegramBotToken,
          telegramChatId: settings.telegramChatId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTelegramStatus('✅ Тестовое сообщение успешно отправлено!');
      } else {
        setTelegramStatus(`❌ ${data.error || 'Ошибка отправки'}`);
      }
    } catch (e: any) {
      setTelegramStatus(`❌ Ошибка: ${e.message}`);
    }
    setTimeout(() => setTelegramStatus(null), 5000);
  };

  // Редактирование
  const [isEditing, setIsEditing] = useState(false);
  const [currentMovie, setCurrentMovie] = useState<MovieItem | null>(null);
  const [tagInput, setTagInput] = useState('');

  // Фильтры таблицы
  const [searchQuery, setSearchQuery] = useState('');
  const [qualityFilter, setQualityFilter] = useState('Все');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error('Ошибка загрузки заказов:', e);
    } finally {
      setOrdersLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status } : o))
        );
      }
    } catch (e) {
      console.error('Ошибка смены статуса заказа:', e);
    }
  };

  const loadMovies = async () => {
    try {
      const res = await fetch('/api/movies');
      const data = await res.json();
      if (data.movies) {
        const formatted: MovieItem[] = data.movies.map((m: any, idx: number) => {
          const rawCat = m.category || m.categoryId || 'Природа';
          const catRu = normalizeToRussianCategory(rawCat);
          const catSlug = getCategorySlug(rawCat);

          return {
            id: String(m.id || idx + 1),
            title: typeof m.title === 'object' ? (m.title.ru || m.title.en) : (m.title || 'Без названия'),
            description: typeof m.description === 'object' ? (m.description.ru || '') : (m.description || ''),
            category: catRu,
            categoryId: catSlug,
            year: Number(m.year || m.yearFrom) || 2024,
            quality: Array.isArray(m.qualities) ? m.qualities[0] : (Array.isArray(m.quality) ? m.quality[0] : (m.quality || 'Full HD')),
            duration: typeof m.duration === 'string' ? m.duration : `${m.episodeDuration?.max || 30} мин`,
            status: m.status === 'Черновик' ? 'Черновик' : 'Опубликован',
            poster: m.poster || m.image || '',
            trailerUrl: m.trailerUrl || (typeof m.trailer === 'string' ? m.trailer : m.trailer?.url) || '',
            stills: Array.isArray(m.stills) ? m.stills : [],
            tags: Array.isArray(m.tags) ? m.tags : [],
            country: Array.isArray(m.countries) ? m.countries[0] : (m.country || 'Россия'),
            ageRating: m.ageRating || '12+',
            audioLang: Array.isArray(m.languages) ? m.languages[0] : (m.audioLang || 'Русский'),
            territory: m.territory || m.distributionTerritory || 'Весь мир',
            rightsPeriod: m.rightsPeriod || 'До 31.12.2028',
            views: m.views || 0,
          };
        });
        setMovies(formatted);
      }
    } catch (e) {
      console.error('Ошибка загрузки:', e);
    }
  };

  useEffect(() => {
    loadMovies();
    loadOrders();
    loadSettings();
    loadLogs();
  }, []);

  useEffect(() => {
    if (tab === 'logs') {
      loadLogs();
    }
  }, [tab, logLevelFilter]);

  // Сохраняем только изменённую карточку — иначе удалённые в БД записи создавались бы заново
  const saveMovie = async (movie: MovieItem, updatedList: MovieItem[]) => {
    setMovies(updatedList);
    try {
      const res = await fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movie),
      });
      if (!res.ok) throw new Error();
    } catch {
      alert('Ошибка при сохранении базы данных');
      loadMovies();
    }
  };


  // 10 русских карточек категорий с автоподбором реального постера из фильмов
  const categoryCards = useMemo(() => {
    return CATEGORY_MAP.map((item) => {
      const catMovies = movies.filter((m) => m.category === item.ru);
      const filmWithPoster = catMovies.find((m) => m.poster && m.poster.trim() !== '');
      return {
        name: item.ru,
        slug: item.slug,
        count: catMovies.length,
        img: filmWithPoster ? filmWithPoster.poster : '/placeholder.png',
      };
    });
  }, [movies]);

  // Фильтрация списка фильмов
  const displayedMovies = useMemo(() => {
    return movies.filter((m) => {
      const matchCat = selectedCategory ? m.category === selectedCategory : true;
      const matchSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchQuality = qualityFilter === 'Все' ? true : m.quality === qualityFilter;
      return matchCat && matchSearch && matchQuality;
    });
  }, [movies, selectedCategory, searchQuery, qualityFilter]);

  const totalPages = Math.ceil(displayedMovies.length / itemsPerPage) || 1;
  const paginatedMovies = displayedMovies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleStartCreate = () => {
    setCurrentMovie({
      id: Date.now().toString(),
      title: '',
      description: '',
      category: selectedCategory || 'Природа',
      categoryId: getCategorySlug(selectedCategory || 'Природа'),
      year: 2024,
      quality: '4K HDR',
      duration: '1 ч 30 мин',
      status: 'Опубликован',
      poster: '',
      trailerUrl: '',
      stills: [],
      tags: ['Документальный'],
      country: 'Россия',
      ageRating: '12+',
      audioLang: 'Русский',
      territory: 'СНГ, страны Балтии',
      rightsPeriod: 'До 31.12.2028',
      views: 0,
    });
    setIsEditing(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMovie || !currentMovie.title.trim()) {
      alert('Введите название тайтла');
      return;
    }

    const catRu = normalizeToRussianCategory(currentMovie.category);
    const movieToSave = {
      ...currentMovie,
      category: catRu,
      categoryId: getCategorySlug(catRu),
    };

    const exists = movies.some((m) => m.id === movieToSave.id);
    const updated = exists
      ? movies.map((m) => (m.id === movieToSave.id ? movieToSave : m))
      : [movieToSave, ...movies];

    saveMovie(movieToSave, updated);
    setIsEditing(false);
    setCurrentMovie(null);
  };

  const handleDeleteMovie = (id: string) => {
    if (confirm('Удалить этот тайтл из каталога?')) {
      setMovies(movies.filter((m) => m.id !== id));
      fetch(`/api/movies?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() =>
        alert('Ошибка при удалении')
      );
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, field: 'poster' | 'still') => {
    const file = e.target.files?.[0];
    if (!file || !currentMovie) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (field === 'poster') {
        setCurrentMovie({ ...currentMovie, poster: data.url });
      } else {
        setCurrentMovie({ ...currentMovie, stills: [...currentMovie.stills, data.url] });
      }
    } catch {
      alert('Не удалось загрузить файл');
    }
  };

  // Удаление кадра из списка
  const handleRemoveStill = (indexToRemove: number) => {
    if (!currentMovie) return;
    setCurrentMovie({
      ...currentMovie,
      stills: currentMovie.stills.filter((_, idx) => idx !== indexToRemove),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-[#f8f9fc] font-sans text-slate-800 antialiased overflow-hidden">
      {/* ЛЕВЫЙ САЙДБАР */}
      <aside className="w-64 bg-[#11131e] text-slate-400 flex flex-col justify-between flex-shrink-0">
        <div>
          <div className="p-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ff5a1f] to-[#ff7a45] flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/30">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </div>
            <div>
              <div className="text-white font-bold text-base leading-tight">UTV Media</div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Панель управления</div>
            </div>
          </div>

          <nav className="px-3 space-y-1 mt-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setTab(item.id as Tab);
                    setIsEditing(false);
                    if (item.id === 'movies') setSelectedCategory(null);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive ? 'bg-[#1c2033] text-white' : 'hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={isActive ? 'text-[#ff5a1f]' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <span className="w-1.5 h-4 bg-[#ff5a1f] rounded-full" />}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-slate-800/80 text-xs">
          <div>Вошли как: <span className="text-slate-300">admin@utv.ru</span></div>
          <Link href="/ru" className="text-[#ff5a1f] font-semibold mt-2 inline-block hover:underline">
            Выйти на витрину сайта →
          </Link>
        </div>
      </aside>

      {/* ОСНОВНАЯ ОБЛАСТЬ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-20 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-10 flex-shrink-0">
          <div>
            {isEditing ? (
              <div className="text-xs text-slate-400 font-medium">
                Тайтлы &gt; <span className="text-[#ff5a1f]">Редактирование</span>
              </div>
            ) : selectedCategory ? (
              <div className="text-xs text-slate-400 font-medium">
                Категории &gt; <span className="text-[#ff5a1f]">{selectedCategory}</span>
              </div>
            ) : (
              <h1 className="text-xl font-bold text-slate-900">
                {tab === 'dashboard' && 'Добро пожаловать, Администратор'}
                {tab === 'categories' && 'Управление категориями'}
                {tab === 'movies' && 'Управление тайтлами'}
                {tab === 'orders' && 'Управление заказами'}
                {tab === 'users' && 'Управление пользователями'}
                {tab === 'settings' && 'Настройки системы'}
              </h1>
            )}
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing
                ? currentMovie?.title || 'Новый тайтл'
                : tab === 'categories'
                ? `Каталог содержит ${categoryCards.length} основных медиа-направлений`
                : 'Панель управления каталогом контента UTV Media'}
            </p>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center text-xs font-semibold bg-slate-100 p-1 rounded-lg">
              <span className="px-2 py-1 bg-white text-slate-900 rounded shadow-sm">RU</span>
              <span className="px-2 py-1 text-slate-400 cursor-pointer">EN</span>
            </div>
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="w-10 h-10 rounded-full bg-slate-200 font-bold flex items-center justify-center text-slate-600">{userInitials}</div>
              <div>
                <div className="text-sm font-semibold text-slate-900">{userName}</div>
                <div className="text-[11px] text-slate-400">{user?.position || 'Администратор'}</div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* 1. ДАШБОРД */}
          {!isEditing && tab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-slate-900">Последние заказы</h2>
                    <button onClick={() => setTab('orders')} className="text-xs font-semibold text-[#ff5a1f] hover:underline">
                      Все заказы
                    </button>
                  </div>
                  {orders.length === 0 ? (
                    <div className="py-16 text-center text-xs text-slate-400">
                      Пока нет оформленных заказов
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.slice(0, 5).map((ord) => (
                        <div key={ord.id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-orange-200 transition-colors">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{ord.id}</span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                ord.status === 'new' ? 'bg-orange-100 text-[#ff5a1f]' :
                                ord.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                ord.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-slate-200 text-slate-700'
                              }`}>
                                {ord.status === 'new' ? 'Новый' : ord.status === 'processing' ? 'В обработке' : ord.status === 'completed' ? 'Выполнен' : 'Отменен'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 font-medium mt-1 truncate">{ord.fullName} · {ord.phone}</p>
                            <p className="text-[11px] text-slate-400">{ord.items?.length || 0} тайтлов · {new Date(ord.createdAt).toLocaleDateString('ru-RU')}</p>
                          </div>
                          <button
                            onClick={() => setTab('orders')}
                            className="text-xs font-semibold text-[#ff5a1f] hover:underline shrink-0 ml-3"
                          >
                            Подробнее
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 mb-4">Популярные тайтлы</h2>
                <div className="space-y-2">
                  {movies.slice(0, 6).map((m) => (
                    <div
                      key={m.id}
                      onClick={() => {
                        setCurrentMovie({ ...m });
                        setIsEditing(true);
                      }}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group"
                      title="Нажмите, чтобы редактировать тайтл"
                    >
                      <div className="w-12 h-8 rounded bg-slate-900 overflow-hidden flex-shrink-0">
                        {m.poster ? (
                          <img src={m.poster} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate group-hover:text-[#ff5a1f] transition-colors">
                          {m.title}
                        </div>
                        <div className="text-[11px] text-slate-400">{m.quality} · {m.year}</div>
                      </div>
                      <Pencil size={13} className="text-slate-300 group-hover:text-[#ff5a1f] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. КАТЕГОРИИ */}
          {!isEditing && tab === 'categories' && !selectedCategory && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryCards.map((cat, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedCategory(cat.name)}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="aspect-[16/9] w-full overflow-hidden bg-slate-900">
                    <img
                      src={cat.img}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-5 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{cat.name}</h3>
                      <span className="text-xs text-slate-400 mt-0.5 inline-block">
                        {formatCount(cat.count)}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-[#ff5a1f] group-hover:underline">
                      Открыть →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. ТАБЛИЦА ТАЙТЛОВ */}
          {!isEditing && (tab === 'movies' || selectedCategory) && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedCategory && (
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium hover:bg-slate-50 flex items-center gap-1.5"
                    >
                      <ArrowLeft size={14} />
                      <span>Назад к категориям</span>
                    </button>
                  )}
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedCategory ? `Категория: ${selectedCategory}` : 'Все тайтлы'}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="px-3.5 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-xl hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                    title="Скачать весь каталог в виде Excel таблицы (.xlsx)"
                  >
                    <Download size={14} />
                    <span>Экспорт Excel</span>
                  </button>

                  <label
                    className="px-3.5 py-2.5 bg-sky-50 text-sky-700 border border-sky-200 text-xs font-semibold rounded-xl hover:bg-sky-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Загрузить обновленный Excel каталог"
                  >
                    <Upload size={14} />
                    <span>{excelImportLoading ? 'Импорт...' : 'Импорт Excel'}</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleImportExcel}
                      disabled={excelImportLoading}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={handleStartCreate}
                    className="px-4 py-2.5 bg-[#ff5a1f] text-white text-xs font-semibold rounded-xl hover:bg-[#e04810] shadow-md shadow-orange-500/20 flex items-center gap-1.5"
                  >
                    <Plus size={15} />
                    <span>Добавить тайтл</span>
                  </button>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по названию..."
                  className="w-full max-w-md px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#ff5a1f]"
                />
                <select
                  value={qualityFilter}
                  onChange={(e) => setQualityFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Все">Качество: Все</option>
                  <option value="4K HDR">4K HDR</option>
                  <option value="Full HD">Full HD</option>
                </select>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase bg-slate-50/50">
                      <th className="py-4 pl-6">Название</th>
                      <th className="py-4">Год</th>
                      <th className="py-4">Качество</th>
                      <th className="py-4">Длительность</th>
                      <th className="py-4">Статус</th>
                      <th className="py-4 text-right pr-6">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedMovies.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/80">
                        <td className="py-4 pl-6 font-bold text-slate-900 flex items-center gap-3">
                          <div className="w-14 h-9 rounded bg-slate-900 overflow-hidden flex-shrink-0">
                            {m.poster ? <img src={m.poster} alt="" className="w-full h-full object-cover" /> : null}
                          </div>
                          <span>{m.title}</span>
                        </td>
                        <td className="py-4 text-slate-500">{m.year}</td>
                        <td className="py-4 font-semibold text-slate-700">{m.quality}</td>
                        <td className="py-4 text-slate-500">{m.duration}</td>
                        <td className="py-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.status === 'Опубликован' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="py-4 text-right pr-6 space-x-3">
                          <button
                            onClick={() => {
                              setCurrentMovie({ ...m });
                              setIsEditing(true);
                            }}
                            className="text-slate-400 hover:text-[#ff5a1f] inline-block"
                            title="Редактировать"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteMovie(m.id)}
                            className="text-slate-400 hover:text-rose-600 inline-block"
                            title="Удалить"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {totalPages > 1 && (
                  <div className="p-4 border-t border-slate-100 flex items-center justify-center gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                      className="px-3 py-1 text-xs border rounded-lg disabled:opacity-40"
                    >
                      Назад
                    </button>
                    <span className="text-xs text-slate-400">Стр. {currentPage} из {totalPages}</span>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="px-3 py-1 text-xs border rounded-lg disabled:opacity-40"
                    >
                      Вперед
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. ФОРМА РЕДАКТИРОВАНИЯ ТАЙТЛА */}
          {isEditing && currentMovie && (
            <form onSubmit={handleSaveForm} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Название тайтла</label>
                    <input
                      type="text"
                      value={currentMovie.title}
                      onChange={(e) => setCurrentMovie({ ...currentMovie, title: e.target.value })}
                      className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Описание</label>
                    <textarea
                      rows={4}
                      value={currentMovie.description}
                      onChange={(e) => setCurrentMovie({ ...currentMovie, description: e.target.value })}
                      className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Категория</label>
                    <select
                      value={currentMovie.category}
                      onChange={(e) => setCurrentMovie({ ...currentMovie, category: e.target.value })}
                      className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      {CATEGORY_MAP.map((c) => (
                        <option key={c.slug} value={c.ru}>{c.ru}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Теги</label>
                    <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                      {currentMovie.tags.map((t, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs flex items-center gap-1.5">
                          {t}
                          <button
                            type="button"
                            onClick={() => setCurrentMovie({ ...currentMovie, tags: currentMovie.tags.filter((_, i) => i !== idx) })}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          placeholder="+ Добавить..."
                          className="px-2 py-1 text-xs bg-transparent border-none outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (tagInput.trim()) {
                              setCurrentMovie({ ...currentMovie, tags: [...currentMovie.tags, tagInput.trim()] });
                              setTagInput('');
                            }
                          }}
                          className="text-xs font-bold text-[#ff5a1f]"
                        >
                          Ок
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Постер</label>
                    <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50">
                      {currentMovie.poster ? (
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900">
                          <img src={currentMovie.poster} alt="" className="w-full h-full object-cover" />
                          <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer transition-opacity text-white text-xs font-bold">
                            Заменить
                            <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'poster')} className="hidden" />
                          </label>
                        </div>
                      ) : (
                        <label className="cursor-pointer block py-4 text-xs text-[#ff5a1f] font-semibold">
                          Нажмите для загрузки (16:9)
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'poster')} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Ссылка на трейлер (URL)</label>
                    <input
                      type="url"
                      value={currentMovie.trailerUrl}
                      onChange={(e) => setCurrentMovie({ ...currentMovie, trailerUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  {/* КАДРЫ ИЗ ТАЙТЛА С КНОПКОЙ УДАЛЕНИЯ */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Кадры из тайтла</label>
                    <div className="grid grid-cols-3 gap-2">
                      {currentMovie.stills.map((st, idx) => (
                        <div key={idx} className="group relative aspect-video rounded overflow-hidden bg-slate-800 border border-slate-200">
                          <img src={st} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveStill(idx)}
                            className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600/90 text-white shadow-md hover:bg-red-700 hover:scale-110 transition-all"
                            title="Удалить кадр"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                      <label className="cursor-pointer border-2 border-dashed border-slate-200 rounded flex items-center justify-center aspect-video text-slate-400 hover:text-[#ff5a1f] text-sm transition-colors">
                        +
                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'still')} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Дополнительные метаданные</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Год выпуска</label>
                    <input
                      type="number"
                      value={currentMovie.year}
                      onChange={(e) => setCurrentMovie({ ...currentMovie, year: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Длительность</label>
                    <input
                      type="text"
                      value={currentMovie.duration}
                      onChange={(e) => setCurrentMovie({ ...currentMovie, duration: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Страна производства</label>
                    <input
                      type="text"
                      value={currentMovie.country}
                      onChange={(e) => setCurrentMovie({ ...currentMovie, country: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Возрастной рейтинг</label>
                    <input
                      type="text"
                      value={currentMovie.ageRating}
                      onChange={(e) => setCurrentMovie({ ...currentMovie, ageRating: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Язык аудиодорожки</label>
                    <input
                      type="text"
                      value={currentMovie.audioLang}
                      onChange={(e) => setCurrentMovie({ ...currentMovie, audioLang: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Территория распространения</label>
                    <input
                      type="text"
                      value={currentMovie.territory}
                      onChange={(e) => setCurrentMovie({ ...currentMovie, territory: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Максимальное качество</label>
                    <select
                      value={currentMovie.quality}
                      onChange={(e) => setCurrentMovie({ ...currentMovie, quality: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl"
                    >
                      <option value="4K HDR">4K HDR</option>
                      <option value="Full HD">Full HD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Период действия прав</label>
                    <input
                      type="text"
                      value={currentMovie.rightsPeriod}
                      onChange={(e) => setCurrentMovie({ ...currentMovie, rightsPeriod: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
                  <button type="submit" className="px-6 py-2.5 bg-[#ff5a1f] text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/20 hover:bg-[#e04810]">
                    Сохранить изменения
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-2.5 bg-white border border-slate-200 text-xs font-bold rounded-xl hover:bg-slate-50">
                    Отмена
                  </button>
                </div>
              </div>
            </form>
          )}

          {!isEditing && tab === 'orders' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Заказы клиентов</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Всего заявок: {orders.length}</p>
                </div>
                <button
                  onClick={loadOrders}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-colors"
                >
                  Обновить список
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#ff5a1f] flex items-center justify-center mx-auto mb-3">
                    <ShoppingCart size={22} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Заказов пока нет</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Когда клиенты оформят заявку на получение медиа-контента из витрины, заказ появится здесь.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((ord) => (
                    <div key={ord.id} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-slate-900">{ord.id}</span>
                          <span className="text-xs text-slate-400">
                            {new Date(ord.createdAt).toLocaleString('ru-RU')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-500 font-medium">Статус заявки:</label>
                          <select
                            value={ord.status}
                            onChange={(e) => updateOrderStatus(ord.id, e.target.value)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border outline-none cursor-pointer transition-colors ${
                              ord.status === 'new' ? 'bg-orange-50 border-orange-200 text-[#ff5a1f]' :
                              ord.status === 'processing' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                              ord.status === 'completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                              'bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            <option value="new">Новый</option>
                            <option value="processing">В обработке</option>
                            <option value="completed">Выполнен</option>
                            <option value="cancelled">Отменен</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 block mb-1">Заказчик:</span>
                          <span className="font-bold text-slate-900 text-sm block">{ord.fullName}</span>
                          {ord.company && <span className="text-slate-500 block mt-0.5">Компания: {ord.company}</span>}
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-1">Контакты:</span>
                          <a href={`mailto:${ord.email}`} className="text-[#ff5a1f] hover:underline block font-semibold">
                            {ord.email}
                          </a>
                          <a href={`tel:${ord.phone}`} className="text-slate-700 hover:underline block font-medium mt-0.5">
                            {ord.phone}
                          </a>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-1">Условия:</span>
                          <span className="font-semibold text-slate-800 block">Позиций: {ord.items?.length || 0} шт.</span>
                          <span className="text-[#ff5a1f] font-medium block mt-0.5">Лицензия по запросу</span>
                        </div>
                      </div>

                      {ord.items && ord.items.length > 0 && (
                        <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                            Выбранный контент ({ord.items.length}):
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {ord.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200/60 shadow-2xs">
                                {item.poster && (
                                  <img src={item.poster} alt="" className="w-12 h-8 object-cover rounded-lg bg-slate-900 shrink-0" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold text-slate-900 truncate" title={item.title}>
                                    {item.title}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate">
                                    {item.category || 'Контент'}{item.totalDurationMinutes ? ` · ${item.totalDurationMinutes} мин` : ''}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. ЛОГИ И АУДИТ БЕЗОПАСНОСТИ */}
          {!isEditing && tab === 'logs' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Shield size={20} className="text-[#ff5a1f]" />
                    Журнал аудита и логирования
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Фиксация действий администраторов, входов, заказов и изменений каталога
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadLogs}
                    className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw size={13} className={logsLoading ? 'animate-spin' : ''} />
                    <span>Обновить</span>
                  </button>
                  <button
                    type="button"
                    onClick={clearLogs}
                    className="px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl hover:bg-rose-100 flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 size={13} />
                    <span>Очистить журнал</span>
                  </button>
                </div>
              </div>

              {/* Фильтры и поиск логов */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {(['ALL', 'INFO', 'SECURITY', 'WARN', 'ERROR'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setLogLevelFilter(lvl)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        logLevelFilter === lvl
                          ? 'bg-[#11131e] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {lvl === 'ALL' ? 'Все уровни' : lvl === 'SECURITY' ? 'Безопасность' : lvl}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Поиск по действию, email или деталям..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadLogs()}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#ff5a1f] w-64"
                  />
                  <button
                    type="button"
                    onClick={loadLogs}
                    className="px-3 py-1.5 bg-[#ff5a1f] text-white text-xs font-semibold rounded-xl hover:bg-[#e04810]"
                  >
                    Найти
                  </button>
                </div>
              </div>

              {/* Таблица записей журнала */}
              <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
                {logs.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs">
                    {logsLoading ? 'Загрузка журнала...' : 'В журнале аудита пока нет записей.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                          <th className="py-3 px-4">Время</th>
                          <th className="py-3 px-3">Уровень</th>
                          <th className="py-3 px-4">Действие</th>
                          <th className="py-3 px-4">Инициатор / IP</th>
                          <th className="py-3 px-4">Детали события</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {logs.map((log, idx) => (
                          <tr key={log.id || idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                              {new Date(log.timestamp).toLocaleString('ru-RU')}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  log.level === 'SECURITY'
                                    ? 'bg-purple-100 text-purple-700'
                                    : log.level === 'ERROR'
                                    ? 'bg-rose-100 text-rose-700'
                                    : log.level === 'WARN'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-sky-100 text-sky-700'
                                }`}
                              >
                                {log.level}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-800 font-mono text-[11px]">
                              {log.action}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              <div className="font-semibold text-slate-900">{log.actor || 'SYSTEM'}</div>
                              {log.ip && <div className="text-[10px] text-slate-400 font-mono">{log.ip}</div>}
                            </td>
                            <td className="py-3 px-4 text-slate-600 max-w-md">
                              <pre className="text-[11px] font-mono bg-slate-50 p-1.5 rounded-lg border border-slate-200/60 overflow-x-auto whitespace-pre-wrap break-all">
                                {typeof log.details === 'object'
                                  ? JSON.stringify(log.details, null, 2)
                                  : log.details || '—'}
                              </pre>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6. УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ */}
          {!isEditing && tab === 'users' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#ff5a1f] flex items-center justify-center mx-auto mb-3">
                <Users size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Пользователей пока нет</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Здесь будут отображаться зарегистрированные аккаунты, их контактные данные и роли доступа.
              </p>
            </div>
          )}

          {/* 7. НАСТРОЙКИ СИСТЕМЫ */}
          {!isEditing && tab === 'settings' && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Настройки уведомлений и платформы</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Укажите параметры Telegram и Email для получения новых заявок с сайта</p>
                </div>
                {settingsSaved && (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                    ✅ Настройки сохранены!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Telegram Bot */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center text-xs font-black">TG</span>
                      Уведомления в Telegram
                    </h3>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700">Telegram Bot Token</label>
                    <input
                      type="text"
                      placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                      value={settings.telegramBotToken}
                      onChange={(e) => setSettings({ ...settings, telegramBotToken: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-[#ff5a1f] focus:bg-white outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Токен бота, созданного через @BotFather в Telegram</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700">Telegram Chat ID (Ваш ID или ID группы)</label>
                    <input
                      type="text"
                      placeholder="123456789 или -100123456789"
                      value={settings.telegramChatId}
                      onChange={(e) => setSettings({ ...settings, telegramChatId: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-[#ff5a1f] focus:bg-white outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">ID можно узнать через бота @userinfobot</p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={testTelegram}
                      className="w-full py-2 px-3 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-xl border border-sky-200 transition-colors"
                    >
                      Отправить тест в Telegram
                    </button>
                    {telegramStatus && (
                      <p className="text-xs text-center font-medium mt-2 text-slate-700">{telegramStatus}</p>
                    )}
                  </div>
                </div>

                {/* Email и Общие настройки */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-orange-50 text-[#ff5a1f] flex items-center justify-center text-xs font-black">@</span>
                      Email и Каталог
                    </h3>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700">Название платформы</label>
                    <input
                      type="text"
                      value={settings.siteName}
                      onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-[#ff5a1f] focus:bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700">Email администратора</label>
                    <input
                      type="email"
                      value={settings.adminEmail}
                      onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-[#ff5a1f] focus:bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700">Получатели копий заявок (Email)</label>
                    <textarea
                      rows={2}
                      value={settings.notificationEmails}
                      onChange={(e) => setSettings({ ...settings, notificationEmails: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-[#ff5a1f] focus:bg-white outline-none"
                    />
                  </div>
                </div>

                {/* Безопасность и Консольный шум */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 md:col-span-2">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Shield size={16} className="text-[#ff5a1f]" />
                      Безопасность логов и консольный шум
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="max-w-xl">
                      <h4 className="text-xs font-bold text-slate-900">Консольный шум безопасности (Console Noise)</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Генерирует фоновые энтропийные события в консоли сервера и маскирует реальные действия администратора,
                        защищая логи от перехвата и автоматизированного анализа ботами.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(settings.consoleNoise)}
                        onChange={(e) => setSettings({ ...settings, consoleNoise: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff5a1f]"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={saveSettings}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-[#ff5a1f] hover:bg-[#e04810] rounded-xl shadow-sm transition-all"
                >
                  Сохранить настройки
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}