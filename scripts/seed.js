const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Начало миграции данных в PostgreSQL ---');

  // 1. Создаем начальные настройки
  console.log('1. Сохранение системных настроек...');
  await prisma.setting.upsert({
    where: { key: 'siteName' },
    update: { value: 'Каталог контента UTV Media' },
    create: { key: 'siteName', value: 'Каталог контента UTV Media' },
  });
  await prisma.setting.upsert({
    where: { key: 'adminEmail' },
    update: { value: 'admin@utvmedia.ru' },
    create: { key: 'adminEmail', value: 'admin@utvmedia.ru' },
  });
  await prisma.setting.upsert({
    where: { key: 'notificationEmails' },
    update: { value: 'orders@utv.ru, managers@utvmedia.ru' },
    create: { key: 'notificationEmails', value: 'orders@utv.ru, managers@utvmedia.ru' },
  });
  await prisma.setting.upsert({
    where: { key: 'consoleNoise' },
    update: { value: 'true' },
    create: { key: 'consoleNoise', value: 'true' },
  });

  // 2. Учетные записи не сидятся: админ берется из ADMIN_EMAIL/ADMIN_PASSWORD в .env

  // Тайтлы живут только в БД: добавляются через админку или импорт Excel

  // 4. Запись в аудит
  await prisma.auditLog.create({
    data: {
      level: 'INFO',
      action: 'DATABASE_MIGRATED',
      actor: 'SYSTEM',
      details: JSON.stringify({ message: 'База данных PostgreSQL успешно инициализирована ' }),
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
