# Используем официальный образ Node.js версии 18 (или выше)
FROM node:18

# Устанавливаем необходимые системные зависимости для sharp
RUN apt-get update && apt-get install -y \
  libvips-dev \
  --no-install-recommends

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Копируем файл package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь исходный код проекта в контейнер
COPY . .

# Компилируем TypeScript в JavaScript
RUN npm install -g ts-node typescript

# Открываем порт, на котором будет работать приложение
EXPOSE 3000

# Переменная окружения для порта (по умолчанию 3000)
ENV APP_PORT=3000

# Команда для запуска приложения
CMD ["npm", "start"]
