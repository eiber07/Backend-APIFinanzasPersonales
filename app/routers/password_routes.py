from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi_mail import FastMail, MessageSchema, MessageType, ConnectionConfig
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from passlib.context import CryptContext

from app.schemas.password import ForgetPasswordRequest, ResetForegetPassword, SuccessMessage
from app.utils.emails import create_reset_password_token, decode_reset_password_token
from app.core.config import settings
from app.database.database import get_db
from app.models.user import User

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

mail_conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    TEMPLATE_FOLDER="app/templates"
)

@router.post("/forget-password")
async def forget_password(
    background: BackgroundTasks,
    fpr: ForgetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == fpr.email))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email inválido."
        )

    secret_token = create_reset_password_token(email=user.email)
    forget_url_link = f"{settings.FRONTEND_URL}?token={secret_token}"


    email_body = {
        "company_name": settings.MAIL_FROM_NAME,
        "link_expiry_min": settings.FORGET_PASSWORD_LINK_EXPIRE_MINUTES,
        "reser_link": forget_url_link
    }

    message = MessageSchema(
        subject="Reseteo de contraseña",
        recipients=[fpr.email],
        template_body=email_body,
        subtype=MessageType.html
    )

    fm = FastMail(mail_conf)
    background.add_task(fm.send_message, message, template_name="mail/new_pass.html")

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"message": "Correo fue enviado", "success": True}
    )


@router.post("/reset-password", response_model=SuccessMessage)
async def reset_password(
    rfp: ResetForegetPassword,
    db: AsyncSession = Depends(get_db)
):
    info = decode_reset_password_token(token=rfp.secret_token)

    if info is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enlace inválido o expirado."
        )

    if rfp.new_password != rfp.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las contraseñas no coinciden."
        )

    result = await db.execute(select(User).where(User.email == info))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado."
        )

    user.password = pwd_context.hash(rfp.new_password)
    await db.commit()

    return {"success": True, "status_code": 200, "message": "Contraseña restablecida correctamente."}