# Backend-APIFinanzasPersonales

API REST para la gestión de finanzas personales y grupales. Permite a los usuarios registrar transacciones, planificar gastos en cuotas y administrar cuentas compartidas con cálculo automático de deudas entre miembros.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | FastAPI |
| ORM | SQLAlchemy (async) |
| Base de datos | PostgreSQL |
| Migraciones | Alembic |
| Autenticación | JWT (OAuth2) |
| Servidor | Uvicorn |
| Frontend | Vanilla JS + HTML + CSS |

---

## Requisitos previos

- Python 3.10+
- PostgreSQL 15+
- pip

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/eiber07/Backend-APIFinanzasPersonales.git
cd Backend-APIFinanzasPersonales

# 2. Crear y activar entorno virtual
python -m venv .venv
source .venv/bin/activate        # Linux/macOS
.venv\Scripts\activate           # Windows

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Configurar variables de entorno
# Crear un archivo .env con:
DATABASE_URL=postgresql+asyncpg://usuario:contraseña@localhost:5432/finanzas_personales
SECRET_KEY=tu_clave_secreta

# 5. Crear la base de datos en PostgreSQL
# Conectarse a psql o pgAdmin y ejecutar:
# CREATE DATABASE finanzas_personales;

# 6. Aplicar migraciones
alembic upgrade head

# 7. Iniciar el servidor
uvicorn app.main:app --reload
```

La API queda disponible en `http://localhost:8000`  
Documentación interactiva en `http://localhost:8000/docs`

---

## Estructura del proyecto

```
Backend-APIFinanzasPersonales/
├── app/
│   ├── auth/               # Autenticación JWT
│   ├── dals/               # Data Access Layer (consultas a la BD)
│   ├── models/             # Modelos SQLAlchemy
│   ├── routes/             # Endpoints de la API
│   ├── schemas/            # Schemas Pydantic (request/response)
│   ├── services/           # Lógica de negocio
│   ├── static/             # Archivos estáticos (JS, CSS, imágenes)
│   ├── templates/          # HTML del frontend
│   ├── database/           # Configuración de conexión
│   └── main.py             # Punto de entrada
├── alembic/                # Migraciones de base de datos
├── alembic.ini
├── requirements.txt
└── README.md
```

---

## Migraciones

```bash
# Aplicar todas las migraciones pendientes
alembic upgrade head

# Crear una nueva migración
alembic revision --autogenerate -m "descripcion del cambio"

# Ver el estado actual
alembic current

# Sincronizar sin ejecutar migraciones (base ya actualizada manualmente)
alembic stamp head
```

## Endpoints principales

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/token` | Login — devuelve JWT |
| POST | `/auth/signup` | Registro de nuevo usuario |
| POST | `/auth/forget-password` | Solicitar reset de contraseña |
| POST | `/auth/reset-password` | Confirmar nueva contraseña |

### Usuarios
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/users/me` | Obtener usuario autenticado |
| GET | `/users/by_id?id={id}` | Obtener usuario por ID |

### Cuentas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/accounts/user` | Listar cuentas del usuario |
| POST | `/accounts/` | Crear cuenta personal o grupal |
| POST | `/accounts/{account_id}/members` | Agregar un miembro a la cuenta grupal |


### Transacciones
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/transactions/account/{id}` | Listar transacciones de una cuenta |
| POST | `/transactions/` | Crear transacción |
| PUT | `/transactions/` | Editar transacción |
| PUT | `/transactions/deactivate/{id}` | Eliminar transacción (soft delete) |

### Gastos Planificados
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/planned_expenses/account/{id}` | Listar gastos de una cuenta |
| GET | `/planned_expenses/{group_id}/{installment}` | Obtener cuota específica |
| POST | `/planned_expenses/` | Crear gasto planificado (genera N cuotas) |
| PUT | `/planned_expenses/{group_id}/{installment}/pay` | Marcar cuota como pagada |
| PUT | `/planned_expenses/deactivate/{group_id}` | Eliminar gasto completo (soft delete) |

