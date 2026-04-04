"""
Seed script — populates the database with initial data.
Run: python -m backend.seed
"""
import asyncio
import os
import json
from backend.database import create_pool, close_pool, execute, fetch_one, fetch_all
from backend.utils.auth import hash_password
from backend.utils.ratings import recalculate_model_stats
from backend.parse_models import get_models


MODELS_DATA = get_models()

USERS_DATA = [
    {
        "nickname": "dev_alex",
        "email": "alex@example.com",
        "password": "password123",
        "role": "разработчик",
        "bio": "Full-stack разработчик с 5-летним опытом. Использую AI ежедневно для кодинга.",
    },
    {
        "nickname": "ml_maria",
        "email": "maria@example.com",
        "password": "password123",
        "role": "ML-инженер",
        "bio": "Исследователь в области NLP. Тестирую модели для production-задач.",
    },
    {
        "nickname": "vibe_coder",
        "email": "vibe@example.com",
        "password": "password123",
        "role": "вайб-кодер",
        "bio": "Создаю проекты с помощью AI. Код пишу вайбами 🌊",
    },
    {
        "nickname": "student_ivan",
        "email": "ivan@example.com",
        "password": "password123",
        "role": "студент",
        "bio": "Студент CS, изучаю AI и ML. Пишу курсовые с помощью нейросетей.",
    },
    {
        "nickname": "user_elena",
        "email": "elena@example.com",
        "password": "password123",
        "role": "обычный пользователь",
        "bio": "Использую ChatGPT и другие модели для учёбы и работы.",
    },
]

