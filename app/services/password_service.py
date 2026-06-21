from fastapi import BackgroundTasks, HTTPException, background
from fastapi.responses import JSONResponse
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from app.utils.emails import create_reset_password_token, decode_reset_password_token
from app.schemas.password import ForgetPasswordRequest, ResetForegetPassword, SuccessMessage
from app.services.user_service import UserService
from app.core.config import settings
from app.auth.password import get_password_hash


class PasswordService:

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
    
    def __init__(self, user_service: UserService):
        self.user_service = user_service

    async def forget_password(
        self,
        forget_password_request: ForgetPasswordRequest,
        background: BackgroundTasks,
    ):
        user = await self.user_service.get_by_email(forget_password_request.email)
        if not user:
            raise HTTPException(status_code=404, detail="Email no registrado")
        
        secret_token = create_reset_password_token(email=user.email)
        forget_url_link = f"{settings.FRONTEND_URL}?token={secret_token}"

        email_body = {
            "company_name": settings.MAIL_FROM_NAME,
            "link_expiry_min": settings.FORGET_PASSWORD_LINK_EXPIRE_MINUTES,
            "reser_link": forget_url_link
        }

        message = MessageSchema(
            subject="Reseteo de contraseña",
            recipients=[forget_password_request.email],
            template_body=email_body,
            subtype=MessageType.html
        )
    
        fm = FastMail(self.mail_conf)
        background.add_task(fm.send_message, message, template_name="mail/new_pass.html")

        return JSONResponse(
            status_code=200,
            content={"message": "Correo fue enviado", "success": True}
        )

    async def reset_password(self, reset_password_request: ResetForegetPassword):
        
        if reset_password_request.new_password != reset_password_request.confirm_password:
            raise HTTPException(
                status_code=400,
                detail="Las contraseñas no coinciden."
            )
        
        email = decode_reset_password_token(token=reset_password_request.secret_token)
        
        user = await self.user_service.get_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
        
        #user.password = reset_password_request.new_password
        user.password = get_password_hash(reset_password_request.new_password)
        await self.user_service.update(user)

        return JSONResponse(
            status_code=200,
            content={"message": "Contraseña reseteada exitosamente", "success": True}
        )