### Cuentas Grupales
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/group-settlement/{account_id}` | Calcular balances y deudas del período |

### Parámetros
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/parameters/parameters?parameters={nombre}` | Obtener parámetros del sistema (tipos de transacción, categorías, etc.) |

---
## Modelo de datos Principales — User
```
users
├── id              INTEGER  (PK, identifica al usuarios)
├── name            String 
├── last_name       String 
├── dni             String 
├── email           String
├── phone           String 
└── password        String
```
---
## Modelo de datos Principales — Account
```
accounts
├── id                  INTEGER  (PK, identifica a la cuenta)
├── id_admin_user       INTEGER  (FK → users)
├── name                String   
├── status_id           INTEGER  (FK → status)
├── description         String
├── account_type_id     INTEGER  (FK → account_types)
```
---
## Modelo de datos Principales — Transaction
```
transactions
├── id                      INTEGER  (PK, identifica a la transaccion)
├── account_id              INTEGER  (FK → users)
├── planned_expense_id      INTEGER     
├── planned_expense_installment_number        INTERGER
├── type_id                 INTEGER  (FK → type)
├── amount                  DECIMAL
├── description             String   
├── category_id             INTEGER  (FK → catgory)
├── status_id               INTEGER  (FK → status)
├── transaction_date        DATETIME
```
---
## Modelo de datos — Gastos Planificados

Los gastos planificados usan una clave primaria compuesta `(id_planned_expense, installment_number)`. Cada cuota es un registro independiente:

```
planned_expenses
├── id_planned_expense    INTEGER  (PK, identifica el grupo)
├── installment_number    INTEGER  (PK, número de cuota: 1, 2, 3...)
├── account_id            INTEGER  (FK → accounts)
├── installment_amount    DECIMAL  (monto fijo por cuota)
├── description           VARCHAR
├── due_date              DATETIME (fecha de vencimiento de esa cuota)
└── status_id             INTEGER  (FK → statuses: 1=activa, 2=pagada)
```
---
## Modelo de datos Principales — Miembros de Cuenta grupales
```
group_account_members
├── id          INTEGER  (PK, identifica a la cuenta)
├── account_id  INTEGER  (FK → accounts)
├── user_id     INTEGER  (FK → users)     
├── role        String
```
---

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Cadena de conexión PostgreSQL (`postgresql+asyncpg://...`) |
| `SECRET_KEY` | Clave para firma de tokens JWT |
| `MAIL_USERNAME` | Usuario de la cuenta de correo usada para enviar emails (por ejemplo, Gmail o SMTP propio). |
| `MAIL_PASSWORD` | Contraseña o app password del servicio de correo. |
| `MAIL_FROM` | Dirección de correo desde la cual se enviarán los emails del sistema. |
| `MAIL_PORT` | Puerto SMTP (ej: 587 para TLS, 465 para SSL). |
| `MAIL_SERVER` | Servidor SMTP (ej: smtp.gmail.com). |
| `MAIL_FROM_NAME` | Nombre que aparecerá como remitente en los correos enviados. |
| `FORGET_PWD_SECRET_KEY` | Clave especial para firmar los tokens de recuperación de contraseña (separada del SECRET_KEY por seguridad). |
| `ALGORITHM` | Algoritmo de firma JWT (normalmente HS256). |
| `FORGET_PASSWORD_LINK_EXPIRE_MINUTES` | Minutos de validez del enlace de recuperación de contraseña. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Minutos de validez del token JWT de acceso. |
| `APP_HOST` | Host donde corre la API (ej: http://localhost:8000). |
| `FRONTEND_URL` | URL del frontend para redirecciones (ej: para el link de recuperación de contraseña) |

---

## Equipo

Proyecto desarrollado como trabajo práctico integrador.


