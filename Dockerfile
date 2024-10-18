# Используем официальный образ Node.js
FROM node:16

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