REVIEWS_DATA = [
    # ChatGPT reviews
    {"user_idx": 0, "model_idx": 0, "overall": 8.5, "coding": 8.0, "speed": 7.5, "price": 5.0, "avail": 9.0, "creative": 9.0, "accuracy": 8.5,
     "text": "GPT-4o — отличная модель для повседневных задач. Код генерирует хорошо, но иногда ошибается в сложных алгоритмах. Мультимодальность — огромный плюс. Цена могла бы быть ниже для Plus подписки.",
     "tags": ["Использую в работе"]},
    {"user_idx": 1, "model_idx": 0, "overall": 8.0, "coding": 7.5, "speed": 7.0, "price": 4.5, "avail": 9.0, "creative": 8.5, "accuracy": 8.0,
     "text": "Для ML-задач GPT-4o хорош, но не идеален. Иногда галлюцинирует при работе с научными данными. Зато API стабилен и документация отличная. Для прототипирования — один из лучших вариантов.",
     "tags": ["Использую в работе"]},
    {"user_idx": 2, "model_idx": 0, "overall": 9.0, "coding": 9.0, "speed": 8.0, "price": 6.0, "avail": 9.5, "creative": 9.5, "accuracy": 8.0,
     "text": "Для вайб-кодинга GPT-4o просто идеален! Понимает контекст, дописывает код как надо, и интерфейс ChatGPT очень удобен. Единственный минус — подписка $20 в месяц, но оно того стоит для продуктивности.",
     "tags": ["Использую в работе"]},

    # Claude reviews
    {"user_idx": 0, "model_idx": 1, "overall": 9.0, "coding": 9.5, "speed": 7.0, "price": 5.5, "avail": 6.0, "creative": 8.5, "accuracy": 9.5,
     "text": "Claude 3.5 Sonnet — лучшая модель для кодинга на данный момент. Контекст 200K токенов — это невероятно удобно для работы с большими проектами. Минус — ограниченная доступность в СНГ без VPN.",
     "tags": ["Использую в работе"]},
    {"user_idx": 1, "model_idx": 1, "overall": 9.5, "coding": 9.5, "speed": 7.5, "price": 6.0, "avail": 5.5, "creative": 8.0, "accuracy": 9.5,
     "text": "Для ML-инженера Claude — must-have инструмент. Точность ответов выше среднего, особенно в technical writing и анализе кода. Artifacts — гениальная фича. Жаль, что из России доступ затруднён.",
     "tags": ["Использую в работе"]},
    {"user_idx": 3, "model_idx": 1, "overall": 8.5, "coding": 8.5, "speed": 7.0, "price": 5.0, "avail": 5.0, "creative": 8.0, "accuracy": 9.0,
     "text": "Для учёбы Claude просто супер — пишет код чисто, объясняет подробно. Но приходится использовать VPN, что неудобно. Бесплатный тариф быстро заканчивается, а Pro стоит как подписка на ChatGPT.",
     "tags": ["Тестировал"]},

    # Gemini reviews
    {"user_idx": 0, "model_idx": 2, "overall": 7.5, "coding": 7.0, "speed": 9.0, "price": 8.0, "avail": 8.0, "creative": 7.5, "accuracy": 7.0,
     "text": "Gemini 2.0 Flash — невероятно быстрая модель. Для задач где нужна скорость, а не максимальная точность — идеальный выбор. Интеграция с Google Workspace — приятный бонус. Код пишет нормально, но хуже Claude.",
     "tags": ["Тестировал"]},
    {"user_idx": 2, "model_idx": 2, "overall": 7.0, "coding": 6.5, "speed": 9.5, "price": 9.0, "avail": 8.5, "creative": 7.0, "accuracy": 6.5,
     "text": "Gemini Flash — реально самая быстрая модель из тех что пробовал. Ответы получаешь практически мгновенно. Для простых задач — отлично. Для сложного кодинга лучше взять что-то помощнее. Бесплатный тариф щедрый!",
     "tags": ["Попробовал разово"]},
    {"user_idx": 4, "model_idx": 2, "overall": 8.0, "coding": 7.0, "speed": 9.0, "price": 9.0, "avail": 8.5, "creative": 8.0, "accuracy": 7.5,
     "text": "Мне нравится Gemini за интеграцию с Google-сервисами. Можно анализировать документы из Drive, работать с Gmail и Calendar. Для обычного пользователя — один из лучших вариантов. Интерфейс понятный и приятный.",
     "tags": ["Использую в работе"]},

    # Grok reviews
    {"user_idx": 0, "model_idx": 3, "overall": 7.0, "coding": 6.5, "speed": 8.0, "price": 6.0, "avail": 4.0, "creative": 9.0, "accuracy": 6.5,
     "text": "Grok 3 — интересная модель с уникальным характером. Отвечает дерзко и с юмором, что иногда мешает в рабочих задачах. Код генерирует средне. Главный плюс — доступ к актуальным данным из X (Twitter) в реальном времени.",
     "tags": ["Тестировал"]},
    {"user_idx": 3, "model_idx": 3, "overall": 7.5, "coding": 6.0, "speed": 8.0, "price": 5.0, "avail": 3.5, "creative": 9.5, "accuracy": 7.0,
     "text": "Grok — самая креативная модель из всех! Отлично генерирует мемы и шутки. Для учёбы не очень подходит, но для развлечения и генерации идей — топ. Доступен только через X Premium, что ограничивает аудиторию.",
     "tags": ["Попробовал разово"]},

    # Mistral reviews
    {"user_idx": 1, "model_idx": 4, "overall": 7.5, "coding": 7.0, "speed": 8.0, "price": 7.0, "avail": 7.0, "creative": 7.0, "accuracy": 8.0,
     "text": "Mistral Large — солидная модель для бизнес-задач. Отлично работает с европейскими языками, хорошо суммаризирует документы. API недорогой и стабильный. Для ML-задач — хороший бюджетный вариант вместо GPT-4.",
     "tags": ["Тестировал"]},
    {"user_idx": 4, "model_idx": 4, "overall": 7.0, "coding": 6.0, "speed": 8.0, "price": 7.5, "avail": 7.5, "creative": 7.0, "accuracy": 7.5,
     "text": "Mistral Le Chat — приятный интерфейс, быстрые ответы. Для обычных вопросов работает хорошо. Нравится, что компания европейская — ощущение что данные в большей безопасности. Для повседневного использования — достойный вариант.",
     "tags": ["Использую в работе"]},

    # Llama reviews
    {"user_idx": 0, "model_idx": 5, "overall": 8.0, "coding": 7.5, "speed": 8.5, "price": 10.0, "avail": 8.0, "creative": 7.0, "accuracy": 7.5,
     "text": "Llama 3.3 70B — лучшая open-source модель. Запускаю локально на RTX 4090 через Ollama. Бесплатно, приватно, без лимитов! Качество уступает Claude/GPT-4o, но для большинства задач его достаточно. Идеально для разработки.",
     "tags": ["Использую в работе"]},
    {"user_idx": 1, "model_idx": 5, "overall": 7.5, "coding": 7.0, "speed": 8.0, "price": 10.0, "avail": 8.5, "creative": 6.5, "accuracy": 7.0,
     "text": "Для ML-инженера Llama — отличный инструмент для fine-tuning и экспериментов. Открытые веса позволяют дообучать под свои задачи. Inference дешёвый через Groq и Together AI. Документация от Meta — хорошая.",
     "tags": ["Использую в работе"]},

    # DeepSeek reviews
    {"user_idx": 0, "model_idx": 6, "overall": 8.5, "coding": 9.0, "speed": 8.0, "price": 10.0, "avail": 6.0, "creative": 7.5, "accuracy": 8.5,
     "text": "DeepSeek V3 — настоящий dark horse! Качество кода на уровне Claude при цене API в 10-50 раз дешевле. MoE архитектура работает отлично. Минус — серверы в Китае, задержки для РФ средние. Но соотношение цена/качество — лучшее на рынке.",
     "tags": ["Использую в работе"]},
    {"user_idx": 2, "model_idx": 6, "overall": 8.0, "coding": 8.5, "speed": 7.5, "price": 10.0, "avail": 5.5, "creative": 7.0, "accuracy": 8.0,
     "text": "DeepSeek — моя находка года! Для вайб-кодинга работает почти как Claude, но бесплатно через их чат. API стоит копейки. Иногда есть проблемы с доступностью, но в целом — must-try для каждого разработчика.",
     "tags": ["Использую в работе"]},
    {"user_idx": 3, "model_idx": 6, "overall": 8.0, "coding": 8.0, "speed": 7.0, "price": 9.5, "avail": 5.0, "creative": 7.5, "accuracy": 8.0,
     "text": "Для студента DeepSeek — находка. Бесплатный чат с качеством уровня GPT-4. Отлично помогает с математикой и алгоритмами. Правда, иногда сервис лежит из-за нагрузки. Но когда работает — это огонь за свои деньги (0 рублей).",
     "tags": ["Тестировал"]},

    # Qwen reviews
    {"user_idx": 1, "model_idx": 7, "overall": 7.0, "coding": 7.0, "speed": 8.0, "price": 8.5, "avail": 6.5, "creative": 6.5, "accuracy": 7.0,
     "text": "Qwen 2.5 Max — достойная модель от Alibaba. Для задач NLP на английском и китайском — одна из лучших. API доступен через DashScope, цены адекватные. Для русского языка работает хуже, чем конкуренты, но развивается быстро.",
     "tags": ["Тестировал"]},
    {"user_idx": 4, "model_idx": 7, "overall": 6.5, "coding": 6.0, "speed": 7.5, "price": 8.0, "avail": 6.0, "creative": 6.5, "accuracy": 6.5,
     "text": "Попробовала Qwen через Hugging Face — работает нормально, но ничем особо не выделяется. Для обычного пользователя интерфейс менее удобен чем у ChatGPT или Claude. Но для тех кто ищет альтернативу — вполне годный вариант.",
     "tags": ["Попробовал разово"]},
]


