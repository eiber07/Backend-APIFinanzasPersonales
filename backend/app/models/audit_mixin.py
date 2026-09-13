from datetime import datetime
from sqlalchemy import Column, DateTime, func

class AuditMixin:
    """ This mixin adds automatic timestamping for creation and updates to any model that inherits from it."""
    creation_date = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
