# AI Review Hub

Платформа для оценки и рецензирования современных AI-моделей.

## Быстрый старт

### 1. Создайте базу данных PostgreSQL

```bash
createdb ai_review_hub
```

Или через psql:
```sql
CREATE DATABASE ai_review_hub;
```

### 2. Настройте окружение

```bash
copy .env.example .env
```

Отредактируйте `.env` при необходимости (пароль PostgreSQL и т.д.).

### 3. Установите зависимости

```bash
pip install -r backend/requirements.txt
```

### 4. Заполните базу начальными данными

```bash
python -m backend.seed
```

Это создаст таблицы и добавит 8 AI-моделей, 5 тестовых пользователей и 22 отзыва.

### 5. Запустите сервер

```bash
uvicorn backend.main:app --reload --port 8000
```

### 6. Откройте в браузере

```
http://localhost:8000
```

## Тестовые аккаунты

| Email | Пароль | Роль |
|-------|--------|------|
| alex@example.com | password123 | Разработчик |
| maria@example.com | password123 | ML-инженер |
| vibe@example.com | password123 | Вайб-кодер |
| ivan@example.com | password123 | Студент |
| elena@example.com | password123 | Обычный пользователь |

## API Endpoints

| Метод | URL | Описание |
|-------|-----|----------|
| POST | /api/auth/register | Регистрация |
| POST | /api/auth/login | Вход |
| GET | /api/auth/me | Текущий пользователь |
| GET | /api/models | Список моделей |
| GET | /api/models/{id} | Детали модели |
| GET | /api/models/{id}/reviews | Отзывы (пагинация) |
| POST | /api/models/{id}/reviews | Добавить отзыв |
| GET | /api/users/{id} | Профиль пользователя |

## Технологии

- **Frontend**: HTML, CSS (Vanilla), JavaScript
- **Backend**: Python, FastAPI, asyncpg
- **БД**: PostgreSQL
- **Auth**: JWT (python-jose), bcrypt
- **Шрифты**: Syne, DM Sans, JetBrains Mono
- **Иконки**: Lucide Icons