async def seed():
    """Main seed function."""
    pool = await create_pool()

    # Read and execute schema
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    async with pool.acquire() as conn:
        await conn.execute(schema_sql)

    print("✓ Schema created")

    # Check if data already exists
    existing = await fetch_one("SELECT COUNT(*) as cnt FROM ai_models")
    if existing and existing["cnt"] > 0:
        print("⚠ Data already exists, skipping seed")
        await close_pool()
        return

    # Insert models
    for m in MODELS_DATA:
        await execute(
            """
            INSERT INTO ai_models (name, slug, description, website_url, logo_url)
            VALUES ($1, $2, $3, $4, $5)
            """,
            m["name"], m["slug"], m["description"], m["website_url"], m["logo_url"],
        )
    print(f"✓ Inserted {len(MODELS_DATA)} models")

    # Insert users
    for u in USERS_DATA:
        hashed = hash_password(u["password"])
        await execute(
            """
            INSERT INTO users (nickname, email, password_hash, role, bio)
            VALUES ($1, $2, $3, $4, $5)
            """,
            u["nickname"], u["email"], hashed, u["role"], u["bio"],
        )
    print(f"✓ Inserted {len(USERS_DATA)} users")

    # Get user and model IDs
    users = await fetch_all("SELECT id FROM users ORDER BY id")
    models = await fetch_all("SELECT id FROM ai_models ORDER BY id")

    # Insert reviews
    for r in REVIEWS_DATA:
        user_id = users[r["user_idx"]]["id"]
        model_id = models[r["model_idx"]]["id"]
        tags_json = json.dumps(r["tags"], ensure_ascii=False)
        await execute(
            """
            INSERT INTO reviews (user_id, model_id, overall_score, score_coding, score_speed,
                                 score_price, score_availability, score_creativity, score_accuracy,
                                 text, tags)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
            """,
            user_id, model_id,
            r["overall"], r["coding"], r["speed"], r["price"],
            r["avail"], r["creative"], r["accuracy"],
            r["text"], tags_json,
        )
    print(f"✓ Inserted {len(REVIEWS_DATA)} reviews")

    # Recalculate stats for all models
    for m in models:
        await recalculate_model_stats(m["id"])
    print("✓ Model stats recalculated")

    await close_pool()
    print("\n🎉 Seed completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
