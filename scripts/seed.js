const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

async function main() {
  console.log('--- Начало миграции данных в PostgreSQL ---');

  // 1. Создаем начальные настройки
  console.log('1. Сохранение системных настроек...');
  await prisma.setting.upsert({
    where: { key: 'siteName' },
    update: {},
    create: { key: 'siteName', value: 'Каталог контента UTV Media' },
  });
  await prisma.setting.upsert({
    where: { key: 'adminEmail' },
    update: {},
    create: { key: 'adminEmail', value: 'admin@utvmedia.ru' },
  });
  await prisma.setting.upsert({
    where: { key: 'notificationEmails' },
    update: {},
    create: { key: 'notificationEmails', value: 'orders@utv.ru, managers@utvmedia.ru' },
  });
  await prisma.setting.upsert({
    where: { key: 'consoleNoise' },
    update: {},
    create: { key: 'consoleNoise', value: 'true' },
  });

  // 2. Создаем учетные записи
  console.log('2. Создание учетных записей...');
  const salt = 'utv-secure-salt-2026';

  const users = [
    {
      email: 'admin@test.ru',
      password: hashPassword('admin123', salt),
      fullName: 'Администратор системы',
      role: 'ADMIN',
      company: 'UTV Media',
      position: 'Главный редактор',
    },
    {
      email: 'admin@utvmedia.ru',
      password: hashPassword('admin123', salt),
      fullName: 'Константин Васильев',
      role: 'ADMIN',
      company: 'UTV Media',
      position: 'Директор по контенту',
    },
    {
      email: 'user@test.ru',
      password: hashPassword('user123', salt),
      fullName: 'Иван Покупатель',
      role: 'USER',
      company: 'Телеканал Премьер',
      position: 'Менеджер по закупкам',
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, fullName: u.fullName },
      create: u,
    });
  }

  // 3. Переносим каталог фильмов из data/data.json
  console.log('3. Миграция фильмов из data.json...');
  const dataFilePath = path.join(process.cwd(), 'data', 'data.json');
  if (fs.existsSync(dataFilePath)) {
    const raw = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
    const moviesList = Array.isArray(raw) ? raw : (raw.movies || raw.items || []);

    let count = 0;
    for (const m of moviesList) {
      const titleRu = typeof m.title === 'object' ? (m.title.ru || m.title.en || 'Без названия') : (m.title || 'Без названия');
      const titleEn = (m._rawTitle && m._rawTitle.en) ? m._rawTitle.en : (typeof m.title === 'object' && m.title.en ? m.title.en : titleRu);
      const descRu = typeof m.description === 'object' ? (m.description.ru || '') : (m.description || '');
      const descEn = (m._rawDescription && m._rawDescription.en) ? m._rawDescription.en : descRu;
      const slug = m.slug || `movie-${m.id || count + 1}`;

      await prisma.movie.upsert({
        where: { slug },
        update: {},
        create: {
          id: String(m.id || count + 1),
          slug,
          titleRu,
          titleEn,
          descriptionRu: descRu,
          descriptionEn: descEn,
          category: m.category || 'Природа',
          categorySlug: m.categorySlug || m.categoryId || 'nature',
          year: Number(m.year || m.yearFrom) || 2024,
          quality: Array.isArray(m.qualities) ? m.qualities[0] : (m.quality || 'Full HD'),
          qualities: Array.isArray(m.qualities) ? m.qualities : [m.quality || 'Full HD'],
          duration: typeof m.duration === 'string' ? m.duration : '30 мин',
          totalDurationMinutes: Number(m.totalDurationMinutes) || 30,
          status: 'Опубликован',
          poster: m.poster || m.image || '/placeholder.png',
          trailerUrl: m.trailerUrl || '',
          stills: Array.isArray(m.stills) ? m.stills : [],
          tags: Array.isArray(m.tags) ? m.tags : [],
          country: Array.isArray(m.countries) ? m.countries[0] : (m.country || 'Россия'),
          countries: Array.isArray(m.countries) ? m.countries : [m.country || 'Россия'],
          ageRating: m.ageRating || '12+',
          languages: Array.isArray(m.languages) ? m.languages : ['Русский'],
          territory: m.territory || 'Весь мир',
          rightsPeriod: m.rightsPeriod || 'До 31.12.2028',
          views: Number(m.views) || 0,
        },
      });
      count++;
    }
    console.log(`Успешно перенесено фильмов в PostgreSQL: ${count}`);
  }

  // 4. Запись в аудит
  await prisma.auditLog.create({
    data: {
      level: 'INFO',
      action: 'DATABASE_MIGRATED',
      actor: 'SYSTEM',
      details: JSON.stringify({ message: 'База данных PostgreSQL успешно инициализирована' }),
    },
  });

  console.log('✅ Инициализация базы данных завершена успешно!');
}

main()
  .catch((e) => {
    console.error('Ошибка при сидировании БД:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
