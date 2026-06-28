# Backend-APIFinanzasPersonales

Backend-APIFinanzasPersonales es una API REST diseñada para ayudar a las personas y a los grupos a organizar su vida financiera de manera simple y clara. Permite registrar ingresos y egresos, administrar cuentas personales y compartidas, planificar gastos futuros y obtener una visión ordenada de las deudas generadas entre los integrantes de una cuenta grupal.

---

## 1. Introducción

Esta aplicación propone una forma práctica de gestionar finanzas personales y compartidas desde un único sistema. Su objetivo no es solo almacenar movimientos, sino ayudar a entender cómo se distribuye el dinero en un contexto familiar, de pareja o de trabajo compartido.

La solución está orientada a usuarios que necesitan llevar control de sus gastos diarios, pero también a quienes comparten gastos con otras personas y requieren una forma ordenada de repartir responsabilidades económicas.

---

## 2. Objetivo

El objetivo principal del sistema es facilitar la administración de finanzas personales y grupales, permitiendo a los usuarios:

- registrar ingresos y egresos;
- crear y gestionar cuentas según su necesidad;
- controlar gastos compartidos;
- proyectar obligaciones futuras mediante gastos planificados;
- visualizar deudas y saldos de forma automática entre los integrantes de una cuenta grupal.

---

## 3. Problemática que resuelve

Muchas personas enfrentan dificultades para llevar un control claro de sus finanzas. En la vida cotidiana, resulta complejo:

- mantener un seguimiento ordenado de los gastos personales;
- administrar gastos compartidos con familiares, compañeros o amigos;
- saber quién pagó qué y quién debe compensar a quién;
- evitar confusiones cuando existen múltiples movimientos en un mismo período.

Esta aplicación busca cubrir esa necesidad proporcionando un entorno simple para registrar movimientos y entender el impacto financiero de cada participante.

---

## 4. Conceptos principales

### Usuario
Un usuario representa a una persona registrada en la plataforma. Puede pertenecer a múltiples cuentas y participar en diferentes escenarios financieros.

### Cuenta
Una cuenta es el espacio donde se registran los movimientos relacionados con una situación concreta de dinero. La aplicación contempla dos tipos principales:

| Tipo de cuenta | Descripción |
|---|---|
| Cuenta personal | Permite administrar únicamente las finanzas del propietario. Solo tiene un miembro y no genera deudas entre usuarios. |
| Cuenta grupal | Permite administrar gastos compartidos entre varios integrantes. Todos los miembros participan de los movimientos registrados y sobre ellas se calculan las deudas. |

### Miembros
Cada cuenta grupal puede tener uno o más miembros. Los miembros pueden tener roles como administrador o miembro, pero esos roles solo determinan permisos dentro de la cuenta y no alteran el cálculo financiero.

### Transacciones
Una transacción representa un movimiento financiero registrado en una cuenta. Puede ser de tres tipos principales:

| Tipo | Descripción |
|---|---|
| Ingreso | Representa un aporte económico realizado por un miembro. En una cuenta personal incrementa el saldo disponible; en una cuenta grupal representa un aporte al fondo común. |
| Egreso | Representa un gasto realizado por un miembro. Puede corresponder a una cuenta personal o a una cuenta grupal. |
| Gasto planificado | Representa una obligación financiera futura, como cuotas, suscripciones o pagos recurrentes. Permite proyectar compromisos antes de que se materialicen como movimientos reales. |

---

## 5. Funcionamiento de las cuentas grupales

Las cuentas grupales funcionan como un espacio compartido para administrar gastos entre varios participantes.

Algunas reglas del comportamiento del sistema son las siguientes:

- todos los movimientos pertenecen a un período determinado, normalmente asociado a un mes y un año;
- todos los miembros participan de todos los movimientos del grupo;
- cada movimiento es registrado por un único usuario;
- los movimientos se distribuyen de forma equitativa entre todos los miembros activos de la cuenta;
- actualmente no existen porcentajes personalizados ni exclusiones de participantes en la distribución.

Este modelo permite que, al registrar un gasto compartido, el sistema pueda organizar después la forma en que cada participante debe compensar a los demás.

---

## 6. Cálculo de deudas

El sistema permite calcular deudas de forma automática a partir de los movimientos registrados en una cuenta grupal.

El proceso conceptual es el siguiente:

- cada movimiento modifica el balance individual de los miembros;
- los balances positivos indican dinero que un usuario debería recuperar;
- los balances negativos indican dinero que un usuario debería pagar;
- a partir de esos saldos, el sistema calcula automáticamente quién debe dinero a quién.

Este mecanismo ayuda a reducir la carga manual de repartir gastos y a obtener una vista más clara de las obligaciones financieras del grupo.

---

## 7. Reglas de negocio

El sistema opera bajo las siguientes reglas de negocio:

- un usuario puede tener múltiples cuentas;
- una cuenta puede pertenecer a uno o varios usuarios;
- una cuenta puede ser personal o grupal;
- una transacción pertenece únicamente a una cuenta;
- una transacción es registrada por un único usuario;
- todos los movimientos grupales se reparten en partes iguales entre los miembros;
- los ingresos grupales representan aportes realizados al grupo;
- los egresos grupales representan gastos afrontados por un miembro en beneficio del grupo;
- tanto ingresos como egresos generan un crédito a favor del usuario que realizó el movimiento;
- las deudas se calculan por período (mes y año);
- las cuentas personales no generan deudas entre usuarios;
- un gasto planificado representa una obligación futura y puede dar origen a una o varias transacciones reales posteriormente.


## 9. Flujo de uso típico

Un usuario puede interactuar con la aplicación siguiendo este flujo general:

1. Crear una cuenta de usuario.
2. Crear una cuenta personal o grupal.
3. Agregar miembros a una cuenta grupal.
4. Registrar ingresos y egresos asociados a la cuenta.
5. Crear gastos planificados para anticipar compromisos futuros.
6. Consultar balances y deudas generadas en el período.
---

## 10. Instalación rápida

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
# CREATE DATABASE finanzas_personales;

# 6. Aplicar migraciones
alembic upgrade head

# 7. Iniciar el servidor
uvicorn app.main:app --reload
```

La API quedará disponible en http://localhost:8000 y la documentación interactiva en http://localhost:8000/docs.

---

## 11. Tecnologías utilizadas

| Capa | Tecnología |
|---|---|
| Framework | FastAPI |
| ORM | SQLAlchemy (async) |
| Base de datos | PostgreSQL |
| Migraciones | Alembic |
| Autenticación | JWT |
| Servidor | Uvicorn |

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



